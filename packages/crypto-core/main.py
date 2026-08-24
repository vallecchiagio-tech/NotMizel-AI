from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import base64
from security import SecurityEngine

# Carica le variabili dal file .env (se esiste)
load_dotenv()

app = FastAPI(title="NotMizel-AI Core Engine", version="1.1.0")

class HealthCheck(BaseModel):
    status: str
    version: str
    supabase_configured: bool

@app.get("/health", response_model=HealthCheck)
async def health_check():
    # Verifica se le chiavi Supabase sono state inserite nell'ambiente
    has_supabase = bool(os.getenv("SUPABASE_URL"))
    return {"status": "online", "version": "1.1.0", "supabase_configured": has_supabase}

@app.post("/api/v1/process-and-hash")
async def process_and_hash_file(
    file: UploadFile = File(...),
    author: str = Form(None),
    copyright_notice: str = Form(None),
    apply_encryption: bool = Form(False)
):
    """
    Endpoint per uso LOCALE (Zero-Knowledge su Termux). 
    Inietta metadati, calcola hash e (opzionalmente) cripta il file.
    """
    file_bytes = await file.read()
    
    # 1. Iniezione Metadati (Attualmente supportato per immagini)
    if author and copyright_notice and file.filename.lower().endswith(('.jpg', '.jpeg', '.webp')):
        file_bytes = SecurityEngine.inject_image_metadata(file_bytes, author, copyright_notice)

    # 2. Hash del file originale (o metadatato)
    original_hash = SecurityEngine.calculate_sha256(file_bytes)
    
    response_data = {
        "filename": file.filename,
        "original_sha256": original_hash,
        "metadata_injected": bool(author and copyright_notice)
    }

    # 3. Crittografia (Opzionale)
    if apply_encryption:
        key = SecurityEngine.generate_aes_key()
        ciphertext, nonce = SecurityEngine.encrypt_file(file_bytes, key)
        encrypted_hash = SecurityEngine.calculate_sha256(ciphertext)
        
        response_data.update({
            "encrypted_sha256": encrypted_hash,
            # ATTENZIONE: In produzione vera, la chiave NON viene restituita dall'API al client,
            # ma viene generata e trattenuta nel browser. Questo serve per test locali.
            "aes_key_base64": base64.b64encode(key).decode('utf-8'),
            "nonce_base64": base64.b64encode(nonce).decode('utf-8')
        })

    return response_data
