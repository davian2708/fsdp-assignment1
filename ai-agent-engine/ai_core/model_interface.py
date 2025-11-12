import os
from .config import settings
import openai
from typing import Optional

class ModelInterface:
    def __init__(self, provider: Optional[str] = None, api_key: Optional[str] = None):
        self.provider = provider or settings.ai_provider
        if self.provider == 'openai':
            key = api_key or settings.openai_api_key
            if not key:
                key = os.getenv('OPENAI_API_KEY')
            if not key:
                raise ValueError('OpenAI API key not provided')
            openai.api_key = key

    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.0) -> str:
        if self.provider == 'openai':
            resp = openai.ChatCompletion.create(
                model='gpt-4o-mini',
                messages=[{'role': 'user', 'content': prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return resp['choices'][0]['message']['content']
        else:
            return '[local-model] placeholder response'
