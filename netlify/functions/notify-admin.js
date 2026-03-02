import fetch from 'node-fetch';

export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { businessName, phone, email, packageType } = JSON.parse(event.body);

        console.log(`[NotifyAdmin] New Registration Attempt: ${businessName} (${email})`);

        // 1. Check if RESEND_API_KEY is present
        const RESEND_API_KEY = process.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            console.warn("[NotifyAdmin] No RESEND_API_KEY found. Logging email content only.");
            console.log("---------------------------------------------------");
            console.log(`To: koszegapp@gmail.com`);
            console.log(`Subject: 🚀 Új szolgáltató regisztrált: ${businessName}`);
            console.log(`Message:`);
            console.log(`Egy új szolgáltató regisztrált a rendszerbe!`);
            console.log(`Név: ${businessName}`);
            console.log(`Telefon: ${phone}`);
            console.log(`Email: ${email}`);
            console.log(`Csomag: ${packageType === 'tablet' ? 'Tablet + Szoftver (Prémium)' : 'Csak Szoftver (Start)'}`);
            console.log("---------------------------------------------------");

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Simulation success (Keys missing)" }),
            };
        }

        // 2. Send via Resend (if key exists)
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'KőszegAPP <onboarding@resend.dev>', // Using Test Domain for guaranteed delivery
                to: ['koszegapp@gmail.com'],
                subject: `🚀 Új szolgáltató: ${businessName}`,
                html: `
          <h1>Új Partner Regisztráció! 🎉</h1>
          <p>Valaki regisztrált a KőszegAPP szolgáltatói felületén.</p>
          <hr />
          <p><strong>Vállalkozás:</strong> ${businessName}</p>
          <p><strong>Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Választott Csomag:</strong> ${packageType === 'tablet' ? '📱 Tablet Csomag' : '💻 Szoftver Csomag'}</p>
          <hr />
          <p>Kérlek vedd fel vele a kapcsolatot 24 órán belül!</p>
        `
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Resend API Error');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email sent successfully", id: data.id }),
        };

    } catch (error) {
        console.error("[NotifyAdmin] Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
