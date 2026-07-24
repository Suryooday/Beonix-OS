"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/services/api";
import { Lead } from "@/types";

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newLead: Lead) => void;
}

export default function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [score, setScore] = useState(75);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError("Name and Email are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createLead({
        name,
        email,
        company: company.trim() || null,
        score: Number(score) || 0,
      });
      onSuccess(response.data);
      setName("");
      setEmail("");
      setCompany("");
      setScore(75);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-white border border-[#eaeaea] rounded-lg p-6 shadow-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5 mb-2">
            <DialogTitle className="text-sm font-bold text-[#1e1e28]">Add New Lead</DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">
              Initialize a new lead in your CRM pipeline.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="my-3 p-3 rounded bg-[#fdebec] border border-[#9f2f2d]/10 text-[#9f2f2d] text-xs">
              {error}
            </div>
          )}

          <div className="py-3 space-y-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="lead-name" className="text-[10px] text-[#787774]">
                Full Name *
              </label>
              <input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-email" className="text-[10px] text-[#787774]">
                Email Address *
              </label>
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@company.com"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774] font-mono"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-company" className="text-[10px] text-[#787774]">
                Company Name
              </label>
              <input
                id="lead-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corporation"
                className="w-full px-2.5 py-1.5 bg-[#f7f6f3] border border-[#eaeaea] rounded text-xs outline-none focus:border-[#787774]"
                disabled={loading}
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] text-[#787774]">
                <label htmlFor="lead-score">Lead Score</label>
                <span className="font-mono font-bold text-[#1e1e28]">{score} / 100</span>
              </div>
              <input
                id="lead-score"
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-[#1e1e28] cursor-pointer h-[3px] bg-[#f4f3ef] rounded-full appearance-none"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[#eaeaea] flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="button-minimal-secondary text-xs px-4 py-2"
              data-clickable
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="button-minimal text-xs px-4.5 py-2"
              data-clickable
            >
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
