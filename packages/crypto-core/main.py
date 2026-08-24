import os
import io
import json
import hashlib
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import piexif
from pypdf import PdfReader, PdfWriter
import uvicorn

app = FastAPI(
    title="NotMizel-AI Core Engine & Trust Suite",
    version="4.0.0",
    description="Engine crittografico Zero-Knowledge con AES-256-GCM e Metadata Injection"
)

# --- UTILITIES CRITTOGRAFICHE ---

def encrypt_aes256_gcm(data: bytes, key_hex: str) -> dict:
    key = bytes.fromhex(key_hex)
    if len(key) != 32:
        raise ValueError("La chiave AES-256 deve essere di 64 caratteri esadecimali (32 byte).")
    
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Nonce a 96-bit per GCM
    ciphertext = aesgcm.encrypt(nonce, data, None)
    
    return {
        "ciphertext_hex": ciphertext.hex(),
        "nonce_hex": nonce.hex()
    }

def inject_image_metadata(image_bytes: bytes, author: str, license_type: str, copyright_notice: str) -> bytes:
    try:
        exif_dict = piexif.load(image_bytes)
    except Exception:
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}

    # Iniezione campi EXIF Standard
    user_comment = json.dumps({"author": author, "license": license_type, "copyright": copyright_notice})
    exif_dict["0th"][piexif.ImageIFD.Artist] = author.encode('utf-8')
    exif_dict["0th"][piexif.ImageIFD.Copyright] = copyright_notice.encode('utf-8')
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = user_comment.encode('utf-8')

    exif_bytes = piexif.dump(exif_dict)
    output = io.BytesIO()
    piexif.insert(exif_bytes, image_bytes, output)
    return output.getvalue()

def inject_pdf_metadata(pdf_bytes: bytes, author: str, license_type: str, copyright_notice: str) -> bytes:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    writer.append(reader)
    
    metadata = {
        "/Author": author,
        "/License": license_type,
        "/Copyright": copyright_notice,
        "/Producer": "NotMizel-AI Digital Trust Suite"
    }
    writer.add_metadata(metadata)
    
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()

# --- ENDPOINTS REST ---

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "engine": "NotMizel-AI Trust Core v4.0",
        "features": ["AES-256-GCM", "EXIF/PDF Metadata Injection", "Zero-Knowledge"]
    }

@app.post("/api/v1/trust/process")
async def process_document(
    file: UploadFile = File(...),
    author: str = Form(...),
    license_type: str = Form("All Rights Reserved"),
    copyright_notice: str = Form(""),
    encryption_key: Optional[str] = Form(None)  # 64 char HEX key se Zero-Knowledge è attivo
):
    try:
        raw_bytes = await file.read()
        filename = file.filename.lower()
        processed_bytes = raw_bytes

        # 1. Iniezione Metadati di Copyright
        if filename.endswith(('.jpg', '.jpeg')):
            processed_bytes = inject_image_metadata(raw_bytes, author, license_type, copyright_notice)
        elif filename.endswith('.pdf'):
            processed_bytes = inject_pdf_metadata(raw_bytes, author, license_type, copyright_notice)

        # 2. Calcolo Hash SHA-256 dell'opera marcata
        file_hash = hashlib.sha256(processed_bytes).hexdigest()

        # 3. Cifratura Zero-Knowledge AES-256-GCM (opzionale)
        encryption_result = None
        if encryption_key:
            encryption_result = encrypt_aes256_gcm(processed_bytes, encryption_key)

        return {
            "filename": file.filename,
            "author": author,
            "license": license_type,
            "watermarked_file_hash": file_hash,
            "is_encrypted": encryption_key is not None,
            "encryption_data": encryption_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore di elaborazione: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
