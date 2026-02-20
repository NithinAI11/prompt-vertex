import json
from core.llm_services import invoke_gemini_string
import config

def design_output_format(state: dict):
    """
    Designs a dynamic markdown template for the final output based on the
    winning prompt strategy.
    """
    print("---AGENT: OUTPUT ARCHITECT (Designing Dynamic Format)---")
    
    best_strategy = state["best_strategy"]

    with open("prompts/output_architect_prompt.json", "r") as f:
        prompt_data = json.load(f)
        
    prompt = prompt_data["prompt"].format(
        winning_prompt=best_strategy["improved_prompt"]
    )
    
    dynamic_template = invoke_gemini_string(
        model_name=config.GEMINI_MODELS["strategist"],
        prompt=prompt,
        temperature=0.3
    )
    
    print("---Dynamically Designed Output Template Created---")
    
    return {"dynamic_output_template": dynamic_template}