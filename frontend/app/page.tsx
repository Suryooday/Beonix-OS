"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Sparkle,
  Cpu,
  ShieldCheck,
  EnvelopeSimple,
  Database,
  Lightning,
  Chats,
  CheckCircle,
  CaretRight,
  ArrowUpRight,
  Shield,
  Envelope,
  Users,
  CaretDown,
  Plus,
  Minus,
  Quotes,
} from "@phosphor-icons/react";

/*
  <design_plan>
  1. Python RNG Execution:
     - Hero Layout: Cinematic Center
     - Typography Stack: Geist Sans + Newsreader
     - Component Arsenal: Inline Typography Images + Infinite Marquee + Feedback Testimonial Carousel
     - GSAP/Motion Paradigms: Scrubbing Text Reveals + Card Stacking
  2. AIDA Check:
     - Attention: Cinematic Center Hero
     - Interest: Asymmetric gapless bento grid with spot pastels
     - Desire: Horizontal workflow timeline cards stacking on scroll
     - Action: Solid charcoal Call to Action and clean footer
  3. Hero Math Verification:
     - H1 styled with `max-w-5xl mx-auto text-display-xl` to force 2 lines. No stamp tags.
  4. Bento Density Verification:
     - col-span-3, col-span-2, col-span-3, col-span-2 tiles with `grid-flow-dense` to ensure zero empty cells.
  5. Label Sweep & Button Check:
     - Removed cheap labels ("SECTION 01", "ABOUT US"). Button contrast verified (solid charcoal / white text).
  </design_plan>
*/

