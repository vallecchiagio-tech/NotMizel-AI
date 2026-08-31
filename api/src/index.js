// NotMizel API - Cloudflare Worker "notmizel-api-edge"
// v0.4.0 (Task 4): POST /stamp salva hash + proof in Supabase.
// ZERO-Upload: l'API accetta SOLO hash SHA-256, mai file.
// NOTA: niente template literal (bug tastiera Android) -> si usa "+".

import { stampDigest } from "./ots.js";

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

// Converte "<64 hex chars>" nei 32 byte binari del digest.
function hexToBytes(hex) {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Accetta SOLO 64 caratteri hex minuscoli (design Task 2).
function isValidHash(hash) {
  return typeof hash === "string" && /^[0-9a-f]{64}$/.test(hash);
}

// Auth: se il secret e' configurato, la chiave DEVE combaciare.
// Se non e' configurato, l'endpoint resta aperto (fase di test).
function checkAuth(request, env) {
  if (!env.NOTMIZEL_API_KEY) return null; // secret assente: aperto
  const key = request.headers.get("X-NotMizel-API-Key");
  if (key === env.NOTMIZEL_API_KEY) return null;
  return json({ error: "invalid or missing API key" }, key ? 403 : 401);
}

// Task 4: salva hash + proof nella tabella "stamps" via REST Supabase.
// Usa service_role key (SOLO lato Worker, bypassa RLS). user_id resta
// NULL finche' non arriva Supabase Auth (Week 7-8).
// Ritorna true/false: un fallito NON deve far perdere il timestamp.
async function saveStamp(env, hash, otsBase64, pool) {
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
      // Log per wrangler tail: non filtriamo dettagli al client.
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

// POST /stamp - valida l'hash, lo invia ai pool OTS, salva in Supabase,
// restituisce il proof. Punto di aggancio per rate limiting / tiers.
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

    // Task 4: persistenza. Il salvataggio non blocca il timestamp:
    // se Supabase fallisce, il client riceve comunque il proof.
    const saved = await saveStamp(env, body.hash, otsBase64, result.pool);

    return json({
      ots: otsBase64,
      hash: body.hash,
      submitted: new Date().toISOString(),
      pool: result.pool,
      saved: saved
    });
  } catch (err) {
    // Non filtriamo dettagli interni al client: logghiamo per wrangler tail.
    console.log("stamp failed:", err.message);
    return json({ error: "timestamping service unavailable, try again later" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ status: "ok", service: "notmizel-api-edge", version: "0.4.0" });
    }

    if (request.method === "POST" && url.pathname === "/stamp") {
      return handleStamp(request, env);
    }

    return json({ error: "not found" }, 404);
  }
};
