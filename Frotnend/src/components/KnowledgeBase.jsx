import React, { useState } from "react";
import { FiUpload, FiLink2, FiFileText, FiLink } from "react-icons/fi";
import {
  uploadText,
  uploadPDF,
  uploadFromURL,
  uploadFAQ,
  getAgentKB,
} from "../api";
import "../styles/knowledgebase.css";

export default function KnowledgeBase({ agentId }) {
  const [activeTab, setActiveTab] = useState("text");
  const [loading, setLoading] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [textFileName, setTextFileName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [faqInput, setFaqInput] = useState("");
  const [kbDocuments, setKbDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);

  const handleUploadText = async () => {
    if (!textContent.trim()) {
      alert("Please enter text content");
      return;
    }
    setLoading(true);
    try {
      await uploadText(agentId, textContent, textFileName);
      alert("Text uploaded successfully!");
      setTextContent("");
      setTextFileName("");
      await loadKBDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload text");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await uploadPDF(agentId, file);
      alert("PDF uploaded successfully!");
      await loadKBDocuments();
    } catch (err) {
      console.error("PDF upload error:", err);
      alert("Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadURL = async () => {
    if (!urlInput.trim()) {
      alert("Please enter a URL");
      return;
    }
    setLoading(true);
    try {
      await uploadFromURL(agentId, urlInput);
      alert("URL content ingested successfully!");
      setUrlInput("");
      await loadKBDocuments();
    } catch (err) {
      console.error("URL ingest error:", err);
      alert("Failed to ingest URL");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFAQ = async () => {
    if (!faqInput.trim()) {
      alert("Please enter FAQ entries (one Q&A per line, separated by |)");
      return;
    }
    const entries = faqInput.split("\n").map((line) => {
      const [q, a] = line.split("|");
      return { question: q?.trim(), answer: a?.trim() };
    });

    setLoading(true);
    try {
      await uploadFAQ(agentId, entries);
      alert("FAQ uploaded successfully!");
      setFaqInput("");
      await loadKBDocuments();
    } catch (err) {
      console.error("FAQ upload error:", err);
      alert("Failed to upload FAQ");
    } finally {
      setLoading(false);
    }
  };

  const loadKBDocuments = async () => {
    try {
      const docs = await getAgentKB(agentId);
      setKbDocuments(docs);
    } catch (err) {
      console.error("Failed to load KB documents:", err);
    }
  };

  const toggleShowDocuments = async () => {
    if (!showDocuments) {
      await loadKBDocuments();
    }
    setShowDocuments(!showDocuments);
  };

  return (
    <div className="knowledge-base-panel">
      <div className="kb-header">
        <h3>Knowledge Base</h3>
        <button className="kb-docs-btn" onClick={toggleShowDocuments}>
          📄 View Documents ({kbDocuments.length || 0})
        </button>
      </div>

      {showDocuments && (
        <div className="kb-documents">
          {kbDocuments.length === 0 ? (
            <p>No documents uploaded yet</p>
          ) : (
            <ul>
              {kbDocuments.map((doc, idx) => (
                <li key={idx}>
                  <strong>{doc.file_name || doc.metadata?.source_type}</strong>
                  <p>{doc.content?.substring(0, 100)}...</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="kb-tabs">
        <button
          className={`tab ${activeTab === "text" ? "active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          <FiFileText /> Text
        </button>
        <button
          className={`tab ${activeTab === "pdf" ? "active" : ""}`}
          onClick={() => setActiveTab("pdf")}
        >
          <FiUpload /> PDF
        </button>
        <button
          className={`tab ${activeTab === "url" ? "active" : ""}`}
          onClick={() => setActiveTab("url")}
        >
          <FiLink /> URL
        </button>
        <button
          className={`tab ${activeTab === "faq" ? "active" : ""}`}
          onClick={() => setActiveTab("faq")}
        >
          ❓ FAQ
        </button>
      </div>

      <div className="kb-content">
        {activeTab === "text" && (
          <div className="kb-section">
            <input
              type="text"
              placeholder="File name (optional)"
              value={textFileName}
              onChange={(e) => setTextFileName(e.target.value)}
            />
            <textarea
              placeholder="Paste text content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={6}
            />
            <button onClick={handleUploadText} disabled={loading}>
              {loading ? "Uploading..." : "Upload Text"}
            </button>
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="kb-section">
            <label className="file-input-label">
              <FiUpload size={24} />
              <span>Click to select PDF</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleUploadPDF}
                disabled={loading}
              />
            </label>
          </div>
        )}

        {activeTab === "url" && (
          <div className="kb-section">
            <input
              type="url"
              placeholder="Enter URL (https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button onClick={handleUploadURL} disabled={loading}>
              {loading ? "Ingesting..." : "Ingest URL"}
            </button>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="kb-section">
            <textarea
              placeholder="Format: Question | Answer&#10;Example: What is AI? | Artificial Intelligence is..."
              value={faqInput}
              onChange={(e) => setFaqInput(e.target.value)}
              rows={6}
            />
            <button onClick={handleUploadFAQ} disabled={loading}>
              {loading ? "Uploading..." : "Upload FAQ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
