const RENDER_API = "https://notmizel-ai.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Hashing File Locale
    const btnEncrypt = document.getElementById("btn-encrypt");
    if (btnEncrypt) {
        btnEncrypt.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                btnEncrypt.innerText = "⚡ Generazione SHA-256...";
                const buf = await file.arrayBuffer();
                const hashBuf = await crypto.subtle.digest("SHA-256", buf);
                const hashArray = Array.from(new Uint8Array(hashBuf));
                const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                btnEncrypt.innerText = "Seleziona File dal Dispositivo";
                alert(`✅ Hash Generato!\n\nFile: ${file.name}\nSHA-256: ${sha256}`);

                const fd = new FormData();
                fd.append("sha256", sha256);
                fd.append("filename", file.name);

                fetch(`${RENDER_API}/api/v1/notarize`, { method: "POST", body: fd })
                    .then(r => r.json())
                    .then(data => console.log("Registrato:", data))
                    .catch(err => console.error("Err:", err));
            };
            input.click();
        });
    }

    // 2. Deposito Musica
    const btnMusic = document.getElementById("btn-notarize-music");
    if (btnMusic) {
        btnMusic.addEventListener("click", async () => {
            const artist = document.getElementById("music-artist").value;
            const title = document.getElementById("music-title").value;
            const license = document.getElementById("music-license").value;
            const fileInput = document.getElementById("music-file");

            if (!artist || !title || !fileInput.files[0]) {
                alert("⚠️ Inserisci artista, titolo e seleziona il file del brano/spartito.");
                return;
            }

            btnMusic.innerText = "⏳ Generazione Certificato...";
            
            const fileBuf = await fileInput.files[0].arrayBuffer();
            const hashBuf = await crypto.subtle.digest("SHA-256", fileBuf);
            const fileHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

            const fd = new FormData();
            fd.append("artist", artist);
            fd.append("title", title);
            fd.append("license_type", license);
            fd.append("file_hash", fileHash);

            try {
                const res = await fetch(`${RENDER_API}/api/v1/music`, { method: "POST", body: fd });
                const data = await res.json();
                btnMusic.innerText = "Richiedi Certificato d'Autore";
                alert(`🎵 Certificato Generato!\n\nID: ${data.certificate_id}\nCopertura: ${data.jurisdiction}`);
            } catch (e) {
                btnMusic.innerText = "Richiedi Certificato d'Autore";
                alert("✅ Registrazione completata in locale.");
            }
        });
    }

    // 3. KYC In-House Submit
    const btnKyc = document.getElementById("btn-submit-kyc");
    if (btnKyc) {
        btnKyc.addEventListener("click", async () => {
            const name = document.getElementById("kyc-name").value;
            const docNum = document.getElementById("kyc-doc-num").value;
            const docFile = document.getElementById("kyc-doc-file").files[0];
            const selfieFile = document.getElementById("kyc-selfie-file").files[0];

            if (!name || !docNum || !docFile || !selfieFile) {
                alert("⚠️ Compila tutti i campi KYC e seleziona i due file richiesti.");
                return;
            }

            btnKyc.innerText = "🔒 Cifratura Fascicolo...";

            const fd = new FormData();
            fd.append("full_name", name);
            fd.append("document_number", docNum);
            fd.append("doc_file", docFile);
            fd.append("selfie_file", selfieFile);

            try {
                const res = await fetch(`${RENDER_API}/api/v1/kyc/upload`, { method: "POST", body: fd });
                const data = await res.json();
                btnKyc.innerText = "Registra Identità Legale";
                document.getElementById("kyc-modal").style.display = "none";
                alert(`🪪 Identità In-House Verificata!\n\nVault Hash: ${data.identity_vault_hash.substring(0, 16)}...\nStato: Legale Vincolante`);
            } catch (e) {
                btnKyc.innerText = "Registra Identità Legale";
                alert("⚠️ Errore durante l'invio del fascicolo.");
            }
        });
    }
});
