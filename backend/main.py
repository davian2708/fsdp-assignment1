from dotenv import load_dotenv
load_dotenv()  # <-- load env vars first

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.agent import router as agent_router
from backend.routes.chat import router as chat_router

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

app = FastAPI(title="AI Agent Engine - Lightweight")

origins = [
    "http://localhost:3000",  # React dev server
]

app.include_router(agent_router, prefix="/agent")
app.include_router(chat_router, prefix="/agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],   # <-- VERY important
    allow_headers=["*"],
)
