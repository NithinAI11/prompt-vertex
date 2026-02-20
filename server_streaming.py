import json
import asyncio
import threading
import time
import schedule
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from typing import Dict
import config
from core.graph import create_graph
from core.vector_store import qdrant_client, DISCOVERY_COLLECTION_NAME
from core.discovery_pipeline import run_discovery_pipeline
from core.cache import redis_client
from core.llm_services import invoke_gemini_json
from core.schemas import DetailedEvaluationRequest, DetailedEvaluationResponse
from settings_manager import get_settings, save_settings # CORRECT IMPORT

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
langgraph_app = create_graph()
DYNAMIC_TEMPLATES_CACHE_KEY = "dynamic_templates_cache"

def run_scheduler():
    print("[Scheduler] Scheduler thread started.")
    while True:
        schedule.run_pending()
        time.sleep(60)

@app.on_event("startup")
async def startup_event():
    print("="*50)
    print("Application starting up...")
    schedule.every(24).hours.do(run_discovery_pipeline)
    print("[Scheduler] Daily discovery pipeline scheduled.")
    if not (redis_client and redis_client.exists(DYNAMIC_TEMPLATES_CACHE_KEY)):
        print("[Scheduler] Kicking off initial pipeline run.")
        threading.Thread(target=run_discovery_pipeline, daemon=True).start()
    threading.Thread(target=run_scheduler, daemon=True).start()
    print("Application startup complete.")
    print("="*50)

@app.post("/detailed-evaluation", response_model=DetailedEvaluationResponse)
async def detailed_evaluation(request: DetailedEvaluationRequest):
    try:
        with open("prompts/detailed_guardian_prompt.json", "r") as f:
            prompt_data = json.load(f)
        eval_prompt = prompt_data["prompt"].format(
            original_prompt=request.original_prompt,
            forged_prompt=request.forged_prompt
        )
        result = invoke_gemini_json(
            model_name=config.GEMINI_MODELS["guardian"],
            prompt=eval_prompt,
            pydantic_model=DetailedEvaluationResponse,
            temperature=0.2
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forge-stream")
async def forge_stream(
    prompt: str,
    tone: str = "Auto",
    temperature: float = 0.7,
    top_p: float = 1.0,
    top_k: int = 40,
    use_council: bool = False,
    use_cross_provider_council: bool = False
):
    async def event_generator():
        thread_id = str(uuid.uuid4())
        config_payload = {"configurable": {"thread_id": thread_id}}

        try:
            inputs = {
                "user_prompt": prompt,
                "user_tone": tone,
                "manual_instructions": "None",
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "use_council": use_council,
                "use_cross_provider_council": use_cross_provider_council,
            }
            async for output in langgraph_app.astream(inputs, config=config_payload):
                for key, value in output.items():
                    # --- CHANGE THIS ---
                    # Instead of just yielding a generic message, yield the actual data payload.
                    # The 'value' object contains the full state after the node runs.
                    # We send the entire value so the frontend has all the context it needs.
                    yield json.dumps({"node": key, "data": value})
                    # -------------------
                    await asyncio.sleep(0.1)
                    
        except Exception as e:
            print(f"Error during stream: {e}")
            yield json.dumps({"error": str(e)})

    return EventSourceResponse(event_generator())

@app.get("/templates/dynamic")
async def get_dynamic_templates():
    try:
        if redis_client:
            cached = redis_client.get(DYNAMIC_TEMPLATES_CACHE_KEY)
            if cached:
                return json.loads(cached)
        
        points, _ = qdrant_client.scroll(
            collection_name=DISCOVERY_COLLECTION_NAME, limit=200, with_payload=True
        )
        payloads = sorted([p.payload for p in points], key=lambda p: p.get("uses", 0), reverse=True)
        
        if redis_client:
            redis_client.setex(DYNAMIC_TEMPLATES_CACHE_KEY, 86400, json.dumps(payloads))
        return payloads
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/templates/{template_id}/increment_usage")
async def increment_usage_count(template_id: str):
    try:
        point = qdrant_client.retrieve(collection_name=DISCOVERY_COLLECTION_NAME, ids=[template_id], with_payload=True)
        if not point:
            raise HTTPException(status_code=404, detail="Template not found")
        
        current_uses = point[0].payload.get("uses", 0)
        qdrant_client.set_payload(
            collection_name=DISCOVERY_COLLECTION_NAME,
            payload={"uses": current_uses + 1},
            points=[template_id],
            wait=True
        )
        return {"message": "Usage count updated", "new_uses": current_uses + 1}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/settings")
async def get_current_settings():
    return get_settings()

@app.post("/settings")
async def update_settings(new_settings: Dict):
    try:
        updated = save_settings(new_settings)
        return {"message": "Settings updated successfully", "settings": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))