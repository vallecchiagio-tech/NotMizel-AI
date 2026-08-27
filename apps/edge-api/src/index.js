export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Gestione CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-NotMizel-API-Key",
        },
      });
    }

    // Proxy verso il motore Render Python per gli endpoint API
    if (url.pathname.startsWith("/api/")) {
      const renderUrl = `https://notmizel-ai.onrender.com${url.pathname}${url.search}`;
      const newRequest = new Request(renderUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      let response = await fetch(newRequest);
      response = new Response(response.body, response);
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    return fetch(request);
  },
};
