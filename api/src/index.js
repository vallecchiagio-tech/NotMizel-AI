// NotMizel API Edge — Worker autonomo (niente più proxy Render!)
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-NotMizel-API-Key",
    },
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return json(null, 204);

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "notmizel-api-edge", version: "0.2.0", ts: new Date().toISOString() });
    }

    // Il Task 2 aggiungerà qui: POST /stamp (OpenTimestamps)
    return json({ error: "not_found", path: url.pathname }, 404);
  },
};

