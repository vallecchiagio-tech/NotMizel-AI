const env = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  SUPABASE_JWT_SECRET: 'your-jwt-secret',
  RENDER_API_URL: 'https://notmizel-ai.onrender.com'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Logica semplice di routing
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'edge-gateway active' }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  // Inoltra la richiesta al backend Render
  try {
    const response = await fetch(env.RENDER_API_URL + url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // Aggiungi header CORS
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' }
    });
  }
}
