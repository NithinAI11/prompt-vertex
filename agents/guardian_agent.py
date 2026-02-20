import json
from core.llm_services import invoke_gemini_string
import config

def forge_final_prompt(state: dict):
    """
    Assembles the final prompt from the best strategy, dynamic output format,
    and user settings. This prompt is the candidate for the Council of Critics.
    """
    print("---AGENT: GUARDIAN---")
    
    best_strategy_prompt = state["best_strategy"]["improved_prompt"]
    dynamic_output_template = state["dynamic_output_template"]
    user_tone = state.get("user_tone", "Auto (Recommended)")
    manual_instructions = state.get("manual_instructions", "None provided.")
    
    temperature = state.get("temperature", 0.7)
    top_p = state.get("top_p", None)
    top_k = state.get("top_k", None)

    with open("prompts/guardian_prompt.json", "r") as f:
        prompt_data = json.load(f)
        
    prompt = prompt_data["prompt"].format(
        chosen_prompt=best_strategy_prompt,
        output_format_template=dynamic_output_template,
        user_tone=user_tone,
        manual_instructions=manual_instructions
    )
    
    result = invoke_gemini_string(
        model_name=config.GEMINI_MODELS["guardian"],
        prompt=prompt,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k
    )
    
    print("---GUARDIAN PROMPT FORGED (Candidate for Council Review)---")
    return {"guardian_prompt": result}