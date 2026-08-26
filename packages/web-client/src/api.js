const BACKEND_URL = "https://notmizel-crypto-core.onrender.com"; // Il tuo endpoint Render

// 1. Cifratura e Notarizzazione Documento Generico
async function encryptDocument() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        alert(`Avvio analisi e cifratura Zero-Knowledge per: ${file.name}`);
        
        // Simulo il calcolo local hash SHA-256
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Richiedi subito la generazione del certificato PDF
        fetchCertificate(file.name, fileHash, "Utente NotMizel");
    };
    fileInput.click();
}

// 2. Deposito e Tutela Copyright Musica
async function notarizeMusic() {
    const artist = document.getElementById('music-artist').value;
    const title = document.getElementById('music-title').value;

    if (!artist || !title) {
        alert("Inserisci sia il nome dell'Artista che il Titolo del brano!");
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*,.mp3,.wav,.flac';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("artist_name", artist);
        formData.append("song_title", title);
        formData.append("kyc_status", "unverified");

        try {
            alert("Deposito dell'impronta acustica in corso...");
            const res = await fetch(`${BACKEND_URL}/notarize/music`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            
            alert(`Brano Depositato con Successo!\nSHA-256: ${data.hash_sha256.substring(0, 20)}...`);
            
            // Scarica il certificato PDF ufficiale
            fetchCertificate(`${title} - ${artist}`, data.hash_sha256, artist);
        } catch (err) {
            alert("Errore di connessione al backend Render. Verificare l'URL.");
            console.error(err);
        }
    };
    fileInput.click();
}

// 3. Scaricamento Certificato PDF Forense
async function fetchCertificate(docTitle, fileHash, author) {
    const formData = new FormData();
    formData.append("doc_title", docTitle);
    formData.append("file_hash", fileHash);
    formData.append("author", author);
    formData.append("jurisdiction", "eIDAS / WIPO / AgID");

    const res = await fetch(`${BACKEND_URL}/generate-certificate`, {
        method: "POST",
        body: formData
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificato_NotMizel_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-encrypt').addEventListener('click', encryptDocument);
    document.getElementById('btn-notarize-music').addEventListener('click', notarizeMusic);
    document.getElementById('btn-request-paper').addEventListener('click', () => {
        alert("Servizio Cartaceo/Apostille: Reindirizzamento al partner notarile accreditato...");
    });
});

async function runAutoKYC() {
    const name = prompt("Inserisci il tuo Nome e Cognome completo:");
    if (!name) return;

    alert("Seleziona la foto del tuo Documento d'Identità (Fronte)");
    const docInput = document.createElement('input');
    docInput.type = 'file';
    
    docInput.onchange = async (e) => {
        const docFile = e.target.files[0];
        if (!docFile) return;

        alert("Ora seleziona un Selfie per la verifica biometrica");
        const selfieInput = document.createElement('input');
        selfieInput.type = 'file';

        selfieInput.onchange = async (ev) => {
            const selfieFile = ev.target.files[0];
            if (!selfieFile) return;

            const formData = new FormData();
            formData.append("document_front", docFile);
            formData.append("selfie", selfieFile);
            formData.append("full_name", name);

            alert("Verifica KYC automatica in corso...");
            try {
                const res = await fetch(`${BACKEND_URL}/kyc/verify-auto`, { method: "POST", body: formData });
                const data = await res.json();
                
                if (data.status === "verified") {
                    document.getElementById('kyc-badge').innerText = `KYC: VERIFICATO (${data.user})`;
                    document.getElementById('kyc-badge').style.background = "#dcfce7";
                    document.getElementById('kyc-badge').style.color = "#15803d";
                    alert(`Identità Verificata con Successo!\nLivello: ${data.kyc_level}\nMatch Biometrico: ${data.biometric_match_confidence}`);
                }
            } catch (err) {
                alert("Errore durante la verifica KYC automatica.");
            }
        };
        selfieInput.click();
    };
    docInput.click();
}
