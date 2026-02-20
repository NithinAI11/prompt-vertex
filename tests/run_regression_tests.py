import sys
import json
from pathlib import Path

# Add the project root to the Python path to allow importing from 'core' and 'agents'
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from core.graph import create_graph
from core.llm_services import invoke_gemini_string
import config

GOLDEN_SET_PATH = project_root / "tests" / "golden_set.json"

EVALUATOR_PROMPT = """
You are a Prompt Quality Evaluator. Your task is to compare an AI-generated prompt against a 'golden standard' prompt and score their similarity and quality.

<golden_standard>
{golden_output}
</golden_standard>

<generated_prompt>
{generated_output}
</generated_prompt>

Analyze both prompts. Does the generated prompt successfully capture the core instruction, context, constraints, and intent of the golden standard? Minor differences in wording are acceptable if the meaning is preserved.

Respond with a single integer score from 1 to 5, where:
1: Completely different. The generated prompt fails to capture the purpose of the golden standard.
2: Mostly different. The generated prompt misses key instructions or changes the intent significantly.
3: Somewhat similar. The generated prompt captures the general idea but misses important details or structure.
4. Mostly similar. The generated prompt is a very close match, with only minor stylistic differences.
5: Identical or functionally identical. The generated prompt perfectly captures the intent and structure of the golden standard.

Your response must be a single integer only.
"""

def run_tests():
    print("--- Starting PromptForge Golden Set Regression Test ---")
    
    try:
        with open(GOLDEN_SET_PATH, "r", encoding="utf-8") as f:
            golden_set = json.load(f)
    except FileNotFoundError:
        print(f"!!! CRITICAL ERROR: Golden set not found at {GOLDEN_SET_PATH}")
        return

    app = create_graph()
    passed_tests = 0
    total_tests = len(golden_set)

    for i, test_case in enumerate(golden_set):
        print(f"\n--- Running Test {i+1}/{total_tests}: {test_case['id']} ---")
        
        input_prompt = test_case["input_prompt"]
        golden_output = test_case["golden_output"]
        
        try:
            inputs = {"user_prompt": input_prompt}
            final_state = app.invoke(inputs)
            generated_output = final_state.get("final_prompt")

            if not generated_output:
                print("!!! TEST FAILED: The graph did not produce a final prompt.")
                continue

            eval_prompt = EVALUATOR_PROMPT.format(
                golden_output=golden_output,
                generated_output=generated_output
            )
            
            score_str = invoke_gemini_string(
                model_name=config.MODELS["deconstruction"],
                prompt=eval_prompt,
                temperature=0.0
            )
            
            score = int(score_str.strip())
            
            print(f"Evaluator Score: {score}/5")
            if score >= 4:
                print("--- RESULT: PASSED ---")
                passed_tests += 1
            else:
                print("--- RESULT: FAILED ---")
                print("--- Golden Output ---")
                print(golden_output)
                print("\n--- Generated Output ---")
                print(generated_output)
                print("---------------------")

        except Exception as e:
            print(f"!!! TEST FAILED: An exception occurred during the test run: {e}")

    print("\n" + "="*50)
    print("--- Regression Test Summary ---")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print("="*50)

if __name__ == "__main__":
    run_tests()