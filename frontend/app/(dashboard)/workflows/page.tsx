"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

import { motion } from "framer-motion";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  CircleNotch,
  Play,
  ArrowRight,
  Lightning,
  Gear,
  Cpu,
  Check,
  TrendUp,
  Warning,
  CheckCircle,
  Clock,
  X,
  EnvelopeSimple,
  WhatsappLogo,
  PhoneCall,
  Copy,
  ArrowsClockwise,
  Plus,
  Trash,
  FloppyDisk,
  Terminal,
} from "@phosphor-icons/react";

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  description: string;
}

const NODE_LIBRARY = {
  triggers: [
    { type: "New Lead", desc: "Fires when a new lead enters the CRM" },
    { type: "Lead Updated", desc: "Fires when lead details are modified" },
    { type: "Lead Stage Changed", desc: "Fires when a lead transitions pipeline columns" },
    { type: "Invoice Overdue", desc: "Fires when invoice payment exceeds due dates" },
    { type: "New Document Uploaded", desc: "Fires when knowledge base docs are uploaded" },
  ],
  conditions: [
    { type: "Score Greater Than", desc: "Check if AI qualification score > threshold" },
    { type: "Stage Equals", desc: "Check if pipeline column matches parameter" },
    { type: "Risk Level Equals", desc: "Check if re-engagement risk level matches tier" },
    { type: "Days Since Activity", desc: "Check inactivity duration elapsed" },
  ],
  actions: [
    { type: "Create Follow-Up", desc: "Schedules automated re-engagement tasks" },
    { type: "Create Recovery Case", desc: "Adds opportunities to the Recovery Queue" },
    { type: "Send Notification", desc: "Logs systemic activity timeline notes" },
    { type: "Update Stage", desc: "Updates pipeline column target stage" },
  ],
};

