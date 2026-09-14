"use client";

import { cn } from "@/lib/utils";

interface OlivLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "green";
}

const SIZE_MAP = {
  xs: { width: 60, height: 20 },
  sm: { width: 80, height: 28 },
  md: { width: 100, height: 34 },
  lg: { width: 140, height: 48 },
  xl: { width: 180, height: 60 },
};

const COLOR_MAP = {
  dark: { text: "var(--text-primary)", accent: "var(--success)" },
  light: { text: "var(--foreground)", accent: "var(--success)" },
  green: { text: "var(--success)", accent: "var(--success)" },
};

/**
 * Oliv logo — wordmark with leaf accent.
 */
export function OlivLogo({ className, size = "md", variant = "dark" }: OlivLogoProps) {
  const dims = SIZE_MAP[size];
  const colors = COLOR_MAP[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 60"
      width={dims.width}
      height={dims.height}
      className={cn("shrink-0", className)}
      aria-label="Oliv"
    >
      {/* Leaf icon */}
      <path
        d="M12 8 C18 4, 28 6, 30 14 C32 22, 26 30, 18 28 C10 26, 6 18, 12 8Z"
        fill={colors.accent}
        opacity="0.9"
      />
      <path
        d="M16 12 C20 10, 24 12, 26 18"
        fill="none"
        stroke={variant === "light" ? "#ffffff" : "var(--bg-canvas)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* "oliv" text */}
      <text
        x="38"
        y="38"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontSize="30"
        fontWeight="600"
        fill={colors.text}
        letterSpacing="-0.02em"
      >
        oliv
      </text>
    </svg>
  );
}
