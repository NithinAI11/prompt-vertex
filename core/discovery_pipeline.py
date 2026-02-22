import time
import json
import uuid
import random
import requests
from bs4 import BeautifulSoup
from typing import List
from pydantic import BaseModel, Field
from core.llm_services import invoke_gemini_json, embedding_model
from core.vector_store import qdrant_client, DISCOVERY_COLLECTION_NAME
from core.cache import redis_client
from core.database import db
from settings_manager import get_settings
from qdrant_client import models
from duckduckgo_search import DDGS
import config

TAVILY_ENDPOINT = "https://api.tavily.com/search"

SEARCH_QUERIES = [
    "best ChatGPT prompts for marketing",
    "useful prompts for developers",
    "creative writing prompts for AI",
]
URL_PROCESS_LIMIT = 10
REQUEST_TIMEOUT = 15
RATE_LIMIT_DELAY = 3
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    )
}

RAW_CONTENT_COLLECTION = "raw_scraped_content"
DYNAMIC_TEMPLATES_CACHE_KEY = "dynamic_templates_cache"

class RefinedPrompt(BaseModel):
    title: str = Field(description="A short, catchy title for the prompt.")
    description: str = Field(description="A one-sentence explanation of what the prompt does.")
    category: str = Field(description="Choose from: [Content Creation, Marketing, Education, Business, Technical, Creative].")
    prompt: str = Field(description="The final, clean, ready-to-use prompt text.")

class BatchRefinerOutput(BaseModel):
    extracted_prompts: List[RefinedPrompt]

BATCH_REFINER_PROMPT = """
You are a master AI prompt engineer. Your task is to analyze a large batch of unstructured text scraped from various websites.
Your goal is to identify and extract ONLY high-quality, reusable prompts from this text.

Review the entire block of text provided below. For each usable prompt you find, structure it into a JSON object with the keys: "title", "description", "category", and "prompt".

- "title": A short, catchy title.
- "description": A one-sentence explanation.
- "category": Choose from: [Content Creation, Marketing, Education, Business, Technical, Creative].
- "prompt": The final, clean, ready-to-use prompt text.

Ignore any text that is not a clear, actionable prompt.
If no usable prompts are found, return an empty list.

Output format:
{{
  "extracted_prompts": [ ... ]
}}

BATCH OF SCRAPED TEXT:
"{batch_text}"
"""

def fetch_from_searxng(query: str) -> List[str]:
    try:
        print(f"SearXNG: Searching '{query}'...")
        url = f"{config.SEARXNG_URL}/search"
        params = {"q": query, "format": "json", "categories": "general,it"}
        response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        results = [r["url"] for r in data.get("results", []) if "url" in r]
        print(f"SearXNG: Found {len(results)} results.")
        return results
    except Exception as e:
        print(f"❌ SearXNG search failed for '{query}': {e}")
        return []

