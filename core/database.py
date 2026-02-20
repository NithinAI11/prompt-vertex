# /PromptForge/core/database.py

from pymongo import MongoClient
import config

def get_mongo_client():
    """Initializes and returns the MongoDB client."""
    client = MongoClient(config.MONGO_HOST, config.MONGO_PORT)
    return client

mongo_client = get_mongo_client()
db = mongo_client[config.MONGO_DB_NAME]