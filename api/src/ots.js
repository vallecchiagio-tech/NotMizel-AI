// ots.js - NotMizel API: interazione con OpenTimestamps (senza librerie).
// v0.5.3 (Task 5): attestation = tag 0x05 + VarInt height (NON 8 byte fissi).
//   Confermato sui byte reali: blocco 964816 -> VarInt D0 F1 3A.
//   La merkle root NON e' nel file: si legge dall'header del blocco.
// v0.5.0: submitToPool + stampDigest, endpoint ufficiali.
// NOTA: niente template literal (bug tastiera Android) -> si usa "+".

const OTS_PREAMBLE = "\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94\x53\x01\x08";
const OTS_POOLS = [
  "https://a.pool.opentimestamps.org",
  "https://b.pool.opentimestamps.org",
  "https://a.pool.eternitywall.com"
];
const POOL_TIMEOUT_MS = 15000;

async function submitToPool(poolUrl, digestBytes, timeoutMs) {
  const res = await fetch(poolUrl + "/digest", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.opentimestamps.v1",
      "User-Agent": "NotMizel-AI/0.5.0",
      "Content-Type": "application/octet-stream"
    },
    body: digestBytes,
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) {
    throw new Error(poolUrl + ": risposta HTTP " + res.status);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error(poolUrl + ": risposta vuota");
  }
  if (buf.length > 10000) {
    throw new Error(poolUrl + ": risposta oltre il limite di size");
  }
  return buf;
}

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
      const pre = OTS_PREAMBLE;
      const preLength = pre.length;
      const ots = new Uint8Array(preLength + 32 + raw.length);
      ots.set(digestBytes, preLength);
      ots.set(raw, preLength + 32);
      return { ots: ots, pool: pool };
    } catch (err) {
      errors.push(err.message);
    }
  }
  throw new Error("tutti i pool OTS falliti: " + errors.join(" | "));
}

// ===== Task 5: upgrade e verifica =====

function bytesToHex(bytes) {
  let h = "";
  for (let i = 0; i < bytes.length; i++) {
    h += ("0" + bytes[i].toString(16)).slice(-2);
  }
  return h;
}

export async function upgradeProof(otsBytes) {
  if (!otsBytes || otsBytes.length < 98) {
    throw new Error("ots troppo corto");
  }
  const digestHex = bytesToHex(otsBytes.slice(33, 65));
  const calendars = [
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org"
  ];
  const errors = [];
  for (const cal of calendars) {
    try {
      const res = await fetch(cal + "/timestamp/" + digestHex, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Accept": "application/vnd.opentimestamps.v1",
          "User-Agent": "NotMizel-AI/0.5.0"
        },
        body: otsBytes,
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) { errors.push(cal + " HTTP " + res.status); continue; }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > 20000) { errors.push(cal + " size"); continue; }
      return buf;
    } catch (err) {
      errors.push(cal + ": " + err.message);
    }
  }
  throw new Error("upgrade fallito: " + errors.join(" | "));
}

// Decodifica una VarInt stile Bitcoin a partire da offset.
// Ritorna {value, next} oppure null se invalida.
function decodeVarInt(bytes, offset) {
  let value = 0;
  let shift = 0;
  let i = offset;
  while (i < bytes.length && i < offset + 4) {
    const b = bytes[i];
    value += (b & 0x7f) * Math.pow(2, shift);
    shift += 7;
    if ((b & 0x80) === 0) {
      return { value: value, next: i + 1 };
    }
    i++;
  }
  return null;
}

// BitcoinBlockHeaderAttestation: tag 0x05 + VarInt(height).
// (FIX v0.5.3: i 8 byte fissi little-endian erano sbagliati; i byte reali
// del file mostrano tag 0x05 e poi D0 F1 3A = VarInt di 964816.)
export function findBitcoinAttestation(otsBytes) {
  // Criterio verificato empiricamente sui byte reali (verify-test.ots):
  // firma a 9 byte del tag Bitcoin attestation + 1 byte di.separator,
  // seguita dalla VarInt dell'altezza del blocco.
  // Unica occorrenza nel file -> zero falsi positivi (vs 0x05 solitario).
  const SIG = [0x05,0x88,0x96,0x0d,0x73,0xd7,0x19,0x01,0x03];
  for (let i = otsBytes.length - SIG.length; i >= 0; i--) {
    let ok = true;
    for (let j = 0; j < SIG.length; j++) {
      if (otsBytes[i + j] !== SIG[j]) { ok = false; break; }
    }
    if (!ok) continue;
    // VarInt subito dopo la firma
    let v = 0, shift = 0, p = i + SIG.length;
    while (p < otsBytes.length) {
      const b = otsBytes[p]; p += 1;
      v += (b & 0x7f) * Math.pow(2, shift); shift += 7;
      if (!(b & 0x80)) break;
    }
    if (v > 0 && v < 2000000) return { height: v };
  }
  return null;
}
