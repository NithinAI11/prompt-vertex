import uuid
from core.graph import create_graph

if __name__ == "__main__":
    app = create_graph()
    
    # Example usage
    initial_prompt = "Tell me about the Roman Empire."
    
    inputs = {"user_prompt": initial_prompt}
    
    # --- FIX: Generate a unique thread_id for the conversation ---
    config_payload = {"configurable": {"thread_id": str(uuid.uuid4())}}
    
    # --- FIX: Pass the config_payload to stream and invoke methods ---
    print("--- Streaming Output ---")
    for output in app.stream(inputs, config=config_payload):
        for key, value in output.items():
            print(f"Output from node '{key}':")
            print("---")
            print(value)
        print("\n===================================\n")

    # To get the final state
    print("--- Final State Invocation ---")
    final_state = app.invoke(inputs, config=config_payload)
    print("\nFinal Forged Prompt:")
    print(final_state['final_prompt'])