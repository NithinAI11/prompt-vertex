from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, List, Optional, Dict

# Import Agents
from agents.research_agent import conduct_research  # NEW IMPORT
from agents.decomposer_agent import decompose_prompt
from agents.retrieval_agent import retrieve_examples
from agents.creative_director_agent import generate_strategies
from agents.critic_agent import evaluate_strategies
from agents.output_architect_agent import design_output_format
from agents.guardian_agent import forge_final_prompt
from agents.council_agent import run_perplexity_council_review, run_cross_provider_council_review
from agents.editor_agent import polish_prompt
from settings_manager import get_settings
import config

# Updated State Definition
class GraphState(TypedDict):
    user_prompt: str
    research_summary: Optional[str]     # NEW
    research_sources: Optional[List[str]] # NEW
    decomposed_prompt: dict
    retrieved_examples: List[Dict]
    strategies: List[Dict]
    critique: str
    best_strategy: Dict
    dynamic_output_template: str
    user_tone: Optional[str]
    manual_instructions: Optional[str]
    guardian_prompt: str
    use_council: bool
    use_cross_provider_council: bool
    critiques: Optional[List[Dict]]
    final_prompt: str
    temperature: Optional[float]
    top_p: Optional[float]
    top_k: Optional[int]

def should_convene_critics(state: GraphState) -> str:
    print("---ROUTER: Checking if critics should be convened---")
    settings = get_settings()
    
    use_cross_provider = state.get("use_cross_provider_council", False)
    if use_cross_provider and config.ENABLE_CROSS_PROVIDER_COUNCIL:
        active_providers = sum(1 for key in ['openaiApiKey', 'anthropicApiKey', 'grokApiKey', 'perplexityApiKey'] if settings.get(key))
        if active_providers >= 2:
            print("---DECISION: Convene the Cross-Provider council.---")
            return "run_cross_provider_council"
        else:
            print("---WARNING: Cross-Provider council requested but not enough API keys are set. Falling back.---")

    use_perplexity = state.get("use_council", False)
    if use_perplexity and config.ENABLE_PERPLEXITY_COUNCIL and settings.get("perplexityApiKey"):
        print("---DECISION: Convene the Perplexity council.---")
        return "run_perplexity_council"
        
    print("---DECISION: Skip council and finalize.---")
    return "finalize_no_council"

def create_graph():
    workflow = StateGraph(GraphState)

    # Add Nodes
    workflow.add_node("research", conduct_research) # NEW NODE
    workflow.add_node("decompose", decompose_prompt)
    workflow.add_node("retrieve_examples", retrieve_examples)
    workflow.add_node("generate_strategies", generate_strategies)
    workflow.add_node("evaluate_strategies", evaluate_strategies)
    workflow.add_node("design_output_format", design_output_format)
    workflow.add_node("synthesize", forge_final_prompt)
    workflow.add_node("run_perplexity_council", run_perplexity_council_review)
    workflow.add_node("run_cross_provider_council", run_cross_provider_council_review)
    workflow.add_node("final_polish", polish_prompt)
    workflow.add_node("finalize_no_council", lambda state: {"final_prompt": state["guardian_prompt"]})

    # Set Entry Point to Research
    workflow.set_entry_point("research")
    
    # Define Edges
    workflow.add_edge("research", "decompose")
    workflow.add_edge("decompose", "retrieve_examples")
    workflow.add_edge("retrieve_examples", "generate_strategies")
    workflow.add_edge("generate_strategies", "evaluate_strategies")
    workflow.add_edge("evaluate_strategies", "design_output_format")
    workflow.add_edge("design_output_format", "synthesize")
    
    # Conditional Logic
    workflow.add_conditional_edges(
        "synthesize",
        should_convene_critics,
        {
            "run_perplexity_council": "run_perplexity_council",
            "run_cross_provider_council": "run_cross_provider_council",
            "finalize_no_council": "finalize_no_council"
        }
    )
    
    workflow.add_edge("run_perplexity_council", "final_polish")
    workflow.add_edge("run_cross_provider_council", "final_polish")
    workflow.add_edge("final_polish", END)
    workflow.add_edge("finalize_no_council", END)

    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)
    
    return app