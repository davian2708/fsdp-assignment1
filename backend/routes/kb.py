from fastapi import APIRouter, HTTPException, UploadFile, File
from models import KnowledgeBaseUploadRequest, FaqBuilderRequest
import db
import PyPDF2
from io import BytesIO

router = APIRouter()

@router.post("/upload")
async def upload_kb_document(req: KnowledgeBaseUploadRequest):
    """
    Upload a document (text or extracted from PDF) to the knowledge base.
    """
    try:
        doc_id = db.save_kb_document(
            agent_id=req.agent_id,
            content=req.content,
            metadata=req.metadata.dict()
        )
        return {
            "status": "success",
            "document_id": doc_id,
            "message": "Document uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-pdf")
async def upload_pdf(agent_id: str, file: UploadFile = File(...)):
    """
    Upload a PDF file and extract text for knowledge base.
    """
    try:
        # Read PDF file
        pdf_content = await file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Save to KB
        doc_id = db.save_kb_document(
            agent_id=agent_id,
            content=text,
            metadata={
                "source_type": "pdf",
                "file_name": file.filename,
            }
        )
        
        return {
            "status": "success",
            "document_id": doc_id,
            "file_name": file.filename,
            "pages": len(pdf_reader.pages),
            "message": "PDF uploaded and indexed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-text")
async def upload_text(req: KnowledgeBaseUploadRequest):
    """
    Upload raw text to knowledge base.
    """
    try:
        doc_id = db.save_kb_document(
            agent_id=req.agent_id,
            content=req.content,
            metadata=req.metadata.dict()
        )
        return {
            "status": "success",
            "document_id": doc_id,
            "message": "Text uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-url")
async def upload_from_url(req: KnowledgeBaseUploadRequest):
    """
    Ingest content from a URL (e.g., FAQ website, article).
    Requires requests library and HTML parsing.
    """
    try:
        import requests
        from bs4 import BeautifulSoup
        
        url = req.metadata.source_url or ""
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        text = soup.get_text()
        
        doc_id = db.save_kb_document(
            agent_id=req.agent_id,
            content=text,
            metadata=req.metadata.dict()
        )
        return {
            "status": "success",
            "document_id": doc_id,
            "url": url,
            "message": "URL content ingested successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/faq")
async def upload_faq(req: FaqBuilderRequest):
    """
    Upload FAQ entries for an agent.
    """
    try:
        faq_list = [entry.dict() for entry in req.faq_entries]
        db.save_faq(req.agent_id, faq_list)
        return {
            "status": "success",
            "faq_count": len(faq_list),
            "message": f"Added {len(faq_list)} FAQ entries"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}")
async def get_agent_kb(agent_id: str):
    """
    Get all knowledge base documents for an agent.
    """
    try:
        docs = db.get_kb_documents(agent_id)
        return {
            "agent_id": agent_id,
            "document_count": len(docs),
            "documents": docs,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
