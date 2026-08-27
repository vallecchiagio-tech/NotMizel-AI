import { NotMizelAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti DOM
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    const userEmailEl = document.getElementById('user-email');
    const userTierEl = document.getElementById('user-tier');

    const hashFileInput = document.getElementById('hash-file-input');
    const hashTriggerBtn = document.getElementById('hash-trigger-btn');
    const hashFileName = document.getElementById('hash-file-name');
    const hashBtn = document.getElementById('hash-btn');
    const hashResult = document.getElementById('hash-result');

    const authorFileInput = document.getElementById('author-file-input');
    const authorTriggerBtn = document.getElementById('author-trigger-btn');
    const authorFileName = document.getElementById('author-file-name');
    const authorBtn = document.getElementById('author-btn');
    const authorResult = document.getElementById('author-result');

    let selectedHashFile = null;
    let selectedAuthorFile = null;

    function updateStateUI() {
        const token = localStorage.getItem('supabase_token');
        if (token) {
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            userEmailEl.textContent = localStorage.getItem('user_email') || 'Utente';
            userTierEl.textContent = localStorage.getItem('user_tier') || 'Free';
        } else {
            loginSection.classList.remove('hidden');
            appSection.classList.add('hidden');
        }
    }

    // Login & Logout
    document.getElementById('login-btn').addEventListener('click', () => {
        const email = prompt("Inserisci la tua email:");
        if (!email) return;
        localStorage.setItem('supabase_token', 'Bearer mock_token_active');
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_tier', 'premium');
        updateStateUI();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });

    // Eventi selezione File
    hashTriggerBtn.addEventListener('click', () => hashFileInput.click());
    hashFileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            selectedHashFile = e.target.files[0];
            hashFileName.textContent = selectedHashFile.name;
            hashFileName.classList.remove('hidden');
            hashBtn.disabled = false;
        }
    });

    authorTriggerBtn.addEventListener('click', () => authorFileInput.click());
    authorFileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            selectedAuthorFile = e.target.files[0];
            authorFileName.textContent = selectedAuthorFile.name;
            authorFileName.classList.remove('hidden');
            authorBtn.disabled = false;
        }
    });

    // Azioni Notarizzazione
    hashBtn.addEventListener('click', async () => {
        if (!selectedHashFile) return;
        hashBtn.textContent = 'Calcolo in corso...';
        hashBtn.disabled = true;
        hashResult.style.display = 'block';
        hashResult.innerHTML = 'Generazione Hash locale SHA-256...';

        try {
            const res = await NotMizelAPI.notarizeHash(selectedHashFile);
            hashResult.innerHTML = `<span style="color:#4ade80">✓ Registrato</span><br>File: ${res.filename}<br>Hash: ${res.sha256_hash}<br>Time: ${res.timestamp}`;
        } catch (err) {
            hashResult.innerHTML = `<span style="color:#f87171">❌ ${err.message}</span>`;
        } finally {
            hashBtn.textContent = 'Calcola Hash & Notarizza';
            hashBtn.disabled = false;
        }
    });

    authorBtn.addEventListener('click', async () => {
        if (!selectedAuthorFile) return;
        const artist = document.getElementById('artist-name').value;
        const title = document.getElementById('work-title').value;
        const region = document.getElementById('region-select').value;

        if (!artist || !title) {
            alert('Compila il nome dell\'autore e il titolo dell\'opera.');
            return;
        }

        authorBtn.textContent = 'Generazione Certificato...';
        authorBtn.disabled = true;
        authorResult.style.display = 'block';
        authorResult.innerHTML = 'Elaborazione prova d\'autore in corso...';

        try {
            const res = await NotMizelAPI.createAuthorProof(selectedAuthorFile, artist, title, region);
            authorResult.innerHTML = `<span style="color:#c084fc">✓ Certificato Generato</span><br>ID: ${res.certificate_id}<br>Hash: ${res.file_hash.substring(0, 24)}...`;
        } catch (err) {
            authorResult.innerHTML = `<span style="color:#f87171">❌ ${err.message}</span>`;
        } finally {
            authorBtn.textContent = 'Richiedi Certificato d\'Autore';
            authorBtn.disabled = false;
        }
    });

    updateStateUI();
});
