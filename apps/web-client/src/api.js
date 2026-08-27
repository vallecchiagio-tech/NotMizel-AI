// Configurazione API
const API_URL = 'https://not.mizel-ai.com'; // Il tuo dominio Cloudflare

// Funzione per ottenere il token (da implementare con Supabase Auth)
async function getToken() {
    return localStorage.getItem('supabase_token');
}

// Funzione per login (da implementare con Supabase)
async function login(email, password) {
    // Esempio di chiamata a Supabase Auth
    // const { user, session } = await supabase.auth.signInWithPassword({ email, password });
    // localStorage.setItem('supabase_token', session.access_token);
    console.log("Login non implementato ancora.");
    return null;
}

// Funzione per logout
function logout() {
    localStorage.removeItem('supabase_token');
}

// Funzione per calcolare hash
async function notarizeFile(file) {
    const token = await getToken();
    if (!token) throw new Error("Non loggato");

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/process-and-hash`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Errore API");
    }

    return await response.json();
}

// Esporta le funzioni
window.NotMizelAPI = {
    login,
    logout,
    notarizeFile
};
