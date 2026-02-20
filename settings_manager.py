import json
from pathlib import Path
from typing import Dict, Any

# Define the path for the secrets file in the project root
SECRETS_FILE_PATH = Path(__file__).resolve().parent / "secrets.json"

DEFAULT_SETTINGS = {
    "username": "Guest",
    "enableParticles": True,
    "geminiApiKey": "",
    "perplexityApiKey": "",
    "openaiApiKey": "",
    "anthropicApiKey": "",
    "grokApiKey": "",
    "tavilyApiKey": ""
}

def get_settings() -> Dict[str, Any]:
    """
    Loads settings from the secrets.json file.
    If the file doesn't exist, it creates one with default values.
    """
    if not SECRETS_FILE_PATH.exists():
        with open(SECRETS_FILE_PATH, "w") as f:
            json.dump(DEFAULT_SETTINGS, f, indent=2)
        return DEFAULT_SETTINGS
    
    with open(SECRETS_FILE_PATH, "r") as f:
        try:
            settings = json.load(f)
            # Ensure all default keys are present
            for key, value in DEFAULT_SETTINGS.items():
                if key not in settings:
                    settings[key] = value
            return settings
        except json.JSONDecodeError:
            return DEFAULT_SETTINGS

def save_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves the provided settings dictionary to the secrets.json file.
    """
    current_settings = get_settings()
    updated_settings = {**current_settings, **new_settings}
    
    with open(SECRETS_FILE_PATH, "w") as f:
        json.dump(updated_settings, f, indent=2)
    return updated_settings