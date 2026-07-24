"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { Lead } from "@/types";
import LeadCard from "@/components/lead-card";
import AddLeadModal from "@/components/add-lead-modal";
import LeadDetailsModal from "@/components/lead-details-modal";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
  CloudSlash,
  Database,
  CalendarBlank,
  Kanban,
  ListChecks,
  Clock,
  ArrowsClockwise,
  PhoneCall,
  EnvelopeSimple,
  WhatsappLogo,
  Chats,
  Notebook,
  TrendUp,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";

import AudioUploadZone from "@/components/audio-upload-zone";

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Closed"];

const STAGE_CLASSES: Record<string, string> = {
  New: "stage-new",
  Contacted: "stage-contacted",
  Qualified: "stage-qualified",
  Proposal: "stage-proposal",
  Closed: "stage-closed",
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // Tabs & Views
  const [crmView, setCrmView] = useState<"pipeline" | "tasks" | "calendar">("pipeline");

  // Filters & UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // Modal triggers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Follow-Up Dashboard States
  const [dashboardTasks, setDashboardTasks] = useState<any>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [draggedTask, setDraggedTask] = useState<any | null>(null);

  // Load leads from API
  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getLeads();
      setLeads(response.data);
      setIsMock(response.isMock);
    } catch (err: any) {
      setError(err?.message || "Failed to load CRM pipeline.");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      await api.getRecoveryQueue();
      const res = await api.getFollowupDashboard();
      setDashboardTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadLeads();
    loadTasks();
  }, []);

  useEffect(() => {
    if (crmView === "tasks" || crmView === "calendar") {
      loadTasks();
    }
  }, [crmView]);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      (lead.company && lead.company.toLowerCase().includes(q)) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.source && lead.source.toLowerCase().includes(q));
    const matchesScore = lead.score >= minScore;
    return matchesSearch && matchesScore;
  });

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDraggedOverStage(stage);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const leadIdStr = e.dataTransfer.getData("text/plain");
    const leadId = parseInt(leadIdStr, 10);
    if (isNaN(leadId)) return;
    const leadToMove = leads.find((l) => l.id === leadId);
    if (!leadToMove) return;
    if (leadToMove.stage === targetStage) return;
    const previousStage = leadToMove.stage;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l)));
    try {
      await api.updateLeadStage(leadId, targetStage);
    } catch (err) {
      console.error("Failed to sync stage transition. Reverting.", err);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: previousStage } : l)));
    }
  };

  const handleLeadStageUpdated = () => {
    loadLeads();
    loadTasks();
  };

  const handleCreateSuccess = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    loadTasks();
  };

  // Follow-Up Actions
  const handleExecuteFollowup = async (id: number) => {
    try { await api.executeFollowup(id); loadTasks(); } catch (err) { console.error(err); }
  };
  const handleCancelFollowup = async (id: number) => {
    try { await api.cancelFollowup(id); loadTasks(); } catch (err) { console.error(err); }
  };
  const handleRescheduleFollowup = async (id: number, daysOffset: number) => {
    try {
      const newTime = new Date();
      newTime.setDate(newTime.getDate() + daysOffset);
      await api.rescheduleFollowup(id, newTime.toISOString());
      loadTasks();
    } catch (err) { console.error(err); }
  };

  // Calendar computations
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((p) => p - 1); }
    else { setCurrentMonth((p) => p - 1); }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((p) => p + 1); }
    else { setCurrentMonth((p) => p + 1); }
  };
  const getTasksForDate = (dateNum: number) => {
    if (!dashboardTasks) return [];
    const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dateNum).padStart(2, "0")}`;
    const all = [...dashboardTasks.today, ...dashboardTasks.upcoming, ...dashboardTasks.overdue, ...dashboardTasks.completed];
    return all.filter((t: any) => t.scheduled_at.startsWith(targetDateStr));
  };
  const handleCalendarDragStart = (e: React.DragEvent, task: any) => { setDraggedTask(task); };
  const handleCalendarDrop = async (e: React.DragEvent, dateNum: number) => {
    e.preventDefault();
    if (!draggedTask) return;
    const newDate = new Date(currentYear, currentMonth, dateNum, 12, 0, 0);
    try { await api.rescheduleFollowup(draggedTask.id, newDate.toISOString()); loadTasks(); }
    catch (err) { console.error(err); }
    finally { setDraggedTask(null); }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "email": return <EnvelopeSimple size={12} className="text-[#1f6c9f]" />;
      case "call": return <PhoneCall size={12} className="text-[#956400]" />;
      case "whatsapp": return <WhatsappLogo size={12} className="text-[#346538]" />;
      case "meeting": return <Chats size={12} className="text-[#9f2f2d]" />;
      default: return <Notebook size={12} className="text-[#787774]" />;
    }
  };

  // Pipeline summary stats
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.stage !== "New").length;
  const closedLeads = leads.filter((l) => l.stage === "Closed").length;
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((a, l) => a + l.score, 0) / totalLeads) : 0;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════
          HUBSPOT DEALS & PIPELINE HEADER
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#cbd6e2] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff7a59] bg-[#fff1ed] px-2 py-0.5 rounded">
                Beonix OS Pipeline
              </span>
              <span className="text-xs text-[#516f90]">Deals & Contacts</span>
            </div>
            <h1 className="text-xl font-bold text-[#2d3e50] tracking-tight">Sales Opportunities</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#ff7a59] text-white hover:bg-[#ff5c35] active:bg-[#e64f2a] shadow-xs transition-all"
              data-clickable
            >
              <Plus size={15} weight="bold" />
              Add Deal / Lead
            </button>
            <button
              onClick={() => window.location.href = "/crm/import"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-[#cbd6e2] text-[#2d3e50] bg-white hover:bg-[#f5f8fa] transition-all"
              data-clickable
            >
              <Database size={15} className="text-[#516f90]" />
              Import Contacts
            </button>
          </div>
        </div>

        {/* HubSpot Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[#eaf0f6]">
          {[
            { label: "Total Opportunities", value: totalLeads, color: "text-[#2d3e50]" },
            { label: "In Active Contact", value: contactedLeads, color: "text-[#0091ae]" },
            { label: "Closed Deals", value: closedLeads, color: "text-[#00a38d]" },
            { label: "Avg Fit Score", value: `${avgScore}%`, color: "text-[#ff7a59]" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-[10px] text-[#516f90] font-semibold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-xl font-extrabold font-mono tracking-tight ${stat.color} tabular-nums mt-0.5`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sandbox Banner */}
      <AnimatePresence>
        {isMock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-[#e1f3fe] border border-[#1f6c9f]/10 text-[#1f6c9f] rounded-lg flex items-center gap-2.5 text-xs font-medium"
          >
            <CloudSlash size={15} weight="bold" />
            <span>
              <strong className="font-bold">Sandbox mode</strong> — FastAPI offline. Changes simulated in local memory.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ View Toggle Tabs ═══ */}
      <div className="flex bg-white p-1 rounded-lg border border-[#eaeaea] max-w-max">
        {([
          { key: "pipeline" as const, label: "Pipeline", Icon: Kanban },
          { key: "tasks" as const, label: "Follow-Ups", Icon: ListChecks },
          { key: "calendar" as const, label: "Calendar", Icon: CalendarBlank },
        ]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setCrmView(key)}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              crmView === key
                ? "bg-[#f4f3ef] text-[#1e1e28] border border-[#e3e3ea]"
                : "text-[#6b6b72] hover:text-[#1e1e28]"
            }`}
            data-clickable
          >
            <Icon size={14} weight={crmView === key ? "bold" : "regular"} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PIPELINE VIEW
         ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {crmView === "pipeline" && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Audio Upload Zone */}
            <div className="minimal-card bg-white p-5">
              <AudioUploadZone
                onIngestComplete={(leadId) => {
                  loadLeads();
                  setSelectedLeadId(leadId);
                }}
              />
            </div>

            {/* Filter bar */}
            <div className="minimal-card bg-white p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#787774]/40" weight="bold" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter leads by name, email, company..."
                    className="w-full pl-9 pr-4 py-2 bg-[#f7f6f3] border border-[#eaeaea] rounded-md text-xs outline-none focus:border-[#787774]"
                  />
                </div>
                <div className="flex items-center gap-3 border border-[#eaeaea] rounded-md px-3 bg-[#f7f6f3]">
                  <SlidersHorizontal size={14} className="text-[#787774]" weight="bold" />
                  <span className="text-[10px] text-[#787774] font-bold uppercase tracking-wider">Score &ge;</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-24 h-1 bg-[#eaeaea] rounded-full appearance-none outline-none"
                    style={{ accentColor: "#3d5af1" }}
                  />
                  <span className="text-xs font-mono font-bold w-6 text-right tabular-nums text-[#1e1e28]">
                    {minScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Pipeline Columns */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage} className="minimal-card bg-white p-4 min-h-[300px] space-y-3">
                    <div className="h-4 w-1/2 rounded bg-[#f4f3ef] animate-pulse" />
                    <div className="h-20 w-full rounded bg-[#f4f3ef] animate-pulse" />
                    <div className="h-20 w-full rounded bg-[#f4f3ef] animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                {PIPELINE_STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter((lead) => lead.stage === stage);
                  const isDraggingOver = draggedOverStage === stage;

                  return (
                    <div
                      key={stage}
                      onDragOver={(e) => handleDragOver(e, stage)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stage)}
                      className={`${STAGE_CLASSES[stage]} flex flex-col rounded-lg p-3 min-h-[480px] bg-white border ${
                        isDraggingOver ? "border-[#3d5af1]" : "border-[#e3e3ea]"
                      }`}
                    >
                      {/* Column header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#eaeaea]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "var(--stage-color)" }}
                          />
                          <h3 className="font-bold text-xs tracking-tight text-[#1e1e28]">{stage}</h3>
                        </div>
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            background: "var(--stage-bg)",
                            color: "var(--stage-color)",
                          }}
                        >
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[550px] py-0.5">
                        {stageLeads.length === 0 ? (
                          <div className="h-20 flex items-center justify-center rounded border border-dashed border-[#eaeaea] p-4 text-center">
                            <span className="text-[10px] text-[#787774]/50 font-mono">Drop leads here</span>
                          </div>
                        ) : (
                          stageLeads.map((lead) => (
                            <LeadCard
                              key={lead.id}
                              lead={lead}
                              onSelect={(id) => setSelectedLeadId(id)}
                              isSelected={selectedLeadId === lead.id}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            FOLLOW-UP DASHBOARD VIEW
         ═══════════════════════════════════════════════════════════ */}
        {crmView === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Stats */}
            {dashboardTasks && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pending", value: dashboardTasks.stats.pending_count, Icon: Clock, bg: "var(--pastel-blue)", text: "var(--pastel-blue-ink)" },
                  { label: "Overdue", value: dashboardTasks.stats.overdue_count, Icon: Warning, bg: "var(--pastel-red)", text: "var(--pastel-red-ink)" },
                  { label: "Completed", value: dashboardTasks.stats.completed_count, Icon: CheckCircle, bg: "var(--pastel-green)", text: "var(--pastel-green-ink)" },
                  { label: "Success", value: `${dashboardTasks.stats.success_rate}%`, Icon: TrendUp, bg: "var(--pastel-green)", text: "var(--pastel-green-ink)" },
                ].map(({ label, value, Icon, bg, text }, i) => (
                  <div key={label} className="minimal-card bg-white p-5 flex items-center gap-4">
                    <div
                      className="p-2.5 rounded-lg"
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
                      <h3 className="text-xl font-bold font-mono tabular-nums text-[#1e1e28]">
                        {value}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Task Categories */}
            {loadingTasks ? (
              <div className="py-16 text-center text-xs text-[#787774]/50">
                <ArrowsClockwise size={20} className="animate-spin inline-block mr-2" /> Loading follow-ups...
              </div>
            ) : dashboardTasks && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Overdue */}
                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-[#eaeaea] bg-white">
                    <Warning size={14} className="text-[#9f2f2d]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9f2f2d]">
                      Overdue ({dashboardTasks.overdue.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#eaeaea] max-h-[240px] overflow-y-auto p-2">
                    {dashboardTasks.overdue.length === 0 ? (
                      <p className="text-xs text-[#787774]/50 p-4 text-center">No overdue tasks.</p>
                    ) : (
                      dashboardTasks.overdue.map((task: any) => (
                        <TaskRow key={task.id} task={task} onExecute={handleExecuteFollowup} onCancel={handleCancelFollowup} onReschedule={handleRescheduleFollowup} getTaskIcon={getTaskIcon} />
                      ))
                    )}
                  </div>
                </div>

                {/* Today */}
                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-[#eaeaea] bg-white">
                    <Clock size={14} className="text-[#1e1e28]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">
                      Today ({dashboardTasks.today.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#eaeaea] max-h-[240px] overflow-y-auto p-2">
                    {dashboardTasks.today.length === 0 ? (
                      <p className="text-xs text-[#787774]/50 p-4 text-center">No follow-ups scheduled for today.</p>
                    ) : (
                      dashboardTasks.today.map((task: any) => (
                        <TaskRow key={task.id} task={task} onExecute={handleExecuteFollowup} onCancel={handleCancelFollowup} onReschedule={handleRescheduleFollowup} getTaskIcon={getTaskIcon} />
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming */}
                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-[#eaeaea] bg-white">
                    <CalendarBlank size={14} className="text-[#787774]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#787774]">
                      Upcoming ({dashboardTasks.upcoming.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#eaeaea] max-h-[240px] overflow-y-auto p-2">
                    {dashboardTasks.upcoming.length === 0 ? (
                      <p className="text-xs text-[#787774]/50 p-4 text-center">No upcoming tasks.</p>
                    ) : (
                      dashboardTasks.upcoming.map((task: any) => (
                        <TaskRow key={task.id} task={task} onExecute={handleExecuteFollowup} onCancel={handleCancelFollowup} onReschedule={handleRescheduleFollowup} getTaskIcon={getTaskIcon} />
                      ))
                    )}
                  </div>
                </div>

                {/* Completed */}
                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-[#eaeaea] bg-white">
                    <CheckCircle size={14} className="text-[#346538]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#346538]">
                      Completed ({dashboardTasks.completed.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#eaeaea] max-h-[240px] overflow-y-auto p-2">
                    {dashboardTasks.completed.length === 0 ? (
                      <p className="text-xs text-[#787774]/50 p-4 text-center">No completed tasks yet.</p>
                    ) : (
                      dashboardTasks.completed.map((task: any) => (
                        <div key={task.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#f7f6f3] transition-colors rounded">
                          <div className="flex items-center gap-2">
                            {getTaskIcon(task.followup_type)}
                            <div>
                              <span className="font-semibold text-[#1e1e28]">{task.title}</span>
                              <span className="text-[10px] text-[#787774] block">Lead: {task.lead_name}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#edf3ec] text-[#346538] border border-[#346538]/10">
                            Completed
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CALENDAR VIEW
         ═══════════════════════════════════════════════════════════ */}
        {crmView === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Month header */}
            <div className="minimal-card bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">
                  {new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="button-minimal-secondary py-1 px-3 text-[10px]" data-clickable>Prev</button>
                  <button onClick={handleNextMonth} className="button-minimal-secondary py-1 px-3 text-[10px]" data-clickable>Next</button>
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="minimal-card bg-white p-0 overflow-hidden">
              {/* Weekdays */}
              <div className="grid grid-cols-7 text-center text-[9px] font-bold uppercase tracking-wider text-[#787774] py-3 bg-[#faf9f6] border-b border-[#eaeaea]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 min-h-[380px]">
                {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-[#eaeaea] bg-[#fbfbfa]" />
                ))}

                {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, i) => {
                  const dateNum = i + 1;
                  const dateTasks = getTasksForDate(dateNum);

                  return (
                    <div
                      key={`day-${dateNum}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleCalendarDrop(e, dateNum)}
                      className="p-2 hover:bg-[#f7f6f3] transition-colors border-r border-b border-[#eaeaea] flex flex-col min-h-[80px]"
                    >
                      <span className="text-[10px] font-mono font-bold text-[#787774]/55">{dateNum}</span>
                      <div className="flex-1 space-y-1 mt-1 overflow-y-auto max-h-[60px]">
                        {dateTasks.map((task: any) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleCalendarDragStart(e, task)}
                            onClick={() => setSelectedLeadId(task.lead_id)}
                            className={`p-1 rounded text-[9px] font-bold border flex items-center justify-between transition-colors ${
                              task.status === "completed"
                                ? "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                                : task.status === "overdue"
                                  ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                  : "bg-[#e1f3fe] text-[#1f6c9f] border-[#1f6c9f]/10"
                            }`}
                            data-clickable
                          >
                            <span className="truncate max-w-[52px]" title={task.title}>{task.title}</span>
                            {getTaskIcon(task.followup_type)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddLeadModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={handleCreateSuccess} />
      <LeadDetailsModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onStageUpdated={handleLeadStageUpdated} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK ROW SUBCOMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface TaskRowProps {
  task: any;
  onExecute: (id: number) => void;
  onCancel: (id: number) => void;
  onReschedule: (id: number, daysOffset: number) => void;
  getTaskIcon: (type: string) => React.ReactNode;
}

function TaskRow({ task, onExecute, onCancel, onReschedule, getTaskIcon }: TaskRowProps) {
  return (
    <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs hover:bg-[#f7f6f3] transition-colors rounded">
      <div className="flex items-center gap-2.5">
        {getTaskIcon(task.followup_type)}
        <div>
          <span className="font-semibold text-[#1e1e28]">{task.title}</span>
          <span className="text-[10px] text-[#787774] block">
            Lead: {task.lead_name} • Due: {task.scheduled_at.slice(0, 10)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-center">
        <button
          onClick={() => onExecute(task.id)}
          className="button-minimal px-3 py-1 text-[9px] font-bold rounded"
          data-clickable
        >
          Execute
        </button>
        <button
          onClick={() => onReschedule(task.id, 3)}
          className="button-minimal-secondary px-3 py-1 text-[9px] font-bold rounded"
          data-clickable
        >
          +3d
        </button>
        <button
          onClick={() => onCancel(task.id)}
          className="px-3 py-1 text-[9px] font-bold text-[#787774] hover:text-[#9f2f2d] transition-colors"
          data-clickable
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
