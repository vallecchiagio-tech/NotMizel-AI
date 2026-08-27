# Zero-Knowledge Cryptographic Core (AES-GCM-256 + HKDF)
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class ZKEngine:
    @staticmethod
    def generate_key() -> bytes:
        return AESGCM.generate_key(bit_length=256)

    @staticmethod
    def encrypt_payload(key: bytes, plaintext: bytes) -> dict:
        nonce = os.urandom(12)
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        return {"ciphertext": ciphertext.hex(), "nonce": nonce.hex()}
