"use client";

/* Decorative visual kit for widgets/cards — applies the brand vector layer.
   - StatChip: beige #ABA294 fill + dark-purple figure text (numbers/KPIs).
   - CardOrnament: diagonal gradient vector on card/widget headers.
   Rules: light/beige fills on SMALL panels (avoid dark fills on small elements). */
import type { ReactNode } from "react";

/** Beige stat chip: beige fill + dark-purple number. Use for KPI figures. */
export function StatChip({
  value,
  label,
  className = "",
}: {
  value: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex flex-col items-center justify-center rounded-xl bg-[#ABA294] px-3 py-2 min-w-[76px] " +
        className
      }
    >
      <span className="text-lg font-bold leading-none text-[#4b3f6b]">{value}</span>
      {label ? (
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[#4b3f6b]/70">
          {label}
        </span>
      ) : null}
    </span>
  );
}

/** Decorative card ornament — subtle diagonal green/beige vector on the card edge. */
export function CardOrnament({
  tone = "green",
}: {
  tone?: "green" | "beige" | "none";
}) {
  if (tone === "none") return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-tr-xl opacity-[0.10]"
      style={{
        background:
          tone === "beige"
            ? "linear-gradient(135deg, #ABA294 0%, transparent 70%)"
            : "linear-gradient(135deg, #314B43 0%, transparent 70%)",
      }}
    />
  );
}