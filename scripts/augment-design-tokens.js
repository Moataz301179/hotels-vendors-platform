/**
 * Design system augmentation — DealRay-inspired enhancements.
 *
 * Adds: supplementary palette, card tokens, component tokens,
 * typography scale refinements. Preserves existing ink scale,
 * signal red, surface ladder, animations, and responsive classes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cssPath = path.join(__dirname, "../app/globals.css");
let css = fs.readFileSync(cssPath, "utf8");

const additions = `\

/* ═══════════════════════════════════════════════════════════════
   SUPPLEMENTARY PALETTE — DealRay-inspired accent system
   Adds functional accent colors for cards, badges, states.
   Brand signal (#ff3d00) remains the ONLY primary accent.
   ═══════════════════════════════════════════════════════════════ */

/* Success — sustainable green for positive states */
--accent-success: #22c55e;
--accent-success-soft: rgba(34, 197, 94, 0.10);
--accent-success-glow: rgba(34, 197, 94, 0.18);

/* Warning — amber for attention states */
--accent-warning: #f59e0b;
--accent-warning-soft: rgba(245, 158, 11, 0.10);

/* Error — cool red for destructive states (distinct from brand signal) */
--accent-error: #ef4444;
--accent-error-soft: rgba(239, 68, 68, 0.10);

/* Info — cool blue for informational states */
--accent-info: #3b82f6;
--accent-info-soft: rgba(59, 130, 246, 0.10);

/* Surface highlight — warm ivory for light cards on dark (unused in dark mode) */
--surface-highlight: #fafaf9;

/* ═══════════════════════════════════════════════════════════════
   CARD TOKENS — consistent card language across marketing + dashboard
   ═══════════════════════════════════════════════════════════════ */

--card-border: rgba(255, 255, 255, 0.06);
--card-border-hover: rgba(255, 255, 255, 0.10);
--card-bg: #12121a;
--card-bg-elevated: #16161e;
--card-radius-sm: 0.375rem;
--card-radius-md: 0.5rem;
--card-radius-lg: 0.75rem;
--card-radius-xl: 1rem;
--card-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--card-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
--card-shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.6);

/* ═══════════════════════════════════════════════════════════════
   COMPONENT TOKENS — shared UI component language
   ═══════════════════════════════════════════════════════════════ */

--btn-radius: 0.375rem;
--btn-padding-y: 0.5rem;
--btn-padding-x: 1rem;
--input-radius: 0.375rem;
--input-border: rgba(255, 255, 255, 0.08);
--input-border-focus: var(--signal);
--badge-radius: 0.25rem;
--badge-padding: 0.125rem 0.5rem;
--modal-radius: 0.75rem;
--modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
--table-radius: 0.5rem;
--table-border: rgba(255, 255, 255, 0.06);
--divider: rgba(255, 255, 255, 0.06);

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAPHY REFINEMENTS — editorial scale
   ═══════════════════════════════════════════════════════════════ */

--text-xs: 0.6875rem;    /* 11px — labels, captions */
--text-sm: 0.75rem;      /* 12px — secondary text */
--text-base: 0.8125rem;  /* 13px — body (compact B2B) */
--text-lg: 0.875rem;     /* 14px — lead text */
--text-xl: 1rem;         /* 16px — section subheads */
--text-2xl: 1.125rem;   /* 18px — card titles */
--text-3xl: 1.25rem;    /* 20px — section heads */
--text-4xl: 1.5rem;     /* 24px — page heads */
--text-5xl: 1.875rem;   /* 30px — hero sub */
--text-6xl: 2.25rem;    /* 36px — hero */
--text-7xl: 3rem;       /* 48px — display */

--leading-tight: 1.1;
--leading-snug: 1.2;
--leading-normal: 1.35;
--leading-relaxed: 1.5;

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD-SPECIFIC TOKENS
   Operational density for authenticated areas.
   ═══════════════════════════════════════════════════════════════ */

--dash-panel-bg: #0e0e14;
--dash-panel-border: rgba(255, 255, 255, 0.05);
--dash-sidebar-width: 240px;
--dash-header-height: 56px;
--dash-cell-padding: 0.625rem 0.875rem;
--dash-table-stripe: rgba(255, 255, 255, 0.02);
`

// Insert after the @theme block (line 31, after the closing })
const insertPoint = css.indexOf("}\n\n.dark {\n  /* Brand signal");
if (insertPoint === -1) {
  console.error("Could not find insertion point in globals.css");
  process.exit(1);
}

// Find the end of the first @theme block
const themeEnd = css.indexOf("}\n\n.dark {");
css = css.slice(0, themeEnd + 1) + additions + css.slice(themeEnd + 1);

fs.writeFileSync(cssPath, css);
console.log(`✓ globals.css augmented (${css.length} chars, +${additions.length} chars)`);
console.log(`  +${additions.split("\n").filter(l => l.startsWith("--")).length} new CSS variables`);
