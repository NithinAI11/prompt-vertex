import json
import re
import requests
from typing import List, Dict
from core.llm_services import invoke_gemini_string
from settings_manager import get_settings
import config

# --- Prompts ---
QUERY_OPTIMIZER_PROMPT = """
Analyze the following user request. Your task is to distill its core intent into a concise, keyword-focused search query suitable for a web search engine.
- Remove all conversational filler, greetings, and pleasantries.
- Focus on the key nouns, verbs, and technical terms.
- The output MUST be only the optimized search query text and nothing else.

User Request: "{user_prompt}"
Optimized Search Query:
"""

RESEARCH_SYNTHESIS_PROMPT = """
You are a Research Analyst. I have collected search results regarding a user's request.
Your task is to synthesize these results into a concise "Truth Context" that defines the factual reality, key terminology, and constraints of the topic.

User Request: "{user_prompt}"

Search Results:
{search_results}

Create a summary (max 200 words) that clarifies the topic for a Prompt Engineer.
Focus on:
1. Definitions of technical terms.
2. Common pitfalls or misconceptions.
3. Key entities or tools mentioned.

Context Summary:
"""

def generate_search_query(user_prompt: str) -> str:
    """
    Uses a fast LLM to convert a conversational user prompt into a clean,
    effective search engine query.
    """
    print("---RESEARCH: Optimizing user prompt into a search query.---")
    try:
        # Create the prompt for the optimizer
        prompt = QUERY_OPTIMIZER_PROMPT.format(user_prompt=user_prompt)
        
        # Invoke a fast, cheap model for this simple task
        optimized_query = invoke_gemini_string(
            model_name=config.GEMINI_MODELS["query_optimizer"],
            prompt=prompt,
            temperature=0.0 # We want deterministic, factual output
        )

        # Final cleaning to remove any potential markdown or quotes
        clean_query = re.sub(r'["`]', '', optimized_query).strip()
        
        print(f"---RESEARCH: Optimized Query: '{clean_query}'---")
        return clean_query
        
    except Exception as e:
        print(f"---RESEARCH: Query optimization failed: {e}. Falling back to user prompt.---")
        # As a fallback, use the original prompt but clean it simply
        return re.sub(r'[^\w\s]', '', user_prompt).strip()


def search_searxng(query: str, num_results: int = 3) -> List[Dict]:
    """
    Primary search using local SearXNG instance.
    """
    print(f"---RESEARCH: Attempting SearXNG for '{query}'---")
    try:
        url = f"{config.SEARXNG_URL}/search"
        params = {"q": query, "format": "json", "categories": "general,science,it"}
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        
        results = []
        for res in data.get("results", [])[:num_results]:
            results.append({
                "title": res.get("title", ""),
                "url": res.get("url", ""),
                "content": res.get("content", "") or res.get("snippet", "")
            })
        
        if not results:
            print("---RESEARCH: SearXNG returned no results.---")
            return []
            
        print(f"---RESEARCH: SearXNG found {len(results)} results.---")
        return results

    except Exception as e:
        print(f"---RESEARCH: SearXNG Failed ({str(e)}). Falling back...---")
        return []

def search_tavily(query: str, num_results: int = 3) -> List[Dict]:
    """
    Secondary fallback search using Tavily API.
    """
    print(f"---RESEARCH: Attempting Tavily Fallback for '{query}'---")
    settings = get_settings()
    api_key = settings.get("tavilyApiKey")
    
    if not api_key:
        print("---RESEARCH: Tavily API Key missing. Skipping fallback.---")
        return []

    try:
        payload = {"api_key": api_key, "query": query, "search_depth": "basic", "max_results": num_results}
        resp = requests.post(config.TAVILY_ENDPOINT, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        results = [
            {"title": res.get("title", ""), "url": res.get("url", ""), "content": res.get("content", "")}
            for res in data.get("results", [])
        ]
            
        print(f"---RESEARCH: Tavily found {len(results)} results.---")
        return results
        
    except Exception as e:
        print(f"---RESEARCH: Tavily Failed ({str(e)}).---")
        return []

def conduct_research(state: dict):
    """
    Orchestrates the research process:
    1. Generates an optimized search query from the user prompt.
    2. Tries SearXNG -> Fallback Tavily.
    3. Synthesizes findings into a research summary.
    """
    print("---AGENT: RESEARCHER (Grounding in Truth)---")
    user_prompt = state["user_prompt"]
    
    # 1. Generate an optimized, clean search query
    optimized_query = generate_search_query(user_prompt)
    
    # 2. Execute Search with the optimized query
    raw_results = search_searxng(optimized_query)
    
    if not raw_results:
        raw_results = search_tavily(optimized_query)
    
    if not raw_results:
        print("---RESEARCH: No sources found. Proceeding without external context.---")
        return {"research_summary": "No external research data available.", "research_sources": []}

    # 4. Format and Synthesize
    formatted_results = "\n\n".join(
        [f"Source {idx+1}: {res['title']}\nURL: {res['url']}\nContent: {res['content']}" for idx, res in enumerate(raw_results)]
    )
    
    synthesis_prompt = RESEARCH_SYNTHESIS_PROMPT.format(user_prompt=user_prompt, search_results=formatted_results)
    
    summary = invoke_gemini_string(
        model_name=config.GEMINI_MODELS["researcher"],
        prompt=synthesis_prompt,
        temperature=0.3
    )

    print("---RESEARCH: Context Synthesized.---")
    
    return {
        "research_summary": summary,
        "research_sources": [r['url'] for r in raw_results]
    }