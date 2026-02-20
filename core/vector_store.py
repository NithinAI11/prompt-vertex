# FILE: core/vector_store.py
# /PromptForge/core/vector_store.py

from qdrant_client import QdrantClient, models
import config

# The collection for our dynamically discovered templates
DISCOVERY_COLLECTION_NAME = "discovered_prompts"

def get_qdrant_client():
    """Initializes and returns the Qdrant client."""
    client = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
    return client

def setup_collections(client: QdrantClient):
    """Ensures the necessary collections exist in Qdrant."""
    try:
        # Check if the collection for discovered prompts exists
        client.get_collection(collection_name=DISCOVERY_COLLECTION_NAME)
        print(f"Collection '{DISCOVERY_COLLECTION_NAME}' already exists.")
    except Exception:
        # If it doesn't exist, create it.
        print(f"Collection '{DISCOVERY_COLLECTION_NAME}' not found. Creating now...")
        client.create_collection(
            collection_name=DISCOVERY_COLLECTION_NAME,
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE), # Ensure size matches your embedding model
        )
        print("Collection created successfully.")

# Initialize client and set up collections on startup
qdrant_client = get_qdrant_client()
setup_collections(qdrant_client)