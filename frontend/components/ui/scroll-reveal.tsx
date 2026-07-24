"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds */
  delay?: number;
  /** Direction of entry */
  direction?: "up" | "down" | "left" | "right";
  /** Distance in pixels */
  distance?: number;
  /** Include blur effect */
  blur?: boolean;
  /** Trigger once */
  once?: boolean;
  /** Duration override */
  duration?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 30,
  blur = true,
  once = true,
  duration = 0.8,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    margin: "0px 0px -60px 0px",
    amount: 0.1,
  });

  const directionMap = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        filter: blur ? "blur(8px)" : "blur(0px)",
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
          : { opacity: 0, x: offset.x, y: offset.y, filter: blur ? "blur(8px)" : "blur(0px)" }
      }
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
