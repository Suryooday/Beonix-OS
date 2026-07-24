"use client";

import React from "react";
import { ScrollReveal } from "./scroll-reveal";

interface SectionHeadingProps {
  overline?: string;
  title: string;
  subtitle?: string;
  gradient?: boolean;
  className?: string;
  align?: "left" | "center";
  size?: "xl" | "lg" | "md" | "sm";
}

export function SectionHeading({
  overline,
  title,
  subtitle,
  gradient = false,
  className = "",
  align = "left",
  size = "lg",
}: SectionHeadingProps) {
  const sizeClass = {
    xl: "text-display-xl",
    lg: "text-display-lg",
    md: "text-display-md",
    sm: "text-display-sm",
  }[size];

  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`${alignClass} ${className}`}>
      {overline && (
        <ScrollReveal delay={0}>
          <span className="text-overline inline-block mb-4">{overline}</span>
        </ScrollReveal>
      )}
      <ScrollReveal delay={0.08}>
        <h2 className={`${sizeClass} ${gradient ? "text-gradient" : "text-foreground"}`}>
          {title}
        </h2>
      </ScrollReveal>
      {subtitle && (
        <ScrollReveal delay={0.16}>
          <p className="text-body-lg mt-4 max-w-2xl" style={align === "center" ? { margin: "1rem auto 0" } : undefined}>
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}

export default SectionHeading;
