import fetch from "node-fetch";

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
      return resp(405, { error: "Method Not Allowed" });
    }

    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const GH_OWNER = process.env.GITHUB_OWNER;
    const GH_REPO = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";

    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return resp(500, { error: "GitHub API hiányzó beállítások" });
    }

    const { path, sha } = JSON.parse(event.body || "{}");
    if (!path) {
      return resp(400, { error: "Hiányzó fájl elérés (path)" });
    }

    let currentSha = sha;
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
    const headers = {
      Authorization: `Bearer ${GH_TOKEN}`,
      "User-Agent": "koszegapp-admin",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    if (!currentSha) {
      const getRes = await fetch(apiUrl, { headers });
      if (getRes.ok) {
        const j = await getRes.json();
        currentSha = j.sha;
      }
    }

    if (!currentSha) {
      return resp(404, { error: "Fájl nem található a GitHub-on" });
    }

    const delRes = await fetch(apiUrl, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        message: `chore(admin): delete submission file ${path}`,
        sha: currentSha,
        branch: GH_BRANCH,
      }),
    });

    if (!delRes.ok) {
      const t = await delRes.text();
      return resp(500, { error: `GitHub fájl törlése sikertelen: ${t}` });
    }

    return resp(200, { ok: true, deletedPath: path });
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
      "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
