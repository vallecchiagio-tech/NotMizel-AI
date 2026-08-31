#!/data/data/com.termux/files/usr/bin/bash
# Test POST /stamp — legge la chiave dal file locale (mai in chat/repo)
KEY=$(cat ~/.notmizel_key)
HASH=$(sha256sum ~/NotMizel-AI/GEMINI.md | cut -d' ' -f1)
echo "Hash: $HASH"
curl -s -X POST https://api.mizel-ai.com/stamp \
  -H "Content-Type: application/json" \
  -H "X-NotMizel-API-Key: $KEY" \
  -d "{\"hash\":\"$HASH\"}"
echo ""
