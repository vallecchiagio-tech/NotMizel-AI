# NOTMIZEL-AI — NOTIZIE E MECCANISMI (SPEC PWA + MENU INFO)

> File: docs/prodotto-info.md — Fonte per: costruzione PWA (Task 9-10) e
> schermata "Informazioni" in-app. Le spiegazioni utente sono tra virgolette:
> sono già scritte in tono finale, usabili copy-paste nell'app.

## COSA È NOTMIZEL (posizionamento)
"NotMizel notarizza i tuoi file creando una prova matematica e permanente
nel tempo, ancorata alla blockchain Bitcoin. La prova è TUA: non serve
fidarsi di noi, e puoi verificarla anche senza di noi."

Principi guida (per ogni scelta di design):
1. Prova nel possesso dell'utente (ricevuta scaricabile, autoportante)
2. Zero-trust (verifica indipendente sempre possibile)
3. Minimizzazione dati (mai più dati del necessario nel DB e nei PDF)

## LE 4 FUNZIONI (per il menù/la home PWA)

### 1. Notarizza (POST /stamp)
"Collapse l'impronta SHA-256 del tuo file (calcolata SUL TUO dispositivo:
il file non lascia mai il telefono) e la ancoro nel tempo tramite
OpenTimestamps, che la incide nella blockchain Bitcoin.
Ottieni: hash, ricevuta OTS, data, stato (pending → confirmed)."
- Limiti futuri: 5 notarizzazioni/giorno free, poi commissione (lato Worker)

### 2. Le mie stampe (GET /list)
"Lo storico delle TUE notarizzazioni. Solo tu vedi le tue righe:
la protezione è doppia (token personale + Row Level Security nel database:
nemmeno un bug dell'app può mostrarti dati altrui)."
- Auth: Bearer token Supabase (magic link, 60 min, rinnovabile)
- Ogni riga: file_hash, ots_proof, status, created_at

### 3. Verifica (POST /verify)
"Verifica una ricevuta in modo INDIPENDENTE: confronto con la blockchain
Bitcoin (block height). Puoi verificare anche senza NotMizel:
opentimestamps.org o il client OTS ufficiale."
- Sempre gratis: chi verifica = fiducia (scelta di prodotto)

### 4. Ricevuta PDF (Task 7-8)
"Scarica la ricevuta ufficiale in PDF: contiene hash, ricevuta OTS
originale, data, e le istruzioni per la verifica indipendente.
Illimitata e gratuita per sempre: la prova è tua."
- Generata SUL dispositivo (pdf-lib vendorizzato in web/public/pdf/ —
  mai CDN). Nessun server, nessun costo, nessun limite.
- Nome file: ricevuta-<primi12 hash>.pdf (blob locale = download sicuro,
  nessun vettore esterno)

## COME FUNZIONA L'ACCESSO (per la schermata info/login)
"Niente password: inserisci la tua email, ti arriva un link magico
valido 60 minuti, lo apri e sei dentro. La sessione si rinnova da sola.
Il tuo file non viene mai caricato: viaggia solo l'impronta crittografica."

## MECCANISMI TECNICI (per sviluppatori/curiosi — collassabile nella UI)
- Hash: SHA-256 calcolato client-side (web/public/crypto-core.js)
- Notarizzazione: OpenTimestamps → pool opentimestamps.org → Bitcoin
- Identità: Supabase Auth magic-link OTP (create_user:true)
- Protezione dati: RLS — policy auth.uid()=user_id su ogni tabella
- Ricevuta OTS: autoportante, verificabile a vita indipendentemente
  da NotMizel (upgradabile: pending → confirmed con attestazione Bitcoin)
- Infrastruttura: Cloudflare Workers (API, api.mizel-ai.com), Supabase
  (auth+DB), Cloudflare Pages (PWA, notarize-ai.com — Task 9)

## PROSSIMI PASSI (roadmap breve, per "novità" futura in app)
- Task 7-8: PDF ricevuta (client-side)
- Task 9-10: PWA installabile + offline (Site URL: aggiornare da
  localhost:8787 → https://notarize-ai.com al deploy!)
- Task 12: notifica email "stampa confermata su Bitcoin"
- Futuro: rate limit 5 stampe/giorno free + commissione (lato Worker,
  Durable Objects/KV — MAI sui download PDF)

## REGOLE DI COERENZA PER CHI SCRIVE LA PWA
1. Ogni testo per l'utente deve sottolineare: file mai caricato, prova
   tua per sempre, verifica indipendente possibile
2. Token gestito in memoria + refresh; MAI in localStorage se non
   cifrato — decidere in Task 9
3. CSP rigorosa in web/ (stesso stile di api/src/security_headers.js)
4. Nessun dato PII nel PDF oltre al necessario

## RICEVUTA PDF UFFICIALE (Task 7-8) — REGOLE DEFINITIVE

Il PDF è IL documento ufficiale della registrazione. UN SOLO PDF, mai due.
- Contiene SEMPRE: hash SHA-256, data/ora registrazione, rete di ancoraggio
  (Bitcoin via OpenTimestamps), sezione "Verifica e ancoraggio" con:
  * "Questa registrazione è stata verificata dal sistema di verifica
    indipendente NotMizel-AI."
  * "L'ancoraggio alla rete Bitcoin avviene in modo sicuro e garantito
    dalla rete stessa entro circa 24 ore dalla registrazione."
  * "Nessun dato del file originale è mai stato trasmesso: solo
    l'impronta crittografica."
- Opzione: "Per ricevere via email il file di verifica originale (.ots),
  richiedilo a verify@mizel-ai.com."
- Se status=confirmed si aggiunge: "Ancoraggio completato — Bitcoin block
  N. XXXXXX, verificato dal sistema NotMizel-AI."
- VIETATO indirizzare a piattaforme esterne nel PDF (no opentimestamps.org,
  no client esterni). La verifica indipendente è quella di NotMizel-AI.
- Nome file: ricevuta-<primi12hash>.pdf. Download illimitato e gratuito.
- Footer: proof of existence, non di proprietà; documento autosufficiente.

## AUTH (Task 8.5) — PER LA PWA
Login email+password + "Accedi con Google" (oltre a magic link). Il login
è il primo schermo: sicurezza percepita e reale, professionalità.

## REGISTRO (Task 8.5 + Task 9) — PER LA PWA
Registro notarizzazioni con stato in tempo reale (polling ~30-60s):
"⏳ Ancoraggio in corso" → "✅ Ancorato — Bitcoin block N." Il PDF
ufficiale si scarica dal registro dopo la conferma.

## MENÙ INFORMAZIONI (Task 9)
Deve spiegare: cos'è la prova di esistenza, l'ancoraggio Bitcoin (~24h),
la verifica indipendente NotMizel-AI. NON rimanda a servizi esterni.
(Decisione pendente del fondatore: menzionare o no la verifica tecnica
con client esterno per utenti esperti.)
