// netlify/functions/save-github-json.mjs

import fetch from "node-fetch";
import jwt from 'jsonwebtoken'; // <-- ÚJ IMPORT

export async function handler(event) {
  try {
    console.log('[save-github-json.mjs] JWT_SECRET:', process.env.JWT_SECRET ? `Létezik, hossza: ${process.env.JWT_SECRET.length}` : '!!! HIÁNYZIK !!!');
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "POST")   return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN  = process.env.GITHUB_TOKEN;
    const GH_OWNER  = process.env.GITHUB_OWNER;
    const GH_REPO   = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";
    const HOOK      = process.env.NETLIFY_BUILD_HOOK || "";
    const JWT_SECRET = process.env.JWT_SECRET; // <-- ÚJ KÖRNYEZETI VÁLTOZÓ

    // ---- ÚJ, TOKEN ALAPÚ HITELESÍTÉS ----
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return resp(401, { error: 'Auth failed: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decodedUser;
    try {
      // Ellenőrizzük a tokent a titkos kulccsal
      decodedUser = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ha a token lejárt vagy érvénytelen, hibát dobunk
      return resp(401, { error: 'Auth failed: Invalid or expired token' });
    }

    const userPermissions = decodedUser.permissions || [];
    if (!userPermissions.includes('*') && !userPermissions.includes('event:edit') && !userPermissions.includes('event:create') && !userPermissions.includes('event:delete')) {
        return resp(403, { error: 'Forbidden: You do not have permission to save content.' });
    }

    const { path, content } = JSON.parse(event.body || "{}");
    if (!path || (!Array.isArray(content) && typeof content !== "object"))
      return resp(400, { error: "Invalid payload" });

    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
    const headers = {
      Authorization: `Bearer ${GH_TOKEN}`,
      "User-Agent": "koszegapp-admin",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    let currentSha;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) {
      const j = await getRes.json();
      currentSha = j.sha;
    }

    const payload = Array.isArray(content) ? content : { ...content, frissitve: new Date().toISOString() };
    const base64 = Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64");

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        // A commit üzenetbe beletehetjük a felhasználót, aki mentett
        message: `chore(admin): update ${path} by ${decodedUser.id}`,
        content: base64,
        branch: GH_BRANCH,
        sha: currentSha,
      }),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return resp(500, { error: `GitHub save failed: ${t}` });
    }

    if (HOOK) {
      try { await fetch(HOOK, { method: "POST" }); } catch {}
    }

    return resp(200, { ok: true, path, triggeredBuild: !!HOOK });
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
