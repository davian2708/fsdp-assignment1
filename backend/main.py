from dotenv import load_dotenv
load_dotenv()  # <-- load env vars first

import os
from fastapi import FastAPI
from backend.routes.agent import router as agent_router
from backend.routes.chat import router as chat_router

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

app = FastAPI(title="AI Agent Engine - Lightweight")

app.include_router(agent_router, prefix="/agents")
app.include_router(chat_router, prefix="/chat")
