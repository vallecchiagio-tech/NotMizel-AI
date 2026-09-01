#!/data/data/com.termux/files/usr/bin/bash
# Scarica l'ultima prova .ots dalla tabella stamps (solo lettura)
KEY=$(cat ~/.supabase_service_key)
URL=$(grep -o 'https://[a-z0-9]*\.supabase\.co' ~/.supabase_url 2>/dev/null || echo "INCOLLA_URL")
curl -s "$URL/rest/v1/stamps?select=file_hash,ots_proof&order=created_at.desc&limit=1" \
  -H "apikey: KEY"−H"Authorization:BearerKEY" -H "Authorization: BearerKEY"−H"Authorization:BearerKEY" > ~/last-proof.json
wc -c ~/last-proof.json
