// netlify/functions/koszeg-pass-apple.js
// KőszegPass – Apple Wallet (.pkpass) generátor
//
// ⚠️  TANÚSÍTVÁNY LOGIKA NEM VÁLTOZOTT – csak az adatforrás és a pass mezők
// ⚠️  passTypeIdentifier + teamIdentifier UGYANAZ mint a ticket rendszerben
//     (ugyanaz az Apple Developer cert alá tartozik)
// ⚠️  serialNumber prefix: "KOSZEG-PASS-" → elkülönül a "EVENT-TICKET-" prefixű jegyektől

import { PKPass } from 'passkit-generator';
import fetch from 'node-fetch';
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = typeof import.meta !== 'undefined' && import.meta.url ? dirname(__filename) : (typeof process !== 'undefined' ? process.cwd() : '');

// ── Cert path resolver (változatlan) ────────────────────────────────────────
function getCertPath(filename) {
    const paths = [
        path.join(__dirname, 'certs', filename),
        path.join(__dirname, '..', 'certs', filename),
        path.join(__dirname, 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'certs', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, 'certs', filename);
}

// ── Image helper (változatlan) ───────────────────────────────────────────────
async function getBuffer(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        return res.buffer();
    } catch (e) {
        console.warn(`Buffer fetch failed for ${url}:`, e.message);
        return null;
    }
}

// ── P12 extractor (változatlan) ──────────────────────────────────────────────
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

    if (!key || !cert) {
        throw new Error('Could not extract key/cert from P12');
    }

    return { key, cert };
}

// ── Supabase (service role – RLS bypass szükséges a backend-en) ──────────────
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
    try {
        const passId = event.queryStringParameters?.passId;
        if (!passId) {
            return { statusCode: 400, body: 'Pass ID required' };
        }

        // 1. KőszegPass lekérdezése
        const { data: passData, error: passError } = await supabase
            .from('koszeg_passes')
            .select('*')
            .eq('id', passId)
            .single();

        if (passError || !passData) {
            console.error('Pass fetch error:', passError);
            return { statusCode: 404, body: 'Pass not found' };
        }

        if (passData.status !== 'active') {
            return { statusCode: 403, body: 'Pass is not active' };
        }

        // 2. Tanúsítványok betöltése (VÁLTOZATLAN – ugyanaz a cert mint a ticket rendszerben)
        const p12Buffer = fs.readFileSync(getCertPath('pass.p12'));
        const wwdrBuffer = fs.readFileSync(getCertPath('AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        // 3. Dátum formázás
        const purchasedAt = new Date(passData.purchased_at);
        const expiresAt = new Date(passData.expires_at);

        const formatHu = (date) =>
            date.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });

        // 4. Pass props
        // ⚠️  passTypeIdentifier és teamIdentifier NEM VÁLTOZIK – Apple-nél regisztrált értékek!
        const passProps = {
            formatVersion: 1,
            passTypeIdentifier: 'pass.hu.koszeg.koszegpass',
            teamIdentifier: '97FG847W58',
            organizationName: 'VisitKőszeg',
            description: 'KőszegPass – Turisztikai kedvezménykártya',

            // ⚠️  Egyedi prefix hogy ne ütközzön a ticket serialNumber-ekkel
            serialNumber: `KOSZEG-PASS-${passData.id}`,

            // KőszegPass brandszínek (sötétkék + arany)
            backgroundColor: 'rgb(12, 35, 75)',
            foregroundColor: 'rgb(255, 255, 255)',
            labelColor: 'rgb(200, 175, 100)',
            logoText: 'KőszegPass',

            // Lejárat dátuma (Apple validálja, elutasíthatja ha múltban van)
            expirationDate: expiresAt,

            // Megosztható: a vendég mutathatja a partnernek
            sharingProhibited: false,

            // Csoportosítás a Walletben (különálló a ticket-ektől)
            groupingIdentifier: 'hu.koszeg.pass'
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

        // 5. Pass típus: storeCard = kedvezménykártya / hűségkártya
        //    (eventTicket helyett – az a jegyrendszeré)
        pass.type = 'storeCard';

        // 6. Mezők összeállítása
        // headerFields: jobb felső sarok (rövid)
        pass.headerFields.push({
            key: 'pass_label',
            label: 'TÍPUS',
            value: passData.pass_type === 'family' ? 'CSALÁDI' : 'EGYÉNI'
        });

        // primaryFields: legnagyobb betűméret, névjegy
        pass.primaryFields.push({
            key: 'holder_name',
            label: 'NÉVJEGY',
            value: passData.holder_name
        });

        // secondaryFields: érvényesség
        pass.secondaryFields.push({
            key: 'valid_from',
            label: 'VÁSÁROLVA',
            value: formatHu(purchasedAt)
        });
        pass.secondaryFields.push({
            key: 'valid_until',
            label: 'ÉRVÉNYES',
            value: formatHu(expiresAt)
        });

        // auxiliaryFields: szervezet neve
        pass.auxiliaryFields.push({
            key: 'org',
            label: 'KIADJA',
            value: 'Kőszegi Turisztikai Szövetség'
        });

        // backFields: részletes info (hátlap)
        pass.backFields.push(
            {
                key: 'usage',
                label: 'Felhasználás',
                value: 'Mutasd fel ezt a kártyát bármely KőszegPass elfogadóhelyen a kedvezmény igénybevételéhez. A kedvezmény mértékét az elfogadóhely határozza meg.'
            },
            {
                key: 'validity_range',
                label: 'Érvényesség',
                value: `${formatHu(purchasedAt)} – ${formatHu(expiresAt)}`
            },
            {
                key: 'pass_id',
                label: 'Pass azonosító',
                value: passData.qr_token
            },
            {
                key: 'website',
                label: 'Weboldal',
                value: 'visitkoszeg.hu'
            },
            {
                key: 'contact',
                label: 'Kapcsolat',
                value: 'info@visitkoszeg.hu'
            }
        );

        // 7. QR kód (az egyedi qr_token – ezzel azonosítható a pass)
        pass.setBarcodes({
            message: passData.qr_token,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: `KőszegPass: ${passData.holder_name}`
        });

        // 8. Képek (ikon + logó kötelező Apple-nél)
        const SITE_URL = 'https://visitkoszeg.hu';
        try {
            const icon = await getBuffer(`${SITE_URL}/images/apple-touch-icon.png`);
            if (icon) {
                pass.addBuffer('icon.png', icon);
                pass.addBuffer('icon@2x.png', icon);
            }

            const logo = await getBuffer(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            if (logo) {
                pass.addBuffer('logo.png', logo);
                pass.addBuffer('logo@2x.png', logo);
            }
        } catch (e) {
            console.warn('Image processing failed (non-fatal):', e.message);
        }

        // 9. Buffer generálás és válasz
        const buffer = await pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="koszegpass-${passData.holder_name.replace(/\s+/g, '-').toLowerCase()}.pkpass"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('KőszegPass Apple Wallet Error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
