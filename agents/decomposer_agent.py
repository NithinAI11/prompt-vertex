import json
from core.llm_services import invoke_gemini_json
from core.schemas import PurifiedPrompt
import config

# Updated Prompt to include Research Context
DECOMPOSER_PROMPT_TEMPLATE = """
You are The Decomposer, an expert in prompt architecture. Your task is to deconstruct a user's raw input into the ICIO (Instruction, Context, Input, Output) framework.

To ensure accuracy, a "Research Context" has been provided containing factual information about the topic. Use this to refine the Context and Instruction.

<research_context>
{research_summary}
</research_context>

<user_prompt>
{user_prompt}
</user_prompt>

Your goal is to populate a JSON structure with four keys: "instruction", "context", "input", and "output".

- **Instruction**: The core command or task.
- **Context**: Background information, constraints, and factual grounding based on the Research Context.
- **Input**: The specific data to be processed.
- **Output**: The desired format of the response.

If any component is missing, explicitly state what is needed. Do not invent information that contradicts the Research Context.

Your output must be a single, valid JSON object.
"""

def decompose_prompt(state: dict):
    """
    Takes the initial user prompt AND research context to break it down.
    """
    print("---AGENT: DECOMPOSER---")
    user_prompt = state["user_prompt"]
    research_summary = state.get("research_summary", "No research context available.")
    
    prompt = DECOMPOSER_PROMPT_TEMPLATE.format(
        user_prompt=user_prompt,
        research_summary=research_summary
    )
    
    result = invoke_gemini_json(
        model_name=config.GEMINI_MODELS["deconstruction"],
        prompt=prompt,
        pydantic_model=PurifiedPrompt
    )
    
    return {"decomposed_prompt": result.dict()}