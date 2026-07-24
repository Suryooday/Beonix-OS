"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  className?: string;
  maxSize?: number;
  speed?: number;
  mouseReactive?: boolean;
}

export function FloatingParticles({
  count = 40,
  color = "99, 102, 241",
  className = "",
  maxSize = 3,
  speed = 0.3,
  mouseReactive = true,
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);

  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * maxSize + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }
      particlesRef.current = particles;
    },
    [count, maxSize, speed]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      initParticles(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    if (mouseReactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    if (prefersReducedMotion) {
      // Draw static particles once
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      });
      return () => window.removeEventListener("resize", resize);
    }

    function animate() {
      const rect = canvas!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);

      particlesRef.current.forEach((p) => {
        // Mouse repulsion
        if (mouseReactive) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.vx += (dx / dist) * force * 0.15;
            p.vy += (dy / dist) * force * 0.15;
          }
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = rect.width + 10;
        if (p.x > rect.width + 10) p.x = -10;
        if (p.y < -10) p.y = rect.height + 10;
        if (p.y > rect.height + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx!.fill();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (mouseReactive) canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [color, initParticles, mouseReactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default FloatingParticles;
