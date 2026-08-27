import hashlib
import time

class SecurityEngine:
    @staticmethod
    def calculate_sha256(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def get_timestamp() -> int:
        return int(time.time())
