const env = {
  SUPABASE_URL: 'https://your-project.supabase.co', // Sostituisci con i tuoi valori reali
  SUPABASE_ANON_KEY: 'your-anon-key',
  RENDER_API_URL: 'https://notmizel-ai.onrender.com'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'edge-gateway active' }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  // Inoltra al backend Render
  try {
    const targetUrl = env.RENDER_API_URL + url.pathname + url.search;
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    const newHeaders = new Headers(response.headers);
    Object.keys(corsHeaders).forEach(key => {
      newHeaders.set(key, corsHeaders[key]);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend unavailable', details: error.message }), {
      status: 503,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
}
