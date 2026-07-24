"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

interface ParallaxOptions {
  /** Parallax speed multiplier (negative = opposite direction) */
  speed?: number;
  /** Scroll offset range [start, end] as viewport fractions */
  offset?: [string, string];
}

/**
 * Parallax hook — returns a ref for the container and a y MotionValue
 * that can be passed to motion.div's style={{ y }} for smooth parallax.
 */
export function useParallax(options: ParallaxOptions = {}): {
  ref: React.RefObject<HTMLDivElement | null>;
  y: MotionValue<number>;
} {
  const { speed = 0.3, offset = ["start end", "end start"] } = options;

  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return { ref, y };
}
