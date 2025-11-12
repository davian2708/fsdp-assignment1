from .agent_manager import AgentConfig
from .model_interface import ModelInterface
from .kb import kb

PROMPT_TEMPLATE = """
You are an assistant with the following role: {role}
Persona: {persona}
Follow these rules:
- Base answers only on provided knowledge snippets.
- If insufficient information, state that and list what's missing.
- Keep answers formal and concise.

Knowledge snippets (most relevant first):
{snippets}

User question: {query}

Answer:
"""

class RAGPipeline:
    def __init__(self, model: ModelInterface):
        self.model = model

    def answer(self, agent_conf: AgentConfig, query: str):
        allowed = agent_conf.allowed_sources or []
        retrieved = kb.retrieve(allowed, query, top_k=agent_conf.max_retrieval)
        snippets = "\n\n".join([f"Source: {r['source']}\n{r['text']}" for r in retrieved])
        prompt = PROMPT_TEMPLATE.format(role=agent_conf.role, persona=agent_conf.persona or '', snippets=snippets, query=query)
        resp = self.model.generate(prompt)
        return {"answer": resp, "retrieved": retrieved}
