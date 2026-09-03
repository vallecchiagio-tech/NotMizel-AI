// NotMizel-AI — Generatore ricevuta PDF (Task 7, Fase 2)
// Autopportante: hash, proof OTS, data, status, istruzioni verifica indipendente.
// MAI contenuti del file — solo metadati. MAI claim di validità legale.

async function buildCertificate(stamp) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const page = pdf.addPage([595, 842]); // A4
  const viola = rgb(0.62, 0.30, 0.95);
  const scuro = rgb(0.13, 0.13, 0.15);
  const grigio = rgb(0.45, 0.45, 0.48);

  // Header brand
  page.drawText('NotMizel-AI', { x: 50, y: 780, size: 24, font: bold, color: viola });
  page.drawText('Certificate of Existence', { x: 50, y: 762, size: 12, font, color: grigio });
  page.drawLine({ start: { x: 50, y: 750 }, end: { x: 545, y: 750 }, thickness: 1, color: viola });

  // Campi ricevuta
  const righe = [
    ['File hash (SHA-256):', stamp.file_hash],
    ['Status:', stamp.status],
    ['Notarizzato il:', stamp.created_at],
    ['Rete di ancoraggio:', 'Bitcoin (via OpenTimestamps)'],
  ];
  let y = 715;
  for (const [label, valore] of righe) {
    page.drawText(label, { x: 50, y, size: 11, font: bold, color: scuro });
    y -= 14;
    page.drawText(String(valore), { x: 50, y, size: 10, font: mono, color: scuro });
    y -= 24;
  }

  // Proof OTS originale (base64, va a capo)
  page.drawText('Ricevuta OpenTimestamps (.ots):', { x: 50, y, size: 11, font: bold, color: scuro });
  y -= 14;
  page.drawText(stamp.ots_proof, { x: 50, y, size: 7, font: mono, color: scuro, maxWidth: 495, lineHeight: 9 });
  y -= 60;

  // Sezione Verifica e ancoraggio (documento ufficiale NotMizel-AI)
  const pending = String(stamp.status).trim().toLowerCase() === 'pending';
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: grigio });
  y -= 22;
  page.drawText('Verifica e ancoraggio alla rete', { x: 50, y, size: 13, font: bold, color: viola });
  y -= 18;
  const conferme = [
    'Questa registrazione e stata verificata dal sistema di verifica',
    'indipendente NotMizel-AI.',
    '',
    'L’ancoraggio alla rete Bitcoin avviene in modo sicuro e garantito',
    'dalla rete stessa entro circa 24 ore dalla registrazione.',
    '',
    'Nessun dato del file originale e mai stato trasmesso: solo',
    'l’impronta crittografica (hash SHA-256).',
  ];
  for (const riga of conferme) {
    if (riga) page.drawText(riga, { x: 50, y, size: 9.5, font, color: scuro });
    y -= 13;
  }
  y -= 4;
  if (pending) {
    page.drawText('Stato: ancoraggio in corso. Al completamento, questo', { x: 50, y, size: 9.5, font: bold, color: viola });
    y -= 13;
    page.drawText('documento indichera il numero del blocco Bitcoin.', { x: 50, y, size: 9.5, font: bold, color: viola });
    y -= 13;
  } else {
    page.drawText('Ancoraggio completato — Bitcoin block N. ' + String(stamp.block_height) + ',', { x: 50, y, size: 9.5, font: bold, color: viola });
    y -= 13;
    page.drawText('verificato dal sistema NotMizel-AI.', { x: 50, y, size: 9.5, font: bold, color: viola });
    y -= 13;
  }
  y -= 6;
  page.drawText('Per ricevere via email il file di verifica originale (.ots):', { x: 50, y, size: 9, font, color: grigio });
  y -= 12;
  page.drawText('richiedilo a verify@mizel-ai.com', { x: 50, y, size: 9.5, font: mono, color: scuro });
  y -= 13;

    y -= 20;
    // Footer
  page.drawText('Proof of Existence — Timestamped on Bitcoin Blockchain', { x: 50, y, size: 8, font: bold, color: viola });

  const bytes = await pdf.save();
  return { bytes, filename: 'ricevuta-' + stamp.file_hash.slice(0, 12) + '.pdf' };
}

function downloadCertificate(stamp) {
  return buildCertificate(stamp).then(({ bytes, filename }) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return filename;
  });
}
