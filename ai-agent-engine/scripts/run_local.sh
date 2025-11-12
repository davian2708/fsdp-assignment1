#!/usr/bin/env bash
uvicorn ai_core.api:app --reload --host 0.0.0.0 --port 8000
