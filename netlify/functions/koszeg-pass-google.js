// netlify/functions/koszeg-pass-google.js
// KőszegPass – Google Wallet generátor
//
// ⚠️  A ticket rendszer eventTicketObjects-t használ.
//     A KőszegPass genericObjects-t használ (loyaltyCard / discount card típus)
//     → külön Google Wallet class kell: GOOGLE_PASS_CLASS_ID env var
// ⚠️  Az objectId prefix "kp_" → elkülönül a "ticket_" prefixű tárgyaktól

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import { googleCredentials } from './lib/googleCredentials.js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Generic pass class létrehozása/frissítése ────────────────────────────────
// A Google Wallet Generic class-t egyszer kell létrehozni, aztán az objectek
// hivatkoznak rá. Ha nem létezik, automatikusan létrehozzuk.
async function ensureGenericClass(fullClassId, serviceAccountEmail, privateKey) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
    if (isProd && !process.env.FORCE_WALLET_PUBLISH) {
        console.log('Skipping class check in production (assumed active)');
        return;
    }

    try {
        const auth = new GoogleAuth({
            credentials: { client_email: serviceAccountEmail, private_key: privateKey },
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });
        const client = await auth.getClient();

        // GET – megnézzük, létezik-e már
        try {
            await client.request({
                url: `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${encodeURIComponent(fullClassId)}`,
                method: 'GET'
            });
            console.log('Generic class exists:', fullClassId);
            return;
        } catch (getErr) {
            if (getErr.code !== 404) throw getErr;
        }

        // POST – létrehozzuk ha nem létezik
        await client.request({
            url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
            method: 'POST',
            data: {
                id: fullClassId,
                reviewStatus: 'UNDER_REVIEW',
                hexBackgroundColor: '#0C234B',
                logo: {
                    sourceUri: {
                        uri: 'https://visitkoszeg.hu/images/koeszeg_logo_nobg.png'
                    },
                    contentDescription: {
                        defaultValue: { language: 'hu', value: 'KőszegPass logó' }
                    }
                },
                cardTitle: {
                    defaultValue: { language: 'hu', value: 'KőszegPass' }
                }
            }
        });
        console.log('✅ Generic class created:', fullClassId);
    } catch (err) {
        console.warn('⚠️ Class ensure warning (non-fatal):', err.message);
    }
}

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const passId = event.queryStringParameters?.passId;
    if (!passId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Pass ID required' }) };
    }

    try {
        // 1. Pass lekérdezése
        const { data: passData, error: passError } = await supabase
            .from('koszeg_passes')
            .select('*')
            .eq('id', passId)
            .single();

        if (passError || !passData) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pass not found' }) };
        }

        if (passData.status !== 'active') {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Pass is not active' }) };
        }

        // 2. Google credentials
        const issuerId = process.env.GOOGLE_ISSUER_ID || googleCredentials.issuerId;

        // ⚠️  Külön class ID a pass-hoz (ne keveredjen a ticket osztállyal)
        const classIdSource = process.env.GOOGLE_PASS_CLASS_ID
            || process.env.GOOGLE_TICKET_CLASS_ID  // fallback ha nincs külön
            || googleCredentials.ticketClassId;

        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleCredentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || googleCredentials.private_key;
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        const cleanedClassId = classIdSource.includes('.') ? classIdSource.split('.').pop() : classIdSource;
        const fullClassId = `${issuerId}.koszeg_pass_class`;

        // ⚠️  objectId prefix "kp_" → elkülönül a "ticket_" tárgyaktól
        const objectId = `${issuerId}.kp_${passData.id.replace(/-/g, '_').slice(0, 30)}`;

        // 3. Class biztosítása (ha nem létezik, létrehozzuk)
        await ensureGenericClass(fullClassId, serviceAccountEmail, privateKey);

        // 4. Dátum formázás
        const formatHu = (dateStr) =>
            new Date(dateStr).toLocaleDateString('hu-HU', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

        // 5. JWT payload összeállítása (genericObjects)
        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: [
                'https://visitkoszeg.hu',
                'https://www.visitkoszeg.hu',
                'https://koszegapp.netlify.app',
                'https://mail.google.com'
            ],
            payload: {
                genericObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        state: 'ACTIVE',

                        // Fejléc kép (kabala/szkyline)
                        heroImage: {
                            sourceUri: {
                                uri: 'https://visitkoszeg.hu/images/koszeg_skyline.jpg'
                            },
                            contentDescription: {
                                defaultValue: { language: 'hu', value: 'Kőszeg látkép' }
                            }
                        },

                        // QR kód – a pass egyedi tokenje
                        barcode: {
                            type: 'QR_CODE',
                            value: passData.qr_token,
                            altText: `KőszegPass: ${passData.holder_name}`
                        },

                        // Kártya fejléc mezők
                        cardTitle: {
                            defaultValue: { language: 'hu', value: 'KőszegPass' }
                        },
                        header: {
                            defaultValue: {
                                language: 'hu',
                                value: passData.holder_name
                            }
                        },
                        subheader: {
                            defaultValue: {
                                language: 'hu',
                                value: passData.pass_type === 'family' ? 'Családi Pass' : 'Egyéni Pass'
                            }
                        },

                        // Text modulok (részletek)
                        textModulesData: [
                            {
                                id: 'valid_until',
                                header: 'ÉRVÉNYES',
                                body: formatHu(passData.expires_at)
                            },
                            {
                                id: 'pass_type',
                                header: 'TÍPUS',
                                body: passData.pass_type === 'family' ? 'Családi (2 felnőtt + gyerekek)' : 'Egyéni'
                            },
                            {
                                id: 'usage',
                                header: 'FELHASZNÁLÁS',
                                body: 'Mutasd fel bármely KőszegPass elfogadóhelyen a kedvezmény igénybevételéhez.'
                            }
                        ],

                        // Linkek (hátlap)
                        linksModuleData: {
                            uris: [
                                {
                                    uri: 'https://visitkoszeg.hu',
                                    description: 'VisitKőszeg weboldal',
                                    id: 'website'
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

        return {
            statusCode: 302,
            headers: {
                'Location': `https://pay.google.com/gp/v/save/${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        };

    } catch (err) {
        console.error('KőszegPass Google Wallet Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
