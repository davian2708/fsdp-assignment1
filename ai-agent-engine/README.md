# AI Agent Engine

A Retrieval-Augmented Generation (RAG) AI Agent Engine built with Python. Provides:
- Agent creation & configuration (role, persona, allowed sources)
- Knowledge base indexing (SentenceTransformers + FAISS)
- RAG pipeline to answer user queries based on indexed docs
- FastAPI endpoints for integration with frontend/backend
- Dockerfile + CI and tests

## Quickstart (local)
1. Create a virtualenv and install deps:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` if using OpenAI.

3. Index example KB:

```bash
python scripts/index_example_kb.py
```

4. Run service:

```bash
uvicorn ai_core.api:app --reload --host 0.0.0.0 --port 8000
```

5. API endpoints:
- `POST /agents` create agent
- `GET /agents` list agents
- `POST /kb/{source}/upload` upload docs
- `POST /agents/query` query agent
