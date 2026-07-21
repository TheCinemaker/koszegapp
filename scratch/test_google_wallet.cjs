const { GoogleAuth } = require('google-auth-library');
const { googleCredentials } = require('../netlify/functions/lib/googleCredentials.js');

const issuerId = googleCredentials.issuerId;
const serviceAccountEmail = googleCredentials.client_email;
const privateKey = googleCredentials.private_key.replace(/\\n/g, '\n');
const fullClassId = `${issuerId}.koszeg_pass_class`;

async function testGoogleWallet() {
  console.log("Connecting to Google Wallet API...");
  console.log("Issuer ID:", issuerId);
  console.log("Service Account:", serviceAccountEmail);
  console.log("Class ID to check/create:", fullClassId);

  try {
    const auth = new GoogleAuth({
      credentials: { client_email: serviceAccountEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    });
    const client = await auth.getClient();

    console.log("Sending GET request to check if class exists...");
    try {
      const res = await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${encodeURIComponent(fullClassId)}`,
        method: 'GET'
      });
      console.log("✅ Class already exists! Response status:", res.status);
      console.log(JSON.stringify(res.data, null, 2));
      return;
    } catch (getErr) {
      if (getErr.code === 404) {
        console.log("Class does not exist (404). Attempting to create it (POST)...");
      } else {
        throw getErr;
      }
    }

    // Attempt POST
    const createRes = await client.request({
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

    console.log("✅ Class created successfully! Response status:", createRes.status);
    console.log(JSON.stringify(createRes.data, null, 2));

  } catch (err) {
    console.error("❌ Google Wallet API Error:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testGoogleWallet();
