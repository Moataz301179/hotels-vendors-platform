/**
 * HOVIN light execution theme.
 *
 * Values are extracted from the owner-supplied website reference
 * (hv-merge-desktop-view.png) with Pillow, not guessed:
 *   paper #FDFDFB · surface #F4F3ED · card #FFFFFF · ink #212325
 *   header #312E2F · accent #276AA9 · muted #6B6C6D · border #E5E5E7
 */
export const theme = {
  paper: '#FDFDFB',
  surface: '#F4F3ED',
  card: '#FFFFFF',
  ink: '#212325',
  header: '#312E2F',
  accent: '#276AA9',
  accentSoft: '#E8F0F7',
  accentInk: '#FFFFFF',
  muted: '#6B6C6D',
  border: '#E5E5E7',
  borderStrong: '#C9C9C7',
  success: '#2F6B4F',
  successSoft: '#E7F1EB',
  danger: '#A33A34',
  dangerSoft: '#F7E9E8',
  onDark: '#F5F5F4',
  onDarkMuted: '#A9A9A8',
  scrim: 'rgba(33,35,37,0.45)',
} as const;

export type Theme = typeof theme;

/** Minimum comfortable touch target (pt). */
export const TOUCH_TARGET = 44;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const type = {
  eyebrow: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  title: { fontSize: 24, lineHeight: 30 },
  section: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12, lineHeight: 17 },
  action: { fontSize: 15, lineHeight: 20 },
};
