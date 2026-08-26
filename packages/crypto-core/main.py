from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
import hashlib
import os

app = FastAPI(title="NotMizel-AI Enterprise Core")

class DocumentRequest(BaseModel):
    content: str

def verify_tier(x_user_tier: str = Header(default="free")):
    allowed_tiers = ["free", "premium", "pro"]
    if x_user_tier not in allowed_tiers:
        raise HTTPException(status_code=403, detail="Piano non riconosciuto.")
    return x_user_tier

async def anchor_to_blockchain(hash_string: str):
    return f"0x_anchor_{hash_string[:10]}_success"

@app.post("/api/v1/notarize")
async def notarize_document(doc: DocumentRequest, tier: str = Depends(verify_tier)):
    doc_hash = hashlib.sha256(doc.content.encode('utf-8')).hexdigest()
    
    response_data = {
        "status": "success",
        "hash": doc_hash,
        "tier_used": tier,
        "legal_value": "Timestamp informatico valido"
    }

    if tier == "pro":
        tx_id = await anchor_to_blockchain(doc_hash)
        response_data["blockchain_tx"] = tx_id
        response_data["legal_value"] = "Timestamp informatico + Immutabilità Blockchain"
        
    return response_data

@app.get("/health")
def health_check():
    return {"status": "NotMizel-AI Cloud Backend Operativo"}
