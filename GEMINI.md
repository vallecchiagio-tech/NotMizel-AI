<!-- NOTE FOR THE HUMAN OWNER: All instructions in this file are for
     the AI, written in English. You don't need to understand or run
     anything in this file yourself. The AI will always give you
     ready-to-copy commands in Italian. -->

# NotMizel-AI — Context & AI Directives (v3 — Simplified MVP)

## 👤 User Profile & Response Style (MOST IMPORTANT — READ FIRST)
- The user is NOT a professional developer. They work exclusively from
  Termux on a smartphone. Assume zero knowledge of terminals, git
  internals, or framework internals unless demonstrated.
- ALWAYS respond in Italian, in simple language. Technical terms must
  be briefly explained the first time they appear.
- ALWAYS state the FULL file path when creating or editing a file
  (e.g., `api/src/index.js`).
- Work in SMALL increments: one file or one function per task.
  Before writing code, explain in 2-4 sentences WHAT you are going to
  change and WHY.
- After any change, give the EXACT copy-paste command(s) the user must
  run to verify it, and tell them what output they should expect.
- If a task requires modifying more than 3 files, STOP and present a
  plan first. Ask the user for approval before proceeding.
- NEVER delete or rewrite existing code without explicitly warning the
  user first and explaining what is lost.
- Be an honest reviewer: if you find a bug, security issue, or
  architectural flaw, report it immediately. Do not rubber-stamp
  existing decisions.
- ERROR HANDLING (CRITICAL): If a Termux command, script, or test
  fails, STOP. Do NOT guess solutions. Ask the user to paste the full
  error log/output first, diagnose from it, then propose ONE fix at a
  time.
- Never tell the user to "try" multiple things at once. One change,
  one verification, then evaluate the result together.

## 🎯 Project Mission
NotMizel-AI is a free, open, verifiable proof-of-existence service:
users prove that a file (documents, images, creative works) existed at
a certain moment, without ever uploading the file itself. Only SHA-256
hashes ever leave the device. Built as a Monorepo, developed entirely
from Termux (Android), running on 100% free-tier infrastructure.

## Contesto operativo (come lavorare in questo progetto)

- **Ambiente di sviluppo**: Termux su smartphone Android. L'utente è un
  principiante assoluto ma resiliente: spiega ogni comando PRIMA di darlo,
  un passo alla volta, mai comandi multipli complessi in un colpo solo.
- **Tono**: incoraggiante, mai condiscendente. Festeggia i traguardi.
  Quando qualcosa si rompe, trasformalo in lezione documentata.
- **Stack**: Cloudflare Pages (PWA: not.mizel-ai.com) + Cloudflare Workers
  (API: api.mizel-ai.com, Worker "notmizel-api-edge") + Supabase
  (database, 5 migration già presenti) + GitHub (repo NotMizel-AI) +
  OpenTimestamps (timestamp blockchain, dal Task 2).
- **Deploy**: manuale da Termux con `npx wrangler deploy` (cd api).
  GitHub Actions "deploy-worker" è DISATTIVATO: non riattivarlo.
- **Verifica sempre**: dopo ogni deploy, `curl` sull'endpoint. "Deploy
  successful" non significa che il codice funzioni (lezione del Task 1).
- **Debug**: usare `npx wrangler tail` per verificare se il traffico
  arriva al Worker; verificare il contenuto dei file deployati, non solo
  l'esito dei comandi.
- **Regola d'oro**: ogni fine task → aggiornare la sezione "Stato e
  decisioni" di questo file + commit. Il file È la memoria del progetto.

## 💰 Product Positioning & Monetization (STRATEGIC CONTEXT)
- FREE tier (launch product): proof-of-existence via OpenTimestamps,
  targeted also at creators as cryptographic proof of anteriority for
  images/works (probative value under art. 20 CAD, Italian law).
- PDF CERTIFICATE (launch feature, FREE tier): after a successful
  timestamp, generate a downloadable "Certificate of Existence" PDF
  containing: file name, SHA-256 hash, submission date, OpenTimestamps
  proof data, and step-by-step INDEPENDENT verification instructions
  (so anyone can verify WITHOUT trusting our servers). Generate it
  client-side in the PWA if possible (e.g., pdf-lib via ES module);
  if not feasible client-side, generate in the Worker. Never include
  file contents — only hashes and proof metadata.
