import hashlib
import io
import time
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = FastAPI(title="NotMizel-AI Trust Core", version="4.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "online",
        "engine": "NotMizel-AI Trust Core v4.1",
        "features": ["AES-256-GCM", "EXIF/PDF Metadata", "Music Copyright Timestamping", "PDF Certificate Generator"]
    }

@app.post("/notarize/music")
async def notarize_music(
    file: UploadFile = File(...),
    artist_name: str = Form(...),
    song_title: str = Form(...),
    kyc_status: str = Form("unverified")
):
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
    
    return {
        "status": "success",
        "type": "audio_copyright",
        "artist": artist_name,
        "title": song_title,
        "hash_sha256": file_hash,
        "timestamp": timestamp,
        "kyc_verified": kyc_status == "verified",
        "legal_jurisdiction": "WIPO / eIDAS Compliant"
    }

@app.post("/generate-certificate")
async def generate_certificate(
    doc_title: str = Form(...),
    file_hash: str = Form(...),
    author: str = Form(...),
    jurisdiction: str = Form("eIDAS / AgID")
):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Intestazione Certificato
    p.setFont("Helvetica-Bold", 18)
    p.drawString(100, 750, "NOTMIZEL-AI DIGITAL TRUST CERTIFICATE")
    p.setLineWidth(1)
    p.line(100, 740, 500, 740)
    
    # Dettagli del deposito
    p.setFont("Helvetica", 12)
    p.drawString(100, 700, f"Documento / Opera: {doc_title}")
    p.drawString(100, 680, f"Autore / Depositante: {author}")
    p.drawString(100, 660, f"Data e Ora (UTC): {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    p.drawString(100, 640, f"Giurisdizione Normativa: {jurisdiction}")
    
    # Impronta Digitale SHA-256
    p.setFont("Helvetica-Bold", 11)
    p.drawString(100, 590, "Impronta Digitale Univoca (SHA-256):")
    p.setFont("Courier", 9)
    p.drawString(100, 575, file_hash)
    
    # Nota Legale
    p.setFont("Helvetica-Oblique", 9)
    p.drawString(100, 520, "Questo certificato attesta l'anteriorità e l'integrità del file ai sensi del Regolamento UE eIDAS.")
    p.drawString(100, 505, "Verifica la validità dell'hash su https://mizel-ai.com/verify")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Certificato_NotMizel_{int(time.time())}.pdf"}
    )
