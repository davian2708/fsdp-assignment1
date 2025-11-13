from pathlib import Path
from .config import settings
from pydantic import BaseModel
import uuid
import json
from typing import List

class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    persona: str = "formal, concise, military tone"
    allowed_sources: List[str] = []
    tools: List[str] = []
    max_retrieval: int = 5

class AgentManager:
    def __init__(self, dirpath: Path):
        self.dir = dirpath
        self.dir.mkdir(parents=True, exist_ok=True)

    def create_agent(self, name: str, role: str, persona: str = None, allowed_sources: List[str] = None, tools: List[str] = None) -> AgentConfig:
        agent_id = str(uuid.uuid4())
        conf = AgentConfig(
            id=agent_id,
            name=name,
            role=role,
            persona=persona or "formal, concise, military tone",
            allowed_sources=allowed_sources or [],
            tools=tools or []
        )
        self.save_agent(conf)
        return conf

    def save_agent(self, conf: AgentConfig):
        path = self.dir / f"{conf.id}.json"
        # Pydantic v2 uses model_dump_json
        path.write_text(conf.model_dump_json(indent=2), encoding="utf-8")

    def load_agent(self, agent_id: str) -> AgentConfig:
        path = self.dir / f"{agent_id}.json"
        if not path.exists():
            raise FileNotFoundError("Agent not found")
        raw = path.read_text(encoding="utf-8")
        # Pydantic v2 method
        return AgentConfig.model_validate_json(raw)

    def list_agents(self) -> List[AgentConfig]:
        agents = []
        for p in sorted(self.dir.glob('*.json')):
            raw = p.read_text(encoding="utf-8")
            agents.append(AgentConfig.model_validate_json(raw))
        return agents

agent_manager = AgentManager(settings.agents_dir)
