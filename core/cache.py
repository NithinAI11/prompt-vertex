# FILE: core/cache.py
# /PromptForge/core/cache.py

import redis

def get_redis_client():
    """Initializes and returns the Redis client."""
    try:
        client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        # Check if the connection is alive
        client.ping()
        print("Successfully connected to Redis.")
        return client
    except redis.exceptions.ConnectionError as e:
        print(f"!!! CRITICAL ERROR: Could not connect to Redis. Is it running? Error: {e}")
        # Return a mock client that does nothing to prevent crashes
        return None

redis_client = get_redis_client()