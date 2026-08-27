import os
import jwt
import httpx
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer
from async_lru import alru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotMizel-Security")

security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

@alru_cache(maxsize=256, ttl=300)
async def get_user_tier_from_db(user_id: str) -> str:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return "free"
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=role",
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            if data and isinstance(data, list) and len(data) > 0:
                return data[0].get("role", "free")
            return "free"
            
        except Exception as e:
            logger.error(f"DB Error: {e}")
            return "free"

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing token")

    token = credentials.credentials
    
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Server config error")

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        tier = await get_user_tier_from_db(user_id)
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "tier": tier
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(status_code=500, detail="Auth error")

def require_premium(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("tier") not in ["premium", "pro", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Premium required")
    return user

def require_pro(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("tier") not in ["pro", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Pro required")
    return user
