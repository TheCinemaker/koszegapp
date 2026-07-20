import fetch from "node-fetch";

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "POST") return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const GH_OWNER = process.env.GITHUB_OWNER;
    const GH_REPO = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";
    const HOOK = process.env.NETLIFY_BUILD_HOOK || "";

    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return resp(500, { error: "GitHub API hiányzó beállítások (GITHUB_TOKEN / OWNER / REPO)" });
    }

    const item = JSON.parse(event.body || "{}");
    if (!item || !item.name) {
      return resp(400, { error: "Hiányzó vagy érvénytelen adatlap" });
    }

    const nameSlug = (item.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const timestamp = Date.now();
    const filename = `${nameSlug}_${timestamp}.json`;
    const filePath = `public/data/submissions/${filename}`;

    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(filePath)}?ref=${GH_BRANCH}`;
    const headers = {
      Authorization: `Bearer ${GH_TOKEN}`,
      "User-Agent": "koszegapp-adatbekero",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    const payload = {
      ...item,
      _filename: filename,
      _filePath: filePath,
      submitted_at: item.submitted_at || new Date().toISOString()
    };

    const base64 = Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64");

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat(adatbekero): add partner submission ${filename}`,
        content: base64,
        branch: GH_BRANCH
      }),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return resp(500, { error: `GitHub save failed: ${t}` });
    }

    if (HOOK) {
      try { await fetch(HOOK, { method: "POST" }); } catch { }
    }

    return resp(200, { ok: true, filename, filePath });
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