def fetch_from_tavily(query: str) -> List[str]:
    settings = get_settings()
    tavily_api_key = settings.get("tavilyApiKey")
    if not tavily_api_key:
        print("⚠️ Tavily API key missing from settings — skipping Tavily search.")
        return []
    try:
        print(f"Tavily: Searching '{query}'...")
        payload = {"api_key": tavily_api_key, "query": query, "num_results": 10}
        response = requests.post(TAVILY_ENDPOINT, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        results = [r["url"] for r in data.get("results", []) if "url" in r]
        print(f"Tavily: Found {len(results)} results.")
        return results
    except Exception as e:
        print(f"❌ Tavily search failed for '{query}': {e}")
        return []

def fetch_from_ddg(query: str) -> List[str]:
    try:
        print(f"DDG: Searching '{query}'...")
        with DDGS() as ddg:
            results = list(ddg.text(query, max_results=10))
        urls = [r["href"] for r in results if "href" in r]
        print(f"DDG: Found {len(urls)} results.")
        return urls
    except Exception as e:
        print(f"❌ DDG search failed for '{query}': {e}")
        return []

def scout_for_sources() -> List[str]:
    print("\n--- Scout: Starting discovery via SearXNG -> Tavily -> DDG ---")
    urls = set()
    for query in SEARCH_QUERIES:
        # 1. Try SearXNG First
        results = fetch_from_searxng(query)
        
        # 2. Fallback to Tavily if SearXNG fails/returns empty
        if not results:
            results = fetch_from_tavily(query)
            
        # 3. Fallback to DDG if both SearXNG and Tavily fail
        if not results:
            results = fetch_from_ddg(query)
            
        urls.update(results)
        print(f"Scout: Accumulated {len(urls)} unique URLs so far.")
        time.sleep(RATE_LIMIT_DELAY + random.uniform(0.5, 1.5))
        
    print(f"--- Scout Complete: Found {len(urls)} unique URLs ---\n")
    return list(urls)

def extractor_and_store_raw(url: str):
    if redis_client and redis_client.exists(url):
        print(f"Cache HIT: '{url}' already processed recently. Skipping.")
        return
    try:
        print(f"Extractor: Fetching {url}")
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")
        text = ' '.join(p.get_text(separator=' ', strip=True) for p in soup.find_all(['p', 'pre', 'code', 'h2', 'h3', 'li']))
        if len(text) < 150:
            print("Extractor: Insufficient content. Skipping.")
            return
        db[RAW_CONTENT_COLLECTION].insert_one({"url": url, "raw_text": text[:15000]})
        print(f"Extractor: ✅ Stored raw text from {url}")
        if redis_client:
            redis_client.setex(url, 86400, "processed")
    except requests.RequestException as e:
        print(f"Extractor WARNING: Request failed ({getattr(e.response, 'status_code', 'N/A')}) for {url}")
    except Exception as e:
        print(f"Extractor ERROR: {e}")

def batch_refine_and_process():
    print("\n--- Batch Refiner: Processing raw scraped content ---")
    raw_docs = list(db[RAW_CONTENT_COLLECTION].find({}))
    if not raw_docs:
        print("Batch Refiner: No raw documents found.")
        return
    batch_text = "\n\n--- SOURCE ---\n\n".join([d["raw_text"] for d in raw_docs])
    formatted_prompt = BATCH_REFINER_PROMPT.format(batch_text=batch_text)
    try:
        result = invoke_gemini_json(
            model_name=config.GEMINI_MODELS["guardian"],
            prompt=formatted_prompt,
            pydantic_model=BatchRefinerOutput
        )
        if not result.extracted_prompts:
            print("Batch Refiner: No valid prompts found.")
            return
        print(f"Batch Refiner: ✅ Extracted {len(result.extracted_prompts)} prompts.")
        for item in result.extracted_prompts:
            librarian_process_and_store(item.dict())
    except Exception as e:
        print(f"❌ Batch Refiner Error: {e}")
    finally:
        db[RAW_CONTENT_COLLECTION].delete_many({})
        print("Batch Refiner: Cleaned up raw collection.")

def librarian_process_and_store(prompt_data: dict):
    text = prompt_data.get("prompt")
    if not text:
        return
    print(f"Librarian: Processing '{prompt_data['title']}'...")
    try:
        vector = embedding_model.embed_query(text)
        
        # --- FIXED: Use query_points instead of deprecated search ---
        similar_response = qdrant_client.query_points(
            collection_name=DISCOVERY_COLLECTION_NAME,
            query=vector,
            limit=1,
            score_threshold=0.90
        )
        similar = similar_response.points
        
        if similar:
            print(f"Librarian: Duplicate found (score {similar[0].score:.2f}). Skipping.")
            return
            
        point_id = str(uuid.uuid4())
        payload = {
            "title": prompt_data["title"],
            "description": prompt_data["description"],
            "category": prompt_data["category"],
            "template": text,
            "uses": 0,
            "id": point_id
        }
        qdrant_client.upsert(
            collection_name=DISCOVERY_COLLECTION_NAME,
            points=[models.PointStruct(id=point_id, vector=vector, payload=payload)],
            wait=True
        )
        print(f"Librarian: ✅ Stored new prompt [{point_id}]")
        if redis_client:
            redis_client.delete(DYNAMIC_TEMPLATES_CACHE_KEY)
            print("Cache: Dynamic templates invalidated.")
    except Exception as e:
        print(f"❌ Librarian ERROR: {e}")

def run_discovery_pipeline():
    print("\n" + "="*55)
    print("--- Prompt Discovery Pipeline (SearXNG + Tavily + DDG) ---")
    print("="*55)
    db[RAW_CONTENT_COLLECTION].delete_many({})
    all_urls = scout_for_sources()
    if not all_urls:
        print("No URLs found. Aborting pipeline.")
        return
    if redis_client:
        new_urls = [u for u in all_urls if not redis_client.exists(u)]
        print(f"Found {len(all_urls)} total URLs, {len(new_urls)} are new.")
    else:
        new_urls = all_urls
        print("Redis unavailable — processing all URLs.")
    to_process = new_urls[:URL_PROCESS_LIMIT]
    if not to_process:
        print("No new URLs to process. Ending.")
        return
    print(f"--- Stage 1: Extracting content from {len(to_process)} URLs ---")
    for i, url in enumerate(to_process, start=1):
        print(f"\n[{i}/{len(to_process)}] Processing {url}")
        extractor_and_store_raw(url)
    print("--- Stage 1 Complete ---")
    batch_refine_and_process()
    print("--- Stage 2 Complete ---")
    print("\n" + "="*55)
    print("--- Prompt Discovery Pipeline Completed ---")
    print("="*55 + "\n")