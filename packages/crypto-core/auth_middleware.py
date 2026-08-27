from fastapi import Request, HTTPException

async def verify_api_credits(request: Request):
    api_key = request.headers.get("X-NotMizel-API-Key")
    if not api_key:
        # Permette l'accesso standard da PWA senza chiave
        return {"tier": "standard_pwa", "credits": 0}
    
    # Logica di controllo crediti API B2B
    if api_key.startswith("nzl_live_"):
        return {"tier": "enterprise_api", "credits": 1000}
    raise HTTPException(status_code=403, detail="Chiave API non valida o crediti esauriti.")
