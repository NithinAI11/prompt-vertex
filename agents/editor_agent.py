from core.llm_services import invoke_perplexity_model
import config

FINAL_EDITOR_PROMPT = """
You are a Master Prompt Editor. Your task is to refine a candidate prompt based on feedback from a council of AI critics. Synthesize the feedback to produce one final, polished version of the prompt. If the critiques are minor and the prompt is already strong, you may return the original. Your output must ONLY be the final prompt text. Do not include any other commentary or explanation.

CANDIDATE PROMPT:
---
{guardian_prompt}
---

CRITICS' FEEDBACK:
---
{critiques}
---

FINAL POLISHED PROMPT:
"""

def polish_prompt(state: dict):
    print("---AGENT: MASTER EDITOR (Final Polish)---")
    guardian_prompt = state["guardian_prompt"]
    critiques = state["critiques"]
    
    if not critiques:
        print("---No critiques received, using Guardian prompt as final.---")
        return {"final_prompt": guardian_prompt}
        
    formatted_prompt = FINAL_EDITOR_PROMPT.format(
        guardian_prompt=guardian_prompt,
        critiques=critiques
    )
    
    response = invoke_perplexity_model(
        model_name=config.PERPLEXITY_MODELS['final_editor'],
        messages=[{"role": "user", "content": formatted_prompt}],
        temperature=0.1,
        max_tokens=2048
    )
    
    raw_output = response['choices'][0]['message']['content'].strip()
    
    if '</think>' in raw_output:
        final_prompt = raw_output.split('</think>')[-1].strip()
    else:
        final_prompt = raw_output
    
    print("---PROMPT POLISH COMPLETE---")
    return {"final_prompt": final_prompt}