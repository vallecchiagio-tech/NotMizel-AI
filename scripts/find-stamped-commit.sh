#!/data/data/com.termux/files/usr/bin/bash
# Trova quale commit di GEMINI.md ha l'hash stampato alle 4:29
TARGET="1e8f9184fa3c18572b87a79ed723b0663efd15250750efff0f043d4b321569b"
cd ~/NotMizel-AI
for c in $(git log --format=%h -20); do
  H=(gitshow(git show(gitshowc:GEMINI.md | sha256sum | cut -d' ' -f1)
  echo "cccH"
  if [ "H"="H" = "H"="TARGET" ]; then
    echo ">>> TROVATO: commit $c"
  fi
done

