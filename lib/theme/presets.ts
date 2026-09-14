export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accent: {
    50: string; 100: string; 200: string; 300: string;
    400: string; 500: string; 600: string; 700: string;
    800: string; 900: string;
  };
  bg: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceHover: string;
  };
  fg: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fontFamily: string;
  fontSizeScale: number; // 0.875 = small, 1 = default, 1.125 = large
  density: "compact" | "default" | "spacious";
}

export const PRESETS: ThemePreset[] = [
  {
    id: "hotels-vendors",
    name: "Hotels Vendors",
    description: "Dark crimson red on deep charcoal. The signature brand identity.",
    accent: {
      50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
      400: "#ff6b6b", 500: "#8B0000", 600: "#6B0000", 700: "#500000",
      800: "#3a0000", 900: "#220000",
    },
    bg: {
      background: "#050505",
      surface: "#0a0a0a",
      surfaceRaised: "#101010",
      surfaceHover: "#1a1a1a",
    },
    fg: {
      primary: "#f0f0f0",
      secondary: "#a0a0a0",
      tertiary: "#707070",
      muted: "#505050",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#ef4444",
      info: "#60a5fa",
    },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeScale: 1,
    density: "default",
  },
  {
    id: "indigo-fintech",
    name: "Indigo Fintech",
    description: "Electric indigo on deep charcoal. Modern institutional feel.",
    accent: {
      50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
      400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
      800: "#3730a3", 900: "#312e81",
    },
    bg: {
      background: "#050508",
      surface: "#050505",
      surfaceRaised: "#12121a",
      surfaceHover: "#1a1a25",
    },
    fg: {
      primary: "#f1f0f5",
      secondary: "#a09fb0",
      tertiary: "#6e6d7e",
      muted: "#4a4958",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#60a5fa",
    },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSizeScale: 1,
    density: "default",
  },
  {
    id: "emerald-compliance",
    name: "Emerald Compliance",
    description: "Deep emerald on midnight green. Trust and sustainability.",
    accent: {
      50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
      400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
      800: "#065f46", 900: "#064e3b",
    },
    bg: {
      background: "#0a0f0d",
      surface: "#0f1412",
      surfaceRaised: "#141a17",
      surfaceHover: "#1a211d",
    },
    fg: {
      primary: "#ffffff",
      secondary: "#9ca3af",
      tertiary: "#6b7280",
      muted: "#4b5563",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#60a5fa",
    },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSizeScale: 1,
    density: "default",
  },
  {
    id: "violet-luxury",
    name: "Violet Luxury",
    description: "Royal violet on deep slate. Premium factoring positioning.",
    accent: {
      50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
      400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
      800: "#5b21b6", 900: "#4c1d95",
    },
    bg: {
      background: "#0c0c12",
      surface: "#12121a",
      surfaceRaised: "#1a1a24",
      surfaceHover: "#22222e",
    },
    fg: {
      primary: "#f1f0f5",
      secondary: "#a0a0b0",
      tertiary: "#6e6d8e",
      muted: "#4a4968",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#60a5fa",
    },
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSizeScale: 1.05,
    density: "spacious",
  },
  {
    id: "cyan-tech",
    name: "Cyan Tech",
    description: "Bright cyan on near-black. AI-first, startup energy.",
    accent: {
      50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9",
      400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490",
      800: "#155e75", 900: "#164e63",
    },
    bg: {
      background: "#050a0c",
      surface: "#0a1114",
      surfaceRaised: "#10191d",
      surfaceHover: "#162126",
    },
    fg: {
      primary: "#ecfeff",
      secondary: "#9ca3af",
      tertiary: "#6b7280",
      muted: "#374151",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#22d3ee",
    },
    fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
    fontSizeScale: 0.95,
    density: "compact",
  },
  {
    id: "gold-premium",
    name: "Gold Premium",
    description: "Warm gold on espresso black. Executive boardroom feel.",
    accent: {
      50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
      400: "#fbbf24", 500: "#d97706", 600: "#b45309", 700: "#92400e",
      800: "#78350f", 900: "#451a03",
    },
    bg: {
      background: "#0a0805",
      surface: "#12100c",
      surfaceRaised: "#1a1712",
      surfaceHover: "#221e18",
    },
    fg: {
      primary: "#fffbeb",
      secondary: "#b0a090",
      tertiary: "#786860",
      muted: "#504840",
    },
    semantic: {
      success: "#34d399",
      warning: "#fbbf24",
      error: "#ef4444",
      info: "#60a5fa",
    },
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSizeScale: 1.05,
    density: "spacious",
  },
];

export const DEFAULT_PRESET = PRESETS[0];

export function applyPreset(preset: ThemePreset) {
  const root = document.documentElement;

  // Accent
  for (let i = 1; i <= 9; i++) {
    const key = (i * 50) as keyof typeof preset.accent;
    if (preset.accent[key]) {
      root.style.setProperty(`--accent-${key}`, preset.accent[key]);
    }
  }

  // Background
  root.style.setProperty("--background", preset.bg.background);
  root.style.setProperty("--surface", preset.bg.surface);
  root.style.setProperty("--surface-raised", preset.bg.surfaceRaised);
  root.style.setProperty("--surface-hover", preset.bg.surfaceHover);

  // Foreground
  root.style.setProperty("--foreground", preset.fg.primary);
  root.style.setProperty("--foreground-secondary", preset.fg.secondary);
  root.style.setProperty("--foreground-tertiary", preset.fg.tertiary);
  root.style.setProperty("--foreground-muted", preset.fg.muted);

  // Semantic
  root.style.setProperty("--success", preset.semantic.success);
  root.style.setProperty("--warning", preset.semantic.warning);
  root.style.setProperty("--error", preset.semantic.error);
  root.style.setProperty("--info", preset.semantic.info);

  // Font
  root.style.setProperty("--font-family", preset.fontFamily);
  root.style.setProperty("--font-size-scale", String(preset.fontSizeScale));
  root.style.setProperty("--density", preset.density);

  // Body bg — scoped to dashboard/marketplace only; marketing pages control their own
  const isMarketing = typeof window !== "undefined" && (
    window.location.pathname === "/" ||
    window.location.pathname.startsWith("/about") ||
    window.location.pathname.startsWith("/pricing") ||
    window.location.pathname.startsWith("/solutions") ||
    window.location.pathname.startsWith("/become-supplier")
  );
  if (!isMarketing) {
    document.body.style.backgroundColor = preset.bg.background;
    document.body.style.color = preset.fg.primary;
    document.body.style.fontFamily = preset.fontFamily;
  }
}

export function applyCustomAccent(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--accent-500", hex);
  // Derive lighter/darker variants roughly
  root.style.setProperty("--accent-400", lighten(hex, 20));
  root.style.setProperty("--accent-600", darken(hex, 20));
  root.style.setProperty("--accent-300", lighten(hex, 40));
  root.style.setProperty("--accent-700", darken(hex, 40));
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
