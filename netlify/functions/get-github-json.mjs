// GET /.netlify/functions/get-github-json?path=public/data/events.json
export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "GET") return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN  = process.env.GITHUB_TOKEN;
    const GH_OWNER  = process.env.GITHUB_OWNER;
    const GH_REPO   = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";

    const path = (event.queryStringParameters?.path || "").trim();
    if (!path) return resp(400, { error: "Missing ?path" });

    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
    // Azonnal RAW-t kérünk a GitHub API-tól:
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github.raw",
        "User-Agent": "koszegapp-admin",
      },
    });

    if (!res.ok) {
      const t = await res.text();
      return resp(res.status, { error: `GitHub read failed: ${t}` });
    }

    const text = await res.text();
    // Válasz JSON-ként (nem kell base64)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body: text,
    };
  } catch (e) {
    return resp(500, { error: e?.message || String(e) });
  }
}

function resp(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
