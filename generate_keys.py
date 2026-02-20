import secrets
from cryptography.fernet import Fernet

# Generate a 32-byte URL-safe secret for JWT
# This is equivalent to `openssl rand -hex 32`
jwt_secret = secrets.token_hex(32)

# Generate a valid Fernet key for encryption
fernet_key = Fernet.generate_key().decode()

print("✅ Successfully generated new secret keys.")
print("Copy the following lines and add them to your .env file:\n")
print("="*50)
print(f'JWT_SECRET_KEY="{jwt_secret}"')
print(f'FERNET_SECRET_KEY="{fernet_key}"')
print("="*50)