import base64
import os
import secrets
import string

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# --- PASSWORD GENERATOR ---


def generate_random_password(length=16):
    """Generates a high-entropy random password."""
    # Define the pool of characters: Letters, Digits, Punctuation
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # secrets.choice is cryptographically secure (unlike random.choice)
    password = "".join(secrets.choice(alphabet) for i in range(length))
    return password


def generate_memorable_password(num_words=5):
    """
    Generates a password using the EFF Large Wordlist.
    Standard: 5 words from a pool of 7776 words = ~64 bits of entropy.
    """
    wordlist_path = "eff_large_wordlist.txt"
    words = []

    try:
        with open(wordlist_path, "r") as f:
            for line in f:
                # The EFF file format is "11111 word". We split by tab or space.
                parts = line.strip().split()
                if len(parts) >= 2:
                    # The word is usually the second part (index 1)
                    words.append(parts[1])

        if not words:
            raise ValueError("Wordlist empty")

        # Select 5 random words securely
        selected_words = [secrets.choice(words) for _ in range(num_words)]

        # Capitalize them for readability (e.g., Correct-Horse-Battery...)
        # This is standard practice for memorable passwords.
        selected_words = [w.capitalize() for w in selected_words]

        return "-".join(selected_words)

    except FileNotFoundError:
        # Emergency Fallback if file is missing (so app doesn't crash)
        fallback = ["Error", "Wordlist", "File", "Missing", "Download", "It"]
        return "-".join(fallback[:num_words])


# --- ASYMMETRIC ENGINE (RSA) ---


def generate_keypair():
    """
    Generates a 2048-bit RSA Keypair.
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    pem_public = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return pem_private.decode("utf-8"), pem_public.decode("utf-8")


def encrypt_with_public_key(message: str, public_key_str: str) -> str:
    """
    Encrypts a message using a Public Key.
    """
    try:
        # 1. Load the key
        public_key = serialization.load_pem_public_key(public_key_str.encode("utf-8"))

        # 2. VITAL Fix: Check if it is actually an RSA key
        if not isinstance(public_key, rsa.RSAPublicKey):
            return "Error: The provided key is not a valid RSA Public Key."

        # 3. Encrypt
        ciphertext = public_key.encrypt(
            message.encode("utf-8"),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
        return base64.b64encode(ciphertext).decode("utf-8")

    except Exception as e:
        return f"Error: Encryption failed. {str(e)}"


def decrypt_with_private_key(ciphertext_b64: str, private_key_str: str) -> str:
    """
    Decrypts a message using a Private Key.
    """
    try:
        # 1. Load the key
        private_key = serialization.load_pem_private_key(
            private_key_str.encode("utf-8"), password=None
        )

        # 2. VITAL Fix: Check if it is actually an RSA key
        if not isinstance(private_key, rsa.RSAPrivateKey):
            return "Error: The provided key is not a valid RSA Private Key."

        # 3. Decrypt
        ciphertext = base64.b64decode(ciphertext_b64)

        plaintext = private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
        return plaintext.decode("utf-8")

    except ValueError:
        return "Error: Key mismatch or corrupted data."
    except Exception as e:
        return f"Error: {str(e)}"


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
