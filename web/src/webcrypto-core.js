/**
 * webcrypto-core.js — Local SHA-256 hashing (Zero-Knowledge core).
 * The file NEVER leaves the device: we only read it in chunks and
 * compute its SHA-256 digest using the native WebCrypto API.
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // read 4 MB at a time (mobile-friendly)

/**
 * Compute SHA-256 hex digest of a File/Blob, entirely in-browser.
 * @param {File|Blob} file
 * @param {(progress: number) => void} [onProgress] — 0..1
 * @returns {Promise<string>} hex-encoded SHA-256 digest
 */
export async function sha256File(file, onProgress) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('WebCrypto non disponibile: serve una connessione HTTPS o localhost.');
  }

  // Fast path: small files can be hashed in one call
  if (file.size <= CHUNK_SIZE) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    if (onProgress) onProgress(1);
    return bufToHex(digest);
  }

  // Streamed path for large files.
  // Note: WebCrypto cannot hash incrementally, so for large files we
  // read chunks and hash the concatenation via a temporary approach:
  // we build the full ArrayBuffer in memory. For MVP this is fine
  // (files up to ~200MB on modern phones). A true streaming hash
  // (e.g., js-sha256 WASM/JS) is a tracked future optimization.
  const chunks = [];
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    chunks.push(await slice.arrayBuffer());
    offset += CHUNK_SIZE;
    if (onProgress) onProgress(Math.min(offset / file.size, 0.99));
  }
  const merged = mergeBuffers(chunks);
  const digest = await crypto.subtle.digest('SHA-256', merged);
  if (onProgress) onProgress(1);
  return bufToHex(digest);
}

/** Compute SHA-256 of a plain text string (used for hash verification UI). */
export async function sha256Text(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}

function mergeBuffers(buffers) {
  const total = buffers.reduce((acc, b) => acc + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    out.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }
  return out.buffer;
}

function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
