from .config import settings
from sentence_transformers import SentenceTransformer
import faiss
import json
from pathlib import Path
import uuid
from typing import List, Dict, Any
import numpy as np

class KnowledgeBase:
    def __init__(self):
        self.kb_dir = settings.kb_dir
        self.kb_dir.mkdir(parents=True, exist_ok=True)
        self.model = SentenceTransformer(settings.embedding_model_name)
        self.dim = settings.embedding_dim

    def _source_dir(self, name: str) -> Path:
        d = self.kb_dir / name
        d.mkdir(parents=True, exist_ok=True)
        return d

    def add_documents(self, source: str, docs: List[str]):
        d = self._source_dir(source)
        metas = []
        meta_path = d / "meta.json"
        if meta_path.exists():
            metas = json.loads(meta_path.read_text(encoding='utf-8'))
        for doc in docs:
            doc_id = str(uuid.uuid4())
            (d / f"{doc_id}.txt").write_text(doc, encoding="utf-8")
            metas.append({"id": doc_id, "filename": f"{doc_id}.txt"})
        meta_path.write_text(json.dumps(metas), encoding='utf-8')
        self._build_index_for_source(source)

    def _build_index_for_source(self, source: str):
        d = self._source_dir(source)
        metas_path = d / "meta.json"
        if not metas_path.exists():
            return
        metas = json.loads(metas_path.read_text(encoding='utf-8'))
        texts = []
        ids = []
        for m in metas:
            txt = (d / m['filename']).read_text(encoding='utf-8')
            texts.append(txt)
            ids.append(m['id'])
        if len(texts) == 0:
            return
        embs = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        faiss.normalize_L2(embs)
        index = faiss.IndexFlatIP(self.dim)
        index.add(embs)
        faiss.write_index(index, str(d / 'index.faiss'))
        (d / 'ids.json').write_text(json.dumps(ids), encoding='utf-8')

    def retrieve(self, allowed_sources: List[str], query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        q_emb = self.model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(q_emb)
        results = []
        sources = allowed_sources or [p.name for p in self.kb_dir.iterdir() if p.is_dir()]
        for s in sources:
            d = self.kb_dir / s
            if not (d / 'index.faiss').exists():
                continue
            index = faiss.read_index(str(d / 'index.faiss'))
            ids = json.loads((d / 'ids.json').read_text(encoding='utf-8'))
            D, I = index.search(q_emb, top_k)
            sims = D[0]
            inds = I[0]
            for sim, ind in zip(sims, inds):
                if ind < 0:
                    continue
                doc_id = ids[ind]
                txt = (d / f"{doc_id}.txt").read_text(encoding='utf-8')
                results.append({"source": s, "id": doc_id, "text": txt, "score": float(sim)})
        results = sorted(results, key=lambda x: x['score'], reverse=True)
        return results[:top_k]

kb = KnowledgeBase()