- PREMIUM tier (announced at launch, built ONLY after waitlist
  validation): qualified eIDAS timestamp via QTSP API, verified
  identity via certified KYC provider API (Persona/Veriff/SumSub),
  premium PDF with qualified proof. One-time payments via Stripe
  Payment Links.
- WAITLIST: launch with a "Notify me when Pro is ready" waitlist
  (Supabase table + public roadmap). Waitlist signups = market
  validation BEFORE contracting any QTSP. NEVER homemade KYC.
- HONEST MARKETING RULE: never overclaim legal value. Allowed wording:
  "verifiable proof of existence" (free) / "qualified eIDAS timestamp"
  (premium, only when actually live). NEVER claim "official copyright
  registration" (it does not exist in Italy/UE) or "guaranteed legal
  protection".

## 🏛️ Architecture — ONLY 2 Components (DO NOT ADD MORE)
- **`web/` (Zero-Knowledge PWA Frontend):**
  - Tech: Vanilla JS PWA (ES Modules only), WebCrypto API.
  - Deployed to: **Cloudflare Pages** → https://not.mizel-ai.com
  - Role: Computes SHA-256 hash of the file LOCALLY (WebCrypto).
    The raw file MUST NEVER leave the user's device. Sends only the
    hash to the API. Shows hash + timestamp history. Generates the
    downloadable PDF Certificate (client-side, hash + proof only).
  - NO Python, NO bundlers, NO build step, NO frameworks.
- **`api/` (Cloudflare Worker Backend):**
  - Tech: Cloudflare Workers + Hono (JavaScript). ONE backend only.
  - Deployed to: **Cloudflare Workers** → https://api.mizel-ai.com
  - Role: Core endpoints:
    - `POST /stamp` — receives a hash, submits it to OpenTimestamps,
      stores hash + pending proof in Supabase.
    - `POST /verify` — receives hash + proof, verifies via
      OpenTimestamps calendar/Bitcoin attestation.
    - `GET /list` — returns the user's timestamp history.
    - `POST /waitlist` — stores emails of interested Pro users.
  - Validates Supabase JWTs. Rate-limited. No other services.

## 🗄️ Data Layer (Supabase — PostgreSQL + Auth)
- Tables: `stamps` (id, user_id, file_hash, ots_proof, status,
  created_at) and `waitlist` (id, email, created_at).
- Row Level Security (RLS) MANDATORY on every table. Deny by default.
  Every migration creating a table MUST include its RLS policies in
  the same file.
- Migrations are APPEND-ONLY: never modify an applied migration,
  only add new ones with ascending timestamp prefixes.
- file_hash column: store only hashes. The database must physically
  have NO column capable of holding file contents.

## 🌐 Deployment Map (Git-based: every push to main triggers deploy)
| Component | Platform | URL |
|---|---|---|
| PWA frontend | Cloudflare Pages | https://not.mizel-ai.com |
| API backend | Cloudflare Workers | https://api.mizel-ai.com |
| Auth & DB | Supabase | (project URL) |
- Secrets live ONLY in platform dashboards (Cloudflare, Supabase) or
  `.env` (never committed). `.env.example` documents them.
- NO Render, NO Python backend, NO second server. If a task seems to
  require one, STOP and propose a Workers-based solution instead.

## ⚖️ Strict Privacy & Security Rules (INVIOLABLE)
1. **Zero-Upload Principle:** the backend only ever receives SHA-256
   hashes and OpenTimestamps proofs. It must never accept, process,
   or store file contents. The API has no file-upload endpoint.
2. **External Trust:** timestamps come from OpenTimestamps
   (https://opentimestamps.org — free, Bitcoin-anchored, verifiable
   by anyone forever). NEVER implement custom timestamping logic.
3. **No Client-Side Secrets:** API tokens or service keys must never
   appear in `web/`.
4. **No Secrets in Code:** never hardcode keys or tokens. Always read
   from environment variables / Workers secrets.
5. **Payments & Identity (future):** use Stripe Payment Links; never
   touch raw payment data. Identity verification only via certified
   KYC provider API. Never act as a payment intermediary.

## 🔭 Future Extensions (tracked — do NOT build now)
- eIDAS/RFC 3161 qualified timestamps via third-party QTSP API
  (Aruba, InfoCert, DigiCert, GlobalSign) as PREMIUM feature, only
  after waitlist validation. The Worker `api/` is the natural proxy.
- Certified KYC provider API for "verified user" badge (never
  homemade KYC — storing identity documents ourselves is an AML/GDPR
  liability).
- Client-side encryption of stored blobs, only if users request it.