export default function WorkflowsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"orchestrator" | "recovery">("orchestrator");

  const [viewMode, setViewMode] = useState<"dashboard" | "builder">("dashboard");
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Execution History monitor
  const [execHistory, setExecHistory] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Recovery Engine Tab States
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [followupDrafts, setFollowupDrafts] = useState<any | null>(null);
  const [followupTab, setFollowupTab] = useState<"email" | "whatsapp" | "call">("email");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchWorkflows();
    fetchQueue();
  }, []);

  const fetchWorkflows = async () => {
    setLoadingWorkflows(true);
    try {
      const res = await api.getWorkflows();
      setWorkflows(res.data);
      setIsMock(res.isMock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await api.getRecoveryQueue();
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSelectCase = async (caseRecord: any) => {
    setSelectedCase(caseRecord);
    setLoadingDetails(true);
    setFollowupDrafts(null);
    setFollowupTab("email");
    try {
      const res = await api.getFollowupDrafts(caseRecord.lead_id);
      setFollowupDrafts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResolveCase = async (caseId: number, status: "executed" | "reviewed" | "dismissed") => {
    try {
      await api.resolveRecoveryCase(caseId, status);
      setQueue((prev) => prev.filter((c) => c.id !== caseId));
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase(null);
        setFollowupDrafts(null);
      }
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleOpenBuilder = async (wf: any) => {
    setSelectedWorkflow(wf);
    setViewMode("builder");
    setSelectedNodeId(null);
    setValidationErrors([]);

    const initialNodes = wf.nodes.map((node: any, idx: number) => {
      const isTrigger =
        node.node_type.startsWith("New") ||
        node.node_type.includes("Uploaded") ||
        node.node_type.includes("Event") ||
        node.node_type.includes("Overdue");
      const isCondition =
        node.node_type.includes("Greater") || node.node_type.includes("Equals") || node.node_type.includes("Activity");

      return {
        id: node.id,
        type: "default",
        position: { x: 100 + (idx % 2) * 220, y: 100 + Math.floor(idx / 2) * 110 },
        data: {
          label: `${node.node_type}`,
          node_type: node.node_type,
          config: node.config || {},
        },
        style: {
          background: isTrigger
            ? "var(--pastel-blue)"
            : isCondition
              ? "var(--pastel-yellow)"
              : "var(--pastel-green)",
          border: isTrigger
            ? "1px solid var(--pastel-blue-ink)"
            : isCondition
              ? "1px solid var(--pastel-yellow-ink)"
              : "1px solid var(--pastel-green-ink)",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: "600",
          color: "#1e1e28",
          padding: "10px",
          width: 170,
        },
      };
    });

    const initialEdges = wf.edges.map((edge: any, idx: number) => ({
      id: `edge_${idx}`,
      source: edge.source_node,
      target: edge.target_node,
      animated: true,
      style: { stroke: "#1e1e28", opacity: 0.4 },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);

    try {
      const res = await api.getWorkflowExecutions(wf.id);
      setExecHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewWorkflow = () => {
    const emptyWf = {
      name: "New Custom Automation",
      description: "Define triggers and outcomes visually.",
      status: "draft",
      nodes: [],
      edges: [],
    };
    handleOpenBuilder(emptyWf);
  };

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#1e1e28", opacity: 0.4 } }, eds)
      ),
    [setEdges]
  );

  const handleAddNodeToCanvas = (nodeType: string) => {
    const newNodeId = `node_${Date.now()}`;
    const isTrigger =
      nodeType.startsWith("New") ||
      nodeType.includes("Uploaded") ||
      nodeType.includes("Event") ||
      nodeType.includes("Overdue");
    const isCondition =
      nodeType.includes("Greater") || nodeType.includes("Equals") || nodeType.includes("Activity");

    const newNode: Node = {
      id: newNodeId,
      type: "default",
      position: { x: 150, y: 150 },
      data: {
        label: nodeType,
        node_type: nodeType,
        config: {},
      },
      style: {
        background: isTrigger
          ? "var(--pastel-blue)"
          : isCondition
            ? "var(--pastel-yellow)"
            : "var(--pastel-green)",
        border: isTrigger
          ? "1px solid var(--pastel-blue-ink)"
          : isCondition
            ? "1px solid var(--pastel-yellow-ink)"
            : "1px solid var(--pastel-green-ink)",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#1e1e28",
        padding: "10px",
        width: 170,
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleUpdateNodeConfig = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                [key]: value,
              },
            },
          };
        }
        return node;
      })
    );
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;
    const formattedNodes = nodes.map((node) => ({
      id: node.id,
      node_type: node.data.node_type,
      config: node.data.config,
    }));
    const formattedEdges = edges.map((edge) => ({
      source_node: edge.source,
      target_node: edge.target,
    }));

    try {
      const updatedWf = {
        ...selectedWorkflow,
        nodes: formattedNodes,
        edges: formattedEdges,
      };
      await api.createWorkflow(updatedWf);
      fetchWorkflows();
      setViewMode("dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualExecute = async () => {
    if (!selectedWorkflow) return;
    setExecuting(true);
    setValidationErrors([]);
    try {
      const res = await api.executeWorkflow(selectedWorkflow.id, {});
      if (res.data && res.data.errors) {
        setValidationErrors(res.data.errors);
      } else {
        const historyRes = await api.getWorkflowExecutions(selectedWorkflow.id);
        setExecHistory(historyRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const selectedNodeObj = nodes.find((n) => n.id === selectedNodeId);
  const oppCount = queue.length;
  const highRiskCount = queue.filter((c) => c.risk_level === "high").length;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* ─── HUBSPOT WORKFLOWS HEADER & TAB SWITCHER ─── */}
      <div className="bg-white border border-[#cbd6e2] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6a2b95] bg-[#f5eefb] px-2 py-0.5 rounded">
                Beonix OS Automations
              </span>
              <span className="text-xs text-[#516f90]">Sequence & Workflows</span>
            </div>
            <h1 className="text-xl font-bold text-[#2d3e50] tracking-tight">Automation Engine</h1>
          </div>

          <div className="flex bg-[#f5f8fa] p-1 rounded-md border border-[#cbd6e2]">
            <button
              onClick={() => {
                setActiveTab("orchestrator");
                setViewMode("dashboard");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === "orchestrator"
                  ? "bg-[#ff7a59] text-white shadow-xs"
                  : "text-[#516f90] hover:text-[#2d3e50]"
              }`}
            >
              <Cpu size={14} weight="bold" />
              Workflow Canvas
            </button>
            <button
              onClick={() => setActiveTab("recovery")}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === "recovery"
                  ? "bg-[#ff7a59] text-white shadow-xs"
                  : "text-[#516f90] hover:text-[#2d3e50]"
              }`}
            >
              <Warning size={14} weight="bold" />
              Recovery Queue
              {oppCount > 0 && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[#d9381e] text-white font-bold ml-1">
                  {oppCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: VISUAL WORKFLOW BUILDER ─── */}
      {activeTab === "orchestrator" && (
        <div className="space-y-6">
          {viewMode === "dashboard" && (
            <div className="space-y-6">
              <div className="minimal-card bg-white py-3 px-4 flex justify-between items-center">
                <span className="text-[10px] text-[#787774] font-mono uppercase tracking-wider">Templates</span>
                <button onClick={handleCreateNewWorkflow} className="button-minimal text-xs">
                  <Plus size={13} weight="bold" />
                  New Workflow
                </button>
              </div>

              {loadingWorkflows ? (
                <div className="py-24 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
                  <ArrowsClockwise size={14} className="animate-spin text-[#1e1e28]" />
                  <span className="font-mono">Compiling nodes registry...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="minimal-card bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3 mb-3">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                              Template Flow
                            </span>
                            <h4 className="text-xs font-bold text-[#1e1e28] mt-0.5">{wf.name}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#edf3ec] text-[#346538] border border-[#346538]/10 capitalize">
                            {wf.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#787774] leading-relaxed">{wf.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#eaeaea] text-[9px] text-[#787774]/70 font-mono">
                        <span>
                          Nodes: {wf.nodes.length} • Edges: {wf.edges.length}
                        </span>
                        <button
                          onClick={() => handleOpenBuilder(wf)}
                          className="button-minimal-secondary text-[9px] py-1 px-3"
                        >
                          Open Canvas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CANVAS WORKSPACE */}
          {viewMode === "builder" && selectedWorkflow && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Sidebar Left: Nodes Palette */}
              <div className="lg:col-span-1 minimal-card bg-white p-4 space-y-5">
                <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">Node Library</h3>
                  <button
                    onClick={() => setViewMode("dashboard")}
                    className="text-xs text-[#787774] hover:text-[#1e1e28] font-semibold"
                    data-clickable
                  >
                    Exit
                  </button>
                </div>

                {/* Triggers Category */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                    1. Triggers
                  </span>
                  <div className="space-y-1.5">
                    {NODE_LIBRARY.triggers.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => handleAddNodeToCanvas(t.type)}
                        className="w-full text-left p-2.5 rounded border border-[#1f6c9f]/10 bg-[#e1f3fe] text-[#1f6c9f] hover:bg-[#1f6c9f]/10 text-[10px] leading-relaxed transition-colors"
                        data-clickable
                      >
                        <span className="font-bold block">{t.type}</span>
                        <span className="text-[9px] opacity-70 mt-0.5 block leading-normal">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditions Category */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                    2. Conditions
                  </span>
                  <div className="space-y-1.5">
                    {NODE_LIBRARY.conditions.map((c) => (
                      <button
                        key={c.type}
                        onClick={() => handleAddNodeToCanvas(c.type)}
                        className="w-full text-left p-2.5 rounded border border-[#956400]/10 bg-[#fbf3db] text-[#956400] hover:bg-[#956400]/10 text-[10px] leading-relaxed transition-colors"
                        data-clickable
                      >
                        <span className="font-bold block">{c.type}</span>
                        <span className="text-[9px] opacity-70 mt-0.5 block leading-normal">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Category */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block">
                    3. Actions
                  </span>
                  <div className="space-y-1.5">
                    {NODE_LIBRARY.actions.map((a) => (
                      <button
                        key={a.type}
                        onClick={() => handleAddNodeToCanvas(a.type)}
                        className="w-full text-left p-2.5 rounded border border-[#346538]/10 bg-[#edf3ec] text-[#346538] hover:bg-[#346538]/10 text-[10px] leading-relaxed transition-colors"
                        data-clickable
                      >
                        <span className="font-bold block">{a.type}</span>
                        <span className="text-[9px] opacity-70 mt-0.5 block leading-normal">{a.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Central Canvas Zone */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center minimal-card bg-white p-3">
                  <div className="flex items-center gap-2 pl-2">
                    <span className="text-xs font-bold text-[#1e1e28]">{selectedWorkflow.name}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#f4f3ef] border border-[#eaeaea] text-[#787774] uppercase tracking-wider">
                      Draft
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveWorkflow}
                      className="button-minimal text-xs py-1.5 px-3.5"
                      data-clickable
                    >
                      <FloppyDisk size={14} weight="bold" />
                      Save Graph
                    </button>
                    <button
                      onClick={handleManualExecute}
                      disabled={executing}
                      className="button-minimal-secondary text-xs py-1.5 px-3.5"
                      data-clickable
                    >
                      <Play size={14} weight="bold" />
                      Manual Run
                    </button>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-4 border border-[#9f2f2d]/10 bg-[#fdebec] text-[#9f2f2d] rounded text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Warning size={14} weight="bold" /> Canvas Errors Found:
                    </span>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* React Flow Workspace */}
                <div className="h-[400px] border border-[#eaeaea] rounded-lg bg-white overflow-hidden relative">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(e, n) => setSelectedNodeId(n.id)}
                    fitView
                  >
                    <Controls />
                    <MiniMap zoomable pannable />
                    <Background color="#eaeaea" gap={16} size={0.7} />
                  </ReactFlow>
                </div>

                {/* Bottom Panel: Execution Log Tracker */}
                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#eaeaea] flex items-center gap-2">
                    <Terminal size={14} className="text-[#1e1e28]" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">
                      Execution Trace Logs (LangGraph State Runs)
                    </h3>
                  </div>
                  <div className="divide-y divide-[#eaeaea] max-h-[160px] overflow-y-auto">
                    {execHistory.length === 0 ? (
                      <p className="text-[10px] text-[#787774]/50 italic p-4 text-center font-mono">
                        No trace execution records logged.
                      </p>
                    ) : (
                      execHistory.map((run) => (
                        <div key={run.id} className="p-3 text-xs space-y-2 hover:bg-[#f7f6f3]/30">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono text-[#787774]">
                              ID: {run.id} • Started: {run.started_at.slice(11, 19)}
                            </span>
                            <span
                              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                run.status === "completed"
                                  ? "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                                  : "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                              }`}
                            >
                              {run.status}
                            </span>
                          </div>

                          <div className="flex gap-1.5 flex-wrap">
                            {run.logs.map((log: any) => (
                              <div
                                key={log.id}
                                className={`p-1 border border-[#eaeaea] rounded text-[9px] font-mono flex items-center gap-1.5 ${
                                  log.status === "success"
                                    ? "bg-[#f4f3ef] text-[#1e1e28]"
                                    : "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                }`}
                                title={log.error_details || log.result_data}
                              >
                                <span>{log.node_type}</span>
                                <span
                                  className={`h-1 w-1 rounded-full ${
                                    log.status === "success" ? "bg-[#346538]" : "bg-[#9f2f2d]"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Right: Inspector config */}
              <div className="lg:col-span-1 minimal-card bg-white p-4 space-y-4 min-h-[300px]">
                <div className="flex items-center justify-between border-b border-[#eaeaea] pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1e28]">Inspector</h3>
                  {selectedNodeId && (
                    <button
                      onClick={handleDeleteSelectedNode}
                      className="p-1 rounded text-[#9f2f2d] hover:bg-[#fdebec] transition-colors"
                      title="Delete Node"
                      data-clickable
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  )}
                </div>

                {selectedNodeObj ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[9px] text-[#787774] block uppercase tracking-wider font-mono">Node Type</span>
                      <span className="font-bold text-[#1e1e28] block mt-0.5">{selectedNodeObj.data.label}</span>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#eaeaea]">
                      <span className="text-[9px] text-[#787774] block uppercase tracking-wider font-bold">
                        Parameters
                      </span>

                      {selectedNodeObj.data.node_type === "Score Greater Than" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#787774]">Threshold Value (0-100)</label>
                          <input
                            type="number"
                            value={selectedNodeObj.data.config.value ?? ""}
                            onChange={(e) => handleUpdateNodeConfig("value", parseInt(e.target.value, 10))}
                            placeholder="e.g. 80"
                            className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                          />
                        </div>
                      )}

                      {selectedNodeObj.data.node_type === "Days Since Activity" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#787774]">Inactivity Threshold (Days)</label>
                          <input
                            type="number"
                            value={selectedNodeObj.data.config.value ?? ""}
                            onChange={(e) => handleUpdateNodeConfig("value", parseInt(e.target.value, 10))}
                            placeholder="e.g. 14"
                            className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                          />
                        </div>
                      )}

                      {selectedNodeObj.data.node_type === "Stage Equals" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#787774]">Pipeline Stage</label>
                          <select
                            value={selectedNodeObj.data.config.value ?? ""}
                            onChange={(e) => handleUpdateNodeConfig("value", e.target.value)}
                            className="w-full text-xs bg-white border border-[#eaeaea] rounded p-2 focus:outline-none"
                          >
                            <option value="">-- select stage --</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                          </select>
                        </div>
                      )}

                      {selectedNodeObj.data.node_type === "Create Follow-Up" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#787774]">Action Channel</label>
                            <select
                              value={selectedNodeObj.data.config.type ?? "email"}
                              onChange={(e) => handleUpdateNodeConfig("type", e.target.value)}
                              className="w-full text-xs bg-white border border-[#eaeaea] rounded p-2 focus:outline-none"
                            >
                              <option value="email">Email</option>
                              <option value="call">Phone Call</option>
                              <option value="whatsapp">WhatsApp Message</option>
                              <option value="meeting">Sync</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#787774]">Task Title</label>
                            <input
                              value={selectedNodeObj.data.config.title ?? ""}
                              onChange={(e) => handleUpdateNodeConfig("title", e.target.value)}
                              placeholder="e.g. Schedule sync"
                              className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                            />
                          </div>
                        </div>
                      )}

                      {selectedNodeObj.data.node_type === "Send Notification" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#787774]">Notification Message</label>
                          <input
                            value={selectedNodeObj.data.config.message ?? ""}
                            onChange={(e) => handleUpdateNodeConfig("message", e.target.value)}
                            placeholder="e.g. Lead needs urgent attention!"
                            className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                          />
                        </div>
                      )}

                      {selectedNodeObj.data.node_type === "Update Stage" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-[#787774]">Move to stage</label>
                          <select
                            value={selectedNodeObj.data.config.stage ?? "Contacted"}
                            onChange={(e) => handleUpdateNodeConfig("stage", e.target.value)}
                            className="w-full text-xs bg-white border border-[#eaeaea] rounded p-2 focus:outline-none"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      )}

                      {!["Score Greater Than", "Days Since Activity", "Stage Equals", "Create Follow-Up", "Send Notification", "Update Stage"].includes(
                        selectedNodeObj.data.node_type
                      ) && <p className="text-[10px] text-[#787774] italic">No parameters required.</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#787774]/55 italic py-6 text-center">
                    Click a node on the canvas to configure parameters.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: LEAD RECOVERY AI ─── */}
      {activeTab === "recovery" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "High Risk Opportunities", value: highRiskCount, Icon: Warning, bg: "var(--pastel-red)", text: "var(--pastel-red-ink)" },
              { label: "Recovery Opportunities", value: oppCount, Icon: Lightning, bg: "var(--pastel-yellow)", text: "var(--pastel-yellow-ink)" },
            ].map(({ label, value, Icon, bg, text }, i) => (
              <div key={label} className="minimal-card bg-white p-4 flex items-center gap-3">
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
                  <h3 className="text-lg font-bold font-mono text-[#1e1e28] mt-0.5 tabnum">{value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className={`space-y-4 ${selectedCase ? "lg:col-span-2" : "lg:col-span-3"}`}>
              <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                Recovery Queue
              </span>

              <div className="minimal-card bg-white p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                        <th className="p-3.5 pl-4 font-bold">Opportunity</th>
                        <th className="p-3.5 font-bold">Risk Level</th>
                        <th className="p-3.5 font-bold">Inactivity</th>
                        <th className="p-3.5 font-bold">Reason</th>
                        <th className="p-3.5 font-bold">Recommended Next Step</th>
                        <th className="p-3.5 text-right pr-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {loadingQueue ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-[#787774]/55 font-mono">
                            <CircleNotch size={14} className="animate-spin inline-block mr-2 text-[#1e1e28]" />
                            Auditing inactive opportunities...
                          </td>
                        </tr>
                      ) : queue.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-[#787774] italic">
                            All opportunities are engaged.
                          </td>
                        </tr>
                      ) : (
                        queue.map((caseItem) => (
                          <tr
                            key={caseItem.id}
                            onClick={() => handleSelectCase(caseItem)}
                            className={`cursor-pointer transition-colors ${
                              selectedCase?.id === caseItem.id
                                ? "bg-[#f4f3ef]/80"
                                : "hover:bg-[#f7f6f3]/40"
                            }`}
                          >
                            <td className="p-3.5 pl-4 font-semibold text-[#1e1e28]">{caseItem.lead_name}</td>
                            <td className="p-3.5">
                              <span
                                className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 capitalize ${
                                  caseItem.risk_level === "high"
                                    ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                    : "bg-[#fbf3db] text-[#956400] border-[#956400]/10"
                                }`}
                              >
                                {caseItem.risk_level}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[9px] text-[#787774]">
                              {caseItem.days_inactive} days
                            </td>
                            <td className="p-3.5 text-[#787774] max-w-[180px] truncate" title={caseItem.reason}>
                              {caseItem.reason}
                            </td>
                            <td className="p-3.5 text-[#787774] max-w-[200px] truncate" title={caseItem.recommended_action}>
                              {caseItem.recommended_action}
                            </td>
                            <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleSelectCase(caseItem)}
                                  className="button-minimal-secondary text-[9px] py-1 px-2.5"
                                  data-clickable
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => handleResolveCase(caseItem.id, "dismissed")}
                                  className="text-[9px] text-[#787774] hover:text-[#9f2f2d] transition-colors font-bold"
                                  data-clickable
                                >
                                  Dismiss
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {selectedCase && (
              <div className="lg:col-span-1 minimal-card bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
                  <div>
                    <h3 className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                      Opportunity Audit
                    </h3>
                    <h4 className="text-xs font-bold text-[#1e1e28] pt-0.5">{selectedCase.lead_name}</h4>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCase(null);
                      setFollowupDrafts(null);
                    }}
                    className="text-[#787774] hover:text-[#1e1e28] transition-colors"
                    data-clickable
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <div className="rounded bg-[#fbfbfa] border border-[#eaeaea] p-3 text-xs">
                  <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold mb-1">
                    Risk Assessment
                  </span>
                  <p className="leading-relaxed text-[#1e1e28] font-sans">{selectedCase.reason}</p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold">
                    Recovery Strategy
                  </span>
                  <p className="leading-relaxed text-[#787774]">{selectedCase.recommended_action}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#eaeaea]">
                  <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold">
                    Follow-Up Scripts
                  </span>

                  {loadingDetails ? (
                    <div className="py-8 text-center text-xs text-[#787774] italic">
                      <CircleNotch size={14} className="animate-spin inline-block mr-1.5 text-[#1e1e28]" />
                      Compiling scripts...
                    </div>
                  ) : followupDrafts ? (
                    <div className="space-y-3">
                      <div className="flex border border-[#eaeaea] p-0.5 bg-[#f4f3ef] rounded text-[10px] font-semibold">
                        <button
                          onClick={() => setFollowupTab("email")}
                          className={`flex-1 py-1 rounded transition-colors flex items-center justify-center gap-1 ${
                            followupTab === "email"
                              ? "bg-white text-[#1e1e28] shadow-xs"
                              : "text-[#787774]"
                          }`}
                          data-clickable
                        >
                          <EnvelopeSimple size={12} weight="bold" />
                          Email
                        </button>
                        <button
                          onClick={() => setFollowupTab("whatsapp")}
                          className={`flex-1 py-1 rounded transition-colors flex items-center justify-center gap-1 ${
                            followupTab === "whatsapp"
                              ? "bg-white text-[#1e1e28] shadow-xs"
                              : "text-[#787774]"
                          }`}
                          data-clickable
                        >
                          <WhatsappLogo size={12} weight="bold" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => setFollowupTab("call")}
                          className={`flex-1 py-1 rounded transition-colors flex items-center justify-center gap-1 ${
                            followupTab === "call"
                              ? "bg-white text-[#1e1e28] shadow-xs"
                              : "text-[#787774]"
                          }`}
                          data-clickable
                        >
                          <PhoneCall size={12} weight="bold" />
                          Points
                        </button>
                      </div>

                      {followupTab === "email" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-2 border border-[#eaeaea] rounded bg-[#fbfbfa] font-mono text-[9px] flex justify-between items-center">
                            <span className="truncate max-w-[160px] text-[#787774]">Subject: {followupDrafts.email_subject}</span>
                            <button
                              onClick={() => copyToClipboard(followupDrafts.email_subject, "subj")}
                              className="text-[#787774] hover:text-[#1e1e28] p-0.5"
                              data-clickable
                            >
                              {copiedText === "subj" ? <Check size={12} className="text-[#346538]" /> : <Copy size={12} weight="bold" />}
                            </button>
                          </div>
                          <div className="relative p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                            {followupDrafts.email_body}
                            <button
                              onClick={() => copyToClipboard(followupDrafts.email_body, "body")}
                              className="absolute right-2 top-2 text-[#787774] hover:text-[#1e1e28] p-1 bg-white rounded border border-[#eaeaea]"
                              data-clickable
                            >
                              {copiedText === "body" ? <Check size={12} className="text-[#346538]" /> : <Copy size={12} weight="bold" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {followupTab === "whatsapp" && (
                        <div className="relative p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] text-[11px] leading-relaxed whitespace-pre-wrap">
                          {followupDrafts.whatsapp_body}
                          <button
                            onClick={() => copyToClipboard(followupDrafts.whatsapp_body, "wa")}
                            className="absolute right-2 top-2 text-[#787774] hover:text-[#1e1e28] p-1 bg-white rounded border border-[#eaeaea]"
                            data-clickable
                          >
                            {copiedText === "wa" ? <Check size={12} className="text-[#346538]" /> : <Copy size={12} weight="bold" />}
                          </button>
                        </div>
                      )}

                      {followupTab === "call" && (
                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-[#787774] leading-normal font-sans">
                          {followupDrafts.call_talking_points.map((pt: string, i: number) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[9px] text-[#787774]/55 italic py-4">Failed to load drafts.</div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#eaeaea]">
                  <button
                    onClick={() => handleResolveCase(selectedCase.id, "executed")}
                    className="button-minimal flex-1 text-[10px] h-8"
                    data-clickable
                  >
                    <CheckCircle size={12} weight="bold" />
                    Mark Executed
                  </button>
                  <button
                    onClick={() => handleResolveCase(selectedCase.id, "dismissed")}
                    className="button-minimal-secondary flex-1 text-[10px] h-8"
                    data-clickable
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
