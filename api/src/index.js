// NotMizel API - Cloudflare Worker "notmizel-api-edge"
// v0.5.3 (Task 5): /verify - attestation height via VarInt,
// merkle root letta DALL'HEADER del blocco (blockstream) = verifica indipendente.
// v0.4.0: POST /stamp salva hash + proof in Supabase.
// ZERO-Upload: l'API accetta SOLO hash SHA-256, mai file.
// NOTA: niente template literal (bug tastiera Android) -> si usa "+".

import { stampDigest, upgradeProof, findBitcoinAttestation } from "./ots.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-NotMizel-API-Key",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({}, { "Content-Type": "application/json" }, CORS_HEADERS, extraHeaders)
  });
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function isValidHash(hash) {
  return typeof hash === "string" && /^[0-9a-f]{64}$/.test(hash);
}

function checkAuth(request, env) {
  if (!env.NOTMIZEL_API_KEY) return null;
  const key = request.headers.get("X-NotMizel-API-Key");
  console.log("auth: received len=" + (key ? key.length : -1) +
              " secret len=" + env.NOTMIZEL_API_KEY.length);
  if (key && key.trim() === env.NOTMIZEL_API_KEY.trim()) return null;
  return json({ error: "invalid or missing API key" }, key ? 403 : 401);
}

async function saveStamp(env, hash, otsBase64) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("saveStamp skipped: Supabase secrets not configured.");
    return false;
  }
  try {
    const res = await fetch(env.SUPABASE_URL + "/rest/v1/stamps", {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        file_hash: hash,
        ots_proof: otsBase64,
        status: "pending"
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.log("saveStamp failed: " + res.status + " " + errText);
      return false;
    }
    return true;
  } catch (e) {
    console.log("saveStamp error: " + e.message);
    return false;
  }
}

async function handleStamp(request, env) {
  const authError = checkAuth(request, env);
  if (authError) return authError;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "body must be valid JSON" }, 400);
  }
  if (!body || typeof body !== "object" || !isValidHash(body.hash)) {
    return json({ error: "hash required: 64 lowercase hex chars (sha256)" }, 400);
  }
  const digestBytes = hexToBytes(body.hash);
  try {
    const result = await stampDigest(digestBytes, body.hash);
    const otsBase64 = btoa(String.fromCharCode.apply(null, result.ots));
    const saved = await saveStamp(env, body.hash, otsBase64);
    return json({
      ots: otsBase64,
      hash: body.hash,
      submitted: new Date().toISOString(),
      pool: result.pool,
      saved: saved
    });
  } catch (err) {
    console.log("stamp failed:", err.message);
    return json({ error: "timestamping service unavailable, try again later" }, 502);
  }
}

// ===== Task 5: verifica =====

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

// POST /verify - {hash, ots(base64)}:
// 1) digest nella prova == hash inviato;
// 2) attestation gia' nella prova (VarInt height) oppure upgrade calendar;
// 3) conferma indipendente: header del blocco da blockstream.info,
//    da cui ricaviamo block_hash E merkle_root (non fidati dal file).
async function handleVerify(request, env) {
  const authError = checkAuth(request, env);
  if (authError) return authError;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "body must be valid JSON" }, 400);
  }
  if (!body || typeof body !== "object" || !isValidHash(body.hash) || typeof body.ots !== "string") {
    return json({ error: "required: hash (64 hex) and ots (base64)" }, 400);
  }
  let proofBytes;
  try {
    proofBytes = b64ToBytes(body.ots);
  } catch (e) {
    return json({ error: "ots is not valid base64" }, 400);
  }
  if (proofBytes.length < 98) {
    return json({ error: "ots too short: not a valid proof" }, 400);
  }
  const proofHex = Array.from(proofBytes.slice(33, 65))
    .map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  if (proofHex !== body.hash) {
    return json({ error: "proof digest mismatch: " + proofHex }, 400);
  }

  let att = findBitcoinAttestation(proofBytes);
  if (!att) {
    try {
      const upgraded = await upgradeProof(proofBytes);
      att = findBitcoinAttestation(upgraded);
    } catch (upErr) {
      console.log("upgrade skipped: " + upErr.message);
    }
  }
  if (!att) {
    return json({ hash: body.hash, status: "pending", checked_at: new Date().toISOString() });
  }

  // Verifica indipendente: header del blocco da blockstream.
  let blockHash = null;
  let merkleRoot = null;
  try {
    const r = await fetch("https://blockstream.info/api/block-height/" + att.height);
    if (r.ok) blockHash = (await r.text()).trim();
    if (blockHash) {
      const r2 = await fetch("https://blockstream.info/api/block/" + blockHash + "/header");
      if (r2.ok) {
        const headerHex = (await r2.text()).trim();
        // Header Bitcoin: bytes 36..68 = merkle root.
        merkleRoot = headerHex.slice(72, 136);
      }
    }
  } catch (e) {
    console.log("blockstream check failed: " + e.message);
  }
  return json({
    hash: body.hash,
    status: blockHash ? "confirmed" : "pending",
    block: att.height,
    block_hash: blockHash,
    merkle_root: merkleRoot,
    checked_at: new Date().toISOString()
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ status: "ok", service: "notmizel-api-edge", version: "0.5.3" });
    }
    if (request.method === "POST" && url.pathname === "/stamp") {
      return handleStamp(request, env);
    }
    if (request.method === "POST" && url.pathname === "/verify") {
      return handleVerify(request, env);
    }
    return json({ error: "not found" }, 404);
  }
};
