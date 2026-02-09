const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Helper to get buffer from URL
async function getBuffer(url) {
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.buffer();
}

// Helper to extract Key and Cert from P12 Buffer
function extractFromP12(p12Buffer, password) {
    try {
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

        let key = null;
        let cert = null;

        // Iterate safe bags to find key and cert
        const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = bags[forge.pki.oids.certBag]?.[0];
        if (certBag) {
            cert = forge.pki.certificateToPem(certBag.cert);
        }

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
        if (keyBag) {
            key = forge.pki.privateKeyToPem(keyBag.key);
        }

        if (!key && !cert) {
            // Try looking in other bag types if not found
            // This is a simplified extraction, might need more robust loop if P12 structure varies
            const localKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
            if (localKeyBags[forge.pki.oids.keyBag]?.[0]) {
                key = forge.pki.privateKeyToPem(localKeyBags[forge.pki.oids.keyBag][0].key);
            }
        }

        if (!key || !cert) {
            throw new Error("Could not extract Key or Cert from P12 file");
        }

        return { key, cert };

    } catch (e) {
        console.error("P12 Extraction Error:", e);
        throw e;
    }
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { user_id, full_name, points, card_type, qr_token } = JSON.parse(event.body);

        // 1. Read Certs from Files (Fix for Netlify 4KB Env Limit)
        // Paths are relative to the function file in Netlify Functions
        const p12Path = path.resolve(__dirname, 'certs/pass.p12');
        const wwdrPath = path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer');

        if (!fs.existsSync(p12Path) || !fs.existsSync(wwdrPath)) {
            // Debug: List directory contents to help if it fails again
            console.error('Certs missing. __dirname:', __dirname);
            try {
                console.error('Contents of __dirname:', fs.readdirSync(__dirname));
                console.error('Contents of certs (if exists):', fs.readdirSync(path.join(__dirname, 'certs')));
            } catch (e) { }
            throw new Error(`Certificates missing at ${p12Path} or ${wwdrPath}`);
        }

        const p12Buffer = fs.readFileSync(p12Path);
        const wwdrBuffer = fs.readFileSync(wwdrPath);

        // Convert WWDR DER to PEM (node-forge expects PEM)
        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        // 2. Initialize Pass
        // Define Colors based on Card Type (Matching App Gradients approx.)
        const cardColors = {
            'DIAMANT': { bg: 'rgb(26, 35, 126)', fg: 'rgb(255, 255, 255)', label: 'rgb(200, 200, 255)' }, // Deep Blue
            'GOLD': { bg: 'rgb(93, 64, 55)', fg: 'rgb(255, 255, 255)', label: 'rgb(255, 224, 178)' },   // Brown/Gold
            'SILVER': { bg: 'rgb(55, 71, 79)', fg: 'rgb(255, 255, 255)', label: 'rgb(207, 216, 220)' }, // Dark Grey
            'BRONZE': { bg: 'rgb(62, 28, 22)', fg: 'rgb(255, 255, 255)', label: 'rgb(215, 204, 200)' }  // Dark Brown
        };

        // Normalize rank
        let normalizeRank = (card_type || 'Bronz').toUpperCase();
        if (normalizeRank === 'BRONZ') normalizeRank = 'BRONZE'; // Fix common typo mapping

        const colors = cardColors[normalizeRank] || cardColors['BRONZE'];

        const safeUserId = String(user_id || '').toUpperCase(); // Use empty string if missing
        const safeName = full_name || 'Felhasználó';
        const safePoints = String(points || '0');
        const safeQr = qr_token || safeUserId; // QR Content

        const passProps = {
            formatVersion: 1,
            passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
            teamIdentifier: process.env.APPLE_TEAM_ID,
            organizationName: 'Kőszeg Város',
            description: 'KőszegPass Városkártya',
            serialNumber: safeUserId || 'UNKNOWN-' + Date.now(), // Unique ID
            backgroundColor: colors.bg,
            foregroundColor: colors.fg,
            labelColor: colors.label,
            logoText: 'KőszegPass',
        };

        const pass = new PKPass(
            {},
            {
                wwdr: wwdrPem,
                signerCert: cert,
                signerKey: key,
                signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
            },
            passProps
        );

        pass.type = 'storeCard';

        // 4. Set Fields
        pass.primaryFields.push({
            key: 'balance',
            label: 'PONTOK',
            value: safePoints,
            textAlignment: 'PKTextAlignmentRight'
        });

        pass.secondaryFields.push({
            key: 'rank',
            label: 'RANG',
            value: normalizeRank,
            textAlignment: 'PKTextAlignmentLeft'
        });

        pass.backFields.push(
            {
                key: 'name',
                label: 'Név',
                value: safeName
            },
            {
                key: 'id',
                label: 'Kártyaszám',
                value: safeUserId
            },
            {
                key: 'info',
                label: 'Info',
                value: 'Ez a KőszegPass digitális kártyád. Mutasd fel elfogadóhelyeken!'
            }
        );

        // 5. Barcode
        pass.setBarcodes({
            format: 'PKBarcodeFormatQR',
            message: safeQr,
            messageEncoding: 'iso-8859-1',
            altText: safeUserId // Show User ID below QR, or leave empty '' to hide "unknown"
        });

        // 3. Add Images
        const SITE_URL = 'https://koszegapp.netlify.app';

        try {
            const iconBuffer = await getBuffer(`${SITE_URL}/images/apple-touch-icon.png`);
            pass.addBuffer('icon.png', iconBuffer);
            pass.addBuffer('icon@2x.png', iconBuffer);

            const logoBuffer = await getBuffer(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            pass.addBuffer('logo.png', logoBuffer);
            pass.addBuffer('logo@2x.png', logoBuffer);

            // Generate a simple Strip image if needed, or exclude
        } catch (e) {
            console.warn("Failed to load images", e);
        }

        // No setters used (setSecondaryFields, setAuxiliaryFields, setBackFields, setBarcodes removed)

        // 6. Generate
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename=koszegpass.pkpass`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error("Apple Pass Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
