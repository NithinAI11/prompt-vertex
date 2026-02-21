import os
from dotenv import load_dotenv
from settings_manager import get_settings

load_dotenv()

# --- Gemini API Key Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Model Configurations (UPDATED, HIGH-RPD, CALLABLE) ---
GEMINI_MODELS = {
    "query_optimizer": "gemini-2.5-flash-lite",
    "researcher": "gemini-2.5-flash",
    "deconstruction": "gemini-2.5-flash",
    "purification": "gemini-2.5-flash-lite",
    "persona": "gemini-2.5-flash",
    "strategist": "gemini-2.5-flash",
    "optimizer": "gemini-2.5-flash-lite",
    "guardian": "gemini-2.5-flash"
}

# 🔒 Perplexity role → real supported models mapping
PERPLEXITY_MODELS = {
    "triage": "sonar",
    "logic_critic": "sonar-reasoning-pro",
    "code_critic": "sonar-reasoning-pro",
    "creative_critic": "sonar-pro",
    "final_editor": "sonar-reasoning-pro",
}

OPENAI_MODELS = {
    "logic_critic": "gpt-4o",  # FIXED from gpt-4.1
    "creative_critic": "gpt-4o",
    "code_critic": "o3-mini"
}

ANTHROPIC_MODELS = {
    "logic_critic": "claude-3-5-sonnet-latest", # FIXED to proper API string
    "creative_critic": "claude-3-5-sonnet-latest",
    "code_critic": "claude-3-5-sonnet-latest"
}

GROK_MODELS = {
    "logic_critic": "grok-2", # Adjusted based on active xAI endpoints
    "creative_critic": "grok-2",
    "code_critic": "grok-2"
}

ENABLE_PERPLEXITY_COUNCIL = True
ENABLE_CROSS_PROVIDER_COUNCIL = True

QDRANT_HOST = "localhost"
QDRANT_PORT = 6343

MONGO_HOST = "localhost"
MONGO_PORT = 27027
MONGO_DB_NAME = "prompt_forge_db"

# --- Research Configuration ---
SEARXNG_URL = "http://localhost:8080"
TAVILY_ENDPOINT = "https://api.tavily.com/search"