# eIDAS Compliant RFC 3161 Time-Stamping Client
import hashlib

def generate_eidas_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
