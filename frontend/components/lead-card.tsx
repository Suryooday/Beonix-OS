"use client";

import React from "react";
import { Lead } from "@/types";
import {
  EnvelopeSimple,
  Buildings,
  Phone,
  Star,
  DotsSixVertical,
} from "@phosphor-icons/react";

interface LeadCardProps {
  lead: Lead;
  onSelect: (leadId: number) => void;
  isSelected?: boolean;
}

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
}

function getScoreConfig(score: number) {
  if (score >= 85)
    return {
      text: "#9f2f2d",
      bg: "#fdebec",
      border: "#9f2f2d15",
      bar: "#9f2f2d",
      label: "Hot",
    };
  if (score >= 65)
    return {
      text: "#956400",
      bg: "#fbf3db",
      border: "#95640015",
      bar: "#956400",
      label: "Warm",
    };
  return {
    text: "#787774",
    bg: "#f4f3ef",
    border: "#eaeaea",
    bar: "#787774",
    label: "Cold",
  };
}

function getPriorityColor(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "#9f2f2d";
    case "medium":
      return "#956400";
    default:
      return "#787774";
  }
}

export default function LeadCard({ lead, onSelect, isSelected = false }: LeadCardProps) {
  const scoreConfig = getScoreConfig(lead.score);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", lead.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(lead.id)}
      data-clickable
      className={`group active:cursor-grabbing rounded-md p-3.5 space-y-2.5 transition-all cursor-pointer border shadow-2xs ${
        isSelected
          ? "bg-[#fff1ed] border-[#ff7a59] ring-1 ring-[#ff7a59]"
          : "bg-white border-[#cbd6e2] hover:border-[#ff7a59]"
      }`}
    >
      {/* Row 1: Contact Avatar + Name + Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#ff7a59] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
            {lead.name ? lead.name.charAt(0).toUpperCase() : "C"}
          </div>
          <h4 className={`font-bold text-xs truncate leading-tight tracking-tight text-[#2d3e50] group-hover:text-[#ff7a59]`}>
            {lead.name}
          </h4>
        </div>

        {/* Score badge */}
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0"
          style={{
            background: scoreConfig.bg,
            border: `1px solid ${scoreConfig.border}`,
            color: scoreConfig.text,
          }}
        >
          <Star size={9} weight="fill" style={{ color: scoreConfig.text }} />
          <span>{lead.score}%</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-[3px] rounded-full overflow-hidden bg-[#eaf0f6]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, lead.score)}%`,
            background: scoreConfig.bar,
          }}
        />
      </div>

      {/* Info rows */}
      <div className="space-y-1 pt-0.5">
        {lead.company && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Buildings size={12} className="shrink-0 text-[#516f90]" />
            <span className="text-[11px] font-medium text-[#2d3e50] truncate">{lead.company}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 min-w-0">
          <EnvelopeSimple size={12} className="shrink-0 text-[#516f90]" />
          <span className="text-[10px] font-mono text-[#516f90] truncate">{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={12} className="shrink-0 text-[#516f90]" />
            <span className="text-[10px] font-mono text-[#516f90] truncate">{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#eaf0f6]">
        <span className="text-[9px] font-mono text-[#516f90]">
          {lead.created_at ? formatDate(lead.created_at) : "Added recently"}
        </span>
        <div className="flex items-center gap-1">
          {lead.source && (
            <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#f5f8fa] border border-[#cbd6e2] text-[#516f90]">
              {lead.source}
            </span>
          )}
          <DotsSixVertical size={14} className="text-[#cbd6e2] group-hover:text-[#516f90]" />
        </div>
      </div>
    </div>
  );
}
