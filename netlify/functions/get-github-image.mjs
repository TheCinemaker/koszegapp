import fetch from "node-fetch";
const mimeByExt = (p) => {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
};

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return respBin(200, "", "text/plain");
    if (event.httpMethod !== "GET") return respBin(405, "", "text/plain");

    const GH_TOKEN  = process.env.GITHUB_TOKEN;
    const GH_OWNER  = process.env.GITHUB_OWNER;
    const GH_REPO   = process.env.GITHUB_REPO;
    const GH_BRANCH = process.env.GITHUB_BRANCH || "main";

    const path = (event.queryStringParameters?.path || "").trim();
    if (!path) return respBin(400, "", "text/plain");

    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${GH_BRANCH}`;
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github.raw",
        "User-Agent": "koszegapp-admin",
      },
    });

    if (!res.ok) {
      return respBin(res.status, "", "text/plain");
    }

    const arrayBuf = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const mime = mimeByExt(path);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": mime,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch {
    return respBin(500, "", "text/plain");
  }
}

function respBin(status, body, contentType) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    },
    body,
    isBase64Encoded: false,
  };
}
