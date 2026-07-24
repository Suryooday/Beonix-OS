"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/services/api";
import {
  UploadSimple,
  CheckCircle,
  Warning,
  ArrowLeft,
  ArrowRight,
  Play,
  Clock,
  Trash,
  FileCsv,
  User,
  EnvelopeSimple,
  Phone,
  Buildings,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import Link from "next/link";

const STEPS = ["Upload File", "Preview Data", "Field Mapping", "Duplicates", "Preflight", "Done"];

const LEAD_FIELDS = [
  { value: "", label: "[Ignore Column]" },
  { value: "name", label: "Name (Required)" },
  { value: "email", label: "Email (Required)" },
  { value: "phone", label: "Phone Number" },
  { value: "company", label: "Company" },
  { value: "source", label: "Lead Source" },
  { value: "notes", label: "Notes" },
];

export default function LeadImportPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [jobId, setJobId] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [dupAction, setDupAction] = useState("skip");
  const [summary, setSummary] = useState<any>(null);

  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.getImportHistory();
      setImportHistory(res.data);
    } catch (err) {
      console.error("Failed to load import history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const selectFile = (f: File) => { setFile(f); setErrorMessage(null); };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) selectFile(e.target.files[0]);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) { setErrorMessage("Please select a spreadsheet file first."); return; }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.uploadImportFile(file);
      setJobId(res.data.job_id);
      setColumns(res.data.columns);
      setSampleRows(res.data.sample_rows);
      setFieldMapping(res.data.suggested_mapping || {});
      if (typeof window !== "undefined") {
        localStorage.setItem(`beonix_import_filename_${res.data.job_id}`, file.name);
      }
      setActiveStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to parse the spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!jobId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.processImport({ job_id: jobId, field_mapping: fieldMapping, dup_action: dupAction });
      setSummary(res.data);
      setActiveStep(6);
      loadHistory();
    } catch (err: any) {
      setErrorMessage(err?.message || "Import pipeline encountered a failure.");
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setFile(null); setJobId(null); setColumns([]); setSampleRows([]);
    setFieldMapping({}); setDupAction("skip"); setSummary(null); setActiveStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="minimal-card bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-overline mb-2 inline-block">CRM / Import</span>
            <h1 className="text-display-md text-foreground">Bulk Lead Import</h1>
            <p className="text-xs text-[#6b6b72] mt-1">
              Ingest leads from Google Ads, Meta Forms, LinkedIn, or any spreadsheet.
            </p>
          </div>
          <Link href="/crm">
            <button className="button-minimal-secondary text-xs">
              <ArrowLeft size={14} weight="bold" />
              Back to Pipeline
            </button>
          </Link>
        </div>
      </div>

      {/* Step progress */}
      <div className="grid grid-cols-6 gap-2">
        {STEPS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                s === activeStep ? "bg-[#3d5af1]" : s < activeStep ? "bg-[#346538]" : "bg-[#e3e3ea]"
              }`} />
              <span className={`text-[9px] hidden sm:inline text-center font-semibold uppercase tracking-wider ${
                s === activeStep ? "text-[#3d5af1]" : s < activeStep ? "text-[#346538]" : "text-[#6b6b72]"
              }`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-[#9f2f2d]/20 bg-[#fdebec] text-[#9f2f2d] text-xs flex items-start gap-2.5">
          <Warning size={15} className="shrink-0 mt-0.5" weight="bold" />
          <div><span className="font-bold">Error:</span> {errorMessage}</div>
        </div>
      )}

      {/* Wizard card */}
      <div className="minimal-card bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e3e3ea] bg-[#faf9f6]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#3d5af1] uppercase tracking-wider">
              Step {activeStep} / {STEPS.length}
            </span>
            <span className="text-[#e3e3ea]">/</span>
            <span className="text-xs font-bold text-[#1e1e28]">{STEPS[activeStep - 1]}</span>
          </div>
        </div>

        <div className="p-6">

          {/* STEP 1: UPLOAD */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-all select-none ${
                  dragActive
                    ? "border-[#3d5af1] bg-[#f4f6ff] cursor-copy"
                    : "border-[#e3e3ea] hover:border-[#6b6b72] bg-[#faf9f6] hover:bg-white cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload spreadsheet file"
                />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className={`p-4 rounded-lg border transition-colors ${
                    dragActive
                      ? "bg-[#e8edff] border-[#3d5af1]/30 text-[#3d5af1]"
                      : "bg-[#f4f3ef] border-[#e3e3ea] text-[#1e1e28]"
                  }`}>
                    <UploadSimple size={28} weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e1e28]">
                      {dragActive ? "Release to upload" : "Drag & drop your file here"}
                    </p>
                    <p className="text-[11px] text-[#6b6b72] mt-1">
                      or <span className="text-[#3d5af1] font-semibold underline underline-offset-2">click to browse files</span>
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-[#6b6b72]/70">CSV, XLSX, XLS — max 10MB</p>
                </div>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#3d5af1]/20 bg-[#f4f6ff]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-[#e8edff] text-[#3d5af1]">
                      <FileCsv size={18} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1e1e28]">{file.name}</p>
                      <p className="text-[10px] text-[#6b6b72] font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="p-1.5 rounded text-[#6b6b72] hover:text-[#9f2f2d] hover:bg-[#fdebec] transition-colors"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-[#e3e3ea]">
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="button-minimal text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><ArrowsClockwise size={14} className="animate-spin" /> Parsing file...</>
                  ) : (
                    <>Next: Preview Data <ArrowRight size={14} weight="bold" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-[#6b6b72]">
                Parsed <span className="font-semibold text-[#1e1e28]">{sampleRows.length}</span> sample rows from{" "}
                <span className="font-semibold text-[#1e1e28]">{file?.name}</span>. Showing a preview of the first 5 columns and 5 rows.
              </p>
              <div className="overflow-x-auto border border-[#e3e3ea] rounded-lg max-h-72">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-[#faf9f6] border-b border-[#e3e3ea] sticky top-0">
                    <tr>
                      {columns.slice(0, 5).map((col) => (
                        <th key={col} className="px-4 py-2.5 font-bold text-[#1e1e28] whitespace-nowrap">{col}</th>
                      ))}
                      {columns.length > 5 && (
                        <th className="px-4 py-2.5 font-bold text-[#6b6b72] whitespace-nowrap italic bg-[#fbfbfa]">
                          + {columns.length - 5} more columns
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e3ea]">
                    {sampleRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#f7f6f3] transition-colors">
                        {columns.slice(0, 5).map((col) => (
                          <td key={col} className="px-4 py-2 text-[#6b6b72] whitespace-nowrap truncate max-w-xs">
                            {row[col] !== undefined ? String(row[col]) : "—"}
                          </td>
                        ))}
                        {columns.length > 5 && (
                          <td className="px-4 py-2 text-[#6b6b72]/60 whitespace-nowrap italic bg-[#fbfbfa]">
                            ...
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#e3e3ea]">
                <button onClick={() => setActiveStep(1)} className="button-minimal-secondary text-xs flex items-center gap-1.5">
                  <ArrowLeft size={14} weight="bold" /> Back
                </button>
                <button onClick={() => setActiveStep(3)} className="button-minimal text-xs flex items-center gap-1.5">
                  Next: Field Mapping <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FIELD MAPPING */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <p className="text-xs text-[#6b6b72]">Map each column to a CRM field. Unmapped columns are ignored.</p>
              <div className="space-y-2">
                {columns.map((col) => {
                  const val = fieldMapping[col] || "";
                  return (
                    <div key={col} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-[#e3e3ea] hover:border-[#6b6b72] transition-colors">
                      <div>
                        <p className="text-xs font-bold text-[#1e1e28]">{col}</p>
                        <p className="text-[10px] text-[#6b6b72] italic mt-0.5">
                          Sample: {sampleRows[0]?.[col] ? String(sampleRows[0][col]) : "[empty]"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {val && (
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[#edf3ec] text-[#346538] border border-[#346538]/10 uppercase tracking-wider">
                            Suggested
                          </span>
                        )}
                        <select
                          value={val}
                          onChange={(e) => setFieldMapping({ ...fieldMapping, [col]: e.target.value })}
                          className="h-8 text-xs bg-white border border-[#e3e3ea] rounded-md px-2 text-[#1e1e28] outline-none focus:border-[#3d5af1] transition-colors"
                        >
                          {LEAD_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#e3e3ea]">
                <button onClick={() => setActiveStep(2)} className="button-minimal-secondary text-xs flex items-center gap-1.5">
                  <ArrowLeft size={14} weight="bold" /> Back
                </button>
                <button onClick={() => setActiveStep(4)} className="button-minimal text-xs flex items-center gap-1.5">
                  Next: Duplicates <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DUPLICATES */}
          {activeStep === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-[#6b6b72]">Choose how to handle rows matching existing CRM records.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "skip", title: "Skip Duplicates", desc: "Ignore rows that match existing records. CRM data stays untouched." },
                  { id: "update", title: "Update Existing", desc: "Overwrite existing lead fields with values from the spreadsheet." },
                  { id: "create", title: "Import Anyway", desc: "Import matching rows as separate new lead records." },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setDupAction(opt.id)}
                    className={`rounded-lg border p-4 transition-all cursor-pointer min-h-[120px] flex flex-col justify-between ${
                      dupAction === opt.id ? "border-[#3d5af1] bg-[#f4f6ff]" : "border-[#e3e3ea] hover:border-[#6b6b72]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#1e1e28]">{opt.title}</p>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        dupAction === opt.id ? "border-[#3d5af1]" : "border-[#e3e3ea]"
                      }`}>
                        {dupAction === opt.id && <div className="w-2 h-2 rounded-full bg-[#3d5af1]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#6b6b72] leading-relaxed mt-2">{opt.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#e3e3ea]">
                <button onClick={() => setActiveStep(3)} className="button-minimal-secondary text-xs flex items-center gap-1.5">
                  <ArrowLeft size={14} weight="bold" /> Back
                </button>
                <button onClick={() => setActiveStep(5)} className="button-minimal text-xs flex items-center gap-1.5">
                  Next: Preflight <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PREFLIGHT */}
          {activeStep === 5 && (
            <div className="space-y-5">
              <p className="text-xs text-[#6b6b72]">Review your import configuration before running.</p>
              <div className="rounded-lg border border-[#e3e3ea] overflow-hidden text-xs">
                {[
                  { label: "File Name", value: file?.name },
                  { label: "Duplicate Action", value: dupAction },
                  { label: "Total Columns", value: `${columns.length} detected` },
                  { label: "Mapped Fields", value: `${Object.values(fieldMapping).filter(Boolean).length} of ${columns.length}` },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className={`grid grid-cols-2 p-3.5 bg-[#faf9f6] ${i < arr.length - 1 ? "border-b border-[#e3e3ea]" : ""}`}>
                    <span className="font-semibold text-[#6b6b72]">{label}</span>
                    <span className="font-mono text-right text-[#1e1e28] capitalize">{value}</span>
                  </div>
                ))}
                <div className="p-3.5 bg-[#faf9f6] border-t border-[#e3e3ea]">
                  <span className="font-semibold text-[#6b6b72] block mb-2">Column → Field Mapping</span>
                  <div className="space-y-1 pl-2 border-l-2 border-[#e3e3ea]">
                    {Object.entries(fieldMapping).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[#6b6b72] font-mono">{k}</span>
                        <span className="font-bold text-[#1e1e28]">→ {v}</span>
                      </div>
                    ))}
                    {Object.values(fieldMapping).filter(Boolean).length === 0 && (
                      <span className="text-[10px] text-[#9f2f2d]">No columns mapped.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#e3e3ea]">
                <button onClick={() => setActiveStep(4)} className="button-minimal-secondary text-xs flex items-center gap-1.5">
                  <ArrowLeft size={14} weight="bold" /> Back
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={loading}
                  className="button-minimal text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><ArrowsClockwise size={14} className="animate-spin" /> Importing...</>
                  ) : (
                    <><Play size={14} weight="fill" /> Run Import Engine</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: SUCCESS */}
          {activeStep === 6 && summary && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center py-2">
                <div className="p-4 rounded-full bg-[#edf3ec] text-[#346538]">
                  <CheckCircle size={32} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1e1e28]">Import Completed Successfully</h4>
                  <p className="text-[11px] text-[#6b6b72] mt-0.5">All valid rows have been scored and added to your pipeline.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Rows", value: summary.total_rows, color: "text-[#1e1e28]", bg: "bg-[#f4f3ef]" },
                  { label: "Imported", value: summary.imported_rows, color: "text-[#346538]", bg: "bg-[#edf3ec]" },
                  { label: "Duplicates", value: summary.duplicate_rows, color: "text-[#956400]", bg: "bg-[#fef6e4]" },
                  { label: "Failed", value: summary.failed_rows, color: "text-[#9f2f2d]", bg: "bg-[#fdebec]" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`minimal-card ${bg} p-4 text-center`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b72] mb-1">{label}</p>
                    <p className={`text-2xl font-mono font-bold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-2 border-t border-[#e3e3ea]">
                <button onClick={resetWizard} className="button-minimal text-xs">
                  Import Another File
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Import History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1e1e28] flex items-center gap-1.5">
              <Clock size={14} weight="bold" /> Import Execution Logs
            </h3>
            <p className="text-[10px] text-[#6b6b72] mt-0.5">Historical uploads and success metrics.</p>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-[#e3e3ea] text-[#6b6b72] uppercase tracking-wider">
            History
          </span>
        </div>
        <div className="minimal-card bg-white overflow-hidden">
          {historyLoading ? (
            <div className="p-8 text-center text-xs text-[#6b6b72]">
              <ArrowsClockwise size={16} className="animate-spin inline-block mr-2" />Loading import logs...
            </div>
          ) : importHistory.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#6b6b72]/50 font-mono italic">
              No historical import records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-[#faf9f6] border-b border-[#e3e3ea]">
                  <tr>
                    {["File Reference", "Total", "Imported", "Duplicates", "Failed", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 font-bold text-[#1e1e28] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e3ea]">
                  {importHistory.map((job) => (
                    <tr key={job.id} className="hover:bg-[#f7f6f3] transition-colors">
                      <td className="px-4 py-3 font-mono font-medium truncate max-w-[180px] text-[#1e1e28]">{job.filename}</td>
                      <td className="px-4 py-3 font-mono text-[#6b6b72]">{job.total_rows}</td>
                      <td className="px-4 py-3 font-mono text-[#346538] font-bold">{job.imported_rows}</td>
                      <td className="px-4 py-3 font-mono text-[#956400]">{job.duplicate_rows}</td>
                      <td className="px-4 py-3 font-mono text-[#9f2f2d]">{job.failed_rows}</td>
                      <td className="px-4 py-3 text-[#6b6b72]">{new Date(job.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                          job.status === "completed"
                            ? "bg-[#edf3ec] text-[#346538] border-[#346538]/10"
                            : job.status === "processing"
                            ? "bg-[#e1f3fe] text-[#1f6c9f] border-[#1f6c9f]/10"
                            : "bg-[#fdebec] text-[#9f2f2d] border-[#9f2f2d]/10"
                        }`}>{job.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
