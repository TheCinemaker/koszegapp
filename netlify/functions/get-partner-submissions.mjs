import fetch from "node-fetch";

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
    if (event.httpMethod !== "GET") return resp(405, { error: "Method Not Allowed" });

    const GH_TOKEN = process.env.GITHUB_TOKEN;
    const GH_OWNER = process.env.GITHUB_OWNER;
    const GH_REPO = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";

    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return resp(500, { error: "GitHub API hiányzó beállítások" });
    }

    const dirUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/public/data/submissions?ref=${GH_BRANCH}`;
    const headers = {
      Authorization: `Bearer ${GH_TOKEN}`,
      "User-Agent": "koszegapp-admin",
      Accept: "application/vnd.github+json",
    };

    const dirRes = await fetch(dirUrl, { headers });
    if (!dirRes.ok) {
      if (dirRes.status === 404) {
        return resp(200, { submissions: [] });
      }
      const t = await dirRes.text();
      return resp(500, { error: `GitHub mappák listázása sikertelen: ${t}` });
    }

    const files = await dirRes.json();
    if (!Array.isArray(files)) {
      return resp(200, { submissions: [] });
    }

    const jsonFiles = files.filter(f => f.type === "file" && f.name.endsWith(".json"));

    const submissions = await Promise.all(
      jsonFiles.map(async (f) => {
        try {
          const fileRes = await fetch(f.download_url || f.git_url, {
            headers: f.download_url ? {} : { ...headers, Accept: "application/vnd.github.raw" }
          });
          if (fileRes.ok) {
            const data = await fileRes.json();
            return {
              ...data,
              _githubSha: f.sha,
              _githubPath: f.path,
              _filename: f.name,
            };
          }
        } catch (err) {
          console.warn(`Failed to parse ${f.name}:`, err);
        }
        return null;
      })
    );

    const validSubmissions = submissions.filter(Boolean);

    return resp(200, { submissions: validSubmissions });
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
