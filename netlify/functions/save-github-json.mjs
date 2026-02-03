// netlify/functions/save-github-json.mjs

import fetch from "node-fetch";
import jwt from 'jsonwebtoken'; // <-- ÚJ IMPORT

export async function handler(event) {
  try {
    console.log('[save-github-json.mjs] JWT_SECRET:', process.env.JWT_SECRET ? `Létezik, hossza: ${process.env.JWT_SECRET.length}` : '!!! HIÁNYZIK !!!');
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "POST") return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const GH_OWNER = process.env.GITHUB_OWNER;
    const GH_REPO = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";
    const HOOK = process.env.NETLIFY_BUILD_HOOK || "";
    // ---- SUPABASE HITELESÍTÉS START ----
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return resp(401, { error: 'Auth failed: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Initialize Supabase Client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return resp(401, { error: 'Auth failed: Invalid or expired token' });
    }

    // Role -> Permissions Mapping
    let role = user.user_metadata?.role || 'client';

    // --- WHITELIST CHECK (Backend Side) ---
    // If role is client/missing, check the whitelist table to see if they are actually an admin
    const username = user.user_metadata?.nickname || user.user_metadata?.username;

    // We can query public table because we have RLS 'public read' enabled
    const { data: whitelistData } = await supabase
      .from('admin_whitelist')
      .select('role')
      .eq('username', username)
      .maybeSingle();

    if (whitelistData) {
      role = whitelistData.role; // Override with the real role
      console.log(`[save-github-json] Whitelist override: ${username} -> ${role}`);
    }
    // --------------------------------------

    let perms = [];

    if (['admin', 'superadmin', 'editor'].includes(role)) {
      perms = ['*'];
    } else if (['provider', 'varos', 'var', 'tourinform', 'partner'].includes(role)) {
      // Grant general write permissions like we did for image upload
      perms = ['events:create', 'events:edit', 'events:delete', 'attractions:create', 'attractions:edit', 'page:save'];
    }

    const decodedUser = {
      id: username || user.email || user.id,
      role: role,
      permissions: perms
    };
    // ---- SUPABASE HITELESÍTÉS END ----

    const userPermissions = decodedUser.permissions || [];
    // Fixed typo: event:edit -> events:edit (checked plural to match standard)
    if (!userPermissions.includes('*') && !userPermissions.includes('events:edit') && !userPermissions.includes('events:create') && !userPermissions.includes('events:delete')) {
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
      try { await fetch(HOOK, { method: "POST" }); } catch { }
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
