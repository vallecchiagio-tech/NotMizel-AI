from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import os
import hashlib
import time

from security import SecurityEngine
from auth_middleware import get_current_user, require_premium, require_pro

load_dotenv()

app = FastAPI(title="NotMizel-AI Core Engine", version="2.1.0")

# --- Modelli Dati ---
class AuthorProofRequest(BaseModel):
    artist_name: str
    work_title: str
    region: str  # "Nazionale (Italia / SIAE) - Pay-Per-Use"

# --- Endpoint ---

@app.get("/health")
async def health_check():
    return {"status": "online", "version": "2.1.0"}

@app.post("/api/v1/notarize-hash")
async def notarize_hash(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Notarizzazione Hashing Standard (Free Tier).
    Calcola SHA-256 locale (Zero-Knowledge) e registra timestamp.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File non fornito")

    file_bytes = await file.read()
    original_hash = SecurityEngine.calculate_sha256(file_bytes)
    timestamp = SecurityEngine.get_timestamp()

    # Qui salveresti l'hash e il timestamp nel DB Supabase
    # Esempio: await supabase.table('hashes').insert({...})

    return {
        "status": "success",
        "filename": file.filename,
        "sha256_hash": original_hash,
        "timestamp": timestamp,
        "user_id": user["user_id"],
        "tier": user["tier"],
        "message": "Hash calcolato e registrato localmente. (Standard)"
    }

@app.post("/api/v1/author-proof")
async def create_author_proof(
    file: UploadFile = File(...),
    artist_name: str = Form(...),
    work_title: str = Form(...),
    region: str = Form(...),
    user: Dict[str, Any] = Depends(require_premium) # Richiede Premium
):
    """
    Prova d'Autore & Musica (Premium Tier).
    Genera certificato notarale con metadati.
    """
    if not file.filename or not artist_name or not work_title:
        raise HTTPException(status_code=400, detail="Campi obbligatori mancanti")

    file_bytes = await file.read()
    file_hash = SecurityEngine.calculate_sha256(file_bytes)
    timestamp = SecurityEngine.get_timestamp()

    # Qui genereresti il PDF con ReportLab (se necessario)
    # e lo salveresti su Cloudflare R2 o Supabase Storage

    return {
        "status": "success",
        "message": "Certificato d'Autore generato con successo.",
        "artist_name": artist_name,
        "work_title": work_title,
        "region": region,
        "file_hash": file_hash,
        "timestamp": timestamp,
        "user_id": user["user_id"],
        "tier": user["tier"],
        "certificate_id": f"cert_{SecurityEngine.calculate_sha256(f'{file_hash}{timestamp}'.encode())[:12]}"
    }

# Placeholder per KYC e Blockchain (già definiti prima)
@app.post("/api/v1/kyc-verify")
async def verify_identity(
    document_front: UploadFile = File(...),
    user: Dict[str, Any] = Depends(require_premium)
):
    # ... (codice KYC esistente)
    return {"status": "processing", "message": "KYC avviato."}

@app.post("/api/v1/anchor-blockchain")
async def anchor_blockchain(
    hash: str = Form(...),
    user: Dict[str, Any] = Depends(require_pro)
):
    # ... (codice Blockchain esistente)
    return {"status": "anchored", "hash": hash, "message": "Hash ancorato."}
