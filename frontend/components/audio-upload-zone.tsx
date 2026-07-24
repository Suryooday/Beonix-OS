"use client";

import React, { useState, useRef } from "react";
import { api } from "@/services/api";
import { CloudArrowUp, CircleNotch, CheckCircle, Warning } from "@phosphor-icons/react";

interface AudioUploadZoneProps {
  onIngestComplete: (leadId: number) => void;
}

export default function AudioUploadZone({ onIngestComplete }: AudioUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<string | null>(null); // Transcribing, Extracting, Scoring, Completed
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError(null);
    setStatus("0%");
    try {
      const response = await api.uploadAudioCall(file, (progressStatus) => {
        setStatus(progressStatus);
      });
      if (response.data.success) {
        setStatus("Completed");
        setTimeout(() => {
          onIngestComplete(response.data.lead_id);
          setStatus(null);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process audio recording.");
      setStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="w-full font-sans"
      >
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative overflow-hidden ${
            dragActive
              ? "border-[#3d5af1] bg-[#f4f6ff]"
              : "border-[#e3e3ea] hover:border-[#6b6b72] bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a"
            onChange={handleFileChange}
            className="hidden"
            disabled={status !== null}
          />

          {status === null ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded bg-[#f4f3ef] border border-[#e3e3ea] text-[#1e1e28]">
                <CloudArrowUp size={24} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1e1e28]">Upload Call Recording</p>
                <p className="text-[10px] text-[#787774] mt-0.5 font-mono">Drag and drop or click to browse</p>
              </div>
              <p className="text-[9px] font-mono text-[#787774]/70">MP3, WAV, M4A supported</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              {status === "Completed" ? (
                <CheckCircle size={28} className="text-[#346538]" weight="bold" />
              ) : (
                <CircleNotch size={28} className="text-[#3d5af1] animate-spin" />
              )}

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#1e1e28] capitalize">
                  {status === "Completed" ? "Ingestion Successful!" : status}
                </p>

                {status !== "Completed" && (
                  <div className="flex items-center gap-1.5 justify-center text-[9px] font-mono text-[#787774]/70 pt-1.5">
                    <span className={status === "Transcribing Audio" ? "text-[#3d5af1] font-bold" : ""}>Transcribe</span>
                    <span>→</span>
                    <span className={status === "Extracting Lead Details" ? "text-[#3d5af1] font-bold" : ""}>Extract</span>
                    <span>→</span>
                    <span className={status === "Scoring Lead" ? "text-[#3d5af1] font-bold" : ""}>Score</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded bg-[#fdebec] border border-[#9f2f2d]/10 text-[#9f2f2d] text-xs">
          <Warning size={14} className="shrink-0 mt-0.5" weight="bold" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
