<!-- NOTE FOR THE HUMAN OWNER: All instructions in this file are for
     the AI, written in English. You don't need to understand or run
     anything in this file yourself. The AI will always give you
     ready-to-copy commands in Italian. -->

# NotMizel-AI — Context & AI Directives

## 👤 User Profile & Response Style (MOST IMPORTANT — READ FIRST)
- The user is NOT a professional developer. They work exclusively from
  Termux on a smartphone. Assume zero knowledge of terminals, git
  internals, or framework internals unless demonstrated.
- ALWAYS respond in Italian, in simple language. Technical terms must
  be briefly explained the first time they appear.
- ALWAYS state the FULL file path when creating or editing a file
  (e.g., `packages/crypto-core/eidas_tsa.py`).
- Work in SMALL increments: one file or one function per task.
  Before writing code, explain in 2-4 sentences and WHY.
- After any change, give the EXACT copy-paste command(s) the user must
  run to verify it (e.g., `pytest packages/crypto-core/tests/ -v`).
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
NotMizel-AI is an Enterprise-grade Mobile Notary Suite designed for
legal compliance and cryptographic security. The system provides
secure digital notarization and timestamping of files using a
Zero-Knowledge architecture. It is built as a Monorepo, developed and
managed entirely from a Termux (Android) environment.

## 🏛️ Architecture & Where It Runs (CRITICAL — DO NOT DEVIATE)
- **`apps/edge-api` (Gateway & Auth):**
  - Tech: Cloudflare Workers + Hono (JavaScript).
  - Deployed to: **Cloudflare Workers**.
  - Role: Global low-latency API gateway, rate limiting, routing,
    Supabase JWT validation. Fails fast on invalid requests.
- **`apps/web-client` (Zero-Knowledge Frontend):**
  - Tech: Vanilla PWA (ES Modules only), WebCrypto API.
  - Deployed to: **Cloudflare Pages** → https://not.mizel-ai.com
  - Role: Performs document hashing (SHA-256) and encryption
    *client-side*. Raw files MUST NEVER leave the user's device.
- **`packages/crypto-core` (The Notary Engine):**
  - Tech: Python 3.11 + FastAPI.
  - Deployed to: **Render** (as a Web Service). NOT on Cloudflare
    Workers — Workers cannot run FastAPI.
  - Role: Secure, isolated proxy to external Qualified Trust Service
    Providers (QTSP). Manages RFC 3161 timestamp requests and
    cryptographic validations.
- **`supabase/migrations` (Data Layer):**
  - Tech: PostgreSQL + Supabase Auth.
  - Role: Stores metadata and hashes only. Governed strictly by Row
    Level Security (RLS) policies.

## 🌐 Deployment Map (Git-based: every push to main triggers deploy)
| Component | Platform | URL |
|---|---|---|
| PWA frontend | Cloudflare Pages | https://not.mizel-ai.com |
| Edge API | Cloudflare Workers | https://api.mizel-ai.com |
| Notary engine | Render | (internal service URL) |
| Auth & DB | Supabase | (project URL) |
- Secrets live ONLY in platform dashboards (Cloudflare, Render,
  Supabase) or `.env` (never committed). `.env.example` documents them.

## ⚖️ Strict Legal & Security Rules (INVIOLABLE)
1. **Zero-Knowledge Privacy (GDPR):** The backend only ever receives
   cryptographic hashes or encrypted blobs. It must never process or
   store plain-text user files.
2. **External Trust (eIDAS):** NEVER generate cryptographic timestamps
   locally or in-house. The system must always proxy to a certified
   external QTSP/TSA using RFC 3161. For development/testing use
   FreeTSA (https://freetsa.org); for production, a qualified QTSP
   must be contracted.
3. **No Client-Side Secrets:** Private keys, QTSP API tokens, or master
   encryption keys must never appear in `apps/web-client`.
4. **Append-Only Migrations:** Never modify an existing applied
   migration file in `supabase/migrations`. Only add new ones with
   ascending timestamp prefixes.
5. **RLS Mandatory:** Every new Supabase table must have RLS enabled
   with explicit policies. Deny by default. Every new migration that
   creates a table MUST include its RLS policies in the same file.
6. **No Secrets in Code:** Never hardcode API keys, tokens, or
   passwords. Always read from environment variables.

## 🔑 Key Derivation Decision (documented — do not reopen without cause)
- Current: PBKDF2-SHA256 with 600,000 iterations via native WebCrypto.
  This is OWASP-compliant and requires no build step.
- Backlog (post-MVP only): migrate to Argon2id via argon2-browser WASM
  (recommended params: 64 MiB memory, t=3, p=1). Track in GitHub
  Issues, do NOT implement during feature work.

## 🛠️ Coding Standards
- **Python (`packages/crypto-core`):**
  - Format/lint with `ruff`. After writing Python code, run:
    `ruff check packages/crypto-core/`
  - Tests with `pytest` in `packages/crypto-core/tests/`. New backend
    features REQUIRE a test before being considered done.
  - Type hints mandatory on all function signatures.
- **JavaScript (`apps/web-client`, `apps/edge-api`):**
  - Strictly ES modules. NO bundlers (no Webpack/Vite) — keep Termux
    development agile.
  - Use standard Web APIs (Fetch, WebCrypto, Service Worker).
  - Syntax check: `node --check <file.js>`.
  - Local testing: to test the PWA in the phone's browser, ALWAYS
    instruct the user to serve it over HTTP (ES Modules do not work
    from file://). Use:
    `python -m http.server 8080 -d apps/web-client`
    then tell the user to open http://localhost:8080 in the browser.
- **API Documentation:** Every endpoint must be documented in
  `docs/api-spec.yaml` (OpenAPI 3.0) and covered by integration tests.

## 📦 Git Discipline (the user's safety net)
- The user is learning git. When a task is completed, ALWAYS provide
  the exact commands to save the work, with a short English commit
  message filled in by you, ready to copy-paste:
  git add -A
  git commit -m "Describe the change here"
- If a change went wrong, prefer fixing forward or `git revert` over
  manual file editing.

## 📍 Current State & Roadmap
- [x] Initial DB schema defined
- [x] GEMINI.md / CLAUDE.md context file created
- [ ] Implement RFC 3161 TSA proxy in `packages/crypto-core`
      (start with FreeTSA: https://freetsa.org; verify with
      `openssl ts -verify`)
- [ ] Enforce RLS policies on ALL Supabase tables
- [ ] Deploy Edge API on Cloudflare Workers
- [ ] Deploy PWA on Cloudflare Pages (https://not.mizel-ai.com)
- [ ] End-to-end flow test: hash → encrypt → timestamp → verify
- [ ] Contract a qualified QTSP for production timestamps
- [ ] (Backlog) Argon2id migration in web-client

## 🔄 How to Work With This File
- At the START of every session, read this file and run
  `git log --oneline -10` to restore context.
- When a task from this file is completed, update the checkboxes here
  in the SAME commit.
- If the user asks for something that violates a rule above, refuse
  politely, cite the rule, and propose the compliant alternative.
