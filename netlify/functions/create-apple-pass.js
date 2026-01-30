const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');

// Helper to get buffer from URL or Env Base64
async function getBuffer(source) {
    if (!source) return null;
    if (source.startsWith('http')) {
        const res = await fetch(source);
        if (!res.ok) throw new Error(`Failed to fetch ${source}`);
        return res.buffer();
    }
    // Assume Base64 string if not http
    return Buffer.from(source, 'base64');
}

// Helper to extract Key and Cert from P12
function extractFromP12(p12Base64, password) {
    try {
        const p12Der = forge.util.decode64(p12Base64);
        const p12Asn1 = forge.asn1.fromDer(p12Der);
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
            console.log("Using fallback bag search...");
            const localKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
            if (localKeyBags[forge.pki.oids.keyBag]?.[0]) {
                key = forge.pki.privateKeyToPem(localKeyBags[forge.pki.oids.keyBag][0].key);
            }
        }

        if (!key || !cert) {
            throw new Error("Could not extract Key or Cert from P12");
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

        // 1. Extract Certs from Env P12
        // We use the P12 provided in env vars
        const { key, cert } = extractFromP12(
            process.env.APPLE_PASS_P12_BASE64,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        // 2. Initialize Pass
        const pass = new PKPass(
            {
                model: 'storeCard',
                passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID, // Updated var name
                teamIdentifier: process.env.APPLE_TEAM_ID,
                organizationName: 'Kőszeg Város',
                description: 'KőszegPass Városkártya',
                serialNumber: user_id,
                backgroundColor: 'rgb(245, 245, 247)',
                foregroundColor: 'rgb(0, 0, 0)',
                labelColor: 'rgb(142, 142, 147)',
                logoText: 'KőszegPass'
            },
            {
                wwdr: await getBuffer(process.env.APPLE_WWDR_CERT_BASE64), // Updated var name
                signerCert: cert,
                signerKey: key,
                // signerKeyPassphrase:  // Not needed if we extracted PEM already
            }
        );

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

        // 4. Set Fields
        pass.setSecondaryFields([
            {
                key: 'rank',
                label: 'RANG',
                value: (card_type || 'Bronz').toUpperCase(),
                textAlignment: 'PKTextAlignmentLeft'
            }
        ]);

        pass.setAuxiliaryFields([
            {
                key: 'points',
                label: 'PONTOK',
                value: String(points || 0),
                textAlignment: 'PKTextAlignmentRight'
            }
        ]);

        pass.setBackFields([
            {
                key: 'name',
                label: 'Név',
                value: full_name || 'Felhasználó'
            },
            {
                key: 'id',
                label: 'Kártyaszám',
                value: user_id
            },
            {
                key: 'info',
                label: 'Info',
                value: 'Ez a KőszegPass digitális kártyád. Használd kedvezményekhez és pontgyűjtéshez a városban!'
            }
        ]);

        // 5. Barcode
        pass.setBarcodes({
            format: 'PKBarcodeFormatQR',
            message: qr_token || user_id,
            messageEncoding: 'iso-8859-1',
            altText: user_id
        });

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
            body: JSON.stringify({ error: err.message, stack: err.stack })
        };
    }
};
