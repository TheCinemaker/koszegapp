import fetch from "node-fetch";

export async function handler(event) {
  // CORS Preflight OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Accept, X-SmartMixin-Context",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: JSON.stringify({ ok: true })
    };
  }

  try {
    let subPath = (event.path || "")
      .replace(/^\/\.netlify\/functions\/smartmixin-proxy/, "")
      .replace(/^\/api\/smartmixin/, "");

    if (!subPath || subPath === "/") subPath = "/";

    let queryString = "";
    if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
      const q = new URLSearchParams(event.queryStringParameters).toString();
      if (q) queryString = `?${q}`;
    }

    const targetUrl = `https://api2.smartmixin.io/api${subPath}${queryString}`;

    const headers = {
      "Accept": "application/json",
      "X-SmartMixin-Context": "UI",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    };

    if (event.headers["content-type"]) {
      headers["Content-Type"] = event.headers["content-type"];
    } else if (event.httpMethod === "POST") {
      headers["Content-Type"] = "application/json";
    }

    const options = {
      method: event.httpMethod,
      headers
    };

    if (event.body && (event.httpMethod === "POST" || event.httpMethod === "PUT")) {
      options.body = event.body;
    }

    const res = await fetch(targetUrl, options);
    const responseText = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: responseText
    };
  } catch (err) {
    console.error("[smartmixin-proxy] Error:", err);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify([])
    };
  }
}
