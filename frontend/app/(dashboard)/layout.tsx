"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Brain,
  GitFork,
  Coins,
  ShieldCheck,
  List,
  X,
  MagnifyingGlass,
  Bell,
  EnvelopeSimple,
  Plus,
  Gear,
  Question,
  CaretDown,
} from "@phosphor-icons/react";

/* ─── HubSpot Navigation Items ─── */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  count?: number;
}

const navItems: NavItem[] = [
  { name: "Deals & Contacts", href: "/crm", icon: Users, label: "CRM", count: 18 },
  { name: "Conversations", href: "/mail", icon: EnvelopeSimple, label: "Inbox", count: 4 },
  { name: "Workflows", href: "/workflows", icon: GitFork, label: "Automations", count: 7 },
  { name: "Knowledge Base", href: "/memory", icon: Brain, label: "RAG Engine" },
  { name: "Capital & Finance", href: "/finance", icon: Coins, label: "Revenue" },
  { name: "Risk & Compliance", href: "/compliance", icon: ShieldCheck, label: "Audit" },
];

/* ─── Page transition ─── */
const pageTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const activeItem = navItems.find((item) => pathname.startsWith(item.href)) || navItems[0];

  return (
    <div className="flex flex-col min-h-screen text-[#2d3e50] bg-[#f5f8fa]">
      {/* ═══════════════════════════════════════════════════════════
          HUBSPOT TOP HEADER BAR (Dark Slate Navy #2d3e50)
         ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 sm:px-6 bg-[#2d3e50] text-white shadow-md select-none">
        {/* Left: Brand + Quick Search */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/crm"
            className="flex items-center gap-2 font-bold tracking-tight text-base hover:opacity-90 transition-opacity"
          >
            {/* HubSpot-style Sprocket Icon / Badge */}
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#ff7a59] text-white shadow-xs">
              <span className="font-extrabold text-sm font-mono">B</span>
            </div>
            <span className="hidden sm:inline-block font-sans text-sm tracking-tight text-white font-semibold">
              Beonix <span className="text-[#ff7a59] font-normal text-xs ml-0.5">Hub</span>
            </span>
          </Link>

          {/* HubSpot Global Search Input */}
          <div className="relative hidden md:flex items-center">
            <MagnifyingGlass
              className="absolute left-3 h-4 w-4 text-[#cbd6e2]"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search contacts, deals, workflows..."
              className="w-64 lg:w-80 pl-9 pr-12 py-1.5 bg-[#1f2937]/70 border border-[#374b61] rounded-md text-xs text-white placeholder-[#a1b0cb] outline-none focus:bg-[#1f2937] focus:border-[#ff7a59] transition-all"
            />
            <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#a1b0cb] bg-[#374b61]/60">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Quick Action Orange Button + Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create "+" Dropdown Button in HubSpot Orange */}
          <div className="relative">
            <button
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#ff7a59] text-white hover:bg-[#ff5c35] active:bg-[#e64f2a] shadow-xs transition-all"
              data-clickable
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">Create</span>
              <CaretDown size={10} weight="bold" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {quickCreateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white text-[#2d3e50] border border-[#cbd6e2] rounded-md shadow-lg py-1 z-50 text-xs font-medium"
                >
                  <Link
                    href="/crm"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#fff1ed] hover:text-[#ff7a59] transition-colors"
                    onClick={() => setQuickCreateOpen(false)}
                  >
                    <Users size={14} className="text-[#ff7a59]" />
                    New Contact / Deal
                  </Link>
                  <Link
                    href="/mail"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#fff1ed] hover:text-[#ff7a59] transition-colors"
                    onClick={() => setQuickCreateOpen(false)}
                  >
                    <EnvelopeSimple size={14} className="text-[#0091ae]" />
                    Compose Campaign
                  </Link>
                  <Link
                    href="/workflows"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#fff1ed] hover:text-[#ff7a59] transition-colors"
                    onClick={() => setQuickCreateOpen(false)}
                  >
                    <GitFork size={14} className="text-[#6a2b95]" />
                    Create Workflow
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-[#374b61] hidden sm:block" />

          {/* Quick Action Icons */}
          <button
            title="Documentation & Help"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md text-[#a1b0cb] hover:text-white hover:bg-[#374b61]/60 transition-colors"
          >
            <Question size={18} />
          </button>

          <button
            title="Settings"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md text-[#a1b0cb] hover:text-white hover:bg-[#374b61]/60 transition-colors"
          >
            <Gear size={18} />
          </button>

          <button
            title="Notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-md text-[#a1b0cb] hover:text-white hover:bg-[#374b61]/60 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff7a59]" />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div
              title="Suryoday P."
              className="w-7 h-7 rounded-full bg-[#ff7a59] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:ring-2 hover:ring-white/40 transition-all"
            >
              SP
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-[#a1b0cb] hover:text-white hover:bg-[#374b61]"
          >
            <List size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          HUBSPOT SUB-HEADER NAVIGATION BAR (White #ffffff)
         ═══════════════════════════════════════════════════════════ */}
      <div className="sticky top-14 z-30 bg-white border-b border-[#cbd6e2] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none">
          {/* Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 py-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "text-[#ff7a59] bg-[#fff1ed] font-semibold"
                      : "text-[#516f90] hover:text-[#2d3e50] hover:bg-[#f5f8fa]"
                  }`}
                >
                  <Icon
                    size={16}
                    weight={isActive ? "bold" : "regular"}
                    className={isActive ? "text-[#ff7a59]" : "text-[#516f90]"}
                  />
                  <span>{item.name}</span>
                  {item.count !== undefined && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-[#ff7a59] text-white"
                          : "bg-[#eaf0f6] text-[#516f90]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {/* HubSpot Active Orange Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ff7a59] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status Metric */}
          <div className="hidden lg:flex items-center gap-2 pl-4 py-2 border-l border-[#eaf0f6]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e5f7f5] text-[#00a38d] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a38d] animate-pulse" />
              Beonix OS Synced
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CANVAS CONTENT
         ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE MENU DRAWER
         ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative flex w-72 flex-col bg-[#2d3e50] text-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <div className="w-7 h-7 rounded-md bg-[#ff7a59] text-white flex items-center justify-center font-mono font-extrabold text-sm">
                    B
                  </div>
                  <span>Beonix Hub</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#a1b0cb] hover:text-white"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#ff7a59] text-white font-semibold"
                          : "text-[#a1b0cb] hover:bg-[#374b61] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
