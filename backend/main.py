from dotenv import load_dotenv
load_dotenv()  # <-- load env vars first

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.agent import router as agent_router
from routes.chat import router as chat_router
from routes.feedback import router as feedback_router
from routes.kb import router as kb_router
from routes.responses import router as responses_router
from routes.chains import router as chains_router

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

app = FastAPI(title="AI Agent Engine - Lightweight")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # Allow frontend URLs + any origin for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router, prefix="/agents")
app.include_router(chat_router, prefix="/chat")
app.include_router(feedback_router, prefix="/feedback")
app.include_router(kb_router, prefix="/kb")
app.include_router(responses_router, prefix="/responses")
app.include_router(chains_router, prefix="/chains")
