const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/*
  BOOTSTRAP SUBSCRIPTION PASS
  
  This is the "subscription" pass that users download ONCE.
  It registers their device with Apple Wallet.
  
  After this, the daily-pass-generator.js cron job will automatically
  send daily event passes to subscribed devices.
  
  This pass:
  - Never expires
  - Always available (even when no events today)
  - Registers the device for future updates
*/

/* -------------------- Helpers -------------------- */

function extractFromP12(p12Buffer, password) {
    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

    let key = null;
    let cert = null;

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    if (certBags[forge.pki.oids.certBag]?.[0]) {
        cert = forge.pki.certificateToPem(certBags[forge.pki.oids.certBag][0].cert);
    }

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]) {
        key = forge.pki.privateKeyToPem(
            keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key
        );
    }

    if (!key || !cert) throw new Error('Missing cert or key');

    return { key, cert };
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    try {
        /* ---------- Certificates ---------- */
        const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
        const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* ---------- Create Bootstrap Pass ---------- */
        const pass = new PKPass(
            {},
            {
                wwdr: wwdrPem,
                signerCert: cert,
                signerKey: key,
                signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
            },
            {
                formatVersion: 1,
                passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
                teamIdentifier: process.env.APPLE_TEAM_ID,
                serialNumber: 'daily-subscription',
                organizationName: 'Kőszeg Város',
                description: 'Ma Kőszegen – Wallet feliratkozás',
                logoText: 'Ma Kőszegen',
                backgroundColor: 'rgb(33,150,243)',
                foregroundColor: 'rgb(255,255,255)',
                labelColor: 'rgb(187,222,251)',
                // ❌ NO webServiceURL - bootstrap pass doesn't update
                // ❌ NO authenticationToken - only registers device
                sharingProhibited: false,
                suppressStripShine: false,
                // ❗ NO expirationDate - this pass never expires
                // ❗ NO relevantDate - always available
                userInfo: {
                    passType: 'daily-subscription',
                    city: 'Kőszeg'
                }
            }
        );

        pass.type = 'storeCard';

        /* ---------- Fields ---------- */
        pass.primaryFields.push({
            key: 'title',
            label: '📍 MA KŐSZEGEN',
            value: 'Napi események a Walletben'
        });

        pass.secondaryFields.push({
            key: 'status',
            label: 'Állapot',
            value: '✅ Feliratkozva'
        });

        pass.backFields.push(
            {
                key: 'info',
                label: 'Hogyan működik?',
                value: 'Ha Kőszegen van aznap esemény, a Wallet automatikusan megjeleníti a napi programokat.'
            },
            {
                key: 'source',
                label: 'Forrás',
                value: 'KőszegAPP – visitkoszeg.hu'
            }
        );

        /* ---------- Images ---------- */

try {
  const icon = fs.readFileSync(path.resolve(__dirname, 'icon.png'));
  pass.addBuffer('icon.png', icon);

  const icon2x = fs.readFileSync(path.resolve(__dirname, 'icon@2x.png'));
  pass.addBuffer('icon@2x.png', icon2x);
} catch (e) {
  console.error('❌ ICON MISSING – PASS WILL FAIL ON IOS', e);
  throw new Error('Wallet icon missing');
}

// 🟡 LOGO OPCIONÁLIS
try {
  const logo = fs.readFileSync(path.resolve(__dirname, 'logo.png'));
  pass.addBuffer('logo.png', logo);

  const logo2x = fs.readFileSync(path.resolve(__dirname, 'logo@2x.png'));
  pass.addBuffer('logo@2x.png', logo2x);
} catch (e) {
  console.warn('⚠️ Logo missing – continuing without logo');
}
        /* ---------- Generate ---------- */
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': 'attachment; filename="koszeg-ma-wallet.pkpass"',
                'Cache-Control': 'no-store'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('BOOTSTRAP PASS ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
