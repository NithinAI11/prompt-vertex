from core.vector_store import qdrant_client, DISCOVERY_COLLECTION_NAME
from core.llm_services import embedding_model

def retrieve_examples(state: dict):
    print("---AGENT: RETRIEVAL (Searching for similar prompts)---")
    decomposed_prompt = state["decomposed_prompt"]
    
    query_text = f"Instruction: {decomposed_prompt['instruction']} Context: {decomposed_prompt['context']}"
    
    try:
        query_vector = embedding_model.embed_query(query_text)
        
        # --- FIXED: Use query_points instead of deprecated search ---
        response = qdrant_client.query_points(
            collection_name=DISCOVERY_COLLECTION_NAME,
            query=query_vector,
            limit=3,
            score_threshold=0.75
        )
        
        # Extract the payload from the points
        retrieved_examples = [hit.payload for hit in response.points]
        
        if retrieved_examples:
            print(f"---Retrieved {len(retrieved_examples)} relevant examples from the vector store.---")
        else:
            print("---No relevant examples found in the vector store.---")
            
        return {"retrieved_examples": retrieved_examples}
        
    except Exception as e:
        print(f"!!! ERROR during retrieval: {e}")
        return {"retrieved_examples": []}