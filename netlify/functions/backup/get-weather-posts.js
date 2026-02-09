import fetch from 'node-fetch';

export async function handler(event, context) {
  const pageId = "100063151394186"; // IDE A KŐSZEGI IDŐJÁRÁS FACEBOOK OLDAL ID
  const token = process.env.FACEBOOK_TOKEN;

  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/${pageId}/posts?fields=message,created_time,permalink_url&access_token=${token}`
    );
    const data = await fbRes.json();

    if (!data.data) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Nem sikerült lekérni a Facebook adatokat.", details: data }),
      };
    }

    const filtered = data.data.filter(
      post => post.message && post.message.includes("#KőszegAPP")
    );

    return {
      statusCode: 200,
      body: JSON.stringify(filtered),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Szerver hiba.", details: err.message }),
    };
  }
}
