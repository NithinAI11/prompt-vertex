import json
import re
import concurrent.futures
import random
from typing import List, Dict, Callable
from core.llm_services import (
    invoke_perplexity_model,
    invoke_openai_model,
    invoke_anthropic_model,
    invoke_grok_model,
)
from settings_manager import get_settings
import config

TRIAGE_PROMPT = """
Analyze the user's prompt and classify its primary intent into one of three categories: "Creative/General", "Technical/Code", or "Search/Fact-Based". Respond with only the category name and nothing else.
Prompt: "{prompt}"
"""
LOGIC_CRITIC_PROMPT = """
You are a Logic & Reasoning Critic. Evaluate the following prompt for clarity, logical structure, and potential for ambiguity. Does it set a clear, achievable goal?
Your response MUST be ONLY a single, valid JSON object with two keys: "score" (an integer 1-10) and "critique" (a brief, 1-2 sentence evaluation). Do not include any other text.
Prompt: "{prompt}"
"""
CREATIVE_CRITIC_PROMPT = """
You are a Creative & Nuance Critic. Evaluate the following prompt for its tone, creativity, and how well it captures nuanced intent. Does it inspire a high-quality response?
Your response MUST be ONLY a single, valid JSON object with two keys: "score" (an integer 1-10) and "critique" (a brief, 1-2 sentence evaluation). Do not include any other text.
Prompt: "{prompt}"
"""
CODE_CRITIC_PROMPT = """
You are a Code-Review Critic. Evaluate this prompt's effectiveness for generating code. Does it specify the language, include examples, and address potential edge cases?
Your response MUST be ONLY a single, valid JSON object with two keys: "score" (an integer 1-10) and "critique" (a brief, 1-2 sentence evaluation). Do not include any other text.
Prompt: "{prompt}"
"""

def parse_llm_response(response: Dict, provider: str) -> str:
    try:
        if provider == 'perplexity':
            return response['choices'][0]['message']['content']
        elif provider == 'openai':
            return response['choices'][0]['message']['content']
        elif provider == 'anthropic':
            return response['content'][0]['text']
        elif provider == 'grok':
            return response['choices'][0]['message']['content']
        return ""
    except (KeyError, IndexError) as e:
        print(f"Error parsing response from {provider}: {e} | Response: {response}")
        return ""

def get_critic_feedback(
    critic_name: str,
    critic_prompt_template: str,
    model_name: str,
    prompt: str,
    invoke_function: Callable,
    provider_name: str,
) -> Dict:
    try:
        response = invoke_function(
            model_name=model_name,
            messages=[{"role": "user", "content": critic_prompt_template.format(prompt=prompt)}]
        )
        feedback_str = parse_llm_response(response, provider_name)
        
        json_match = re.search(r'\{.*\}', feedback_str, re.DOTALL)
        if not json_match:
            raise ValueError(f"No valid JSON object found in the {critic_name}'s response.")
        
        clean_json_str = json_match.group(0)
        feedback = json.loads(clean_json_str)
        feedback['critic'] = f"{critic_name} ({provider_name.capitalize()})"
        return feedback
    except Exception as e:
        print(f"!!! ERROR getting feedback from {critic_name} ({provider_name}): {e}")
        return {"critic": critic_name, "score": 0, "critique": f"Error during evaluation: {e}"}

def run_perplexity_council_review(state: dict):
    print("---AGENT: CONVENING PERPLEXITY COUNCIL OF CRITICS---")
    guardian_prompt = state["guardian_prompt"]
    
    triage_response = invoke_perplexity_model(
        model_name=config.PERPLEXITY_MODELS['triage'],
        messages=[{"role": "user", "content": TRIAGE_PROMPT.format(prompt=guardian_prompt)}], max_tokens=50
    )
    intent_text = parse_llm_response(triage_response, 'perplexity').lower()
    intent = "Creative/General"
    if "technical" in intent_text or "code" in intent_text: intent = "Technical/Code"
    elif "search" in intent_text or "fact-based" in intent_text: intent = "Search/Fact-Based"

    critics_to_run = {
        "Logic": (LOGIC_CRITIC_PROMPT, config.PERPLEXITY_MODELS['logic_critic']),
        "Creative": (CREATIVE_CRITIC_PROMPT, config.PERPLEXITY_MODELS['creative_critic'])
    }
    if "Technical/Code" in intent:
        critics_to_run["Code"] = (CODE_CRITIC_PROMPT, config.PERPLEXITY_MODELS['code_critic'])

    all_critiques = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(get_critic_feedback, name, p_template, model, guardian_prompt, invoke_perplexity_model, 'perplexity')
            for name, (p_template, model) in critics_to_run.items()
        ]
        for future in concurrent.futures.as_completed(futures):
            all_critiques.append(future.result())
    return {"critiques": all_critiques}

def run_cross_provider_council_review(state: dict):
    print("---AGENT: CONVENING CROSS-PROVIDER COUNCIL OF CRITICS---")
    guardian_prompt = state["guardian_prompt"]
    settings = get_settings()

    available_providers = {
        'openai': (invoke_openai_model, config.OPENAI_MODELS) if settings.get("openaiApiKey") else None,
        'anthropic': (invoke_anthropic_model, config.ANTHROPIC_MODELS) if settings.get("anthropicApiKey") else None,
        'grok': (invoke_grok_model, config.GROK_MODELS) if settings.get("grokApiKey") else None,
        'perplexity': (invoke_perplexity_model, config.PERPLEXITY_MODELS) if settings.get("perplexityApiKey") else None,
    }
    active_providers = {k: v for k, v in available_providers.items() if v}
    if len(active_providers) < 2:
        print("---Not enough providers for cross-review, falling back to Perplexity council---")
        return run_perplexity_council_review(state)
    
    provider_names = list(active_providers.keys())
    random.shuffle(provider_names)

    logic_provider_name = provider_names[0]
    creative_provider_name = provider_names[1]
    
    critics_to_run = [
        ("Logic", LOGIC_CRITIC_PROMPT, active_providers[logic_provider_name][1]['logic_critic'], active_providers[logic_provider_name][0], logic_provider_name),
        ("Creative", CREATIVE_CRITIC_PROMPT, active_providers[creative_provider_name][1]['creative_critic'], active_providers[creative_provider_name][0], creative_provider_name),
    ]

    all_critiques = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(get_critic_feedback, *params) for params in critics_to_run]
        for future in concurrent.futures.as_completed(futures):
            all_critiques.append(future.result())
            
    return {"critiques": all_critiques}