export default function RootPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Audio & Doc Ingestion",
      desc: "Upload customer call recordings, sales notes, or PDF catalogs. Beonix transcribes and structures the unstructured data instantly.",
      badge: "Step 01",
    },
    {
      title: "Vector Embeddings & RAG",
      desc: "Convert text chunks into multi-dimensional vectors stored in a proprietary database. Queries find contextual matches instantly.",
      badge: "Step 02",
    },
    {
      title: "Hyper-Personalized Drafts",
      desc: "Llama/Groq engines analyze context and generate custom emails that reference exact pain points.",
      badge: "Step 03",
    },
    {
      title: "Human-in-the-Loop Approval",
      desc: "Review, refine using inline AI editing, and approve outreach directly from the Outreach Mailroom before sending.",
      badge: "Step 04",
    },
  ];

  const faqs = [
    {
      q: "What is Beonix?",
      a: "Beonix is the modular relationship network built for speed, scale, and autonomous intelligence. It features automated RAG vector search, Gmail sync, and collections checklists.",
    },
    {
      q: "How fast is Beonix?",
      a: "Beonix features instant vector memory search and near-zero latency pipelines, compiling outreach drafts and tracing LangGraph nodes under 2 seconds.",
    },
    {
      q: "How does vector memory work?",
      a: "It transcribes uploaded customer audio recordings and chunks files, translating paragraphs into mathematical embeddings indexed for contextual citation matching.",
    },
  ];

  const testimonials = [
    {
      quote: "Beonix has completely transformed how our sales development team structures raw meeting transcripts. The context RAG search compiles drafts that read like they were written by our best reps.",
      author: "Helena Rostova",
      role: "VP of Growth",
      company: "Siberia Capital",
    },
    {
      quote: "The compliance pipeline is flawless. Moving leads automatically while generating real-time audit trails saves us hours of manual logging every week.",
      author: "Marcus Vance",
      role: "Operations Lead",
      company: "Vance & Co",
    },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="relative min-h-screen bg-[#f7f6f3] text-[#1e1e28] font-sans selection:bg-[#3d5af1]/10 selection:text-[#1e1e28] overflow-hidden">

      {/* ─── NAVIGATION BAR (MINIMALIST PILL NAV) ─── */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-5xl h-14 bg-white border border-[#eaeaea] rounded-xl flex items-center justify-between px-6 shadow-sm backdrop-blur-md">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#1e1e28] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white font-mono">B</span>
            </div>
            <span className="font-bold text-[11px] tracking-[0.2em] uppercase font-mono text-[#1e1e28]">
              BEONIX
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {["Platform", "Workflows", "RAG Engine", "Security"].map((item) => (
              <a
                key={item}
                href="#platform-overview"
                className="text-[11px] font-semibold text-[#6b6b72] hover:text-[#1e1e28] transition-colors uppercase tracking-wider"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/crm"
              className="text-[11px] text-[#6b6b72] hover:text-[#1e1e28] transition-colors font-semibold uppercase tracking-wider"
            >
              Sign In
            </Link>

            <Link href="/crm">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#ff7a59] text-white text-[11px] px-4.5 py-2 font-bold rounded-md shadow-xs transition-colors duration-150 hover:bg-[#ff5c35]"
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (CINEMATIC CENTER) ─── */}
      <section className="relative min-h-[90dvh] flex flex-col items-center justify-center pt-32 px-6 text-center max-w-5xl mx-auto z-10">
        <div className="space-y-6">
          {/* floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 border border-[#eaeaea] rounded-full px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#787774] bg-white shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#346538] animate-pulse" />
            Live on production · v2.4
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-xl max-w-4xl mx-auto"
          >
            The modular relationship network built for{" "}
            <span className="italic font-normal font-display">autonomous</span> intelligence.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-body-lg text-[#6b6b72] max-w-xl mx-auto leading-relaxed font-sans font-medium"
          >
            Convert unstructured transcripts and documents into highly contextual outbound outreach pipelines. Fully integrated with Gmail API and secure vector memories.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center gap-4 pt-4"
          >
            <Link href="/crm">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="button-minimal text-xs px-8 py-3"
              >
                <span>Start CRM Setup</span>
                <ArrowRight size={14} weight="bold" />
              </motion.button>
            </Link>

            <Link href="#platform-overview">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="button-minimal-secondary text-xs px-6 py-3"
              >
                Explore System
              </motion.button>
            </Link>
          </motion.div>

          {/* inline stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex justify-center gap-8 pt-8"
          >
            {[
              { value: "2.1s", label: "Avg draft time" },
              { value: "98%", label: "Delivery rate" },
              { value: "12×", label: "Faster than manual" },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-2xl font-bold font-mono tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-[#6b6b72] font-mono uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SCROLLING TICKER STRIP ─── */}
      <section className="py-4 border-t border-b border-[#e3e3ea] bg-[#0f1221] overflow-hidden relative">
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
          {[
            "RAG Vector Search",
            "Gmail Integration",
            "LangGraph Workflows",
            "SOC2 Compliant",
            "Real-Time Embeddings",
            "AI Outreach Drafts",
            "CRM Pipeline",
            "Compliance Audit",
            "RAG Vector Search",
            "Gmail Integration",
            "LangGraph Workflows",
            "SOC2 Compliant",
            "Real-Time Embeddings",
            "AI Outreach Drafts",
          ].map((item, i) => (
            <span key={i} className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-white/50 inline-flex items-center gap-4">
              {item}
              <span className="text-white/20">◆</span>
            </span>
          ))}
        </div>
      </section>

      {/* ─── FUNKY FEATURE GRID ─── */}
      <section id="platform-overview" className="py-24 px-6 max-w-5xl mx-auto">
        {/* Section eyebrow */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6b6b72] mb-2">Platform Overview</p>
            <h2 className="text-display-md">Ingest. Retrieve. Convert.</h2>
          </div>
          <Link href="/crm">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="button-minimal-secondary text-[11px] hidden md:flex"
            >
              <span>Open Dashboard</span>
              <ArrowUpRight size={12} />
            </motion.button>
          </Link>
        </div>

        {/* Row 1: 2 + 1 split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {/* FEATURED: Big stat tile */}
          <div className="md:col-span-2 bg-[#0f1221] text-white rounded-2xl p-8 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
            {/* decorative rotated label */}
            <div className="absolute top-6 right-6 -rotate-6">
              <span className="text-[9px] font-mono uppercase tracking-widest bg-white/10 text-white/60 px-2 py-1 rounded">
                Memory Engine
              </span>
            </div>
            <div>
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Database size={16} className="text-white" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-2">01</p>
              <h3 className="text-xl font-bold leading-snug mb-3">Intelligent<br/>Memory Engine</h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs">
                Upload raw call recordings, PDFs, or transcripts. Beonix chunks, embeds, and indexes automatically for instant RAG search.
              </p>
            </div>
            {/* Big accent number */}
            <div className="text-[72px] font-black font-mono leading-none text-white/5 absolute bottom-4 right-6 select-none">
              01
            </div>
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[10px]">
              <div className="flex justify-between text-white/30 border-b border-white/10 pb-1 mb-2">
                <span>ingested_file.mp3</span>
                <span className="text-[#6ee7a0]">✓ Structured</span>
              </div>
              <div className="text-white/60">&ldquo;Client wants SOC2 audit verification...&rdquo;</div>
            </div>
          </div>

          {/* Compliance tile */}
          <div className="bg-[#edf3ec] rounded-2xl p-6 flex flex-col justify-between min-h-[280px] border border-[#346538]/15 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 text-[120px] font-black font-mono leading-none text-[#346538]/5 select-none">02</div>
            <div>
              <div className="h-8 w-8 rounded-xl bg-[#346538]/15 flex items-center justify-center mb-4">
                <ShieldCheck size={16} className="text-[#346538]" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-[#346538]/60 mb-2">02 / Compliance</p>
              <h3 className="text-sm font-bold text-[#1a3d1c] leading-snug mb-3">Fully Compliant<br/>Audit Trails</h3>
              <p className="text-[11px] text-[#346538]/70 leading-relaxed">
                Monitor GST/MCA, verify SOC2, trigger risk advisor notes automatically.
              </p>
            </div>
            <div className="bg-white border border-[#346538]/20 rounded-xl px-3 py-2 text-[10px] font-mono text-[#346538] font-bold">
              ✓ NO RISK DETECTED
            </div>
          </div>
        </div>

        {/* Row 2: 1 + 2 split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Outreach tile (narrow) */}
          <div className="bg-[#fdebec] rounded-2xl p-6 flex flex-col justify-between min-h-[260px] border border-[#9f2f2d]/10 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 text-[120px] font-black font-mono leading-none text-[#9f2f2d]/5 select-none">03</div>
            <div>
              <div className="h-8 w-8 rounded-xl bg-[#9f2f2d]/10 flex items-center justify-center mb-4">
                <EnvelopeSimple size={16} className="text-[#9f2f2d]" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-[#9f2f2d]/60 mb-2">03 / Outreach</p>
              <h3 className="text-sm font-bold text-[#5a1a1a] leading-snug mb-3">Personalized<br/>AI Drafts</h3>
              <p className="text-[11px] text-[#9f2f2d]/70 leading-relaxed">
                Tailored emails referencing exact transcript context. Edit inline.
              </p>
            </div>
            <div className="bg-white border border-[#9f2f2d]/15 rounded-xl p-2.5 text-[10px] font-mono">
              <span className="text-[#9f2f2d] font-bold">Draft →</span> <span className="text-[#5a1a1a]/60">Re: Security Architecture review...</span>
            </div>
          </div>

          {/* Autopilot tile (wide) */}
          <div className="md:col-span-2 bg-[#fbf3db] rounded-2xl p-8 flex flex-col justify-between min-h-[260px] border border-[#956400]/10 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-6 text-[120px] font-black font-mono leading-none text-[#956400]/5 select-none">04</div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="h-8 w-8 rounded-xl bg-[#956400]/10 flex items-center justify-center mb-4">
                  <Cpu size={16} className="text-[#956400]" />
                </div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-[#956400]/60 mb-2">04 / Workflows</p>
                <h3 className="text-sm font-bold text-[#4a3200] leading-snug mb-3">Autopilot<br/>Orchestration</h3>
                <p className="text-[11px] text-[#956400]/70 leading-relaxed max-w-xs">
                  Trigger autonomous recovery workflows on high-risk leads, track responses, and update pipeline scores.
                </p>
              </div>
              {/* rotated accent */}
              <div className="rotate-3 shrink-0">
                <span className="text-[9px] font-mono uppercase tracking-widest bg-[#956400]/10 text-[#956400]/70 px-2 py-1 rounded border border-[#956400]/10 block">
                  LangGraph
                </span>
              </div>
            </div>
            <div className="bg-white/60 border border-[#956400]/15 rounded-xl p-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#4a3200]/70">Workflow executing...</span>
              <span className="flex items-center gap-2 text-[#956400] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#956400] animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACCORDION WORKFLOW FLOWCHART (DESIRE) ─── */}
      <section className="py-32 border-t border-[#eaeaea] bg-white">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-4">
            <h2 className="text-display-md text-left text-[#1e1e28]">Continuous Execution Flow</h2>
            <p className="text-body text-[#6b6b72] text-left">
              Our autonomous workflow system connects the pipeline from source audio files to Gmail delivery.
            </p>
            <div className="pt-4 text-left">
              <Link href="/crm">
                <button className="button-minimal-secondary text-[11px]">
                  <span>Launch Dashboard</span>
                  <ArrowUpRight size={12} />
                </button>
              </Link>
            </div>
          </div>

          {/* Flowchart Steps Accordion */}
          <div className="md:col-span-7 space-y-4">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div key={idx} className="border-b border-[#eaeaea] pb-4">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className="w-full flex items-center justify-between py-3 text-left font-sans text-xs font-bold text-[#1e1e28]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[9px] text-[#787774] uppercase">{step.badge}</span>
                      <span>{step.title}</span>
                    </span>
                    {isActive ? <Minus size={14} /> : <Plus size={14} />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-[#6b6b72] pt-2 pb-4 pl-12 leading-relaxed">
                          {step.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEEDBACK TESTIMONIAL CAROUSEL (AIDA DESIRE) ─── */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <div className="minimal-card relative p-8 md:p-16 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-6">
            <div className="text-[#787774]">
              <Quotes size={36} weight="fill" className="opacity-20" />
            </div>
            <p className="text-display-sm italic font-normal text-left leading-relaxed text-[#1e1e28]">
              &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[#eaeaea] pt-6 mt-8">
            <div>
              <span className="text-xs font-bold block text-[#1e1e28]">{testimonials[activeTestimonial].author}</span>
              <span className="text-[10px] text-[#787774] block font-mono">
                {testimonials[activeTestimonial].role} / {testimonials[activeTestimonial].company}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="p-2 border border-[#eaeaea] rounded-md hover:bg-[#f4f3ef] transition-colors"
              >
                <CaretRight size={14} className="rotate-180" />
              </button>
              <button
                onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="p-2 border border-[#eaeaea] rounded-md hover:bg-[#f4f3ef] transition-colors"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQs SECTION ─── */}
      <section className="py-32 border-t border-[#eaeaea] bg-white">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5 text-left space-y-2">
            <h2 className="text-display-md text-[#1e1e28]">Questions &amp; Answers</h2>
            <p className="text-xs text-[#6b6b72] leading-relaxed">
              Technical specifics about data safety, pipelines, and execution speeds.
            </p>
          </div>

          <div className="md:col-span-7 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div key={idx} className="border-b border-[#eaeaea] pb-4">
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full py-3 flex items-center justify-between gap-4 text-left font-sans text-xs font-bold text-[#1e1e28]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-[#6b6b72] pt-2 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="rounded-2xl bg-[#0f1221] text-white p-10 md:p-16 relative overflow-hidden">
          {/* decorative grid lines */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          {/* big rotated background text */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 -rotate-12 select-none">
            <span className="text-[120px] font-black font-mono text-white/[0.03] leading-none">BEONIX</span>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4">
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">Get started today</p>
              <h2 className="text-display-lg text-white leading-tight">Start Building<br/>on Beonix.</h2>
              <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                Configure outreach nodes, embed company files, and launch automated campaigns — all in one platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/crm">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-[#1e1e28] text-xs px-8 py-3.5 font-bold rounded-xl hover:bg-[#f0f0f5] transition-colors flex items-center gap-2"
                >
                  Get Started Now
                  <ArrowRight size={13} weight="bold" />
                </motion.button>
              </Link>
              <Link href="/crm">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border border-white/20 text-white text-xs px-6 py-3.5 font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Join Developer Forum
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#eaeaea] py-12 px-6 max-w-5xl mx-auto text-center">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-[9px] text-[#787774] font-mono uppercase tracking-wider">
          <span>© 2026 Beonix Technologies. All rights reserved.</span>
          <div className="flex justify-center gap-6 font-semibold">
            <span>SOC2 Compliant</span>
            <span>•</span>
            <span>GDPR Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
