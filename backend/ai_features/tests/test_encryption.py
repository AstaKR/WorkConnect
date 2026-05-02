import pytest
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'er_backend.settings')


def test_encrypt_decrypt_roundtrip():
    from ai_features.encryption import fernet_encrypt, fernet_decrypt
    original = "sk-test-api-key-abc123"
    assert fernet_decrypt(fernet_encrypt(original)) == original


def test_ciphertext_differs_from_plaintext():
    from ai_features.encryption import fernet_encrypt
    original = "my-secret-key"
    assert fernet_encrypt(original) != original


def test_empty_string_roundtrip():
    from ai_features.encryption import fernet_encrypt, fernet_decrypt
    assert fernet_decrypt(fernet_encrypt("")) == ""


def test_unicode_roundtrip():
    from ai_features.encryption import fernet_encrypt, fernet_decrypt
    val = "api-key-with-special-chars-!@#$%"
    assert fernet_decrypt(fernet_encrypt(val)) == val
