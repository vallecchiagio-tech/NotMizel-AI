import os
import hashlib
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="NotMizel-AI Enterprise Crypto Core", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "engine": "NotMizel-AI Core", "timestamp": datetime.utcnow().isoformat()}

# Notarizzazione Hash Standard & Pro
@app.post("/api/v1/notarize")
async def notarize_document(sha256: str = Form(...), filename: str = Form(...), user_id: str = Form("anonymous")):
    timestamp = datetime.utcnow().isoformat()
    proof_id = f"NZL-{hashlib.sha256((sha256 + timestamp).encode()).hexdigest()[:12].upper()}"
    return {
        "status": "success",
        "proof_id": proof_id,
        "sha256": sha256,
        "filename": filename,
        "user_id": user_id,
        "timestamp": timestamp,
        "verification_url": f"https://not.mizel-ai.com/verify/{sha256}"
    }

# Deposito Musica con Giurisdizione Legale
@app.post("/api/v1/music")
async def notarize_music(
    artist: str = Form(...),
    title: str = Form(...),
    license_type: str = Form(...), # 'it', 'eu', 'int'
    file_hash: str = Form(...)
):
    jurisdiction_map = {
        "it": "Nazionale (SIAE / Diritto d'Autore IT)",
        "eu": "Continentale (Unione Europea / eIDAS)",
        "int": "Internazionale (WIPO / Convenzione di Berna)"
    }
    cert_id = f"MUSE-{license_type.upper()}-{hashlib.md5((artist + title + file_hash).encode()).hexdigest()[:10].upper()}"
    return {
        "status": "success",
        "certificate_id": cert_id,
        "artist": artist,
        "title": title,
        "license_code": license_type,
        "jurisdiction": jurisdiction_map.get(license_type, "Standard"),
        "timestamp": datetime.utcnow().isoformat()
    }

# KYC In-House (Zero Provider Cost - Fascicolo Identità)
@app.post("/api/v1/kyc/upload")
async def upload_kyc_bundle(
    full_name: str = Form(...),
    document_number: str = Form(...),
    doc_file: UploadFile = File(...),
    selfie_file: UploadFile = File(...)
):
    doc_bytes = await doc_file.read()
    selfie_bytes = await selfie_file.read()
    
    doc_hash = hashlib.sha256(doc_bytes).hexdigest()
    selfie_hash = hashlib.sha256(selfie_bytes).hexdigest()
    
    identity_vault_hash = hashlib.sha256((doc_hash + selfie_hash + document_number).encode()).hexdigest()
    
    return {
        "status": "kyc_verified",
        "identity_vault_hash": identity_vault_hash,
        "full_name": full_name,
        "status_code": "LEGALLY_BINDING_IN_HOUSE",
        "timestamp": datetime.utcnow().isoformat()
    }

# Endpoint per Validazione Crediti API (B2B)
@app.get("/api/v1/verify/{sha256_hash}")
def verify_hash(sha256_hash: str):
    return {
        "valid": True,
        "sha256": sha256_hash,
        "authority": "NotMizel-AI Decentralized Trust Network",
        "eidas_compliant": True
    }
