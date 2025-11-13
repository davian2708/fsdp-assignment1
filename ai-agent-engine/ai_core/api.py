from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .agent_manager import agent_manager
from .kb import kb
from .model_interface import ModelInterface
from .rag import RAGPipeline
from .config import settings
from pydantic import BaseModel
import os
import jwt
from datetime import datetime, timedelta

app = FastAPI(title='AI Agent Engine')

# -------------------
# FIXED CORS SETTINGS
# -------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"   # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------

# Simple API key / JWT auth dependency
def verify_api_key(x_api_key: str = Header(None)):
    secret = settings.secret_key
    if not x_api_key:
        raise HTTPException(status_code=401, detail='Missing API key')
    try:
        payload = jwt.decode(x_api_key, secret, algorithms=['HS256'])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid API key')

class CreateAgentRequest(BaseModel):
    name: str
    role: str
    persona: str = None
    allowed_sources: List[str] = None
    tools: List[str] = None

class QueryRequest(BaseModel):
    agent_id: str
    query: str

# instantiate model interface (degrade safely if no key)
try:
    model_interface = ModelInterface()
except Exception:
    model_interface = ModelInterface(provider='local')

rag = RAGPipeline(model_interface)

@app.post('/agents')
def create_agent(req: CreateAgentRequest, auth=Depends(verify_api_key)):
    conf = agent_manager.create_agent(req.name, req.role, req.persona, req.allowed_sources, req.tools)
    return conf

@app.get('/agents')
def list_agents(auth=Depends(verify_api_key)):
    return agent_manager.list_agents()

@app.get('/agents/{agent_id}')
def get_agent(agent_id: str, auth=Depends(verify_api_key)):
    try:
        return agent_manager.load_agent(agent_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail='Agent not found')

@app.post('/kb/{source}/upload')
async def upload_docs(source: str, files: List[UploadFile] = File(...), auth=Depends(verify_api_key)):
    contents = []
    for f in files:
        b = await f.read()
        contents.append(b.decode('utf-8'))
    kb.add_documents(source, contents)
    return {'status': 'ok', 'source': source, 'count': len(contents)}

@app.post('/agents/query')
def query_agent(req: QueryRequest, auth=Depends(verify_api_key)):
    try:
        agent = agent_manager.load_agent(req.agent_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail='Agent not found')
    res = rag.answer(agent, req.query)
    return res

# Utility route: generate API key (for testing only)
@app.post('/generate_test_key')
def generate_test_key():
    payload = {'sub': 'tester', 'exp': datetime.utcnow() + timedelta(days=365)}
    token = jwt.encode(payload, settings.secret_key, algorithm='HS256')
    return {'token': token}
