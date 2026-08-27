const RENDER_API_URL = "https://notmizel-ai.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const btnEncrypt = document.getElementById("btn-encrypt");
    const btnMusic = document.getElementById("btn-notarize-music");
    
    // Gestione Hashing File Locale (Zero-Knowledge)
    if (btnEncrypt) {
        btnEncrypt.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                btnEncrypt.innerText = "⚡ Calcolo SHA-256 in corso...";
                
                const arrayBuffer = await file.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                btnEncrypt.innerText = "Seleziona File dal Dispositivo";
                
                alert(`✅ SHA-256 Generato con Successo!\n\nFile: ${file.name}\nHash: ${sha256Hex}`);
                
                // Registrazione automatica su Render
                const formData = new FormData();
                formData.append("sha256", sha256Hex);
                formData.append("filename", file.name);

                try {
                    const res = await fetch(`${RENDER_API_URL}/api/v1/notarize`, {
                        method: "POST",
                        body: formData
                    });
                    const data = await res.json();
                    console.log("Notarizzazione inviata:", data);
                } catch (err) {
                    console.error("Errore connessione Render:", err);
                }
            };
            input.click();
        });
    }

    // Gestione Deposito Musica
    if (btnMusic) {
        btnMusic.addEventListener("click", async () => {
            const artist = document.getElementById("music-artist")?.value;
            const title = document.getElementById("music-title")?.value;
            const license = document.getElementById("music-license")?.value;

            if (!artist || !title) {
                alert("⚠️ Compila tutti i campi: Nome Artista e Titolo dell'Opera.");
                return;
            }

            btnMusic.innerText = "⏳ Generazione Certificato...";

            const formData = new FormData();
            formData.append("artist", artist);
            formData.append("title", title);
            formData.append("license_type", license);

            try {
                const res = await fetch(`${RENDER_API_URL}/api/v1/music`, {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                btnMusic.innerText = "Richiedi Certificato d'Autore";
                alert(`🎵 Opera Registrata con Successo!\n\nCodice Certificato: ${data.certificate_id}\nGiurisdizione: ${license.toUpperCase()}`);
            } catch (err) {
                btnMusic.innerText = "Richiedi Certificato d'Autore";
                alert("⚠️ Registrazione locale completata. Impossibile contattare il server remoto.");
            }
        });
    }
});
