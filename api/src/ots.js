// NotMizel API — OpenTimestamps client (Task 2)
// Endpoint e header verificati sul sorgente ufficiale
// (opentimestamps/calendar.py, classe RemoteCalendar):
//   POST <pool>/digest  — body: 32 byte binari del digest
//   Headers: Accept: application/vnd.opentimestamps.v1, User-Agent
// La risposta del calendario e' un Timestamp serializzato "grezzo".
// Un file .ots vero e': header(30 byte) + major(01) + tag sha256(08)
// + digest(32 byte) + risposta grezza del pool.
// Struttura verificata empiricamente col client ufficiale Python.
// NOTA: niente backtick/template literal (bug tastiera Android).

const OTS_PREAMBLE = "\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94\x01\x08";
const OTS_POOLS = [
  "https://a.pool.opentimestamps.org",
  "https://b.pool.opentimestamps.org",
  "https://a.pool.eternitywall.com",
];
const POOL_TIMEOUT_MS = 15000;

// Invia il digest a un singolo pool. Restituisce Uint8Array dei byte
// del Timestamp ricevuto, o lancia un Error descrittivo.
async function submitToPool(poolUrl, digestBytes, timeoutMs) {
  const res = await fetch(poolUrl + "/digest", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.opentimestamps.v1",
      "User-Agent": "NotMizel-AI/0.3.0",
      "Content-Type": "application/octet-stream",
    },
    body: digestBytes,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error("pool " + poolUrl + " risposto HTTP " + res.status);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error("pool " + poolUrl + ": risposta vuota");
  }
  if (buf.length > 10000) {
    throw new Error("pool " + poolUrl + ": risposta oltre il limite di size");
  }
  return buf;
}

// Prova i pool in ordine finche' uno non riesce.
// digestBytes: Uint8Array di 32 byte (digest binario).
// digestHex: stringa hex di 64 caratteri (validazione coerenza).
export async function stampDigest(digestBytes, digestHex) {
  if (!(digestBytes instanceof Uint8Array) || digestBytes.length !== 32) {
    throw new Error("stampDigest: attesi 32 byte binari del digest");
  }
  if (typeof digestHex !== "string" || !/^[0-9a-f]{64}$/.test(digestHex)) {
    throw new Error("stampDigest: atteso hash hex di 64 caratteri");
  }
  const errors = [];
  for (const pool of OTS_POOLS) {
    try {
      const raw = await submitToPool(pool, digestBytes, POOL_TIMEOUT_MS);
      // Componi il file .ots completo:
      // preambolo(33) + digest(32) + risposta grezza del pool
      const pre = new Uint8Array(OTS_PREAMBLE.length);
      for (let i = 0; i < OTS_PREAMBLE.length; i++) {
        pre[i] = OTS_PREAMBLE.charCodeAt(i);
      }
      const ots = new Uint8Array(pre.length + 32 + raw.length);
      ots.set(pre, 0);
      ots.set(digestBytes, pre.length);
      ots.set(raw, pre.length + 32);
      return { ots: ots, pool: pool };
    } catch (err) {
      errors.push(err.message);
    }
  }
  throw new Error("tutti i pool OTS falliti: " + errors.join(" | "));
}
