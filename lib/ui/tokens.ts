// lib/ui/tokens.ts - Design tokens based on premium pattern
// Following principles from awesome-llm-apps generative UI agents

export const tokens = {
  dark: {
    background: '#0c0c12',
    surface: '#12121a',
    surfaceAlt: '#1a1a24',
    surfaceHover: '#1a1a24',
    text: '#ffffff',
    textMuted: '#a0a0b0',
    textTertiary: '#7a7a92',
    border: 'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.04)',
    borderAccent: 'rgba(49, 46, 129, 0.3)',
    accent: '#312e81',
    accentLight: '#4338ca',
    accentDark: '#1e1b4b',
    // Additional accent colors as requested
    lime: '#84cc16',
    yellow: '#fcd34d',
    turquoise: '#08b8a3',
    orange: '#f97316',
    white: '#ffffff',
  },
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    surfaceHover: '#f1f5f9',
    text: '#011224',
    textMuted: '#5a6a7e',
    textTertiary: '#94a3b8',
    border: 'rgba(1, 18, 36, 0.08)',
    borderSubtle: 'rgba(1, 18, 36, 0.04)',
    borderAccent: 'rgba(42, 8, 140, 0.20)',
    accent: '#2a088c',
    accentLight: '#3a18a0',
    accentDark: '#1a066c',
    // Additional accent colors
    lime: '#65a30d',
    yellow: '#f59e0b',
    turquoise: '#069f85',
    orange: '#ea580c',
    white: '#ffffff',
  }
} as const;

export type TokenTheme = keyof typeof tokens;
export type TokenValue = typeof tokens.dark;
