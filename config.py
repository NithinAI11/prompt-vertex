import os
from dotenv import load_dotenv
from settings_manager import get_settings  # CORRECT IMPORT

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

# 🔒 Perplexity role → real supported models mapping (FIXED)
PERPLEXITY_MODELS = {
    "triage": "sonar",
    "logic_critic": "sonar-reasoning-pro",
    "code_critic": "sonar-reasoning-pro",
    "creative_critic": "sonar-pro",
    "final_editor": "sonar-reasoning-pro",
}

OPENAI_MODELS = {
    "logic_critic": "gpt-4.1",
    "creative_critic": "gpt-4o",
    "code_critic": "o3-mini"
}

ANTHROPIC_MODELS = {
    "logic_critic": "claude-sonnet-4.5",
    "creative_critic": "claude-3.5-sonnet",
    "code_critic": "claude-sonnet-4.5"
}

GROK_MODELS = {
    "logic_critic": "grok-4-fast-reasoning",
    "creative_critic": "grok-4",
    "code_critic": "grok-4-fast-reasoning"
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
