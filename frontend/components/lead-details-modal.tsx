"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { LeadDetail, Transcript } from "@/types";
import AudioUploadZone from "./audio-upload-zone";
import {
  EnvelopeSimple,
  Buildings,
  CalendarBlank,
  ArrowsClockwise,
  Warning,
  CircleNotch,
  Phone,
  PhoneCall,
  WhatsappLogo,
  Chats,
  Notebook,
  Plus,
  X,
  Paperclip,
  CheckCircle,
} from "@phosphor-icons/react";

interface LeadDetailsModalProps {
  leadId: number | null;
  onClose: () => void;
  onStageUpdated: () => void;
}

const pipelineStages = ["New", "Contacted", "Qualified", "Proposal", "Closed"];

export default function LeadDetailsModal({ leadId, onClose, onStageUpdated }: LeadDetailsModalProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note logging states
  const [noteType, setNoteType] = useState("Note");
  const [noteContent, setNoteContent] = useState("");
  const [loggingActivity, setLoggingActivity] = useState(false);

  // Tab select state
  const [modalTab, setModalTab] = useState<"overview" | "timeline" | "calls" | "assistant" | "followups">("overview");

  // Lead insights state
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Lead Chat states
  const [leadChatText, setLeadChatText] = useState("");
  const [leadMessages, setLeadMessages] = useState<any[]>([]);
  const [sendingLeadQuery, setSendingLeadQuery] = useState(false);
  const [recActions, setRecActions] = useState<string[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);

  // Follow-ups states
  const [followups, setFollowups] = useState<any[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);

  const fetchFollowups = async (id: number) => {
    setLoadingFollowups(true);
    try {
      const res = await api.getLeadFollowups(id);
      setFollowups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollowups(false);
    }
  };

  const activitiesEndRef = useRef<HTMLDivElement>(null);
  const [scoringLead, setScoringLead] = useState(false);
  const [submittingPrep, setSubmittingPrep] = useState(false);
  const [reviewInput, setReviewInput] = useState("");
  const [draftEmail, setDraftEmail] = useState<any>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const fetchDraftEmail = async (id: number) => {
    try {
      const res = await api.getOutreachEmails();
      const found = res.data.find((d: any) => Number(d.lead_id) === Number(id));
      setDraftEmail(found || null);
    } catch (err) {
      console.error("Failed to load outreach email:", err);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!lead) return;
    setGeneratingEmail(true);
    try {
      const res = await api.generateOutreachEmail(lead.id);
      setDraftEmail(res.data);
      const detailResponse = await api.getLeadById(lead.id);
      setLead(detailResponse.data);
      onStageUpdated();
    } catch (err: any) {
      alert("Failed to generate email outreach: " + (err.message || err));
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSavePrep = async () => {
    if (!lead) return;
    setSubmittingPrep(true);
    try {
      const res = await api.submitLeadPrep(lead.id, reviewInput);
      setLead(res.data);
      onStageUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPrep(false);
    }
  };

  useEffect(() => {
    if (lead) {
      setReviewInput(lead.manual_review || "");
    }
  }, [lead]);

  // Parse scoring factors from JSON
  let factorData: any = null;
  if (lead?.score_reasoning) {
    try {
      factorData = JSON.parse(lead.score_reasoning);
    } catch (e) {
      console.error("Failed to parse score_reasoning JSON", e);
    }
  }

  const getPriorityBadgeStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10";
      case "medium":
        return "bg-[#fbf3db] text-[#956400] border-[#956400]/10";
      default:
        return "bg-[#f4f3ef] text-[#787774] border-[#eaeaea]";
    }
  };

  const fetchInsights = async (id: number) => {
    setLoadingInsights(true);
    try {
      const res = await api.getLeadInsights(id);
      setInsights(res.data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRecalculateScore = async () => {
    if (!lead) return;
    setScoringLead(true);
    try {
      await api.calculateLeadScore(lead.id);
      const detailResponse = await api.getLeadById(lead.id);
      setLead(detailResponse.data);
      await fetchInsights(lead.id);
      onStageUpdated();
    } catch (err: any) {
      alert("Failed to recalculate score: " + (err.message || err));
    } finally {
      setScoringLead(false);
    }
  };

  // Fetch lead detail on load or leadId change
  useEffect(() => {
    if (leadId === null) {
      setLead(null);
      setInsights(null);
      setLeadMessages([]);
      setRecActions([]);
      setLeadSources([]);
      setModalTab("overview");
      return;
    }

    const fetchLeadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getLeadById(leadId);
        setLead(response.data);
        await fetchInsights(leadId);
        await fetchFollowups(leadId);
        await fetchDraftEmail(leadId);
      } catch (err: any) {
        setError(err.message || "Failed to load lead details.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeadDetails();
  }, [leadId]);

  // Scroll to bottom of activity feed when activities update
  useEffect(() => {
    if (activitiesEndRef.current) {
      activitiesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lead?.activities]);

  const handleStageChange = async (newStage: string) => {
    if (!lead) return;
    try {
      await api.updateLeadStage(lead.id, newStage);
      const detailResponse = await api.getLeadById(lead.id);
      setLead(detailResponse.data);
      onStageUpdated();
    } catch (err: any) {
      alert(err.message || "Failed to update lead stage.");
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !noteContent.trim()) return;

    setLoggingActivity(true);
    try {
      const response = await api.addManualActivity(lead.id, noteType, noteContent.trim());
      setLead((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          activities: [...prev.activities, response.data],
        };
      });
      setNoteContent("");
    } catch (err: any) {
      alert("Failed to log activity: " + err.message);
    } finally {
      setLoggingActivity(false);
    }
  };

  const handleSendLeadQuery = async (queryText?: string) => {
    const query = queryText || leadChatText;
    if (!query.trim() || !lead || sendingLeadQuery) return;

    setLeadChatText("");
    setSendingLeadQuery(true);
    setError(null);

    setLeadMessages((prev) => [...prev, { role: "user", content: query }]);

    try {
      const response = await api.askLeadQuestion(lead.id, query);
      setLeadMessages((prev) => [...prev, { role: "assistant", content: response.data.answer }]);
      setRecActions(response.data.recommended_actions || []);
      setLeadSources(response.data.sources || []);
    } catch (err: any) {
      setError(err.message || "Failed to ask lead memory assistant.");
    } finally {
      setSendingLeadQuery(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "System":
        return <Warning size={12} className="text-[#787774]" weight="bold" />;
      case "Stage Change":
        return <ArrowsClockwise size={12} className="text-[#1e1e28]" weight="bold" />;
      case "Call":
        return <PhoneCall size={12} className="text-[#956400]" weight="bold" />;
      case "Email":
        return <EnvelopeSimple size={12} className="text-[#1f6c9f]" weight="bold" />;
      default:
        return <Notebook size={12} className="text-[#787774]" weight="bold" />;
    }
  };

  return (
    <Dialog
      open={leadId !== null}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-white border border-[#cbd6e2] rounded-lg p-6 shadow-2xl flex flex-col space-y-4">
        <DialogHeader className="border-b border-[#eaf0f6] pb-3">
          <DialogTitle className="text-sm font-bold text-[#2d3e50] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#ff7a59] text-white flex items-center justify-center text-[10px] font-bold">
                {lead?.name ? lead.name.charAt(0).toUpperCase() : "C"}
              </div>
              <span>Beonix OS Contact & Deal Record</span>
            </div>
            {lead && (
              <span className="text-[10px] font-mono font-bold bg-[#fff1ed] border border-[#ff7a59]/30 text-[#ff7a59] px-2 py-0.5 rounded">
                DEAL #{lead.id}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#516f90]">
            Manage contact properties, inspect activity timelines, and trigger automated outreach workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {loading && (
            <div className="py-20 text-center text-xs text-[#516f90] flex items-center justify-center gap-2">
              <CircleNotch size={14} className="animate-spin text-[#ff7a59]" />
              <span className="font-mono">Syncing Beonix OS CRM records...</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded bg-[#ffebe8] border border-[#d9381e]/20 text-[#d9381e] text-xs">
              {error}
            </div>
          )}

          {lead && !loading && (
            <>
              {/* Tab Navigation Menu */}
              <div className="flex bg-[#f5f8fa] p-1 rounded-md border border-[#cbd6e2] text-[10px] font-semibold">
                {([
                  { key: "overview", label: "Overview" },
                  { key: "timeline", label: "Timeline" },
                  { key: "calls", label: "Call History" },
                  { key: "assistant", label: "Memory Assistant" },
                  { key: "followups", label: "Follow-Ups" },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setModalTab(t.key)}
                    className={`flex-1 py-1.5 rounded text-center transition-all ${
                      modalTab === t.key
                        ? "bg-[#ff7a59] text-white shadow-xs font-bold"
                        : "text-[#516f90] hover:text-[#2d3e50]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ─── TAB 1: OVERVIEW & INSIGHTS ─── */}
              {modalTab === "overview" && (
                <div className="space-y-4">
                  {/* Profile Details Card */}
                  <div className="minimal-card bg-white p-4 space-y-3.5">
                    <h3 className="text-sm font-bold text-[#1e1e28]">{lead.name}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-[#787774]">
                      <div className="flex items-center gap-2">
                        <EnvelopeSimple size={15} className="text-[#787774]/70 shrink-0" />
                        <span className="font-mono text-[10.5px] truncate">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={15} className="text-[#787774]/70 shrink-0" />
                          <span className="font-mono text-[10.5px] truncate">{lead.phone}</span>
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <Buildings size={15} className="text-[#787774]/70 shrink-0" />
                          <span className="truncate font-semibold text-[#1e1e28]">{lead.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={15} className="text-[#787774]/70 shrink-0" />
                        <span>Created {new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Stage selectors */}
                    <div className="pt-3.5 flex items-center justify-between gap-4 border-t border-[#eaeaea]">
                      <span className="text-xs font-bold text-[#1e1e28]">Pipeline Stage:</span>
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(e.target.value)}
                        className="text-xs bg-white border border-[#eaeaea] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#787774] font-semibold"
                      >
                        {pipelineStages.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AI Lead Insights Panel */}
                  {insights && (
                    <div className="minimal-card bg-white p-4 space-y-4 text-[11px]">
                      <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-2.5">
                        AI Customer Insights
                      </span>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="space-y-0.5">
                          <span className="text-[#787774] font-semibold block">Decision Maker</span>
                          <span className="font-bold text-[#1e1e28]">{insights.decision_maker}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[#787774] font-semibold block">Sentiment</span>
                          <span className="text-[9.5px] font-mono font-bold bg-[#fbfbfa] border border-[#eaeaea] rounded px-1.5 py-0.2">
                            {insights.sentiment}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[#787774] font-semibold block">Risk Level</span>
                          <span
                            className={`text-[9.5px] font-mono font-bold border rounded px-1.5 py-0.2 capitalize ${
                              insights.risk_level === "Low"
                                ? "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                                : insights.risk_level === "Medium"
                                  ? "bg-[#fbf3db] text-[#956400] border-[#956400]/10"
                                  : "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                            }`}
                          >
                            {insights.risk_level}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[#787774] font-semibold block">Last Contact</span>
                          <span className="font-mono text-[#787774]">{insights.last_contact}</span>
                        </div>
                        <div className="col-span-2 space-y-0.5 pt-2 border-t border-[#eaeaea]">
                          <span className="text-[#787774] font-semibold block">Next Action Step</span>
                          <span className="font-bold text-[#1e1e28]">
                            {insights.next_steps?.[0] || "Follow up on proposal"}
                          </span>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <span className="text-[#787774] font-semibold block">Key Objections</span>
                          <div className="flex flex-wrap gap-1">
                            {insights.key_objections?.map((obj: string) => (
                              <span
                                key={obj}
                                className="text-[9px] font-mono font-bold bg-[#f4f3ef] border border-[#eaeaea] text-[#787774] rounded px-1.5 py-0.5"
                              >
                                {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lead Scoring Details Section */}
                  <div className="minimal-card bg-white p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                          Lead Scoring Engine
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-sm font-bold text-[#1e1e28] font-mono">{lead.score}/100</span>
                          <span
                            className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 ${getPriorityBadgeStyles(
                              lead.priority || "Low"
                            )}`}
                          >
                            {lead.priority || "Low"} Priority
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRecalculateScore}
                        disabled={scoringLead}
                        className="button-minimal text-[10px] py-1 px-2.5 flex items-center gap-1.5"
                        data-clickable
                      >
                        {scoringLead ? (
                          <>
                            <CircleNotch size={12} className="animate-spin text-[#1e1e28]" />
                            Scoring...
                          </>
                        ) : (
                          <>
                            <ArrowsClockwise size={12} weight="bold" />
                            Recalculate
                          </>
                        )}
                      </button>
                    </div>

                    {factorData ? (
                      <div className="space-y-3.5 pt-3.5 border-t border-[#eaeaea]">
                        {Object.entries(factorData).map(([key, details]: [string, any]) => {
                          const displayNames: Record<string, string> = {
                            urgency: "Urgency",
                            budget_signal: "Budget Signal",
                            decision_maker: "Decision Maker Presence",
                            engagement: "Engagement Level",
                            sentiment: "Sentiment",
                          };
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-[#1e1e28] font-mono">
                                <span>{displayNames[key] || key}</span>
                                <span className="tabnum">{details.score || 0}/10</span>
                              </div>
                              <div className="w-full bg-[#f4f3ef] rounded-full h-[3px] overflow-hidden">
                                <div
                                  className="bg-[#1e1e28] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${(details.score || 0) * 10}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-[#787774] leading-normal pl-0.5">
                                {details.reason || "No details provided."}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-[#787774]/70 italic py-1 border-t border-[#eaeaea]">
                        No lead scoring factors calculated yet. Click Recalculate to analyze communication signals.
                      </div>
                    )}
                  </div>

                  {/* Manual Lead Prep Planner */}
                  <div className="minimal-card bg-white p-4 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                        Lead Preparation Planner
                      </span>
                      <p className="text-[10px] text-[#787774]/70">
                        Write manual review comments to plan talking topics for your next conversation.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="Write notes about custom integrations, budget boundaries, or features of interest..."
                        className="w-full min-h-[80px] p-2.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774] font-sans resize-none"
                      />
                      <button
                        onClick={handleSavePrep}
                        disabled={submittingPrep || !reviewInput.trim()}
                        className="button-minimal w-full text-xs py-2"
                        data-clickable
                      >
                        {submittingPrep ? "Analyzing Prep & Topics..." : "Save Review & Plan Topics"}
                      </button>
                    </div>

                    {(() => {
                      let talkingPointsList: string[] = [];
                      if (lead?.talking_points) {
                        try {
                          talkingPointsList = JSON.parse(lead.talking_points);
                        } catch (e) {
                          console.error(e);
                        }
                      }

                      return talkingPointsList.length > 0 ? (
                        <div className="pt-3.5 border-t border-[#eaeaea] space-y-3">
                          <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                            Recommended Talking Topics (Groq AI)
                          </span>
                          <div className="space-y-2.5">
                            {talkingPointsList.map((pt, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 text-xs text-[#1e1e28] bg-[#fbfbfa] border border-[#eaeaea] p-3 rounded"
                              >
                                <div className="h-5 w-5 rounded bg-[#f4f3ef] border border-[#eaeaea] flex items-center justify-center shrink-0 mt-0.5 select-none text-[10px] font-bold text-[#1e1e28]">
                                  {idx + 1}
                                </div>
                                <span className="leading-relaxed font-sans">{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* AI Outreach Draft Panel */}
                  <div className="minimal-card bg-white p-4 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                        AI Outreach Draft
                      </span>
                      <p className="text-[10px] text-[#787774]/70">
                        Create personalized outreach content based on the talking points above.
                      </p>
                    </div>

                    {!draftEmail ? (
                      <button
                        onClick={handleGenerateOutreach}
                        disabled={generatingEmail || !lead.talking_points}
                        className="button-minimal w-full text-xs py-2"
                        data-clickable
                      >
                        {generatingEmail ? "Drafting personalized email..." : "Generate AI Outreach Email"}
                      </button>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div className="rounded bg-[#fbfbfa] border border-[#eaeaea] p-4 space-y-2">
                          <div className="text-[9px] font-mono text-[#787774] border-b border-[#eaeaea] pb-2 mb-2 flex justify-between items-center">
                            <span>
                              Subject: <strong className="text-[#1e1e28]">{draftEmail.subject}</strong>
                            </span>
                            <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono font-bold bg-[#e1f3fe] border border-[#1f6c9f]/10 text-[#1f6c9f]">
                              {draftEmail.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#1e1e28] whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto pr-1 font-sans">
                            {draftEmail.body}
                          </p>
                        </div>
                        <p className="text-[9px] text-[#346538] font-mono italic flex items-center gap-1">
                          <CheckCircle size={10} weight="bold" />
                          Draft generated. Lead transitioned to Contacted. View in Outreach Drafts tab.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 2: TIMELINE & MANUAL ACTIVITY ─── */}
              {modalTab === "timeline" && (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5 block">
                      Activity &amp; Communications
                    </span>

                    <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2 border-l-2 border-[#eaeaea] pl-4 py-1">
                      {lead.activities.length === 0 ? (
                        <p className="text-xs text-[#787774]/55 italic py-4">No activity logs recorded yet.</p>
                      ) : (
                        lead.activities.map((act) => (
                          <div key={act.id} className="relative space-y-1">
                            <div className="absolute -left-[24px] top-0.5 h-4.5 w-4.5 rounded bg-white border border-[#eaeaea] flex items-center justify-center shadow-xs">
                              {getActivityIcon(act.type)}
                            </div>

                            <div className="flex items-baseline justify-between gap-4">
                              <span className="text-[9.5px] uppercase font-mono font-bold tracking-wider text-[#787774]/70">
                                {act.type}
                              </span>
                              <span className="text-[9px] text-[#787774]/50 font-mono">
                                {formatDate(act.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-[#1e1e28] font-sans">{act.content}</p>
                          </div>
                        ))
                      )}
                      <div ref={activitiesEndRef} />
                    </div>
                  </div>

                  {/* Log Activity Form */}
                  <form onSubmit={handleLogActivity} className="pt-4 border-t border-[#eaeaea] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1e1e28]">Log Activity Note</span>
                      <div className="flex bg-[#f4f3ef] p-0.5 rounded border border-[#eaeaea]">
                        {["Note", "Call", "Email"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNoteType(type)}
                            className={`text-[9.5px] font-semibold px-2 py-0.75 rounded transition-colors ${
                              noteType === type
                                ? "bg-white text-[#1e1e28] border border-[#eaeaea] shadow-xs"
                                : "text-[#787774] hover:text-[#1e1e28]"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Discussed budget, sent project case study..."
                        disabled={loggingActivity}
                        className="flex-1 px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                      />
                      <button
                        type="submit"
                        disabled={loggingActivity || !noteContent.trim()}
                        className="button-minimal text-xs px-3.5 shrink-0"
                        data-clickable
                      >
                        Log Note
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ─── TAB 3: CALL HISTORY & TRANSCRIPTS ─── */}
              {modalTab === "calls" && (
                <div className="space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5 block">
                    Call Recordings &amp; Transcripts
                  </span>

                  <AudioUploadZone
                    onIngestComplete={async () => {
                      if (lead) {
                        const detailResponse = await api.getLeadById(lead.id);
                        setLead(detailResponse.data);
                        await fetchInsights(lead.id);
                        onStageUpdated();
                      }
                    }}
                  />

                  {/* Transcripts List */}
                  <div className="space-y-3 mt-2 max-h-[220px] overflow-y-auto pr-1">
                    {!lead.transcripts || lead.transcripts.length === 0 ? (
                      <p className="text-[10px] text-[#787774]/55 italic py-6 text-center">
                        No voice call transcriptions logged.
                      </p>
                    ) : (
                      lead.transcripts.map((t) => <TranscriptItem key={t.id} transcript={t} />)
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 4: MEMORY ASSISTANT ─── */}
              {modalTab === "assistant" && (
                <div className="space-y-4 flex flex-col h-[380px]">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5 block">
                    Ask Lead Memory Assistant
                  </span>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 p-3 rounded border border-[#eaeaea] bg-[#fbfbfa] text-xs">
                    {leadMessages.length === 0 ? (
                      <div className="space-y-4 py-4">
                        <div className="text-center space-y-1">
                          <p className="text-[11px] font-bold text-[#1e1e28]">Scoped Customer Intelligence</p>
                          <p className="text-[9.5px] text-[#787774]">
                            Query objections, timeline concern points, or pricing status.
                          </p>
                        </div>

                        {/* Quick Prompts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-w-sm mx-auto">
                          {[
                            "Summarize this lead",
                            "What objections exist?",
                            "What should I do next?",
                            "Has pricing been discussed?",
                            "What are the conversion risks?",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => handleSendLeadQuery(prompt)}
                              className="p-2 rounded border border-[#eaeaea] bg-white hover:border-[#787774] text-[9.5px] text-left text-[#787774] hover:text-[#1e1e28] transition-colors truncate"
                              data-clickable
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      leadMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                          <div
                            className={`p-3 rounded border text-xs leading-relaxed ${
                              m.role === "user"
                                ? "bg-[#f4f3ef] border-[#eaeaea] text-[#1e1e28]"
                                : "bg-[#e1f3fe] border-[#1f6c9f]/10 text-[#1f6c9f]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {sendingLeadQuery && (
                      <div className="flex gap-2 mr-auto items-center text-[10px] text-[#787774]">
                        <CircleNotch size={12} className="animate-spin text-[#1e1e28]" />
                        <span className="font-mono">Searching activities &amp; call records...</span>
                      </div>
                    )}
                  </div>

                  {/* Context Citations */}
                  {(leadSources.length > 0 || recActions.length > 0) && (
                    <div className="grid grid-cols-2 gap-3 shrink-0 text-[10px]">
                      <div className="p-2.5 rounded border border-[#eaeaea] bg-[#fbfbfa] space-y-1">
                        <span className="font-bold text-[#787774] uppercase tracking-wider block font-mono text-[8px]">
                          Recommended Actions
                        </span>
                        <ul className="list-disc pl-3.5 text-[#787774] space-y-0.5 leading-relaxed font-sans">
                          {recActions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded border border-[#eaeaea] bg-[#fbfbfa] space-y-1 overflow-hidden">
                        <span className="font-bold text-[#787774] uppercase tracking-wider block font-mono text-[8px]">
                          Referenced Sources
                        </span>
                        <div className="space-y-1 overflow-y-auto max-h-[50px] pr-0.5">
                          {leadSources.map((source, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center bg-white rounded px-2 py-0.5 text-[9px] border border-[#eaeaea]"
                            >
                              <span className="font-bold text-[#1e1e28] capitalize">{source.type}</span>
                              <span className="font-mono text-[#787774] tabnum">{source.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Query input field */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendLeadQuery();
                    }}
                    className="flex gap-2 shrink-0"
                  >
                    <input
                      value={leadChatText}
                      onChange={(e) => setLeadChatText(e.target.value)}
                      placeholder="e.g. What objections has Elena raised?"
                      disabled={sendingLeadQuery}
                      className="flex-1 px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                    />
                    <button
                      type="submit"
                      disabled={sendingLeadQuery || !leadChatText.trim()}
                      className="button-minimal text-xs px-4 shrink-0"
                      data-clickable
                    >
                      Ask
                    </button>
                  </form>
                </div>
              )}

              {/* ─── TAB 5: FOLLOW-UPS ─── */}
              {modalTab === "followups" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5 block">
                      Scheduled Follow-Ups
                    </span>
                    <button
                      onClick={async () => {
                        if (!lead) return;
                        setLoadingFollowups(true);
                        try {
                          await api.createFollowup({ lead_id: lead.id });
                          await fetchFollowups(lead.id);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoadingFollowups(false);
                        }
                      }}
                      disabled={loadingFollowups}
                      className="button-minimal text-[10px] px-3 py-1 flex items-center gap-1"
                      data-clickable
                    >
                      <Plus size={11} weight="bold" />
                      Suggest Next
                    </button>
                  </div>

                  {loadingFollowups ? (
                    <div className="py-12 text-center text-xs text-[#787774] italic">
                      <CircleNotch size={14} className="animate-spin inline-block mr-1.5 text-[#1e1e28]" />
                      Loading tasks...
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {followups.length === 0 ? (
                        <p className="text-[10px] text-[#787774]/55 italic py-8 text-center">
                          No follow-up tasks scheduled. Click &apos;Suggest Next&apos; to trigger automation.
                        </p>
                      ) : (
                        followups.map((f: any) => {
                          const getIcon = (t: string) => {
                            switch (t) {
                              case "email":
                                return <EnvelopeSimple size={14} className="text-[#1f6c9f]" weight="bold" />;
                              case "call":
                                return <PhoneCall size={14} className="text-[#956400]" weight="bold" />;
                              case "whatsapp":
                                return <WhatsappLogo size={14} className="text-[#346538]" weight="bold" />;
                              case "meeting":
                                return <Chats size={14} className="text-[#1e1e28]" weight="bold" />;
                              default:
                                return <Notebook size={14} className="text-[#787774]" weight="bold" />;
                            }
                          };
                          return (
                            <div
                              key={f.id}
                              className="p-3 rounded border border-[#eaeaea] bg-[#fbfbfa] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#787774] transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                {getIcon(f.followup_type)}
                                <div>
                                  <span className="font-bold text-[#1e1e28]">{f.title}</span>
                                  <span className="text-[10px] text-[#787774]/70 block font-mono tabnum">
                                    Due: {f.scheduled_at.slice(0, 10)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                {f.status === "completed" ? (
                                  <span className="bg-[#edf3ec] border border-[#346538]/10 text-[#346538] text-[8px] font-mono font-bold rounded px-1.5 py-0.5">
                                    Completed
                                  </span>
                                ) : f.status === "cancelled" ? (
                                  <span className="bg-[#f4f3ef] border border-[#eaeaea] text-[#787774] text-[8px] font-mono font-bold rounded px-1.5 py-0.5">
                                    Cancelled
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={async () => {
                                        await api.executeFollowup(f.id);
                                        await fetchFollowups(lead.id);
                                        onStageUpdated();
                                      }}
                                      className="button-minimal text-[9px] px-2.5 py-1"
                                      data-clickable
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const nextDate = new Date(f.scheduled_at);
                                        nextDate.setDate(nextDate.getDate() + 3);
                                        await api.rescheduleFollowup(f.id, nextDate.toISOString());
                                        await fetchFollowups(lead.id);
                                      }}
                                      className="button-minimal-secondary text-[9px] px-2.5 py-1"
                                      data-clickable
                                    >
                                      +3d
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await api.cancelFollowup(f.id);
                                        await fetchFollowups(lead.id);
                                      }}
                                      className="text-[9px] text-[#787774] hover:text-[#9f2f2d] px-2 py-1 font-bold transition-colors"
                                      data-clickable
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TranscriptItem({ transcript }: { transcript: Transcript }) {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="p-3 rounded border border-[#eaeaea] bg-[#fbfbfa] text-[11px] space-y-1.5 hover:border-[#787774] transition-colors">
      <div className="flex items-center justify-between gap-4 border-b border-[#eaeaea] pb-1.5 mb-1.5">
        <span className="font-bold text-[#1e1e28] truncate max-w-[200px]" title={transcript.filename}>
          {transcript.filename}
        </span>
        <div className="flex items-center gap-2 text-[9.5px] text-[#787774]/70 shrink-0 font-mono tabnum">
          <span>{formatDuration(transcript.duration_seconds)}</span>
          <span>•</span>
          <span>{new Date(transcript.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <p className={`text-[#787774] leading-relaxed font-sans ${expanded ? "" : "line-clamp-2"}`}>
        {transcript.transcript_text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[9.5px] text-[#1e1e28] hover:text-[#787774] font-bold select-none"
      >
        {expanded ? "Show Less" : "Read Full Transcript"}
      </button>
    </div>
  );
}
