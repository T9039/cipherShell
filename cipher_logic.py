import base64
import os
import secrets
import string

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# --- PASSWORD GENERATOR ---


def generate_random_password(length=16):
    """Generates a high-entropy random password."""
    # Define the pool of characters: Letters, Digits, Punctuation
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # secrets.choice is cryptographically secure (unlike random.choice)
    password = "".join(secrets.choice(alphabet) for i in range(length))
    return password


def generate_memorable_password(num_words=4):
    """Generates a generic 'correct-horse-battery-staple' password."""
    # For a real app, load the EFF Large Wordlist from a file.
    # For this 3-hour MVP, we use a small hardcoded sample list to ensure it runs immediately.
    # TODO: Download 'eff_large_wordlist.txt' and read it here for better entropy.

    sample_wordlist = [
        "account",
        "balance",
        "camera",
        "danger",
        "early",
        "factor",
        "garden",
        "habit",
        "iceberg",
        "jacket",
        "kangaroo",
        "laptop",
        "magnet",
        "network",
        "object",
        "packet",
        "quality",
        "radio",
        "saddle",
        "tactical",
        "umbrella",
        "vacuum",
        "waffle",
        "xylophone",
        "yellow",
        "zebra",
        "admit",
        "below",
        "crisis",
        "debug",
        "effort",
        "finance",
        "galaxy",
        "harbor",
        "image",
    ]

    selected_words = [secrets.choice(sample_wordlist) for _ in range(num_words)]
    return "-".join(selected_words)


# --- ENCRYPTION ENGINE ---


def derive_key(passphrase: str, salt: bytes) -> bytes:
    """
    Turns a human passphrase into a secure 32-byte Fernet key using PBKDF2.
    This makes the encryption resistant to Rainbow Table attacks.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,  # High iteration count slows down brute-force attacks
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))


def encrypt_message(message: str, passphrase: str) -> str:
    """
    Encrypts a message using a passphrase.
    Returns: A URL-safe base64 encoded string containing the Salt + Ciphertext.
    """
    # 1. Generate a random 16-byte salt
    salt = os.urandom(16)

    # 2. Derive a secure key from the passphrase + salt
    key = derive_key(passphrase, salt)

    # 3. Encrypt the message
    f = Fernet(key)
    token = f.encrypt(message.encode())

    # 4. Combine Salt and Token (We need the salt to decrypt later!)
    # We will base64 encode the salt + token to make it a single copy-pasteable string
    full_payload = base64.urlsafe_b64encode(salt + token).decode()
    return full_payload


def decrypt_message(encrypted_payload: str, passphrase: str) -> str:
    """
    Decrypts the payload using the passphrase.
    """
    try:
        # 1. Decode the wrapper to get bytes
        decoded_payload = base64.urlsafe_b64decode(encrypted_payload)

        # 2. Extract the Salt (first 16 bytes) and the Token (the rest)
        salt = decoded_payload[:16]
        token = decoded_payload[16:]

        # 3. Derive the SAME key using the extracted salt and provided passphrase
        key = derive_key(passphrase, salt)

        # 4. Decrypt
        f = Fernet(key)
        decrypted_message = f.decrypt(token).decode()
        return decrypted_message

    except Exception:
        # Fernet raises an InvalidToken exception if the key (passphrase) is wrong
        return "[ERROR] Decryption Failed: Invalid Passphrase or Corrupted Data."
