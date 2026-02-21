import json
import re
import time
from typing import Optional, List, Dict
import os
import logging
import warnings

import requests
from google import genai
from google.genai import types
from pydantic import BaseModel

# Suppress HuggingFace and Sentence-Transformers verbose warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub")
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

from langchain_huggingface import HuggingFaceEmbeddings

import config
from settings_manager import get_settings

# =========================================================
# Common Helpers
# =========================================================

RETRYABLE_STATUS_CODES = {404, 429, 500, 502, 503, 504}

def _is_retryable_error(err: Exception) -> bool:
    msg = str(err).lower()
    return any(code in msg for code in ["404", "429", "500", "502", "503", "504", "not found", "timeout", "unavailable"])


def _safe_json_extract(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No valid JSON object found in model response")
    return json.loads(match.group(0))


def _fallback_chain(primary: str, model_pool: Dict[str, str]) -> List[str]:
    seen = set()
    chain = [primary]
    for m in model_pool.values():
        if m not in seen and m != primary:
            chain.append(m)
        seen.add(m)
    return chain


# =========================================================
# Gemini Client
# =========================================================

client = None
if config.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=config.GEMINI_API_KEY)
        print("✅ Gemini Client Initialized.")
    except Exception as e:
        print(f"⚠️ Gemini Client Init Failed: {e}")
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found. Gemini calls will fail.")


def invoke_gemini_json(
    model_name: str,
    prompt: str,
    pydantic_model: BaseModel,
    temperature: Optional[float] = 0.7,
    top_p: Optional[float] = None,
    top_k: Optional[int] = None,
    max_retries: int = 2
):
    if not client:
        raise RuntimeError("Gemini client not initialized")

    fallback_models = _fallback_chain(model_name, config.GEMINI_MODELS)

    generate_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
        ]
    )

    last_error = None

    for model in fallback_models:
        for attempt in range(max_retries):
            try:
                print(f"🚀 Gemini JSON → {model} (attempt {attempt + 1})")
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=generate_config
                )

                raw_text = response.text or ""
                response_json = _safe_json_extract(raw_text)
                return pydantic_model(**response_json)

            except Exception as e:
                print(f"⚠️ Gemini JSON failed on {model}: {e}")
                last_error = e
                if not _is_retryable_error(e):
                    break
                time.sleep(1.2 * (attempt + 1))

    raise RuntimeError(f"All Gemini JSON fallbacks failed. Last error: {last_error}")


def invoke_gemini_string(
    model_name: str,
    prompt: str,
    temperature: Optional[float] = 0.7,
    top_p: Optional[float] = None,
    top_k: Optional[int] = None,
    max_retries: int = 2
) -> str:
    if not client:
        raise RuntimeError("Gemini client not initialized")

    fallback_models = _fallback_chain(model_name, config.GEMINI_MODELS)

    generate_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
        ]
    )

    last_error = None

    for model in fallback_models:
        for attempt in range(max_retries):
            try:
                print(f"🚀 Gemini TEXT → {model} (attempt {attempt + 1})")
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=generate_config
                )

                text = (response.text or "").strip()
                text = re.sub(r'^```.*?\n|\n```$', '', text, flags=re.DOTALL)
                return text

            except Exception as e:
                print(f"⚠️ Gemini TEXT failed on {model}: {e}")
                last_error = e
                if not _is_retryable_error(e):
                    break
                time.sleep(1.2 * (attempt + 1))

    raise RuntimeError(f"All Gemini TEXT fallbacks failed. Last error: {last_error}")


# =========================================================
# Perplexity (Sonar) with Fallback
# =========================================================

