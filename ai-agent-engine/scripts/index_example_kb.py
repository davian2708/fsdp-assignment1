from ai_core.kb import kb
from pathlib import Path

src_dir = Path('example_kb/example_source')
texts = []
for p in src_dir.glob('*.txt'):
    texts.append(p.read_text(encoding='utf-8'))
kb.add_documents('example_source', texts)
print('Indexed example_kb/example_source')
