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
- [ ] Week 3-4: Worker `POST /stamp` → OpenTimestamps submission +
      Supabase storage (with RLS migration)
- [ ] Week 5-6: Worker `POST /verify` → independent OTS verification
- [ ] Week 7-8: Supabase Auth login + RLS + `GET /list` history
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
