"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CurrencyDollar,
  Clock,
  CheckCircle,
  Warning,
  Plus,
  Handshake,
  Scales,
  ArrowsClockwise,
  Shield,
  Copy,
  Check,
  FileText,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "invoices" | "payments" | "approvals" | "collections">("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // Single selection states
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [dunningData, setDunningData] = useState<any | null>(null);
  const [loadingDunning, setLoadingDunning] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states
  const [invNumber, setInvNumber] = useState("");
  const [invCustomer, setInvCustomer] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDueDate, setInvDueDate] = useState("");

  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Wire Transfer");

  const [appTitle, setAppTitle] = useState("");
  const [appRequester, setAppRequester] = useState("");
  const [appApprover, setAppApprover] = useState("");

  // AI Chat state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      await api.getRecoveryQueue();
      const res = await api.getFinanceDashboard();
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNumber || !invCustomer || !invAmount || !invDueDate) return;
    try {
      await api.createInvoice({
        invoice_number: invNumber,
        customer_name: invCustomer,
        amount: parseFloat(invAmount),
        due_date: new Date(invDueDate).toISOString(),
        status: "sent",
      });
      setInvoiceModalOpen(false);
      setInvNumber("");
      setInvCustomer("");
      setInvAmount("");
      setInvDueDate("");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId || !payAmount) return;
    try {
      await api.recordPayment({
        invoice_id: parseInt(payInvoiceId, 10),
        amount: parseFloat(payAmount),
        payment_method: payMethod,
      });
      setPaymentModalOpen(false);
      setPayInvoiceId("");
      setPayAmount("");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle || !appRequester || !appApprover) return;
    try {
      await api.createApprovalRequest({
        title: appTitle,
        requester: appRequester,
        approver: appApprover,
        status: "pending",
      });
      setApprovalModalOpen(false);
      setAppTitle("");
      setAppRequester("");
      setAppApprover("");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveApproval = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.updateApprovalStatus(id, status);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDunning = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setLoadingDunning(true);
    setDunningData(null);
    try {
      const res = await api.getInvoiceDunning(invoice.id);
      setDunningData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDunning(false);
    }
  };

  const handleAskFinanceAi = (query: string) => {
    setAiQuery(query);
    setLoadingAi(true);
    setAiResponse(null);

    setTimeout(() => {
      setLoadingAi(false);
      if (query.includes("overdue")) {
        setAiResponse(
          "Analyzing payment history... LexCorp is currently 35 days past due and represents our highest risk account (Escalation status). Wayne Enterprises is 18 days past due. We recommend prioritizing follow-up for LexCorp immediately."
        );
      } else if (query.includes("follow-up")) {
        setAiResponse(
          "Customer follow-up checklist:\n1. LexCorp (Invoice INV-2026-003, $1200, 35 days overdue) - Legal escalation notice ready.\n2. Wayne Enterprises (Invoice INV-2026-002, $500, 18 days overdue) - Level 2 reminder ready."
        );
      } else {
        setAiResponse(
          "Current collections profile indicates $1,700 in total overdue revenue. Stark Industries has cleared their balance. Risk concentrations are locked inside Q1 corporate accounts."
        );
      }
    }, 1000);
  };

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER & TAB SWITCHER ─── */}
      <div className="minimal-card bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <span className="text-overline mb-2 inline-block">Capital Module</span>
            <h1 className="text-display-md text-foreground">Capital Operations</h1>
            <p className="text-xs text-[#787774] mt-1 max-w-md">
              Monitor receivables, approve expenses, and audit automatic collection reminders.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex flex-wrap bg-[#f4f3ef] p-1 rounded-lg border border-[#eaeaea]">
            {[
              { id: "dashboard", label: "Dashboard", icon: CurrencyDollar },
              { id: "invoices", label: "Invoices", icon: FileText },
              { id: "payments", label: "Payments", icon: Handshake },
              { id: "approvals", label: "Approvals", icon: Scales },
              { id: "collections", label: "Collections", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedInvoice(null);
                    setDunningData(null);
                  }}
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
        <div className="flex items-center gap-3 px-5 py-2.5 text-xs bg-[#fbfbfa] border border-[#eaeaea] rounded-lg">
          <Clock size={14} className="text-[#787774] shrink-0" weight="bold" />
          <span className="text-[#787774] font-medium">
            <strong className="font-bold text-[#1e1e28]">Sandbox mode</strong> — Invoices and payments simulated in browser local storage.
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
          <ArrowsClockwise size={14} className="animate-spin text-[#1e1e28]" />
          <span className="font-mono">Aggregating capital metrics...</span>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* ─── TAB 1: GENERAL STATS DASHBOARD ─── */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Outstanding Balance",
                      value: `$${data.stats.outstanding_revenue.toLocaleString()}`,
                      Icon: CurrencyDollar,
                      bg: "var(--pastel-blue)",
                      text: "var(--pastel-blue-ink)",
                    },
                    {
                      label: "Paid This Month",
                      value: `$${data.stats.paid_this_month.toLocaleString()}`,
                      Icon: CheckCircle,
                      bg: "var(--pastel-green)",
                      text: "var(--pastel-green-ink)",
                    },
                    {
                      label: "Overdue Revenue",
                      value: `$${data.stats.overdue_revenue.toLocaleString()}`,
                      Icon: Warning,
                      bg: "var(--pastel-red)",
                      text: "var(--pastel-red-ink)",
                    },
                    {
                      label: "Pending Approvals",
                      value: data.stats.pending_approvals,
                      Icon: Scales,
                      bg: "var(--pastel-yellow)",
                      text: "var(--pastel-yellow-ink)",
                    },
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
                        <h3 className="text-xl font-bold font-mono text-[#1e1e28] tabnum mt-0.5">{value}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Aging Buckets Row & AI Assistant Box */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Aging Buckets */}
                  <div className="lg:col-span-2 minimal-card bg-white p-5">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-3 mb-4">
                      Receivables Aging Analysis
                    </span>
                    <div className="space-y-5">
                      {Object.entries(data.aging_buckets).map(([bucket, amt]: [string, any]) => {
                        const totalOverdue = data.stats.overdue_revenue || 1;
                        const percent = Math.min(100, Math.round((amt / totalOverdue) * 100));
                        return (
                          <div key={bucket} className="space-y-1.5 text-xs">
                            <div className="flex justify-between font-semibold text-[#787774]">
                              <span>{bucket}</span>
                              <span className="font-mono text-[#1e1e28]">
                                {percent}% — ${amt.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-[#f4f3ef] rounded-full h-[4px] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  bucket.startsWith("0-30")
                                    ? "bg-[#1f6c9f]/60"
                                    : bucket.startsWith("31-60")
                                      ? "bg-[#1f6c9f]/80"
                                      : "bg-[#1f6c9f]"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Finance AI Assistant Panel */}
                  <div className="minimal-card bg-white p-5">
                    <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider block border-b border-[#eaeaea] pb-3 mb-4">
                      Ask Capital AI Advisor
                    </span>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        {[
                          "Which invoices are most likely to become overdue?",
                          "Which customers require follow-up?",
                          "Show collection risks.",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => handleAskFinanceAi(q)}
                            className="w-full text-left p-2.5 rounded border border-[#eaeaea] bg-[#fbfbfa] hover:border-[#787774] text-[10px] font-bold text-[#787774] hover:text-[#1e1e28] transition-colors"
                            data-clickable
                          >
                            {q}
                          </button>
                        ))}
                      </div>

                      {loadingAi && (
                        <div className="text-center italic text-[#787774]/70 py-2 flex items-center justify-center gap-1.5 font-mono text-[9px]">
                          <ArrowsClockwise size={12} className="animate-spin text-[#1e1e28]" /> Checking aging ledgers...
                        </div>
                      )}

                      {aiResponse && (
                        <div className="p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] leading-relaxed text-[11px] text-[#787774] whitespace-pre-wrap">
                          {aiResponse}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: INVOICES TAB ─── */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#787774]" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search invoice # or client..."
                      className="w-full pl-9 pr-3 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                    />
                  </div>
                  <button onClick={() => setInvoiceModalOpen(true)} className="button-minimal text-xs" data-clickable>
                    <Plus size={12} weight="bold" />
                    New Invoice
                  </button>
                </div>

                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                          <th className="p-4 pl-5 font-bold">Invoice Number</th>
                          <th className="p-4 font-bold">Customer</th>
                          <th className="p-4 font-bold">Amount</th>
                          <th className="p-4 font-bold">Due Date</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 pr-5 text-right font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                        {data.invoices
                          .filter(
                            (inv: any) =>
                              inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-[#f7f6f3]/30 transition-colors">
                              <td className="p-4 pl-5 font-bold text-[#1e1e28]">{inv.invoice_number}</td>
                              <td className="p-4 font-sans text-xs text-[#787774]">{inv.customer_name}</td>
                              <td className="p-4 font-semibold text-[#1e1e28] tabnum">${inv.amount.toLocaleString()}</td>
                              <td className="p-4 text-[#787774] tabnum">{inv.due_date.slice(0, 10)}</td>
                              <td className="p-4 font-sans">
                                <span
                                  className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-1.5 py-0.5 border ${
                                    inv.status === "paid"
                                      ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                      : inv.status === "overdue"
                                        ? "bg-[#fdebec] border-[#9f2f2d]/10 text-[#9f2f2d]"
                                        : "bg-[#f4f3ef] border-[#eaeaea] text-[#787774]"
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right font-sans">
                                {inv.status !== "paid" && (
                                  <button
                                    onClick={() => {
                                      setPayInvoiceId(String(inv.id));
                                      setPayAmount(String(inv.amount));
                                      setPaymentModalOpen(true);
                                    }}
                                    className="button-minimal-secondary text-[9px] py-1 px-2.5"
                                    data-clickable
                                  >
                                    Record Payment
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: PAYMENTS TAB ─── */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                    Recorded Receipts
                  </span>
                  <button onClick={() => setPaymentModalOpen(true)} className="button-minimal text-xs" data-clickable>
                    <Plus size={12} weight="bold" />
                    Record Payment
                  </button>
                </div>

                <div className="minimal-card bg-white p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                          <th className="p-4 pl-5 font-bold">Payment ID</th>
                          <th className="p-4 font-bold">Invoice ID</th>
                          <th className="p-4 font-bold">Amount</th>
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 pr-5 font-bold">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                        {data.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-[#787774] italic">
                              No payments logged yet.
                            </td>
                          </tr>
                        ) : (
                          data.payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-[#f7f6f3]/30 transition-colors">
                              <td className="p-4 pl-5 text-[#1e1e28]">#{p.id}</td>
                              <td className="p-4 text-[#787774]">INV #{p.invoice_id}</td>
                              <td className="p-4 font-bold text-[#1e1e28] tabnum">${p.amount.toLocaleString()}</td>
                              <td className="p-4 text-[#787774] tabnum">{p.payment_date.slice(0, 10)}</td>
                              <td className="p-4 pr-5 font-sans text-xs capitalize text-[#1e1e28]">
                                {p.payment_method}
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

            {/* ─── TAB 4: APPROVALS TAB ─── */}
            {activeTab === "approvals" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                    Corporate Requests Log
                  </span>
                  <button onClick={() => setApprovalModalOpen(true)} className="button-minimal text-xs" data-clickable>
                    <Plus size={12} weight="bold" />
                    Submit Approval
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.approvals.length === 0 ? (
                    <p className="text-xs text-[#787774] italic py-10 text-center col-span-2 font-mono">
                      No approval requests registered.
                    </p>
                  ) : (
                    data.approvals.map((app: any) => (
                      <div key={app.id} className="minimal-card bg-white p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 border-b border-[#eaeaea] pb-3 mb-3">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                                Approval Request
                              </span>
                              <h4 className="text-xs font-bold text-[#1e1e28] mt-1">{app.title}</h4>
                            </div>
                            <span
                              className={`inline-flex items-center text-[9px] font-mono font-bold rounded px-1.5 py-0.5 border ${
                                app.status === "approved"
                                  ? "bg-[#edf3ec] border-[#346538]/10 text-[#346538]"
                                  : app.status === "rejected"
                                    ? "bg-[#fdebec] border-[#9f2f2d]/10 text-[#9f2f2d]"
                                    : "bg-[#fbf3db] border-[#956400]/10 text-[#956400]"
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9px] text-[#787774] font-mono">
                            <div>
                              Requester: <span className="font-bold text-[#1e1e28] font-sans text-xs">{app.requester}</span>
                            </div>
                            <div>
                              Approver: <span className="font-bold text-[#1e1e28] font-sans text-xs">{app.approver}</span>
                            </div>
                          </div>
                        </div>

                        {app.status === "pending" && (
                          <div className="flex gap-2 pt-4 mt-4 border-t border-[#eaeaea]">
                            <button
                              onClick={() => handleResolveApproval(app.id, "approved")}
                              className="button-minimal flex-1 py-1.5 text-[10px]"
                              data-clickable
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleResolveApproval(app.id, "rejected")}
                              className="button-minimal-secondary flex-1 py-1.5 text-[10px]"
                              data-clickable
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 5: COLLECTIONS DUNNING TAB ─── */}
            {activeTab === "collections" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Overdue Queue */}
                <div className={`space-y-4 ${selectedInvoice ? "lg:col-span-2" : "lg:col-span-3"}`}>
                  <span className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider pl-1.5">
                    Overdue Collections Queue
                  </span>

                  <div className="minimal-card bg-white p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#faf9f6] text-[#787774] font-mono text-[9px] uppercase tracking-wider border-b border-[#eaeaea]">
                            <th className="p-3.5 pl-4 font-bold">Invoice Number</th>
                            <th className="p-3.5 font-bold">Customer Name</th>
                            <th className="p-3.5 font-bold">Amount</th>
                            <th className="p-3.5 font-bold">Due Date</th>
                            <th className="p-3.5 text-right pr-4 font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeaea] font-mono text-[10.5px]">
                          {data.invoices.filter((inv: any) => inv.status === "overdue").length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-10 text-center text-[#787774] italic">
                                No past-due invoices registered. Perfect credit!
                              </td>
                            </tr>
                          ) : (
                            data.invoices
                              .filter((inv: any) => inv.status === "overdue")
                              .map((inv: any) => (
                                <tr
                                  key={inv.id}
                                  onClick={() => handleSelectDunning(inv)}
                                  className={`cursor-pointer transition-colors ${
                                    selectedInvoice?.id === inv.id
                                      ? "bg-[#f4f3ef]/80 text-[#1e1e28]"
                                      : "hover:bg-[#f7f6f3]/40"
                                  }`}
                                >
                                  <td className="p-3.5 pl-4 font-bold text-[#1e1e28]">{inv.invoice_number}</td>
                                  <td className="p-3.5 font-sans">{inv.customer_name}</td>
                                  <td className="p-3.5 tabnum">${inv.amount.toLocaleString()}</td>
                                  <td className="p-3.5 tabnum">{inv.due_date.slice(0, 10)}</td>
                                  <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleSelectDunning(inv)}
                                      className="button-minimal-secondary text-[9px] py-1 px-2.5"
                                      data-clickable
                                    >
                                      Dunning Notice
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Dunning Details Right Panel */}
                {selectedInvoice && (
                  <div className="lg:col-span-1 minimal-card bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
                      <div>
                        <h3 className="text-[9px] font-mono font-bold text-[#787774] uppercase tracking-wider">
                          Dunning Engine
                        </h3>
                        <h4 className="text-xs font-bold text-[#1e1e28] pt-0.5">{selectedInvoice.invoice_number}</h4>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedInvoice(null);
                          setDunningData(null);
                        }}
                        className="text-[#787774] hover:text-[#1e1e28] transition-colors"
                        data-clickable
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>

                    {loadingDunning ? (
                      <div className="py-8 text-center text-xs text-[#787774] italic font-mono">
                        <ArrowsClockwise size={14} className="animate-spin inline-block mr-1.5 text-[#1e1e28]" /> Calculating aging terms...
                      </div>
                    ) : dunningData ? (
                      <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center p-2 rounded bg-[#fbfbfa] border border-[#eaeaea]">
                          <span className="font-bold text-[#787774] uppercase tracking-wider text-[8px] font-mono">
                            Dunning Action Tier
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 capitalize ${
                              dunningData.level === "Escalation"
                                ? "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                                : "bg-[#fbf3db] text-[#956400] border-[#956400]/10"
                            }`}
                          >
                            {dunningData.level} ({dunningData.days_overdue} days overdue)
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold">
                            Phone Sync Script
                          </span>
                          <div className="p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] text-[#1e1e28] leading-relaxed font-sans">
                            {dunningData.call_script}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#eaeaea]">
                          <span className="text-[9px] font-mono text-[#787774] uppercase tracking-wider block font-bold">
                            Re-engagement Email Draft
                          </span>
                          <div className="p-2 border border-[#eaeaea] rounded bg-[#fbfbfa] font-mono text-[9px] flex justify-between items-center">
                            <span className="truncate max-w-[160px] text-[#787774]">Subject: {dunningData.email_subject}</span>
                            <button
                              onClick={() => triggerCopy(dunningData.email_subject, "subj")}
                              className="text-[#787774] hover:text-[#1e1e28] transition-colors"
                              data-clickable
                            >
                              {copiedText === "subj" ? <Check size={12} className="text-[#346538]" /> : <Copy size={12} weight="bold" />}
                            </button>
                          </div>
                          <div className="relative p-3 border border-[#eaeaea] rounded bg-[#fbfbfa] font-sans text-[10px] whitespace-pre-wrap leading-relaxed">
                            {dunningData.email_body}
                            <button
                              onClick={() => triggerCopy(dunningData.email_body, "body")}
                              className="absolute right-2 top-2 text-[#787774] hover:text-[#1e1e28] p-1 bg-white rounded border border-[#eaeaea]"
                              data-clickable
                            >
                              {copiedText === "body" ? <Check size={12} className="text-[#346538]" /> : <Copy size={12} weight="bold" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* ─── INVOICE CREATE MODAL ─── */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#eaeaea] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">Create Client Invoice</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">Schedule and track payment terms for customers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Invoice Number</label>
              <input
                value={invNumber}
                onChange={(e) => setInvNumber(e.target.value)}
                placeholder="e.g. INV-2026-004"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Customer/Client Name</label>
              <input
                value={invCustomer}
                onChange={(e) => setInvCustomer(e.target.value)}
                placeholder="e.g. Stark Industries"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Invoice Amount ($)</label>
              <input
                type="number"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Payment Due Date</label>
              <input
                type="date"
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <button type="submit" className="button-minimal w-full h-10 mt-2 text-xs" data-clickable>
              Create Invoice
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── PAYMENT RECORD MODAL ─── */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#eaeaea] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">Record Payment Receipt</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">Log incoming invoice clears against receivables accounts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Select Invoice ID</label>
              <input
                value={payInvoiceId}
                onChange={(e) => setPayInvoiceId(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Amount Settled ($)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Payment Channel</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full text-xs bg-white border border-[#eaeaea] rounded p-2 focus:outline-none"
              >
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="ACH Sync">ACH Auto Sync</option>
              </select>
            </div>
            <button type="submit" className="button-minimal w-full h-10 mt-2 text-xs" data-clickable>
              Record Receipt
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── APPROVAL CREATE DIALOG ─── */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#eaeaea] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">Submit Corporate Approval Request</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">Log payroll checks or budget allocations requests.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateApproval} className="space-y-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Request Title</label>
              <input
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="e.g. Q3 Software Payroll Allocations"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Requester Name</label>
              <input
                value={appRequester}
                onChange={(e) => setAppRequester(e.target.value)}
                placeholder="e.g. HR Director"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#787774]">Approver Name</label>
              <input
                value={appApprover}
                onChange={(e) => setAppApprover(e.target.value)}
                placeholder="e.g. CEO or CFO"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
              />
            </div>
            <button type="submit" className="button-minimal w-full h-10 mt-2 text-xs" data-clickable>
              Submit Request
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
