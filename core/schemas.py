from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class DeconstructedPrompt(BaseModel):
    instruction: str = Field(description="The core command or task for the LLM.")
    context: Optional[str] = Field(default=None, description="Background information, constraints, or topic. Can be null if not present.")
    input: Optional[str] = Field(default=None, description="The specific data to be processed. Can be null if not present.")
    output: Optional[str] = Field(default=None, description="The desired format or structure of the response. Can be null if not present.")

class PurifiedPrompt(DeconstructedPrompt):
    pass

class PromptStrategy(BaseModel):
    strategy_name: str = Field(description="A short, descriptive name for the improvement strategy (e.g., 'Add Persona and Analogy', 'Step-by-Step Reasoning').")
    improved_prompt: str = Field(description="The full text of the prompt rewritten according to this strategy.")
    reasoning: str = Field(description="A brief explanation of why this strategy is effective for the given prompt.")

class StrategyList(BaseModel):
    strategies: List[PromptStrategy]

class CriticOutput(BaseModel):
    best_strategy_index: int = Field(description="The index (0, 1, 2, etc.) of the best strategy from the provided list.")
    critique: str = Field(description="A brief justification for why this strategy was chosen as the most effective.")

class FormatterOutput(BaseModel):
    selected_format_name: str = Field(description="The exact name of the chosen format template.")

class DetailedEvaluationRequest(BaseModel):
    original_prompt: str
    forged_prompt: str

class PromptAnalysis(BaseModel):
    score: int
    strengths: str
    weaknesses: Optional[str] = None
    key_improvements: Optional[List[str]] = None

class DetailedEvaluationResponse(BaseModel):
    original_prompt_analysis: PromptAnalysis
    forged_prompt_analysis: PromptAnalysis
    overall_verdict: str