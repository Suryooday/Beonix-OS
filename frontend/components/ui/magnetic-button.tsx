"use client";

import React from "react";
import { useMagnetic } from "@/hooks/use-magnetic";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  strength?: number;
}

export function MagneticButton({
  children,
  className = "",
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  strength = 0.25,
}: MagneticButtonProps) {
  const magneticRef = useMagnetic(strength);

  const baseClass =
    variant === "primary" ? "btn-premium" : "btn-ghost-premium";

  return (
    <div ref={magneticRef} className="inline-block" style={{ willChange: "transform" }}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClass} ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {children}
      </button>
    </div>
  );
}

export default MagneticButton;
