# FILE: run_pipeline.py
# /PromptForge/run_pipeline.py

import schedule
import time
from core.discovery_pipeline import run_discovery_pipeline

if __name__ == "__main__":
    # Run the pipeline once immediately on startup
    print("Running initial discovery pipeline...")
    run_discovery_pipeline()

    # Schedule the pipeline to run every 24 hours
    schedule.every(24).hours.do(run_discovery_pipeline)
    print("Initial run complete. Pipeline is now scheduled to run automatically every 24 hours.")

    while True:
        schedule.run_pending()
        time.sleep(60) # check every minute for a pending job