## 🛠️ Coding Standards
- **JavaScript (`web/`, `api/`):**
  - Strictly ES modules. NO bundlers (no Webpack/Vite).
  - Use standard Web APIs (Fetch, WebCrypto, Service Worker).
  - Syntax check: `node --check <file.js>`.
  - Local testing: to test the PWA in the phone's browser, ALWAYS
    instruct the user to serve it over HTTP (ES Modules do not work
    from file://). Use:
    `python -m http.server 8080 -d web`
    then tell the user to open http://localhost:8080 in the browser.
- **PDF generation:** prefer client-side with a single ES module
  (pdf-lib loaded via CDN as ES module is acceptable). If done in the
  Worker, never log or persist anything beyond hash/proof metadata.
- **Database:** SQL migrations in `supabase/migrations/`.
- **API Documentation:** every endpoint documented in
  `docs/api-spec.yaml` (OpenAPI 3.0).

## 📦 Git Discipline (the user's safety net)
- The user is learning git. When a task is completed, ALWAYS provide
  the exact commands to save the work, with a short English commit
  message filled in by you, ready to copy-paste:
  git add -A
  git commit -m "Describe the change here"
- If a change went wrong, prefer fixing forward or `git revert` over
  manual file editing.

## 🗺️ Target Repository Structure (restructuring in progress)
NotMizel-AI/
├── web/                    # PWA frontend (Cloudflare Pages)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js           # hashing, UI logic
│   ├── js/api.js           # API calls
│   ├── js/pdf-certificate.js  # PDF certificate generation
│   ├── js/webcrypto-core.js   # WebCrypto helpers
│   ├── manifest.json
│   └── sw.js
├── api/                    # Cloudflare Worker backend
│   ├── src/index.js
│   └── wrangler.toml
├── supabase/
│   └── migrations/
├── docs/
│   └── api-spec.yaml
├── .env.example
├── .gitignore
└── GEMINI.md
- Legacy folders (apps/, packages/) are DEPRECATED: when a task
  touches them, propose migrating the useful code to the new
  structure and then deleting the old folder, with user approval.

## 📍 Current State & Roadmap (12 weeks)
- [x] AI context file (GEMINI.md v3) created
- [x] Restructure repository to the target layout above
      (migrate useful code from apps/, delete legacy folders)
- [x] Week 1-2: PWA that hashes a file locally (SHA-256 via
      WebCrypto) and shows the hash to the user
- [x] Week 3: Worker+`POST /STAMP` → OpenTimestamps submission 
- [x] Week 4: Supabase storage (with RLS migration)
- [x] Week 5-6: Worker `POST /verify` → independent OTS verification
- [x] Week 7-8: Supabase Auth login + RLS + `GET /list` history
- [ ] Week 8-9: PDF Certificate of Existence (client-side, download)
- [ ] Week 9-10: PWA installable + offline (manifest.json, sw.js),
      deploy to not.mizel-ai.com
- [ ] Week 10-11: waitlist table + `POST /waitlist` + landing section
- [ ] Week 11-12: end-to-end test (hash → stamp → upgrade → verify →
      PDF), README, launch
- [ ] (Future) eIDAS QTSP premium + KYC provider + Stripe

## 🔄 How to Work With This File
- At the START of every session, read this file and run
  `git log --oneline -10` to restore context.
- When a task from this file is completed, update the checkboxes here
  in the SAME commit.
- If the user asks for something that violates a rule above, refuse
  politely, cite the rule, and propose the compliant alternative.

## Note ambiente Termux
- Wrangler funziona SOLO con patch a node_modules/workerd/lib/main.js:
  sostituire il `throw new Error("Unsupported platform...")` con
  `return { pkg: "workerd", subpath: "/package.json" };`
  Ri-applicare dopo ogni npm install. NON usare `wrangler dev` (workerd non gira su Android): solo deploy.

## STATE/DECISIONS
### [29/08/2026] Task 1 COMPLETATO — Backend Edge operativo
- Worker `notmizel-api-edge` standalone su Cloudflare (NO più proxy Render)
- Endpoint attivi: GET /health → {"status":"ok", version:"0.2.0"}
- URL: https://api.mizel-ai.com (custom domain) + workers.dev
- Deploy: cd api && npx wrangler deploy (manuale da Termux)
- GitHub Actions "deploy-worker" DISATTIVATO (punta a cartella inesistente)
- Lezioni: (1) "Deploy successful" ≠ "il codice funziona": verificare SEMPRE
  il contenuto del file deployato; (2) usare wrangler tail per verificare
  il traffico; (3) mai git integration + deploy manuale non coordinati.
- PROSSIMO: Task 2 — POST /stamp (OpenTimestamps)

- Task 5 COMPLETATO e verificato in produzione: l'endpoint /verify
  restituisce {"status":"confirmed","block":964816} per verify-test.ots
- Estrazione block height da .ots senza dipendenze nel Worker edge
- Triplo match: ots info (lib ufficiale) + lib Python + Worker pro

### [30/08/2026] Task 2 COMPLETATO - opentimestamp + sha256 
- **Stato progetto**: Task 2 COMPLETATO e chiuso.
- **Live su Cloudflare**: Worker `notmizel-api-edge` -> api.mizel-ai.com
  - GET /health (pubblico), POST /stamp (autenticato).
- **Autenticazione**: header `X-NotMizel-API-Key`, secret Cloudflare
  `NOTMIZEL_API_KEY` — RUOTATA a fine Task 2 (la vecchia è sovrascritta,
  Cloudflare non conserva cronologia dei secrets).
- **Verifica finale**: `ots info worker2.ots` riconosciuto dal client ufficiale,
  attestato PendingAttestation su alice.btc.calendar -> ancoraggio Bitcoin entro
  ~24h (poi `ots verify` = Success!).
- **Decisioni tecniche prese**:
  - File .ots composti direttamente nel Worker (zero dipendenze lato edge).
  - Failover 3 pool OTS, timeout 15s per pool.
  - Retry lato client (10s) per gestire 404 transitori dei calendari.
- **Prossimo passo**: Task 3 (vedi roadmap).
 - Endpoint POST /stamp LIVE su api.mizel-ai.com (Worker Cloudflare)
 - Genera file .ots UFFICIALI verificabili col client OpenTimestamps
 - Protocollo ricostruito: header 30B + major(01) + tag sha256(08) + digest(32B) + risposta pool
 - Pool con failover: a.pool, b.pool, eternitywall
 - Endpoint autenticato con X-NotMizel-API-Key (403 testato e funzionante)
 - LEZIONE: i calendari OTS a volte rispondono 404 (rate-limit) -> retry con 10s di pausa
 - TO-DO client app: rate-limit lato client 1 stamp/10s
- **Prossimo step**: Task 3 (vedi roadmap)

### [31/08/2026] Task 3 COMPLETATO — Supabase storage con RLS
- Progetto Supabase esistente RIUSATO (era in pausa, riattivato con Restore)
- Verificato: le 5 migrazioni vecchie (Enterprise/Trust Suite) NON erano mai
  state applicate ("No migrations" nel dashboard) → rimosse dal repo
  (recuperabili dalla cronologia git se serve)
- Nuova migrazione: supabase/migrations/20260831_notmizel_schema.sql
  - Tabelle: stamps (user_id, file_hash, ots_proof, status) + waitlist (email)
  - RLS attivo deny-by-default su entrambe; waitlist senza policy (solo
    service_role via Worker)
- Applicata via SQL Editor dashboard (Success), verificata: 2 tabelle presenti
- LEZIONE: le policy SQL non hanno "if not exists" → ri-eseguire uno script
  già applicato dà errore 42710 "already exists" (non è un problema reale)
- PROSSIMO: collegare Worker a Supabase (secrets su Cloudflare) e salvare
  le stampe in POST /stamp

### [31/08/2026] Task 4 COMPLETATO — Worker -> Supabase persistenza
- Secrets caricati su Cloudflare: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
  (mai nel repo, verificati con wrangler secret list)
- Worker v0.4.0: POST /stamp ora salva hash + ots_proof (base64) in tabella
  stamps via REST Supabase. Campo "saved":true/false nella risposta.
- Design: fallimento Supabase NON fa perdere il timestamp (client riceve
  comunque il proof; errore loggato per wrangler tail). user_id NULL
  finche' non arriva Auth (Week 7-8).
- Test end-to-end PASSATO: script api/test-stamp.sh -> saved:true,
  riga verificata presente in Table Editor (tabella stamps).
- LEZIONE: righe curl lunghe con \" e $(...) = errori su tastiera Android
  -> sempre script .sh con chiave letta da ~/.notmizel_key (mai in chat).
- PROSSIMO: Task 5 — POST /verify (Week 5-6 roadmap).

## [31-08-2026] Task 5 COMPLETATO — verifica OTS con estrazione block height
- Estrazione altezza Bitcoin da .ots senza dipendenze: firma a 9 byte
  (0588960d73d7190103) + VarInt, criterio validato empiricamente su
  verify-test.ots (unica occorrenza, ~2^-72 di falso positivo)
- Storia: 0x05 solitario → falsi positivi; euristiche → falsi positivi;
  lezione: SEMPRE validazione locale (node) prima del deploy
- Triplo match finale: ots info + libreria Python + Worker prod → 964816
- Lezione di metodo: ingegneria inversa un errore alla volta, ogni
  fallimento deterministico ha ristretto lo spazio delle ipotesi
- Task 5 COMPLETATO e verificato in produzione: l'endpoint /verify
  restituisce {"status":"confirmed","block":964816} per verify-test.ots
- Estrazione block height da .ots senza dipendenze nel Worker edge
- Triplo match: ots info (lib ufficiale) + lib Python + Worker prod
- D1: Scartato lo 0x05 solitario e le euristiche sui byte fissi
  (falsi positivi: 2315, 215816). Adottata firma a 9 byte
  (0588960d73d7190103) + VarInt, probabilità falso positivo ~2^-72
- D2: Criterio validato EMPIRICAMENTE sui byte reali di verify-test.ots
  (unica occorrenza @1226, varint @1235 = 964816) PRIMA del deploy
- D3: Regola di metodo permanente: nessun deploy senza validazione
  locale (node) che reproduca l'output atteso
- D4: Ingegneria inversa del formato OTS un errore alla volta: ogni
  errore deterministico ha ristretto lo spazio delle ipotesi
- PROSSIMO: Task 6 (vedere roadmap Week 7-8)

#### Task 6 — Completato ✅ (2026-01-09)
- Endpoint: POST /auth/magic-link (api/src/index.js, handleMagicLink ~riga 152,
  rotta a livello router dopo /verify). Body: {email} → Supabase OTP
  (auth/v1/otp, create_user:true) → 200 {ok,message:"email inviata"}.
  Errori gestiti: 400 email/JSON invalido, 503 secrets mancanti, 502 OTP fail
  (con console.log dettaglio).
- Secrets Cloudflare configurati e verificati: SUPABASE_URL (solo dominio),
  SUPABASE_ANON_KEY. ⚠️ service_role MAI sul Worker.
- Supabase: provider Email enabled; Site URL = http://localhost:8787 (TEMP —
  aggiornare al deploy PWA); Redirect URLs: http://localhost:8787/**.
