import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { businessName, phone, email, packageType } = JSON.parse(event.body);

        console.log(`[NotifyAdmin] New Registration: ${businessName} (${email})`);

        if (!process.env.RESEND_API_KEY) {
            console.warn("[NotifyAdmin] No RESEND_API_KEY. Check Netlify Environment Variables.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Simulation success (Keys missing)" }),
            };
        }

        // 1. Send Notification to ADMIN
        const adminEmail = await resend.emails.send({
            from: 'KőszegAPP <onboarding@resend.dev>',
            to: ['koszegapp@gmail.com'],
            subject: `🚀 ÚJ PARTNER: ${businessName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h1 style="color: #6d28d9;">Új Partner Regisztráció! 🎉</h1>
                    <p>Egy új vállalkozás regisztrált a KőszegAPP rendszerébe.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #666;">Cégnév:</td><td style="font-weight: bold;">${businessName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Kapcsolattartó:</td><td>${email}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Telefon:</td><td><a href="tel:${phone}">${phone}</a></td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Csomag:</td><td><span style="background: #f3f4f6; padding: 4px 8px; rounded: 4px;">${packageType === 'tablet' ? '📱 Tablet Csomag (Prémium)' : '💻 Szoftver Csomag (Start)'}</span></td></tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p><strong>Lépések:</strong></p>
                    <ol>
                        <li>Vedd fel vele a kapcsolatot telefonon.</li>
                        <li>Küldd el a PDF szerződést.</li>
                        <li>Ha megjött az utalás, aktiváld a fiókot a Supabase-ben.</li>
                    </ol>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">Ez egy automatikus rendszerüzenet a KőszegAPP-tól.</p>
                </div>
            `
        });

        // 2. Send Welcome Email to PROVIDER (Registrant)
        const providerEmailStatus = await resend.emails.send({
            from: 'KőszegAPP <onboarding@resend.dev>',
            to: [email],
            subject: `Üdvözöljük a KőszegAPP rendszerében! - ${businessName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #111827; margin-bottom: 10px;">Gratulálunk a regisztrációhoz!</h1>
                        <p style="color: #6b7280; font-size: 16px;">Örömmel üdvözöljük a KőszegAPP partnerei között.</p>
                    </div>

                    <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
                        <h3 style="margin-top: 0; color: #374151;">Regisztrációs Adatok</h3>
                        <p style="margin: 4px 0;"><strong>Vállalkozás:</strong> ${businessName}</p>
                        <p style="margin: 4px 0;"><strong>Választott csomag:</strong> ${packageType === 'tablet' ? 'Prémium (Tablet + Szoftver)' : 'Start (Csak Szoftver)'}</p>
                        <p style="margin: 4px 0;"><strong>Állapot:</strong> Jóváhagyásra vár</p>
                    </div>

                    <h3 style="color: #111827;">Mi a következő lépés?</h3>
                    <p style="color: #4b5563; line-height: 1.6;">
                        Regisztrációja sikeresen rögzítésre került. A rendszer teljes körű használatához a következő lépések szükségesek:
                    </p>
                    <ol style="color: #4b5563; line-height: 1.6;">
                        <li><strong>Telefonos egyeztetés:</strong> Munkatársunk 24 órán belül felveszi Önnel a kapcsolatot a részletek pontosítása végett.</li>
                        <li><strong>Szerződéskötés:</strong> Emailben megküldjük a hivatalos szolgáltatói szerződést, melyet aláírva kell visszajuttatnia részünkre.</li>
                        <li><strong>Aktiválás:</strong> A szerződés aláírása és a választott csomag díjának megérkezése után azonnal aktiváljuk hozzáférését, melyről újabb értesítést kap.</li>
                    </ol>

                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #9ca3af; text-align: center;">
                        <p>&copy; ${new Date().getFullYear()} KőszegAPP. Minden jog fenntartva.</p>
                        <p>Kőszeg, Magyarország</p>
                    </div>
                </div>
            `
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Emails processed successfully",
                adminEmailId: adminEmail.data?.id,
                providerEmailId: providerEmailStatus.data?.id
            }),
        };

    } catch (error) {
        console.error("[NotifyAdmin] Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
