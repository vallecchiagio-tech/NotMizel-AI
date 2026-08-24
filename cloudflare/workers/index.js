export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      // Qui in seguito instradteremo le richieste sicure
      return new Response(JSON.stringify({ message: "NotMizel-AI Edge Proxy Active" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("NotMizel-AI Edge Gateway", { status: 200 });
  },
};