- VERIFICATO END-TO-END: curl → {"ok":true} → email ricevuta → link cliccato →
  utente presente in Authentication → Users (vallecchia.gio@gmail.com).
  Atterraggio link su localhost:8787 = 404 atteso (Site URL temporaneo).
- Git: commit f0efbad "Task 6: endpoint POST /auth/magic-link via Supabase OTP",
  push su main. Log diagnostico ROUTER PATH rimosso prima del commit.
- Deploy prod: Version ID post-fix e post-cleanup da verificare col prossimo
  `npx wrangler deploy` ( cleanup log già commitato).
- PROSSIMO (Task 7): PWA lato client — pagina che cattura token dall'URL
  (?token=...&type=magiclink), scambio sessione via auth/v1/verify, storage
  sessione, aggiornare Site URL/Redirect in Supabase al deploy PWA.
- POST /auth/magic-link: body {email} → Supabase OTP (create_user:true) →
  {"ok":true}. Errori: 400 invalid, 503 secrets mancanti, 502 OTP fail.
- GET /list (handleList ~riga 182, rotta dopo magic-link): Authorization
  Bearer → validato su auth/v1/user → GET rest/v1/stamps?user_id=eq.<id>
  (select id,file_hash,ots_proof,status,created_at, order desc) → {stamps:[...]}.
  401 token mancante/non valido, 502 lettura fallita.
