"use client";

import { motion, AnimatePresence } from "framer-motion";

interface IPadFrameProps {
  children: React.ReactNode;
  accentColor: string;
}

export function IPadFrame({ children, accentColor }: IPadFrameProps) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* iPad outer frame */}
      <div
        className="relative rounded-[28px] p-[10px]"
        style={{
          background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.6), 0 0 80px ${accentColor}08`,
        }}
      >
        {/* iPad camera notch */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full z-10" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.04)" }} />
        {/* iPad screen bezel */}
        <div
          className="rounded-[18px] overflow-hidden relative"
          style={{ border: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* Screen content */}
          <div className="bg-[#000000]">
            <AnimatePresence mode="wait">
              <motion.div
                key={accentColor}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* iPad home indicator */}
        <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[60px] h-[3px] rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
      </div>
      {/* Reflection / glow underneath */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-[40px] rounded-full blur-[30px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${accentColor}10, transparent)` }}
      />
    </div>
  );
}
