from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    data_dir: Path = Path("./ai_engine_data")
    kb_dir: Path = data_dir / "kb"
    agents_dir: Path = data_dir / "agents"
    embedding_model_name: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384
    ai_provider: str = "openai"
    openai_api_key: str = None
    secret_key: str = "replace-with-secret"

    class Config:
        env_file = ".env"

settings = Settings()