- Secrets: SUPABASE_URL (solo dominio!), SUPABASE_ANON_KEY. MAI service_role.
- RLS verificata: tabelle stamps+waitlist con rowsecurity=true; policy su
  stamps SELECT/INSERT con auth.uid()=user_id; waitlist deny-by-default.
- TEST END-TO-END SUPERATO: senza token → 401; con token → 200 {"stamps":[]}
  (riga test presente ma di altro user → RLS+filtro dimostrati).
- Supabase: Site URL ancora localhost:8787 (temporaneo) → aggiornare al
  deploy PWA. Magic link: 60 min, monouso.
- Git: commit "Task 6: endpoint POST /auth/magic-link..." + "Task 6: endpoint
  GET /list...". Ultimo Version ID: 443e5a65.
- PROSSIMO: Task 7 (vedere roadmap (Week 8-9)
- dopo Task 7 (Task 8):(vedere roadmap) PWA — cattura token dall'URL (#access_token=...), scambio
  sessione, pagina history che chiama GET /list; agg. Site URL/Redirect Supabase.

## Task 7-8 decisions
- SCOPERTA (Fase 1, 02/09/2026): web/src/api.js contiene fetch a
  /notarize-hash e /author-proof — endpoint che NON esistono nel Worker
  (router: /health, /stamp, /verify, /auth/magic-link, /list). api.js è
  fuori sync. NESSUN client /list presente.
  → Fase 3 Task 7-8: aggiungere getList(token) in api.js + decidere con
    il fondatore se rimuovere/correggere gli endpoint fantasma.
- web/index.html include gli script con <script type="module"
  src="./src/app.js"> in fondo al body — pattern da replicare per
  certificate.js.
## TASK 7 — PROGRESSO

- Fase 1 COMPLETATA (02/09/2026): pdf-lib v1.17.1 vendorizzata in
  web/src/pdf/pdf-lib.min.js (UMD, 525.099 byte, jsdelivr npm — verifica
  integrità fatta: NOT "Not Found"). Test browser OK: certificate.html
  genera e scarica PDF 895 byte con testo viola. Commit Fase 1.
- NOTA TECNICA: pdf-lib UMD si usa come globale PDFLib.PDFDocument ecc.,
  non come ES Module import. La variante .mjs NON esiste sul pacchetto
  npm dist — non riprovare, non perdere tempo.
- 404 innocui in test locale: /favicon.ico e /sw.js (il browser cerca un
  service worker per via del manifest.json esistente — indizio utile per
  il Task 9, dove sw.js sarà reale).
- PROSSIMO: Fase 2 = buildCertificate(stamp) con dati FINTI in
  web/src/certificate.js (ricevuta completa: file_hash, ots_proof,
  created_at, status, nome file ricevuta-<primi12hash>.pdf) → commit.


## 📝 LEZIONI APPRESE — Task 2 (OpenTimestamps)

1. **Protocollo OTS ricostruito via ingegneria inversa**: un file .ots valido =
   header magic 30 byte (`\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94`)
   + MAJOR_VERSION (`01`) + tag OpSHA256 (`08`) + digest (32 byte) + risposta grezza del pool.
   Verificato empiricamente col client Python ufficiale (confronto byte-per-byte con xxd).
2. **API calendari OTS**: `POST <pool>/digest` con body = 32 byte binari del digest,
   header `Accept: application/vnd.opentimestamps.v1`. Failover multi-pool
   (a.pool, b.pool, eternitywall) perché a volte rispondono 404.
3. **Rate-limit**: i pool a volte rifiutano (404) sotto richieste ravvicinate ->
   retry lato client con pausa 10 secondi. Regola per l'app: max 1 stamp / 10s.
4. **Debug empirico > ipotesi**: ogni fix è stato guidato da test (xxd, grep sul
   sorgente ufficiale, confronto offset) mai da congetture. Metodo vincente.
5. **Copiatura manuale = fonte di bug**: chiavi/hash ricopiati a mano hanno causato
   403/400 falsi. Soluzione: script con valori hardcoded una volta sola (stamp.py)
   e sempre verifica con wc -c. L'umano è controllore qualità, non fotocopiatrice 😄
6. **Errori 403 con chiave corretta?** Ricontrollare SEMPRE carattere per carattere
   la chiave prima di sospettare il server.

## Lezioni apprwse Task 5 (ots senza dipendenze)
1. **0x05 solitario = trappola**: byte troppo comune in hash casuali ->
   falsi positivi (2315, 215816). Serve una firma lunga: 9 byte ~2^-72.
2. **Le euristiche non bastano mai**: ogni fix "a muzzo" ne creava un
   altro falso positivo. Solo il confronto con i byte REALI del file
   (dump + rfind + varint) ha chiuso lo spazio delle ipotesi.
3. **Gate di validazione locale**: mai deployare senza aver riprodotto
   l'output atteso in node in locale. Questa volta: primo deploy
   dopo fix = produzione corretta, zero rollback.
4. **Ingegneria inversa per errori deterministici**: ogni parser che
   falliva diceva QUALCOSA (tag shiftato, digest mangiato, fork non
   ricorsivo). Gli errori erano la mappa, non il rumore.
5. **Verifica indipendente**: la prova vive nella blockchain Bitcoin
   via OpenTimestamps; il nostro Worker e' solo un verificador comodo.
   Chiunque puo' riconfermare l'.ots con la lib ufficiale.

### Task 6 — Lezioni apprese (auth magic link, 2026-01-09)
1. MAI pipingare `wrangler deploy` con `| tail`: l'output troncato nasconde
   eventuali failure e il Version ID. Sempre output completo + confrontare
   il Version ID nuovo col precedente (se identico = deploy non partito).
2. `wrangler dev` NON funziona su Termux (workerd EACCES, già noto in
   GEMINI.md): flusso di verifica = node --check → sed visivo → deploy →
   `wrangler tail --format pretty` → curl.
3. Anchor di patch: SEMPRE a riga singola. Gli anchor multilinea falliscono
   per differenze di indentazione (2 assert ci hanno bloccato 2 volte = buon
   assert!). MA: anche con anchor a riga singola la rotta è finita DENTRO il
   blocco if precedente → node --check passa comunque (le graffe tornano) →
   VERIFICARE SEMPRE la struttura con `sed -n` dopo la patch, non solo la sintassi.
4. Log diagnostico temporaneo in cima al router (`ROUTER PATH: ...`) =
   tecnica vincente: ha smascherato il bug di annidamento in 1 deploy.
5. Config Supabase: SUPABASE_URL = SOLO il dominio (https://xxx.supabase.co),
   mai con path (/rest/v1) → altrimenti PGRST125 "Invalid path" da PostgREST.
   Test rapido endpoint auth: curl su /auth/v1/health → 200.
6. Secrets: `wrangler secret put` sovrascrive in sicurezza, mai mostrati nei
   log. Usare ANON KEY, MAI service_role key sul Worker edge.
7. Un 404 "not found" custom + tail che mostra "Ok" = il tail non distingue
   gli status; fidarsi solo del body della curl con -i.
### Task 6 — Lezioni apprese parte 2 (GET /list + RLS, 2026-09-01)
1. File migrazione su GitHub ≠ migrazione applicata: Supabase non sincronizza
   da solo. "No migrations" in dashboard traccia solo CLI/CI, non i Run
   manuali da SQL Editor. Verificare le tabelle con query su pg_tables.
2. Fidarsi del DB reale, non della documentazione: GEMINI.md diceva "ots_uuid"
   ma la colonna reale è "ots_proof". Sempre grep sul file SQL prima di scrivere query.
3. CI deploy-worker.yml: paths "cloudflare/workers/**" = cartella inesistente →
   la CI non scatta MAI. Deploy = SOLO manuale: npx wrangler deploy + verifica
   Version ID diverso dal precedente.
4. Magic link: valido ~60 min, monouso. Per catturare il token: tieni premuto
   il link nell'email → "copia indirizzo" → token = stringa tra access_token= e &
   (l'atterraggio su localhost:8787 dà 404: normale, Site URL temporaneo).
5. Pattern di test perfetto: endpoint protetto testato DUE volte — senza token
   (atteso 401) e con token (atteso 200). Lista vuota con riga presente in
   tabella = PROVA che RLS + filtro user_id funzionano.
6. JWT ispezionabile senza segreti: la parte centrale del token (tra i punti)
   è base64 → sub (user_id), exp, email leggibili subito per il debug.
7. i messaggi 'No such file or directory' di bash vanno letti per quello che sono: 
   problema di percorso locale, non del servizio — distinguere sempre errori ambientali da 
   errori di codice

## NOTE: - Considerare sempre (il progetto si sta sviluppando con cloudflare+supabase+github 
          nei piani gratuiti)
## NOTE: - impostare l'infrasteuttura, file e schemi, basandosi sul fattore possibile di poter 
          far pagare servizi eccedenti, per non fare pagare i superamento dei limiti al fondatore!
## NOTE: - Ricordare sempre di istruire e dare istruzioni/comandi dettagliati e 
          quando si possibili velocizzati da eseguire all'umano   


## Minitask pendenti
- [ ] Email magic link via dominio proprio: creare account Resend (free 3000 email/mese), configurare DNS (SPF/DKIM) su Cloudflare per notmizel-ai.com, poi impostare SMTP custom in Supabase (Authentication → SMTP). Zero codice, solo configurazione. Motivo: email default Supabase hanno rate limit ~4/ora e rischi spam.
- [ ] Valutare migrazione storage verso Cloudflare (D1/R2) solo se i dati superano ~400MB (limite pratico Supabase free 500MB).
- [x] Rinforzo sicurezza checkAuth (Task futuro): oggi la prima riga è `if (!env.NOTMIZEL_API_KEY) return null` = accesso libero se 
      il secret non è configurato. Da cambiare in "deny by default" (ritornare 503/errore se il secret manca), MA attenzione: /verify 
      e il flusso di verifica indipendente dipendono da checkAuth — testare bene dopo la modifica.
- [x] Minitask sicurezza auth (2026-09-02): checkAuth rinforzato —
    !NOTMIZEL_API_KEY → 503 deny-by-default (stesso pattern delle guardie
    Supabase Task 6). Tocca /stamp e /verify ma in prod il secret esiste:
    ramo mai eseguito. Non-regressione verificata: scripts/test-stamp.sh →
    ots ricevuta + saved:true. Version ID c20784c4.
    (Nota: script sta in scripts/, non in root — find per localizzarlo.)
## MINITASK / DECISIONI APERTI (Task 7-8, aggiornato)

- [ ] Minitask CORS futuro: attualmente Access-Control-Allow-Origin: "*" in
      api/src/index.js:10. Quando la PWA gira su https://not.mizel-ai.com
      (Task 9), restringere l'origine a quel dominio. NON toccare ora.
- [ ] Minitask storage version (failover) — preesistente, non bloccante.
- [ ] Minitask rinforzo checkAuth su /verify — preesistente, non bloccante.
- [ ] Aggiornare Site URL Supabase da http://localhost:8787 a
      https://not.mizel-ai.com + redirect not.mizel-ai.com/** SOLO al
      deploy PWA (Task 9). Redirect attuale: http://localhost:8787/**.

## DECISIONI TASK 7-8 (confermate col fondatore)

- Percorso PDF engine: web/src/pdf/ (NON web/public/pdf/ né web/js/ —
  la struttura reale del repo vince sui documenti; docs e GEMINI.md
  si aggiornano alla Fase 4).
- Riuso web/src/api.js per chiamate /list: se manca il client /list,
  si aggiunge IN api.js, non nella pagina di test.
- Pagina di test web/certificate.html: token incollato a mano in memoria
  (const TOKEN), MAI localStorage. Standalone, non è la PWA (Task 9).
- CORS verificato in produzione (02/09/2026): OPTIONS /list → 204 con
  Access-Control-Allow-Origin: *. NESSUNA modifica al Worker per Task 7-8.
- PWA futura girerà su sottodominio: not.mizel-ai.com.
- Errore PGRST125 su /auth/magic-link nei log: STORIA PASSATA, risolto
  (SUPABASE_URL senza path). Non indagare.

## COME LAVORIAMO (nuova regola)

- Ogni decisione/minitask si annota SUBITO in GEMINI.md/docs durante la
  sessione: si invia blocco da incollare + comandi + verifica + commit.
  Motivo: la chat ha memoria limitata (~39 messaggi), il repo è la verità.


## Metodo di lavoro (da applicare sempre, ogni chat)
1. VERIFICARE PRIMA DI MODIFICARE: mai patchare alla cieca. Prima grep/sed per vedere le righe esatte con numeri, poi patch.
2. Patch via python3 heredoc con ASSERT su ogni anchor: se il codice non combacia esattamente, il patch si ferma SENZA scrivere (AssertionError = comportamento corretto, non errore da ignorare).
   Template: python3 - <<'PYEOF' ... s=open(p).read(); old='...'; assert old in s; s=s.replace(old,new); open(p,"w").write(s); print("PATCH OK") PYEOF
3. DOPO ogni patch: node --check api/src/index.js (verifica sintassi locale) + sed -n 'X,Yp' per verifica visiva.
4. MAI toccare codice che funziona: checkAuth è intoccabile (/verify e la verifica indipendente dipendono da essa). Modifiche puramente additive.
5. Una modifica per volta, poi test. Comandi corti e semplici (i loop/heredoc complessi si rompono nell'incollaggio su tastiera Android).
6. A fine task: commit E push (regola del progetto). Segreti mai mostrati nei comandi (solo nomi variabili con grep -o).
7. Context chat limitato (~30 messaggi): annotare minitask e decisioni in fondo a GEMINI.md; prima di chiudere una chat, fare riassunto di handover.
