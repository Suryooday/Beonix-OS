"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import {
  Database,
  UploadSimple,
  CircleNotch,
  CheckCircle,
  Warning,
  FileText,
  FilePdf,
  File,
  Plus,
  Compass,
  ArrowRight,
  ChatTeardropText,
  PaperPlaneRight,
} from "@phosphor-icons/react";

const parseAssistantResponse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    return { answer: content, sources: [] };
  }
};

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<"knowledge" | "assistant">("knowledge");

  // Knowledge Base State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant State
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeCitationMessageId, setActiveCitationMessageId] = useState<number | null>(null);

  const [isMock, setIsMock] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    fetchDocs();
    fetchSessions();
  }, []);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocs = async () => {
    try {
      const res = await api.getDocuments();
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      setDocuments(sorted);
      setIsMock(res.isMock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const localSessions = getLocalMockSessionsList();
      setSessions(localSessions);
      if (localSessions.length > 0 && currentSessionId === null) {
        selectSession(localSessions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getLocalMockSessionsList = () => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("beonix_mock_chat_sessions");
    if (!stored) return [];
    return JSON.parse(stored);
  };

  const selectSession = async (id: number) => {
    setCurrentSessionId(id);
    setMessages([]);
    setActiveCitationMessageId(null);
    try {
      const res = await api.getChatSession(id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.createChatSession();
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setActiveCitationMessageId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
      setUploadError("Unsupported format. Please upload PDF, DOCX, or TXT files.");
      return;
    }
    if (file.size === 0) {
      setUploadError("Empty file. Please upload a valid document containing text.");
      return;
    }
    setUploadStatus("Uploading");
    setUploadError(null);
    try {
      await api.uploadDocument(file);
      setUploadStatus("Completed");
      fetchDocs();
      setTimeout(() => setUploadStatus(null), 1500);
    } catch (err) {
      console.error(err);
      setUploadError("Ingestion pipeline failed. File format could not be parsed.");
      setUploadStatus(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || currentSessionId === null) return;
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: inputMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSendingMessage(true);
    try {
      const res = await api.postChatMessage(currentSessionId, userMsg.content);
      setMessages((prev) => [...prev, res.data]);
      
      // Update session title locally if it was "New Conversation"
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId && s.title === "New Conversation") {
            return {
              ...s,
              title: userMsg.content.slice(0, 32) + (userMsg.content.length > 32 ? "..." : ""),
            };
          }
          return s;
        })
      );

      // Highlight citations for this response
      setActiveCitationMessageId(res.data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER & TAB SWITCHER ─── */}
      <div className="minimal-card bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-overline mb-2 inline-block">RAG Engine</span>
            <h1 className="text-display-md text-foreground">Context Memory</h1>
            <p className="text-xs text-[#787774] mt-1 max-w-md">
              Ingest unstructured files, structure records automatically, and cite references in outbound messaging.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-[#f4f3ef] p-1 rounded-lg border border-[#eaeaea]">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "knowledge"
                  ? "bg-white text-[#1e1e28] border border-[#eaeaea] shadow-xs"
                  : "text-[#787774] hover:text-[#1e1e28]"
              }`}
            >
              <Database size={13} weight="bold" />
              Registry
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "assistant"
                  ? "bg-white text-[#1e1e28] border border-[#eaeaea] shadow-xs"
                  : "text-[#787774] hover:text-[#1e1e28]"
              }`}
            >
              <Compass size={13} weight="bold" />
              Chat Advisor
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: KNOWLEDGE BASE REGISTRY ─── */}
      {activeTab === "knowledge" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Upload card */}
          <div className="lg:col-span-1 space-y-4">
            <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
              Knowledge Ingestion
            </span>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`minimal-card bg-white border-2 border-dashed p-8 text-center cursor-pointer min-h-[220px] flex flex-col justify-center items-center relative overflow-hidden transition-colors ${
                dragActive ? "border-[#1e1e28] bg-[#fbfbfa]" : "border-[#eaeaea] hover:border-[#787774]"
              }`}
              data-clickable
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadStatus !== null}
              />

              {uploadStatus === null ? (
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-[#f4f3ef] flex items-center justify-center text-[#1e1e28] border border-[#eaeaea] mx-auto">
                    <UploadSimple size={20} weight="bold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1e1e28]">Drag &amp; Drop Documents</p>
                    <p className="text-[9px] text-[#787774] mt-1 font-mono uppercase tracking-wider">PDF, DOCX, or TXT formats</p>
                  </div>
                  <button type="button" className="button-minimal text-[10px] py-1.5 px-4">
                    Upload File
                  </button>
                </div>
              ) : (
                <div className="space-y-4 py-2 w-full max-w-[200px]">
                  {uploadStatus === "Completed" ? (
                    <CheckCircle size={32} className="text-[#346538] mx-auto" weight="bold" />
                  ) : (
                    <CircleNotch size={32} className="text-[#1e1e28] animate-spin mx-auto" />
                  )}

                  <div>
                    <p className="text-xs font-bold text-[#1e1e28] capitalize font-mono">
                      {uploadStatus === "Completed" ? "Ingested Successfully" : "Uploading File..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded bg-[#fdebec] border border-[#9f2f2d]/10 text-[#9f2f2d] text-xs font-medium">
                <Warning size={14} className="shrink-0 mt-0.5" weight="bold" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Document Listing Table */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
              Knowledge Base Documents
            </span>

            <div className="minimal-card bg-white p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                      <th className="p-4 pl-5 font-bold">File Name</th>
                      <th className="p-4 font-bold">Type</th>
                      <th className="p-4 font-bold">Size</th>
                      <th className="p-4 font-bold">Chunks</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 pr-5 font-bold">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaea]">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-[#787774]/55 font-mono">
                          <CircleNotch size={14} className="animate-spin inline-block mr-2 text-[#1e1e28]" />
                          Ingesting document registry...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-[#787774] italic">
                          No company knowledge base uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#f7f6f3]/50 transition-colors">
                          <td className="p-4 pl-5 font-semibold text-[#1e1e28] max-w-[200px] truncate" title={doc.filename}>
                            <div className="flex items-center gap-2">
                              {doc.document_type === "pdf" ? (
                                <FilePdf size={14} className="text-[#9f2f2d] shrink-0" weight="bold" />
                              ) : doc.document_type === "docx" ? (
                                <FileText size={14} className="text-[#1f6c9f] shrink-0" weight="bold" />
                              ) : (
                                <File size={14} className="text-[#787774] shrink-0" />
                              )}
                              <span className="truncate">{doc.filename}</span>
                            </div>
                          </td>
                          <td className="p-4 uppercase font-mono text-[9px] text-[#787774]/70">
                            {doc.document_type}
                          </td>
                          <td className="p-4 font-mono text-[9px] text-[#787774]/70 tabnum">
                            {formatBytes(doc.file_size)}
                          </td>
                          <td className="p-4 font-mono text-[9px] text-[#787774]/70 tabnum">
                            {doc.chunk_count}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-2 py-0.5 border ${
                                doc.processing_status === "completed"
                                  ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                  : doc.processing_status === "processing"
                                    ? "bg-[#e1f3fe] border-[#1f6c9f]/10 text-[#1f6c9f]"
                                    : "bg-[#fdebec] border-[#9f2f2d]/10 text-[#9f2f2d]"
                              }`}
                            >
                              {doc.processing_status}
                            </span>
                          </td>
                          <td className="p-4 pr-5 text-[#787774]/60 font-mono text-[9px]">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: AI ASSISTANT (RAG CHAT) ─── */}
      {activeTab === "assistant" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch" style={{ height: "calc(100vh - 280px)" }}>
          {/* Chat Sessions Sidebar */}
          <div className="lg:col-span-1 minimal-card bg-white p-4 flex flex-col space-y-4 h-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[#eaeaea] pb-3">
              <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1">
                Conversations
              </span>
              <button onClick={createNewSession} className="button-minimal text-[10px] px-3.5 py-1" data-clickable>
                <Plus size={10} weight="bold" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {sessions.length === 0 ? (
                <p className="text-[10px] text-[#787774]/40 italic text-center pt-8 font-mono">No chats logged yet.</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-left p-2.5 rounded text-xs font-semibold border ${
                      currentSessionId === s.id
                        ? "bg-[#f4f3ef] border-[#eaeaea] text-[#1e1e28]"
                        : "border-transparent text-[#787774] hover:text-[#1e1e28] hover:bg-[#f4f3ef]/30"
                    } truncate block`}
                    data-clickable
                  >
                    {s.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Conversation */}
          <div className="lg:col-span-2 minimal-card bg-white flex flex-col h-full overflow-hidden p-0">
            {currentSessionId === null ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-3 rounded-lg bg-[#f4f3ef] border border-[#eaeaea] text-[#1e1e28]">
                  <Compass size={24} weight="bold" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1e1e28]">AI Knowledge Assistant</h4>
                  <p className="text-[11px] text-[#787774] max-w-xs mt-1 leading-normal">
                    Query your ingested business knowledge, analyze PDF metrics, and build campaign responses.
                  </p>
                </div>
                <button onClick={createNewSession} className="button-minimal text-xs">
                  Create New Conversation
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden justify-between h-full">
                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <ChatTeardropText size={28} className="text-[#eaeaea]" weight="bold" />
                      <p className="text-[11px] text-[#787774]/60">Send a query to search vector records.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.role === "user";
                      const parsed = isUser ? { answer: msg.content, sources: [] } : parseAssistantResponse(msg.content);
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto mr-0" : "ml-0 mr-auto cursor-pointer"}`}
                        >
                          <span className="text-[9px] font-mono text-[#787774] mb-1 px-1">
                            {isUser ? "YOU" : "KNOWLEDGE ADVISOR"}
                          </span>
                          <div
                            className={`rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap border ${
                              isUser
                                ? "bg-[#f4f3ef] border-[#eaeaea] text-[#1e1e28]"
                                : `bg-[#e1f3fe] border-[#1f6c9f]/10 text-[#1f6c9f] ${
                                    activeCitationMessageId === msg.id ? "border-[#1f6c9f] ring-1 ring-[#1f6c9f]/20" : ""
                                  }`
                            }`}
                          >
                            {parsed.answer}

                            {/* Citations references */}
                            {!isUser && parsed.sources && parsed.sources.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-[#1f6c9f]/10">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-[#1f6c9f]">
                                  <span>{parsed.sources.length} References Cited</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {sendingMessage && (
                    <div className="ml-0 mr-auto flex flex-col max-w-[80%]">
                      <span className="text-[9px] font-mono text-[#787774] mb-1 px-1">KNOWLEDGE ADVISOR</span>
                      <div className="rounded-lg p-3.5 bg-[#fbfbfa] border border-[#eaeaea] text-xs flex items-center gap-2">
                        <CircleNotch size={12} className="animate-spin text-[#1e1e28]" />
                        <span className="font-mono text-[#787774]">Querying vector memory database...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-[#eaeaea] bg-white shrink-0 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question about your knowledge registry..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !inputMessage.trim()}
                    className="button-minimal p-2 rounded shrink-0"
                  >
                    <PaperPlaneRight size={13} weight="bold" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Citation Sidebar Panel */}
          <div className="lg:col-span-1 minimal-card bg-white p-4 flex flex-col space-y-4 h-full overflow-hidden">
            <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider border-b border-[#eaeaea] pb-2 pl-1">
              Source Citations
            </span>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activeCitationMessageId === null ? (
                <p className="text-[10px] text-[#787774]/40 italic text-center pt-8 leading-normal font-mono">
                  Click references inside a chat bubble to view document context chunks.
                </p>
              ) : (
                (() => {
                  const targetMsg = messages.find((m) => m.id === activeCitationMessageId);
                  if (!targetMsg || targetMsg.role === "user") return null;
                  const parsed = parseAssistantResponse(targetMsg.content);
                  if (!parsed.sources || parsed.sources.length === 0) {
                    return (
                      <p className="text-[10px] text-[#787774]/40 italic text-center pt-8 leading-normal font-mono">
                        No references cited for this response.
                      </p>
                    );
                  }
                  return parsed.sources.map((cite: any, i: number) => (
                    <div key={i} className="p-3 rounded bg-[#fbfbfa] border border-[#eaeaea] space-y-2">
                      <div className="flex justify-between items-start text-[10px]">
                        <span className="font-bold text-[#1e1e28] truncate max-w-[120px]">{cite.document}</span>
                        <span className="text-[9px] font-mono font-bold bg-[#edf3ec] text-[#346538] px-1 py-0.5 rounded">
                          Score {Math.round(cite.score * 100)}%
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#787774] leading-relaxed italic">
                        Chunk {cite.chunk}
                      </p>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
