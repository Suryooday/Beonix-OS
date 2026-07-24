"use client";

import { useRef } from "react";
import { useInView, UseInViewOptions } from "framer-motion";

interface ScrollRevealOptions {
  /** Trigger once or continuously */
  once?: boolean;
  /** IntersectionObserver margin */
  margin?: string;
  /** Amount of element visible before triggering (0-1) */
  amount?: number;
}

/**
 * Custom hook for scroll-triggered reveal animations.
 * Returns a ref and an isInView boolean.
 * Combine with Framer Motion's `animate` prop for opacity + translateY + blur reveals.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { once = true, margin = "0px 0px -80px 0px", amount = 0.15 } = options;

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    margin,
    amount,
  } as UseInViewOptions);

  return { ref, isInView };
}
