"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ShieldCheck,
  Warning,
  ArrowsClockwise,
  ClockCounterClockwise,
  Calendar,
  Shield,
  FileText,
  Plus,
  X,
  Paperclip,
  Folder,
  Sliders,
  Chats,
  Circle,
  MagnifyingGlass,
} from "@phosphor-icons/react";

interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  status: "Allowed" | "Flagged";
}

const initialAuditLogs: AuditLog[] = [
  {
    id: "LOG-4902",
    user: "Suryoday Pratapsingh",
    action: "Updated Lead Stage (New -> Contacted)",
    target: "Lead #102",
    ip: "192.168.1.42",
    timestamp: "5 mins ago",
    status: "Allowed",
  },
  {
    id: "LOG-4901",
    user: "Suryoday Pratapsingh",
    action: "Bulk Index Document Trigger",
    target: "Collection: leads_context_memory",
    ip: "192.168.1.42",
    timestamp: "12 mins ago",
    status: "Allowed",
  },
  {
    id: "LOG-4900",
    user: "System Webhook",
    action: "Created New Lead Entity",
    target: "Lead #101",
    ip: "85.22.109.4",
    timestamp: "1 hour ago",
    status: "Allowed",
  },
  {
    id: "LOG-4899",
    user: "Unknown Guest",
    action: "API Query (Authentication Error)",
    target: "/leads/export",
    ip: "203.0.113.88",
    timestamp: "3 hours ago",
    status: "Flagged",
  },
];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "requirements" | "calendar" | "risks" | "documents" | "ai" | "soc2">("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Form states
  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("GST");
  const [reqDueDate, setReqDueDate] = useState("");
  const [reqOwner, setReqOwner] = useState("");

  const [docReqId, setDocReqId] = useState("");
  const [docFilename, setDocFilename] = useState("");

  // AI Advisor Chat Box
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // SOC2 tab states
  const [logs, setLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [controls, setControls] = useState([
    { id: 1, name: "Data Encryption at Rest (AES-256 for SQLite)", active: true },
    { id: 2, name: "Vector Index Isolation (Chroma Namespaces)", active: true },
    { id: 3, name: "Multi-factor authentication (MFA) enforce", active: false },
    { id: 4, name: "SOC2 Trust Criteria Log Rotation", active: true },
    { id: 5, name: "GDPR Right to Be Forgotten Lead Wipe", active: true },
  ]);

  const toggleControl = (id: number) => {
    setControls((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getComplianceDashboard();
      setData(res.data);
      setIsMock(res.isMock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle || !reqCategory || !reqDueDate || !reqOwner) return;
    try {
      await api.createComplianceRequirement({
        title: reqTitle,
        category: reqCategory,
        due_date: new Date(reqDueDate).toISOString(),
        owner: reqOwner,
        status: "pending",
      });
      setReqModalOpen(false);
      setReqTitle("");
      setReqDueDate("");
      setReqOwner("");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docReqId || !docFilename) return;
    try {
      await api.uploadComplianceDocument({
        requirement_id: parseInt(docReqId, 10),
        filename: docFilename,
      });
      setDocModalOpen(false);
      setDocReqId("");
      setDocFilename("");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskComplianceAi = (query: string) => {
    setAiQuery(query);
    setLoadingAi(true);
    setAiResponse(null);

    setTimeout(() => {
      setLoadingAi(false);
      if (query.includes("due")) {
        setAiResponse(
          "Filings due this month:\n1. Q2 GST Filing - Due in 2 days (At Risk).\n2. Annual MCA Audit Return - Due in 5 days (Pending)."
        );
      } else if (query.includes("risk")) {
        setAiResponse(
          "High risk deadlines:\n- Q1 TDS Filing is 10 days past due (Critical Risk). Please review late filing fees immediately.\n- Q2 GST Filing has 2 days remaining and has no verified document uploaded (High Risk)."
        );
      } else if (query.includes("missing")) {
        setAiResponse(
          "Missing documents:\n- Q2 GST Filing has no verified return statement certificate uploaded.\n- Q1 TDS Filing does not contain any challan payment receipt."
        );
      } else {
        setAiResponse(
          "Action Priorities:\n1. Submit Q1 TDS Filing (Overdue 10 days).\n2. Upload GST Return Certificate (Due in 2 days).\n3. Complete internal policy renewal review."
        );
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER & TAB SWITCHER ─── */}
      <div className="minimal-card bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-overline mb-2 inline-block">Risk Intelligence</span>
            <h1 className="text-display-md text-foreground">Compliance &amp; Risk</h1>
            <p className="text-xs text-[#787774] mt-1 max-w-md">
              Track regulatory deadlines, execute compliance checks, and audit file access control traces.
            </p>
          </div>

          <div className="flex flex-wrap bg-[#f4f3ef] p-1 rounded-lg border border-[#eaeaea]">
            {[
              { id: "dashboard", label: "Dashboard", icon: Folder },
              { id: "requirements", label: "Requirements", icon: FileText },
              { id: "calendar", label: "Calendar", icon: Calendar },
              { id: "risks", label: "Risk Center", icon: Shield },
              { id: "documents", label: "Documents", icon: Paperclip },
              { id: "ai", label: "AI Advisor", icon: Chats },
              { id: "soc2", label: "SOC2", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-[#1e1e28] border border-[#eaeaea] shadow-xs"
                      : "text-[#787774] hover:text-[#1e1e28]"
                  }`}
                >
                  <Icon size={12} weight="bold" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sandbox Banner */}
      {isMock && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-[#fbfbfa] border border-[#eaeaea] rounded-lg text-xs">
          <ClockCounterClockwise size={14} className="text-[#787774] shrink-0" weight="bold" />
          <span className="text-[#787774] font-medium">
            <strong className="font-bold text-[#1e1e28]">Sandbox mode</strong> — Regulatory parameters simulated in browser local storage.
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
          <ArrowsClockwise size={14} className="animate-spin text-[#1e1e28]" />
          <span className="font-mono">Auditing regulatory parameters...</span>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* ─── VIEW 1: COMPLIANCE DASHBOARD ─── */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Upcoming (7 days)", value: data.stats.upcoming_deadlines, Icon: Calendar, bg: "var(--pastel-blue)", text: "var(--pastel-blue-ink)" },
                    { label: "Overdue Tasks", value: data.stats.overdue_items, Icon: Warning, bg: "var(--pastel-red)", text: "var(--pastel-red-ink)" },
                    { label: "Risk Warnings", value: data.stats.risk_alerts, Icon: Shield, bg: "var(--pastel-yellow)", text: "var(--pastel-yellow-ink)" },
                    { label: "Compliance Score", value: `${data.stats.compliance_score}%`, Icon: ShieldCheck, bg: "var(--pastel-green)", text: "var(--pastel-green-ink)" },
                  ].map(({ label, value, Icon, bg, text }) => (
                    <div key={label} className="minimal-card bg-white p-5 flex items-center gap-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: bg,
                          color: text,
                        }}
                      >
                        <Icon size={16} weight="bold" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#787774] font-semibold uppercase tracking-wider">
                          {label}
                        </p>
                        <h3 className="text-xl font-bold font-mono text-[#1e1e28] mt-0.5 tabnum">{value}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Critical Alert summary and breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Critical Risks alerts queue */}
                  <div className="lg:col-span-2 minimal-card bg-white p-5">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-3 mb-4">
                      Compliance Priority Actions
                    </span>

                    <div className="space-y-3.5">
                      {data.risks.length === 0 ? (
                        <p className="text-xs text-[#787774] italic py-6 text-center">
                          No active priority risk alerts. All checks compliant.
                        </p>
                      ) : (
                        data.risks.map((risk: any) => (
                          <div
                            key={risk.id}
                            className="p-4 border border-[#eaeaea] bg-[#fbfbfa] rounded flex items-start gap-3.5"
                          >
                            <div
                              className={`p-2 rounded text-white shrink-0 ${
                                risk.severity === "critical"
                                  ? "bg-[#9f2f2d]"
                                  : risk.severity === "high"
                                    ? "bg-[#956400]"
                                    : "bg-[#1f6c9f]"
                              }`}
                            >
                              <Warning size={14} weight="bold" />
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex gap-2 items-center">
                                <span className="font-bold text-[#1e1e28]">{risk.description}</span>
                                <span
                                  className={`text-[8.5px] font-mono font-bold border rounded px-1.5 py-0.2 uppercase ${
                                    risk.severity === "critical"
                                      ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                      : "bg-[#fbf3db] text-[#956400] border-[#956400]/10"
                                  }`}
                                >
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="text-[#787774] leading-relaxed font-sans">{risk.recommendation}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Timeline Checklist */}
                  <div className="minimal-card bg-white p-5">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-3 mb-4">
                      Timeline Checklist
                    </span>

                    <div className="space-y-3 font-mono text-[9.5px]">
                      {data.requirements.map((r: any) => (
                        <div key={r.id} className="flex justify-between items-center border-b border-[#eaeaea] pb-2.5">
                          <div className="space-y-0.5">
                            <span className="font-sans font-bold text-[#1e1e28] block">{r.title}</span>
                            <span className="text-[#787774] block tabnum">{r.due_date.slice(0, 10)}</span>
                          </div>
                          <span
                            className={`text-[8px] font-mono font-bold rounded px-1.5 py-0.5 border capitalize ${
                              r.status === "compliant"
                                ? "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                                : r.status === "overdue"
                                  ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                  : "bg-[#e1f3fe] text-[#1f6c9f] border-[#1f6c9f]/10"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: REQUIREMENTS GRID ─── */}
            {activeTab === "requirements" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#787774]" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search requirement name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                    />
                  </div>
                  <button onClick={() => setReqModalOpen(true)} className="button-minimal text-xs" data-clickable>
                    <Plus size={12} weight="bold" />
                    New Requirement
                  </button>
                </div>

                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                          <th className="p-4 pl-5 font-bold">Title</th>
                          <th className="p-4 font-bold">Category</th>
                          <th className="p-4 font-bold">Due Date</th>
                          <th className="p-4 font-bold">Owner</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 pr-5 text-right font-bold">Documents</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                        {data.requirements
                          .filter((r: any) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((r: any) => (
                            <tr key={r.id} className="hover:bg-[#f7f6f3]/30 transition-colors">
                              <td className="p-4 pl-5 font-bold text-[#1e1e28] font-sans text-xs">{r.title}</td>
                              <td className="p-4 font-sans">
                                <Badge variant="outline" className="text-[10px] rounded border-[#eaeaea] bg-[#f4f3ef] text-[#787774] font-semibold">
                                  {r.category}
                                </Badge>
                              </td>
                              <td className="p-4 text-[#787774] tabnum">{r.due_date.slice(0, 10)}</td>
                              <td className="p-4 font-sans text-[#787774]">{r.owner}</td>
                              <td className="p-4 font-sans">
                                <span
                                  className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-2 py-0.5 border ${
                                    r.status === "compliant"
                                      ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                      : r.status === "overdue"
                                        ? "bg-[#fdebec] border-[#9f2f2d]/10 text-[#9f2f2d]"
                                        : "bg-[#e1f3fe] border-[#1f6c9f]/10 text-[#1f6c9f]"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right font-sans">
                                <button
                                  onClick={() => {
                                    setDocReqId(String(r.id));
                                    setDocModalOpen(true);
                                  }}
                                  className="button-minimal-secondary text-[9px] py-1 px-2.5"
                                  data-clickable
                                >
                                  Upload Doc
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: CALENDAR TAB ─── */}
            {activeTab === "calendar" && (
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                  Upcoming Regulatory Schedule
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {["This Week", "Next Week", "Later This Month"].map((bracket, bIdx) => (
                    <div key={bracket} className="minimal-card bg-white p-0 overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#eaeaea] bg-[#faf9f6]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">{bracket}</h3>
                      </div>
                      <div className="p-4 space-y-3.5 text-xs">
                        {data.requirements.filter((r: any) => {
                          const due = new Date(r.due_date);
                          const today = new Date();
                          const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                          if (bIdx === 0) return diffDays >= -14 && diffDays <= 3;
                          if (bIdx === 1) return diffDays > 3 && diffDays <= 10;
                          return diffDays > 10;
                        }).length === 0 ? (
                          <p className="text-[10px] text-[#787774]/55 italic py-6 text-center font-mono">
                            No compliance tasks scheduled.
                          </p>
                        ) : (
                          data.requirements
                            .filter((r: any) => {
                              const due = new Date(r.due_date);
                              const today = new Date();
                              const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                              if (bIdx === 0) return diffDays >= -14 && diffDays <= 3;
                              if (bIdx === 1) return diffDays > 3 && diffDays <= 10;
                              return diffDays > 10;
                            })
                            .map((r: any) => (
                              <div
                                key={r.id}
                                className="p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] space-y-2 hover:border-[#787774] transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[#1e1e28]">{r.title}</span>
                                  <Badge variant="outline" className="text-[9.5px] rounded border-[#eaeaea] bg-[#f4f3ef] text-[#787774] font-medium">
                                    {r.category}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center font-mono text-[9px] text-[#787774]">
                                  <span className="tabnum">Due: {r.due_date.slice(0, 10)}</span>
                                  <span className="capitalize">{r.status}</span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 4: RISK CENTER ─── */}
            {activeTab === "risks" && (
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                  Compliance Risk Audits
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.risks.length === 0 ? (
                    <p className="text-xs text-[#787774]/55 italic py-6 text-center col-span-2 font-mono">
                      All controls compliant. No risks identified.
                    </p>
                  ) : (
                    data.risks.map((risk: any) => (
                      <div key={risk.id} className="minimal-card bg-white p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3 mb-3">
                            <span className="font-bold text-[#1e1e28] uppercase tracking-wider text-[10px] pl-1 font-mono">
                              Compliance Alert
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 capitalize ${
                                risk.severity === "critical"
                                  ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                  : "bg-[#fbf3db] text-[#956400] border-[#956400]/10"
                              }`}
                            >
                              {risk.severity} Severity
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-[#787774] block font-bold uppercase tracking-wider">
                              Identified Risk
                            </span>
                            <p className="text-[#1e1e28] leading-relaxed font-sans text-xs">{risk.description}</p>
                          </div>
                          <div className="space-y-1.5 pt-2">
                            <span className="text-[9px] font-mono text-[#787774] block font-bold uppercase tracking-wider">
                              Mitigation Steps
                            </span>
                            <p className="text-[#787774] leading-relaxed font-sans text-xs">{risk.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 5: DOCUMENT REPOSITORY ─── */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                    Compliance Filings Archive
                  </span>
                  <button onClick={() => setDocModalOpen(true)} className="button-minimal text-xs" data-clickable>
                    <Plus size={12} weight="bold" />
                    Upload Document
                  </button>
                </div>

                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                          <th className="p-4 pl-5 font-bold">Doc ID</th>
                          <th className="p-4 font-bold">Filename</th>
                          <th className="p-4 font-bold">Upload Date</th>
                          <th className="p-4 pr-5 font-bold">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                        {data.documents.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-[#787774] italic">
                              No filings files verified yet.
                            </td>
                          </tr>
                        ) : (
                          data.documents.map((doc: any) => (
                            <tr key={doc.id} className="hover:bg-[#f7f6f3]/30 transition-colors">
                              <td className="p-4 pl-5">#{doc.id}</td>
                              <td className="p-4 font-sans font-semibold flex items-center gap-2 text-[#1e1e28]">
                                <Paperclip size={14} className="text-[#787774]/70" />
                                {doc.filename}
                              </td>
                              <td className="p-4 text-[#787774] tabnum">{doc.upload_date.slice(0, 10)}</td>
                              <td className="p-4 pr-5 font-sans">
                                <span
                                  className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-2 py-0.5 border ${
                                    doc.verification_status === "verified"
                                      ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                      : "bg-[#f4f3ef] border-[#eaeaea] text-[#787774]"
                                  }`}
                                >
                                  {doc.verification_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 6: AI ADVISOR ─── */}
            {activeTab === "ai" && (
              <div className="max-w-2xl mx-auto">
                <div className="minimal-card bg-white p-5">
                  <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3 mb-4">
                    <Chats size={18} className="text-[#1e1e28]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">
                      AI Compliance Advisor
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold">
                        Suggested Audits
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "What filings are due this month?",
                          "Which deadlines are at risk?",
                          "What documents are missing?",
                          "What should we prioritize?",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => handleAskComplianceAi(q)}
                            className="button-minimal-secondary text-[10px] px-3.5 py-1.5"
                            data-clickable
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {loadingAi && (
                      <div className="text-center italic text-[#787774]/70 py-4 font-mono text-[9px]">
                        <ArrowsClockwise size={14} className="animate-spin inline-block mr-1.5 text-[#1e1e28]" />
                        Auditing regulatory logs...
                      </div>
                    )}

                    {aiResponse && (
                      <div className="p-4 border border-[#eaeaea] rounded bg-[#fbfbfa] leading-relaxed font-sans text-xs text-[#1e1e28] whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 7: IMMUTABLE SECURITY & SOC2 AUDIT TAB ─── */}
            {activeTab === "soc2" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Security Controls Checklist */}
                <div className="lg:col-span-1 minimal-card bg-white p-5 space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-3 mb-1 pl-1">
                    Security Control Checklist
                  </span>
                  <div className="space-y-2.5">
                    {controls.map((ctrl) => (
                      <button
                        key={ctrl.id}
                        onClick={() => toggleControl(ctrl.id)}
                        className="w-full flex items-center justify-between p-3 rounded bg-[#fbfbfa] border border-[#eaeaea] hover:bg-[#f4f3ef]/30 text-left transition-colors cursor-pointer"
                        data-clickable
                      >
                        <span className="text-xs font-semibold text-[#1e1e28] pr-4 leading-normal font-sans">
                          {ctrl.name}
                        </span>
                        {ctrl.active ? (
                          <ShieldCheck size={18} weight="bold" className="text-[#346538] shrink-0" />
                        ) : (
                          <Circle size={18} className="text-[#eaeaea] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security Audit Logs */}
                <div className="lg:col-span-2 minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#eaeaea] flex items-center justify-between bg-[#faf9f6]">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                      SOC2 Security Audit Trail
                    </span>
                    <ClockCounterClockwise size={16} className="text-[#787774]" />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#eaeaea] bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider">
                          <th className="p-4 pl-5 font-bold">Log ID</th>
                          <th className="p-4 font-bold">Actor</th>
                          <th className="p-4 font-bold">Action</th>
                          <th className="p-4 font-bold">Target</th>
                          <th className="p-4 font-bold">IP Address</th>
                          <th className="p-4 font-bold">Time</th>
                          <th className="p-4 pr-5 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#f7f6f3]/30 transition-colors">
                            <td className="p-4 pl-5 text-[#787774]/70 font-semibold">{log.id}</td>
                            <td className="p-4 font-sans text-[#1e1e28] font-semibold">{log.user}</td>
                            <td className="p-4 font-sans text-[#787774] truncate max-w-[150px]">{log.action}</td>
                            <td className="p-4 text-[#787774] truncate max-w-[130px]">{log.target}</td>
                            <td className="p-4 text-[#787774]/60">{log.ip}</td>
                            <td className="p-4 font-sans text-[#787774]/60 tabnum">{log.timestamp}</td>
                            <td className="p-4 pr-5 font-sans">
                              <span
                                className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-2 py-0.5 border ${
                                  log.status === "Allowed"
                                    ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                    : "bg-[#fdebec] border-[#9f2f2d]/10 text-[#9f2f2d]"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ─── REQUIREMENT CREATE MODAL ─── */}
      <Dialog open={reqModalOpen} onOpenChange={setReqModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#eaeaea] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">New Compliance Requirement</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">Schedule regulatory filings or policy audit tasks.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequirement} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Requirement Title</label>
              <input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g. Q2 GST Return Filing"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Requirement Category</label>
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value)}
                className="w-full text-xs bg-white border border-[#eaeaea] rounded p-2 focus:outline-none"
              >
                <option value="GST">GST Filing</option>
                <option value="MCA">MCA Audit Returns</option>
                <option value="Tax">Income Tax / TDS</option>
                <option value="Payroll">Payroll Obligations</option>
                <option value="Internal Policy">Internal Policy Renewal</option>
                <option value="Contract Renewal">Contract / License Expiration</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Due Date Deadline</label>
              <input
                type="date"
                value={reqDueDate}
                onChange={(e) => setReqDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Owner (Assignee)</label>
              <input
                value={reqOwner}
                onChange={(e) => setReqOwner(e.target.value)}
                placeholder="e.g. Finance Manager"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <button type="submit" className="button-minimal w-full h-10 mt-2 text-xs" data-clickable>
              Save Requirement
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DOCUMENT UPLOAD MODAL ─── */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#eaeaea] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">Upload Verification Document</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">Attach filing certificates or audits receipts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadDocument} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Target Requirement ID</label>
              <input
                value={docReqId}
                onChange={(e) => setDocReqId(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Filename (Verification Receipt)</label>
              <input
                value={docFilename}
                onChange={(e) => setDocFilename(e.target.value)}
                placeholder="e.g. gst_q2_receipt.pdf"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <button type="submit" className="button-minimal w-full h-10 mt-2 text-xs" data-clickable>
              Upload Document
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
