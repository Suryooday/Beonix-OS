"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds for stagger animation */
  delay?: number;
  /** Whether to animate on scroll */
  animate?: boolean;
  /** Whether hovering lifts the card */
  hover?: boolean;
  /** Glow on hover */
  glow?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  style?: React.CSSProperties;
  "data-clickable"?: boolean;
}

export function GlassCard({
  children,
  className = "",
  delay = 0,
  animate = true,
  hover = true,
  glow = false,
  onClick,
  onDragStart,
  draggable,
  style,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  const baseClasses = `
    relative overflow-hidden
    bg-[var(--glass-bg)]
    border border-[var(--glass-border)]
    rounded-[24px]
    shadow-[var(--glass-shadow)]
    backdrop-blur-[24px]
    transition-all duration-500
  `;

  const hoverClasses = hover
    ? "hover:translate-y-[-3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06),0_0_0_1px_var(--glass-border)]"
    : "";

  const glowClasses = glow
    ? "hover:border-[rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
    : "";

  if (!animate) {
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
        style={style}
        onClick={onClick}
        onDragStart={onDragStart}
        draggable={draggable}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
      style={style}
      onClick={onClick}
      onDragStart={onDragStart as any}
      draggable={draggable}
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 24, filter: "blur(6px)" }
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default GlassCard;
