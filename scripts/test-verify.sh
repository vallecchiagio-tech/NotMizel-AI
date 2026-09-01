#!/data/data/com.termux/files/usr/bin/bash
# Test POST /verify - la chiave viene letta DIRETTAMENTE da Python
python3 <<'PYEOF'
import json, urllib.request, urllib.error

key = open("/data/data/com.termux/files/home/.notmizel_key").read().strip()
b64 = open("/data/data/com.termux/files/home/verify-test.ots","rb").read()
import base64
b64 = base64.b64encode(b64).decode()
h = "1e8f9184fa3c18572b87a79ed723b0663efd15250750efff0f043d4b7321569b"

data = json.dumps({"hash": h, "ots": b64}).encode()
req = urllib.request.Request("https://api.mizel-ai.com/verify", data=data,
        headers={"Content-Type": "application/json", "X-NotMizel-API-Key": key,
             "User-Agent": "NotMizel-AI/0.5.0"})
try:
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode())
PYEOF
