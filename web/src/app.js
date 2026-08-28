/**
 * app.js — NotMizel-AI MVP (Task 1)
 * Local file hashing UI. No network calls: privacy by design.
 */

import { sha256File } from './webcrypto-core.js';

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const progressWrap = document.getElementById('progress-wrap');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const result = document.getElementById('result');
const hashOutput = document.getElementById('hash-output');
const errorBox = document.getElementById('error');

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) hashFile(file);
});

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  progressWrap.classList.add('hidden');
}

async function hashFile(file) {
  // Reset UI state
  errorBox.classList.add('hidden');
  result.classList.add('hidden');
  fileInfo.classList.remove('hidden');
  progressWrap.classList.remove('hidden');
  progressFill.style.width = '0%';

  fileName.textContent = file.name;
  fileSize.textContent = `${formatSize(file.size)} · elaborato solo su questo dispositivo`;

  try {
    const hash = await sha256File(file, (progress) => {
      const pct = Math.round(progress * 100);
      progressFill.style.width = `${pct}%`;
      progressLabel.textContent =
        pct < 100 ? `Calcolo in corso… ${pct}%` : 'Completato ✓';
    });

    progressWrap.classList.add('hidden');
    hashOutput.textContent = hash;
    result.classList.remove('hidden');
  } catch (err) {
    showError(`Errore durante il calcolo: ${err.message}`);
  }
}

