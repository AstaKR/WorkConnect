import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def _get_fernet() -> Fernet:
    from django.conf import settings
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"er_plan_ai_keys",
        iterations=100_000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return Fernet(key)


def fernet_encrypt(plaintext: str) -> str:
    """Encrypt a plaintext string. Returns URL-safe base64 ciphertext."""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def fernet_decrypt(ciphertext: str) -> str:
    """Decrypt a Fernet ciphertext string. Returns plaintext."""
    return _get_fernet().decrypt(ciphertext.encode()).decode()
