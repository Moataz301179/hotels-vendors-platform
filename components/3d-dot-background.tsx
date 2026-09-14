"use client";

import { useEffect, useRef } from "react";

interface Dot3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseHue: number;
  radius: number;
  phase: number;
}

export function Dot3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      width = canvas.offsetWidth * dpr;
      height = canvas.offsetHeight * dpr;
      canvas.width = width;
      canvas.height = height;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const dots: Dot3D[] = [];
    const numDots = 120;
    const centerX = 1920 / 2;
    const centerY = 1080 / 2;

    for (let i = 0; i < numDots; i++) {
      const angle = (i / numDots) * Math.PI * 2;
      const arm = i % 3;
      const theta = angle + (arm * (Math.PI * 2)) / 3;
      const radius = Math.random() * 200 + 50;
      const spiralT = i / numDots;
      const baseRadius = radius + spiralT * 100;

      dots.push({
        x: centerX + Math.cos(theta) * baseRadius,
        y: centerY + Math.sin(theta) * baseRadius,
        z: Math.random() * 200 - 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.2,
        baseHue: 240 + arm * 60,
        radius: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    let animationId: number;

    const animate = () => {
      time += 0.016;
      animationId = requestAnimationFrame(animate);

      ctx.fillStyle = "rgba(12, 12, 18, 0.85)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.z += dot.vz;

        if (dot.x < 0) dot.x = width;
        if (dot.x > width) dot.x = 0;
        if (dot.y < 0) dot.y = height;
        if (dot.y > height) dot.y = 0;

        const angleFromCenter = Math.atan2(
          dot.y - height / 2,
          dot.x - width / 2
        );
        const distFromCenter = Math.sqrt(
          Math.pow(dot.x - width / 2, 2) + Math.pow(dot.y - height / 2, 2)
        );
        const spiralEffect = Math.sin(time * 0.3 + i * 0.1) * 5;
        const spiralX = dot.x + Math.cos(angleFromCenter) * spiralEffect;
        const spiralY = dot.y + Math.sin(angleFromCenter) * spiralEffect;

        const hueShift = Math.sin(time * 0.1 + dot.phase) * 30;
        const hue = dot.baseHue + hueShift;

        const depthFactor = 1 - dot.z / 200;
        const alpha = 0.4 + depthFactor * 0.4;

        const r = Math.sin(hue / 60) * 50 + 50;
        const g = Math.sin((hue + 120) / 60) * 50 + 50;
        const b = Math.sin((hue + 240) / 60) * 50 + 50;

        const usePurple = hue > 250 && hue < 320;
        const useGreen = hue > 120 && hue < 250;
        const colorR = usePurple
          ? Math.min(255, 42 + hue * 0.5)
          : useGreen
          ? Math.min(255, r * 0.3)
          : Math.min(255, r);
        const colorG = usePurple
          ? Math.min(255, 8 + hue * 0.3)
          : useGreen
          ? Math.min(255, 50 + hue * 0.3)
          : Math.min(255, g);
        const colorB = Math.min(255, b);

        ctx.beginPath();
        ctx.arc(spiralX, spiralY, dot.radius + depthFactor * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(colorR)}, ${Math.round(colorG)}, ${Math.round(colorB)}, ${alpha})`;
        ctx.fill();

        for (let j = 0; j < dots.length; j++) {
          if (i === j) continue;
          const other = dots[j];
          const dx = spiralX - other.x;
          const dy = spiralY - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const lineAlpha = (1 - dist / 80) * 0.15 * alpha;
            ctx.strokeStyle = `rgba(139, 92, 246, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(spiralX, spiralY);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
