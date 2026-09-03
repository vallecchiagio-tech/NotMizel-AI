
## ARCHITETTURA NOTMIZEL - Mappa funzioni e file (post Task 7)

### Backend - api/src/index.js (Cloudflare Worker: notmizel-api-edge)
- ROUTER (switch sull'URL):
  /health -> risposta di stato, pubblico.
  /auth/magic-link -> chiede a Supabase di inviare email login
    (magic link); pubblico.
  /list -> handleList: restituisce le notarizzazioni dell'utente
    loggato; richiede Bearer JWT.
  /stamp -> handleStamp: notarizza un hash; richiede Bearer JWT +
    header X-NotMizel-API-Key (doppia autenticazione).
- function getUser(request, env): valida il JWT Bearer chiamando
  Supabase (/auth/v1/user); restituisce {userId} o null.
- function handleStamp: estrae hash dal body, lo invia al pool
  OpenTimestamps, riceve la proof OTS (base64), salva in Supabase
  via saveStamp. Risposta: {ots, hash, submitted, pool, saved}.
- function saveStamp(env, hash, otsBase64, userId): INSERT nella
  tabella Supabase "stamps" con campi: file_hash, user_id,
  ots_proof, status="pending". (FIX Fase 3: user_id ora incluso.)
- function handleList: valida utente, poi GET a Supabase
  /rest/v1/stamps?user_id=eq.<id> -> {stamps:[...]}.

### Supabase (DB)
- Tabella stamps: id (uuid), file_hash, ots_proof, user_id,
  status (pending/confirmed), created_at.
- Auth: magic link, JWT scade in 1h.

### Client da terminale (test)
- ~/fase3.sh: estrae token da ~/token_url.txt, calcola sha256 del
  file-link, chiama /stamp e /list. Metodo @D@+sed per i $.

### Contratto API (da usare nella PWA)
- POST /stamp: header Authorization: Bearer <JWT> + X-NotMizel-API-Key:
  <APP_KEY> + body {"hash":"<64hex>"} -> {ots,hash,submitted,pool,saved}
- GET /list: header Authorization: Bearer <JWT> -> {stamps:[...]}

## TESTO PER LA PAGINA "INFORMAZIONI" (PWA)

NotMizel: la tua cassaforte di prove.
NotMizel permette di dimostrare CHE UN DOCUMENTO ESISTEVA in una
certa data, senza rivelarne il contenuto. Come funziona:
1. Scegli un file (es. un PDF). NotMizel calcola la sua "impronta
   digitale" crittografica (hash SHA-256): il contenuto non lascia
   mai il tuo dispositivo.
2. L'impronta viene inviata a OpenTimestamps, un servizio pubblico
   che la incide nella blockchain di Bitcoin. Il risultato e' una
   "prova" (proof OTS) che appartiene solo a te.
3. La prova e' salvata nel tuo account ed e' verificabile da
   chiunque, per sempre, anche senza NotMizel.
Lo stato "pending" significa che la prova sta entrando nel round di
bitcoinizzazione (di norma entro poche ore/giorni); dopo la conferma
sara' verificabile con qualsiasi verifier OpenTimestamps.
