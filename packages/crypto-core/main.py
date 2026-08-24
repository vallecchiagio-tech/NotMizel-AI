import hashlib
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="NotMizel-AI Core Engine",
    version="3.0.0",
    description="Motore crittografico locale per notarizzazione e generazione hash SHA-256"
)

class HealthResponse(BaseModel):
    status: str
    engine: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "online", "engine": "NotMizel-AI Core v3.0"}

@app.post("/api/v1/hash")
async def generate_hash(file: UploadFile = File(...)):
    try:
        sha256_hash = hashlib.sha256()
        # Legge il file a blocchi per ottimizzare la memoria RAM del telefono
        while chunk := await file.read(8192):
            sha256_hash.update(chunk)
            
        return {
            "filename": file.filename,
            "sha256": sha256_hash.hexdigest()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
