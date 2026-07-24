"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  EnvelopeSimple,
  ArrowsClockwise,
  PencilSimpleLine,
  FloppyDisk,
  CheckCircle,
  PaperPlaneRight,
  Building,
  CaretRight,
  Trash,
  Sparkle,
  ArrowUUpLeft,
  Paperclip,
  Key,
  SignOut,
} from "@phosphor-icons/react";

interface EmailAttachment {
  id: number;
  filename: string;
  content_type: string;
  created_at: string;
}

interface ThreadMessage {
  id: number;
  sender: string; // 'user' or 'prospect'
  subject: string;
  body: string;
  created_at: string;
}

interface EmailLog {
  id: number;
  lead_id: number;
  lead_name: string;
  lead_email: string;
  subject: string;
  body: string;
  status: string;
  response_received?: string;
  response_sentiment?: string;
  created_at: string;
  sent_at?: string;
  replied_at?: string;
  attachments: EmailAttachment[];
  messages: ThreadMessage[];
}

export default function MailPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gmail status state
  const [gmailStatus, setGmailStatus] = useState<any>({
    connected: false,
    email: null,
    client_id_configured: false,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  // OAuth Config state
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Active email / company selection
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<EmailLog | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // AI Refiner
  const [aiPrompt, setAiPrompt] = useState("");
  const [refiningWithAi, setRefiningWithAi] = useState(false);

  // Conversation thread
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // Thread Reply Input
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Attachment upload status
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Load Gmail API integration status
  const loadGmailStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.getGmailStatus();
      setGmailStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Load emails
  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOutreachEmails();
      setEmails(res.data);

      // Handle company selection
      const companies = getCompaniesFromEmails(res.data);
      if (companies.length > 0) {
        if (!selectedCompany) {
          setSelectedCompany(companies[0]);
          const matching = res.data.filter((e) => getCompanyForEmail(e) === companies[0]);
          if (matching.length > 0) {
            setActiveEmail(matching[0]);
          }
        } else {
          // Keep selection synchronized
          const matching = res.data.find((e) => Number(e.id) === Number(activeEmail?.id));
          if (matching) {
            setActiveEmail(matching);
          } else {
            const list = res.data.filter((e) => getCompanyForEmail(e) === selectedCompany);
            if (list.length > 0) setActiveEmail(list[0]);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load outreach emails.");
    } finally {
      setLoading(false);
    }
  };

  // Load active thread messages
  const loadThread = async (emailId: number) => {
    setLoadingThread(true);
    try {
      const res = await api.getThreadMessages(emailId);
      setThreadMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadGmailStatus();
    loadEmails();
  }, []);

  useEffect(() => {
    if (activeEmail) {
      loadThread(activeEmail.id);
      setEditSubject(activeEmail.subject);
      setEditBody(activeEmail.body);
      setIsEditing(false);
    } else {
      setThreadMessages([]);
    }
  }, [activeEmail]);

  // Extract company name from email domain
  const getCompanyForEmail = (email: EmailLog) => {
    if (email.lead_email.includes("@")) {
      const domain = email.lead_email.split("@")[1];
      if (domain) {
        const companyPart = domain.split(".")[0];
        return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
      }
    }
    return "Prospect Corp";
  };

  const getCompaniesFromEmails = (emailList: EmailLog[]) => {
    const list = emailList.map((e) => getCompanyForEmail(e));
    return Array.from(new Set(list));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;
    setSavingConfig(true);
    try {
      await api.saveGmailConfig(clientId, clientSecret);
      await loadGmailStatus();
      setShowConfigPanel(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      const res = await api.getGmailAuthUrl();
      if (res.data && res.data.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectGmail();
      loadGmailStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdits = async (id: number) => {
    if (!editSubject.trim() || !editBody.trim()) return;
    setSavingEdit(true);
    try {
      await api.updateOutreachEmail(id, editSubject, editBody);
      loadEmails();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRefineWithAi = async () => {
    if (!activeEmail || !aiPrompt.trim()) return;
    setRefiningWithAi(true);
    try {
      const res = await api.refineEmailWithAi(activeEmail.id, aiPrompt);
      setEditSubject(res.data.subject);
      setEditBody(res.data.body);
      setIsEditing(true);
      setAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setRefiningWithAi(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeEmail || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingAttachment(true);
    try {
      await api.uploadAttachment(activeEmail.id, file);
      loadEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await api.deleteAttachment(attachmentId);
      loadEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveEmail = async (id: number) => {
    try {
      await api.approveOutreachEmail(id);
      loadEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEmail = async (id: number) => {
    try {
      await api.sendOutreachEmail(id);
      loadEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateReply = async (id: number, sentiment: string) => {
    try {
      await api.simulateOutreachReply(id, sentiment);
      loadEmails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmail || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      await api.sendThreadReply(activeEmail.id, replyBody);
      setReplyBody("");
      loadThread(activeEmail.id);
      loadEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const companies = getCompaniesFromEmails(emails);

  return (
    <div className="space-y-6">
      {/* ─── GMAIL CONFIGURATION PANEL ─── */}
      <div className="minimal-card bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-8 w-8 rounded-md bg-[#fff1ed] flex items-center justify-center text-[#ff7a59] shrink-0 border border-[#ff7a59]/20">
              <EnvelopeSimple size={18} weight="bold" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d3e50]">
                Beonix OS Inbox & Gmail API Integration
              </h4>
              <p className="text-[10px] text-[#516f90] mt-0.5 leading-relaxed">
                {gmailStatus.connected
                  ? `Connected to Gmail as: ${gmailStatus.email}`
                  : "Link your business Gmail to send real outbound outreach campaigns."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!gmailStatus.client_id_configured ? (
              <button
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#ff7a59] text-white hover:bg-[#ff5c35] transition-all shadow-xs"
                data-clickable
              >
                <Key size={14} weight="bold" />
                Configure Credentials
              </button>
            ) : gmailStatus.connected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#d9381e]/30 text-[#d9381e] bg-[#ffebe8] hover:bg-[#d9381e] hover:text-white transition-all"
                data-clickable
              >
                <SignOut size={14} weight="bold" />
                Disconnect
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAuthenticate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#ff7a59] text-white hover:bg-[#ff5c35] transition-all shadow-xs"
                  data-clickable
                >
                  <PaperPlaneRight size={14} weight="bold" />
                  Authorize Gmail
                </button>
                <button
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className="p-1.5 rounded-md border border-[#cbd6e2] text-[#516f90] hover:text-[#2d3e50] hover:bg-[#f5f8fa]"
                  title="Config credentials"
                  data-clickable
                >
                  <Key size={14} weight="bold" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Credentials Form Drawer */}
        {showConfigPanel && (
          <div className="mt-4 p-4 rounded bg-[#f7f6f3] border border-[#eaeaea] space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#1e1e28]">
                Google Cloud OAuth Credentials
              </h5>
              <p className="text-[10px] text-[#787774] leading-relaxed">
                Create OAuth 2.0 Web Client credentials in Google Console. Set Redirect URI to:{" "}
                <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[9px] text-[#1e1e28] border border-[#eaeaea] select-all">
                  http://localhost:8000/emails/gmail/callback
                </code>
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-[#787774] uppercase tracking-wider">Client ID</label>
                  <input
                    type="text"
                    placeholder="Paste Client ID..."
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#eaeaea] rounded text-xs font-mono text-[#1e1e28] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-[#787774] uppercase tracking-wider">Client Secret</label>
                  <input
                    type="password"
                    placeholder="Paste Client Secret..."
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#eaeaea] rounded text-xs font-mono text-[#1e1e28] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
                <button
                  type="button"
                  onClick={() => setShowConfigPanel(false)}
                  className="button-minimal-secondary text-[10px] py-1 px-3"
                  data-clickable
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig || !clientId.trim() || !clientSecret.trim()}
                  className="button-minimal text-[10px] py-1 px-3"
                  data-clickable
                >
                  {savingConfig ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
          <ArrowsClockwise size={14} className="animate-spin text-[#1e1e28]" />
          <span className="font-mono">Loading mailroom records...</span>
        </div>
      ) : emails.length === 0 ? (
        <div className="minimal-card max-w-xl mx-auto p-12 text-center space-y-4 bg-white">
          <EnvelopeSimple size={42} weight="bold" className="text-[#eaeaea] mx-auto" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[#1e1e28]">No Outreach Campaigns</h4>
            <p className="text-[11px] text-[#787774] leading-relaxed">
              Generate AI outreach drafts inside individual CRM lead cards first. The mailroom will populate with drafts grouped by account company name.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/crm")}
            className="button-minimal text-xs mt-2"
            data-clickable
          >
            Go to CRM Pipeline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch min-h-[550px]">
          {/* Left panel: Company List */}
          <div className="md:col-span-1 minimal-card bg-white p-3 flex flex-col space-y-3 h-full overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
            <span className="text-[9px] font-mono font-bold text-[#787774]/70 uppercase tracking-wider border-b border-[#eaeaea] pb-2 pl-1.5">
              Target Accounts
            </span>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {companies.map((company) => {
                const companyEmails = emails.filter((e) => getCompanyForEmail(e) === company);
                const draftCount = companyEmails.filter((e) => e.status === "draft").length;
                const isSelected = selectedCompany === company;

                return (
                  <button
                    key={company}
                    onClick={() => {
                      setSelectedCompany(company);
                      const list = emails.filter((e) => getCompanyForEmail(e) === company);
                      if (list.length > 0) setActiveEmail(list[0]);
                      setIsEditing(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded text-left text-xs transition-colors border ${
                      isSelected
                        ? "bg-[#f4f3ef] border-[#eaeaea] text-[#1e1e28] font-bold"
                        : "border-transparent text-[#787774] hover:text-[#1e1e28] hover:bg-[#f4f3ef]/30"
                    }`}
                    data-clickable
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building size={14} className={isSelected ? "text-[#1e1e28]" : "text-[#787774]/40"} weight={isSelected ? "bold" : "regular"} />
                      <span className="truncate">{company}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {draftCount > 0 && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#e1f3fe] text-[#1f6c9f]">
                          {draftCount}
                        </span>
                      )}
                      <CaretRight size={10} className={isSelected ? "text-[#1e1e28]" : "text-[#787774]/30"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active Company Outreach Thread */}
          <div className="md:col-span-3 minimal-card bg-white p-5 flex flex-col space-y-4 h-full overflow-hidden justify-between" style={{ height: "calc(100vh - 280px)" }}>
            {activeEmail ? (
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                {/* Active Header */}
                <div className="border-b border-[#eaeaea] pb-3 flex justify-between items-start shrink-0 flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#1e1e28]">{activeEmail.lead_name}</h3>
                    <span className="text-[10px] font-mono text-[#787774]">{activeEmail.lead_email}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                        activeEmail.status === "draft"
                          ? "bg-[#f4f3ef] text-[#787774] border-[#eaeaea]"
                          : activeEmail.status === "approved"
                            ? "bg-[#e1f3fe] text-[#1f6c9f] border-[#1f6c9f]/10"
                            : activeEmail.status === "sent"
                              ? "bg-[#e1f3fe] text-[#1f6c9f] border-[#1f6c9f]/10"
                              : "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                      }`}
                    >
                      {activeEmail.status}
                    </span>

                    {activeEmail.status === "draft" && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-[#787774] hover:text-[#1e1e28] p-1"
                        title="Edit email copy"
                        data-clickable
                      >
                        <PencilSimpleLine size={13} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
                  {/* --- DRAFT MODE EDITING VIEW --- */}
                  {activeEmail.status === "draft" && (
                    <div className="space-y-4">
                      {/* AI Assistant Refinement input */}
                      <div className="rounded border border-[#eaeaea] bg-[#fbfbfa] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#1e1e28] uppercase tracking-wider">
                          <Sparkle size={13} weight="bold" />
                          <span>AI Assistant (Groq) // AUTOPILOT</span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Instructions (e.g., 'Make it shorter', 'Add a call to action regarding integrations')..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                          />
                          <button
                            onClick={handleRefineWithAi}
                            disabled={refiningWithAi || !aiPrompt.trim()}
                            className="button-minimal text-xs py-1.5 px-4"
                            data-clickable
                          >
                            {refiningWithAi ? (
                              <ArrowsClockwise size={12} className="animate-spin" />
                            ) : (
                              <Sparkle size={12} weight="bold" />
                            )}
                            Refine
                          </button>
                        </div>
                      </div>

                      {/* Subject and Body forms */}
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-[#787774] uppercase tracking-wider">Subject</label>
                            <input
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-[#787774] uppercase tracking-wider">Body</label>
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#eaeaea] rounded text-xs min-h-[160px] outline-none font-sans leading-relaxed focus:border-[#787774]"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditSubject(activeEmail.subject);
                                setEditBody(activeEmail.body);
                              }}
                              className="button-minimal-secondary text-[10px] py-1.5 px-3"
                              data-clickable
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdits(activeEmail.id)}
                              disabled={savingEdit || !editSubject.trim() || !editBody.trim()}
                              className="button-minimal text-[10px] py-1.5 px-3"
                              data-clickable
                            >
                              <FloppyDisk size={12} weight="bold" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-[11px] font-mono text-[#1e1e28] flex items-baseline gap-1.5">
                            <span className="text-[#787774]">Subject:</span>
                            <span className="font-bold">{activeEmail.subject}</span>
                          </div>
                          <div className="p-4 bg-[#fbfbfa] border border-[#eaeaea] rounded text-[11px] text-[#1e1e28] leading-relaxed whitespace-pre-wrap font-sans">
                            {activeEmail.body}
                          </div>
                        </div>
                      )}

                      {/* --- FILE ATTACHMENTS SECTION --- */}
                      <div className="border-t border-[#eaeaea] pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                            <Paperclip size={12} weight="bold" />
                            Attachments
                          </span>

                          <label className="cursor-pointer text-[9px] font-bold text-[#1e1e28] hover:text-[#787774] transition-colors flex items-center gap-1">
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={uploadingAttachment}
                            />
                            {uploadingAttachment ? (
                              <ArrowsClockwise size={10} className="animate-spin" />
                            ) : (
                              <span>+ Attach File</span>
                            )}
                          </label>
                        </div>

                        {activeEmail.attachments && activeEmail.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {activeEmail.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center gap-2 pl-3 pr-2 py-1 rounded bg-[#f4f3ef] border border-[#eaeaea] text-[10px] text-[#1e1e28]"
                              >
                                <span className="truncate max-w-[150px] font-mono">{att.filename}</span>
                                <button
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  className="text-[#787774] hover:text-[#9f2f2d] p-0.5 rounded transition-colors"
                                  title="Remove attachment"
                                  data-clickable
                                >
                                  <Trash size={11} weight="bold" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#787774]/50 italic block pl-0.5">
                            No attachments uploaded.
                          </span>
                        )}
                      </div>

                      {/* Send Actions */}
                      <div className="pt-4 border-t border-[#eaeaea] flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveEmail(activeEmail.id)}
                          className="button-minimal text-xs px-4 py-1.5"
                          data-clickable
                        >
                          <CheckCircle size={13} weight="bold" />
                          Approve Draft
                        </button>
                      </div>
                    </div>
                  )}

                  {activeEmail.status === "approved" && (
                    <div className="space-y-4">
                      <div className="text-[11px] font-mono text-[#1e1e28] flex items-baseline gap-1.5 border-b border-[#eaeaea] pb-3">
                        <span className="text-[#787774]">Subject:</span>
                        <span className="font-bold">{activeEmail.subject}</span>
                      </div>
                      <div className="p-4 bg-[#fbfbfa] border border-[#eaeaea] rounded text-[11px] text-[#1e1e28] leading-relaxed whitespace-pre-wrap font-sans">
                        {activeEmail.body}
                      </div>

                      {activeEmail.attachments && activeEmail.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#eaeaea]">
                          {activeEmail.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f4f3ef] border border-[#eaeaea] text-[9px] font-mono text-[#787774]"
                            >
                              <Paperclip size={10} weight="bold" />
                              {att.filename}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-4 border-t border-[#eaeaea] flex justify-end">
                        <button
                          onClick={() => handleSendEmail(activeEmail.id)}
                          className="button-minimal text-xs px-4 py-2"
                          data-clickable
                        >
                          <PaperPlaneRight size={13} weight="bold" />
                          Send Outreach (Gmail API)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- SENT & REPLIED CHAT-STYLE TIMELINE --- */}
                  {(activeEmail.status === "sent" || activeEmail.status === "replied") && (
                    <div className="space-y-4">
                      {loadingThread ? (
                        <div className="py-12 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
                          <ArrowsClockwise size={13} className="animate-spin text-[#1e1e28]" />
                          <span className="font-mono">Loading conversation history...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {threadMessages.map((msg) => {
                            const isProspect = msg.sender === "prospect";

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] ${
                                  isProspect ? "ml-0 mr-auto" : "ml-auto mr-0"
                                }`}
                              >
                                <span className="text-[9px] font-mono text-[#787774] mb-1 px-1">
                                  {isProspect ? "PROSPECT" : "REPRESENTATIVE (YOU)"} —{" "}
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>

                                <div
                                  className={`rounded-lg p-3.5 border text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                                    isProspect
                                      ? "bg-[#fbfbfa] border-[#eaeaea] text-[#1e1e28]"
                                      : "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                  }`}
                                >
                                  {msg.body}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inbound sentiment trigger simulators for SENT status */}
                      {activeEmail.status === "sent" && (
                        <div className="rounded border border-[#eaeaea] bg-[#fbfbfa] p-4 space-y-3">
                          <div className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                            Simulate Incoming Response
                          </div>
                          <p className="text-[10px] text-[#787774] leading-relaxed">
                            Simulate replies with different sentiments to test scoring adjustments.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleSimulateReply(activeEmail.id, "positive")}
                              className="px-3.5 py-1.5 rounded text-[10px] font-bold bg-[#edf3ec] text-[#346538] border border-[#346538]/10 hover:bg-[#346538]/10 transition-colors"
                            >
                              Positive Reply (+20 Score)
                            </button>
                            <button
                              onClick={() => handleSimulateReply(activeEmail.id, "neutral")}
                              className="px-3.5 py-1.5 rounded text-[10px] font-bold bg-[#f4f3ef] text-[#787774] border border-[#eaeaea] hover:bg-[#eaeaea] transition-colors"
                            >
                              Neutral Reply (0 Score)
                            </button>
                            <button
                              onClick={() => handleSimulateReply(activeEmail.id, "negative")}
                              className="px-3.5 py-1.5 rounded text-[10px] font-bold bg-[#fdebec] text-[#9f2f2d] border border-[#9f2f2d]/10 hover:bg-[#9f2f2d]/10 transition-colors"
                            >
                              Negative Reply (-15 Score)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* --- REPLY TEXT INPUT FIELD FOR REPLIED STATE --- */}
                      {activeEmail.status === "replied" && (
                        <form onSubmit={handleSendThreadReply} className="border-t border-[#eaeaea] pt-4 space-y-3 shrink-0">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                              <ArrowUUpLeft size={12} weight="bold" />
                              Send Follow-up Reply
                            </span>
                            <textarea
                              placeholder="Write your email response back to the prospect..."
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#eaeaea] rounded text-xs min-h-[90px] outline-none leading-relaxed focus:border-[#787774]"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={sendingReply || !replyBody.trim()}
                              className="button-minimal text-xs px-4 py-2"
                              data-clickable
                            >
                              <PaperPlaneRight size={12} weight="bold" />
                              {sendingReply ? "Sending reply..." : "Send Reply"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-[#787774]/50 italic flex flex-col items-center justify-center gap-2 h-full">
                <EnvelopeSimple size={32} weight="bold" className="text-[#eaeaea]" />
                <span>Select an account company thread from the left panel.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