def invoke_perplexity_model(
    model_name: str, # FIXED: Changed from role_or_model to model_name to match agents
    messages: List[dict],
    temperature: float = 0.2,
    max_tokens: int = 1024,
    max_retries: int = 2
) -> dict:

    settings = get_settings()

    # 🔒 Ensure correct key mapping
    api_key = (
        settings.get("perplexityApiKey")
        or os.getenv("PERPLEXITY_API_KEY")
    )

    if not api_key:
        raise RuntimeError("❌ Perplexity API key missing. Set PERPLEXITY_API_KEY in .env or settings.")

    # 🔁 Resolve role → model (this safely handles if passed either role string or direct model string)
    resolved_model = config.PERPLEXITY_MODELS.get(model_name, model_name)

    fallback_models = _fallback_chain(resolved_model, config.PERPLEXITY_MODELS)

    endpoint = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    last_error = None

    for model in fallback_models:
        for attempt in range(max_retries):
            try:
                print(f"🚀 Perplexity → {model} (attempt {attempt + 1})")
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                }

                resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)

                if resp.status_code == 401:
                    raise RuntimeError("401 Unauthorized – Invalid Perplexity API Key or missing permissions.")

                resp.raise_for_status()
                return resp.json()

            except Exception as e:
                print(f"⚠️ Perplexity failed on {model}: {e}")
                last_error = e
                time.sleep(1.2 * (attempt + 1))

    raise RuntimeError(f"❌ All Perplexity fallbacks failed. Last error: {last_error}")



# =========================================================
# OpenAI / Anthropic / Grok (Provider-local fallback too)
# =========================================================

from openai import OpenAI
from anthropic import Anthropic

def invoke_openai_model(model_name: str, messages: List[dict], temperature: float = 0.2, max_tokens: int = 1024):
    settings = get_settings()
    api_key = settings.get("openaiApiKey")
    if not api_key:
        raise RuntimeError("OpenAI API key missing")

    client = OpenAI(api_key=api_key)
    fallback_models = _fallback_chain(model_name, config.OPENAI_MODELS)

    last_error = None
    for model in fallback_models:
        try:
            print(f"🚀 OpenAI → {model}")
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return resp.model_dump()
        except Exception as e:
            print(f"⚠️ OpenAI failed on {model}: {e}")
            last_error = e

    raise RuntimeError(f"All OpenAI fallbacks failed: {last_error}")


def invoke_anthropic_model(model_name: str, messages: List[dict], temperature: float = 0.2, max_tokens: int = 1024):
    settings = get_settings()
    api_key = settings.get("anthropicApiKey")
    if not api_key:
        raise RuntimeError("Anthropic API key missing")

    client = Anthropic(api_key=api_key)
    fallback_models = _fallback_chain(model_name, config.ANTHROPIC_MODELS)

    system_prompt = next((m["content"] for m in messages if m["role"] == "system"), None)
    user_msgs = [m for m in messages if m["role"] != "system"]

    last_error = None
    for model in fallback_models:
        try:
            print(f"🚀 Anthropic → {model}")
            resp = client.messages.create(
                model=model,
                system=system_prompt,
                messages=user_msgs,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return resp.model_dump()
        except Exception as e:
            print(f"⚠️ Anthropic failed on {model}: {e}")
            last_error = e

    raise RuntimeError(f"All Anthropic fallbacks failed: {last_error}")


def invoke_grok_model(model_name: str, messages: List[dict], temperature: float = 0.2, max_tokens: int = 1024):
    settings = get_settings()
    api_key = settings.get("grokApiKey")
    if not api_key:
        raise RuntimeError("Grok API key missing")

    fallback_models = _fallback_chain(model_name, config.GROK_MODELS)

    endpoint = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    last_error = None
    for model in fallback_models:
        try:
            print(f"🚀 Grok → {model}")
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"⚠️ Grok failed on {model}: {e}")
            last_error = e

    raise RuntimeError(f"All Grok fallbacks failed: {last_error}")


# =========================================================
# Embeddings (Warnings suppressed)
# =========================================================

def get_embedding_model():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": False}
    )

embedding_model = get_embedding_model()