export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/legal-eidas") {
      const affiliateLink = "https://www.notary24.com/?ref=NOTMIZEL_AI";
      return Response.redirect(affiliateLink, 302);
    }

    const backendUrl = "https://notmizel-ai.onrender.com" + url.pathname + url.search;
    const modifiedRequest = new Request(request);
    
    return fetch(backendUrl, modifiedRequest);
  }
};
