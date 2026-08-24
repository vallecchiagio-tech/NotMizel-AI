import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image
import piexif
import json
from io import BytesIO

class SecurityEngine:
    @staticmethod
    def generate_aes_key() -> bytes:
        """Genera una chiave AES-256 (32 bytes) per la crittografia Zero-Knowledge."""
        return AESGCM.generate_key(bit_length=256)

    @staticmethod
    def encrypt_file(file_data: bytes, key: bytes) -> tuple[bytes, bytes]:
        """Cripta i dati usando AES-256-GCM. Restituisce (ciphertext, nonce)."""
        aesgcm = AESGCM(key)
        nonce = os.urandom(12) # Il nonce a 12 byte è lo standard per GCM
        ciphertext = aesgcm.encrypt(nonce, file_data, None)
        return ciphertext, nonce

    @staticmethod
    def calculate_sha256(file_data: bytes) -> str:
        """Calcola l'hash SHA-256 per l'ancoraggio blockchain."""
        return hashlib.sha256(file_data).hexdigest()

    @staticmethod
    def inject_image_metadata(image_data: bytes, author: str, copyright_notice: str) -> bytes:
        """Inietta metadati EXIF (Copyright/Author) in un'immagine (JPEG/WebP) senza alterare i pixel."""
        try:
            img = Image.open(BytesIO(image_data))
            if img.format not in ['JPEG', 'TIFF', 'WEBP']:
                return image_data # Se non supporta EXIF nativo, ritorna originale
            
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
            
            # Inseriamo i dati nel tag Artist (315) e Copyright (33432)
            exif_dict["0th"][piexif.ImageIFD.Artist] = author.encode('utf-8')
            exif_dict["0th"][piexif.ImageIFD.Copyright] = copyright_notice.encode('utf-8')
            
            exif_bytes = piexif.dump(exif_dict)
            output = BytesIO()
            img.save(output, format=img.format, exif=exif_bytes)
            return output.getvalue()
        except Exception as e:
            print(f"Errore iniezione metadati: {e}")
            return image_data # Fail-safe: restituisce l'originale se fallisce
