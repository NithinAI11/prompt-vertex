import json
from core.llm_services import invoke_gemini_json
from core.schemas import StrategyList
import config

def generate_strategies(state: dict):
    """
    Takes a decomposed prompt and inspirational examples to brainstorm
    multiple diverse improvement strategies.
    """
    print("---AGENT: CREATIVE DIRECTOR (Generating Strategies)---")
    decomposed_prompt = state["decomposed_prompt"]
    retrieved_examples = state["retrieved_examples"]
    
    with open("prompts/creative_director_prompt.json", "r") as f:
        prompt_data = json.load(f)
        
    prompt = prompt_data["prompt"].format(
        decomposed_prompt=decomposed_prompt,
        retrieved_examples=retrieved_examples
    )
    
    result = invoke_gemini_json(
        model_name=config.GEMINI_MODELS["optimizer"],
        prompt=prompt,
        pydantic_model=StrategyList
    )
    
    return {"strategies": [s.dict() for s in result.strategies]}