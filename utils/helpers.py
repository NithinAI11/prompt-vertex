# FILE: utils/helpers.py
# /PromptForge/utils/helpers.py

from langchain_core.runnables import Runnable
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel

def invoke_llm_and_repair(
    model: Runnable,
    prompt_template: Runnable,
    pydantic_model: BaseModel,
    input_data: dict,
    agent_name: str
):
    """
    Invokes an LLM chain that is configured for native JSON output and parses
    the result directly into the specified Pydantic model.

    The complex self-repair and retry logic is no longer needed because the model's
    JSON mode guarantees a syntactically valid JSON response, which simplifies
    the process and makes it more robust.
    """
    print(f"---AGENT: {agent_name.upper()}---")
    try:
        # The model is now configured to output JSON directly.
        # We create a parser that will validate the output against our Pydantic schema.
        parser = JsonOutputParser(pydantic_object=pydantic_model)

        # Construct the final chain
        chain = prompt_template | model | parser
        
        # Invoke the chain and get the structured, validated Pydantic object
        result = chain.invoke(input_data)
        
        return result

    except Exception as e:
        print(f"!!! CRITICAL ERROR in {agent_name}: The LLM call or Pydantic parsing failed.")
        print(f"!!! This could be due to a malformed prompt, an issue with the model's response structure, or an API error.")
        print(f"!!! Full Error: {e}")
        # Re-raise the exception to stop the graph execution cleanly.
        # This provides a clear error message in the main application log.
        raise e