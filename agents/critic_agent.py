import json
from core.llm_services import invoke_gemini_json
from core.schemas import CriticOutput
import config

def evaluate_strategies(state: dict):
    """
    Analyzes a list of generated strategies and selects the single most
    effective one, providing a justification for the choice.
    """
    print("---AGENT: CRITIC (Evaluating Strategies)---")
    strategies = state["strategies"]
    
    with open("prompts/critic_prompt.json", "r") as f:
        prompt_data = json.load(f)

    prompt = prompt_data["prompt"].format(strategies=strategies)

    result = invoke_gemini_json(
        model_name=config.GEMINI_MODELS["strategist"],
        prompt=prompt,
        pydantic_model=CriticOutput
    )

    best_strategy = strategies[result.best_strategy_index]
    print(f"---Critic has chosen strategy: '{best_strategy['strategy_name']}'---")

    return {
        "critique": result.critique,
        "best_strategy": best_strategy
    }