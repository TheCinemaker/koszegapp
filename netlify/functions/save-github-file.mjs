import jwt from 'jsonwebtoken';

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "POST") return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const GH_OWNER = process.env.GITHUB_OWNER;
    const GH_REPO = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";
    const JWT_SECRET = process.env.JWT_SECRET;
    const BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK || "";

    // ---- JWT HITELESÍTÉS START ----
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return resp(401, { error: 'Auth failed: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decodedUser;
    try {
      decodedUser = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("JWT Verify Error:", err.message);
      return resp(401, { error: 'Auth failed: Invalid or expired token' });
    }
    // ---- JWT HITELESÍTÉS END ----

    let { filename, contentBase64, dir = "public/images/events", overwrite = false } =
      JSON.parse(event.body || "{}");

    if (!filename || !contentBase64) return resp(400, { error: "Missing filename or contentBase64" });

    // data URL esetén vágjuk le az elejét
    if (contentBase64.startsWith("data:")) {
      contentBase64 = contentBase64.split(",")[1] || "";
    }

    const safeName = filename.replace(/[\r\n]/g, "").trim();
    const dot = safeName.lastIndexOf(".");
    const base = dot > -1 ? safeName.slice(0, dot) : safeName;
    const ext = (dot > -1 ? safeName.slice(dot) : "").toLowerCase();
    const baseSlug = slugifyBase(base);

    // Célútvonal
    let targetPath = `${dir}/${baseSlug}${ext}`;

    const apiBase = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`;
    const headers = {
      Authorization: `Bearer ${GH_TOKEN}`,
      "User-Agent": "koszegapp-admin",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // Létezik már?
    let shaToUse;
    {
      const getUrl = `${apiBase}${encodeURIComponent(targetPath)}?ref=${GH_BRANCH}`;
      const getRes = await fetch(getUrl, { headers });
      if (getRes.ok) {
        const j = await getRes.json();
        if (overwrite) {
          shaToUse = j.sha;
        } else {
          targetPath = `${dir}/${baseSlug}-${Date.now()}${ext}`;
          shaToUse = undefined;
        }
      } else if (getRes.status !== 404) {
        // Ha nem 404, és nem ok, akkor baj van (pl. 401 auth hiba github felé)
        const errText = await getRes.text();
        console.error("GitHub CHECK failed:", getRes.status, errText);
        // Nem térünk vissza azonnal hibával, megpróbáljuk a feltöltést, hátha (de valszeg elhasal)
      }
    }

    // Feltöltés
    const putBody = {
      message: `chore(admin): upload ${targetPath} by ${decodedUser.id}`,
      content: contentBase64,
      branch: GH_BRANCH,
    };
    if (shaToUse) putBody.sha = shaToUse;

    const putRes = await fetch(`${apiBase}${encodeURIComponent(targetPath)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      console.error("GitHub upload failed", putRes.status, t);
      return resp(500, { error: `GitHub upload failed (${putRes.status}): ${t}` });
    }

    // Build hook
    let hookStatus = null;
    if (BUILD_HOOK) {
      try {
        const r = await fetch(BUILD_HOOK, { method: "POST" });
        hookStatus = r.status;
      } catch (e) {
        console.error("Build hook error:", e);
        hookStatus = "hook-error";
      }
    }

    const storedName = targetPath.split("/").pop();
    const rawUrl = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${targetPath}`;
    return resp(200, {
      ok: true,
      filename: storedName,
      path: targetPath,
      rawUrl,
      triggeredBuild: !!BUILD_HOOK,
      hookStatus
    });

  } catch (e) {
    console.error("save-github-file crashed:", e);
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

function slugifyBase(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
