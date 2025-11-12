from ai_core.agent_manager import agent_manager
from ai_core.rag import RAGPipeline
from ai_core.model_interface import ModelInterface


def test_rag_pipeline(monkeypatch):
    # create dummy agent
    agent = agent_manager.create_agent('tester', 'test role', allowed_sources=['example_source'])
    # monkeypatch model to return echo
    class DummyModel:
        def generate(self, prompt, max_tokens=512, temperature=0.0):
            return 'DUMMY RESPONSE'
    rag = RAGPipeline(DummyModel())
    out = rag.answer(agent, 'what is in sample1')
    assert 'answer' in out
