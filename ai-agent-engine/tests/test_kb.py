import pytest
from ai_core.kb import kb

def test_add_and_retrieve(tmp_path):
    # create a temp source
    src = 'tmp_test_src'
    docs = ['alpha bravo charlie', 'delta echo foxtrot']
    kb.add_documents(src, docs)
    res = kb.retrieve([src], 'alpha')
    assert len(res) > 0
    assert 'alpha' in res[0]['text']
