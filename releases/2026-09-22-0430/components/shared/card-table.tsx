"use client";

import { ReactNode } from "react";

export interface CardTableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  primary?: boolean;
  badge?: boolean;
  hideOnMobile?: boolean;
  headerSlot?: ReactNode;
  render?: (row: T) => ReactNode;
}

interface CardTableProps<T> {
  columns: CardTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  mobileSelected?: (row: T) => boolean;
}

export function CardTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allSelected,
  someSelected,
  mobileSelected,
}: CardTableProps<T>) {
  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const hasCheckbox = !!onToggleRow;

  const getAlign = (col: CardTableColumn<T>, isLast: boolean): string => {
    if (col.align) return col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
    return isLast ? "text-right" : "text-left";
  };

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-border-subtle bg-surface-1 overflow-hidden">
        <div className="overflow-x-auto table-scroll-wrapper">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border-subtle">
                {hasCheckbox && (
                  <th className="px-4 py-3 w-10">
                    {onToggleAll && (
                      <button
                        onClick={onToggleAll}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px]"
                        aria-label={allSelected ? "Deselect all" : "Select all"}
                      >
                        {allSelected ? (
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" fill="var(--accent-base)" stroke="var(--accent-base)" strokeWidth="1"/><path d="M4 7.5L6.5 10L11 5" stroke="#0c0c12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : someSelected ? (
                          <div className="w-[15px] h-[15px] rounded border-2 border-accent-base/50 bg-accent-base/20" />
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/></svg>
                        )}
                      </button>
                    )}
                  </th>
                )}
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider ${getAlign(col, i === columns.length - 1)}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedIds?.has(id) ?? false;
                return (
                  <tr
                    key={id}
                    className={`border-b border-border-invisible transition-colors hover:bg-white/[0.015] ${isSelected ? "bg-accent-base/[0.04]" : ""}`}
                  >
                    {hasCheckbox && (
                      <td className="px-4 py-3 w-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleRow?.(id); }}
                          className="flex items-center justify-center min-w-[44px] min-h-[44px]"
                          aria-label={`Select row ${id}`}
                        >
                          {isSelected ? (
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" fill="var(--accent-base)" stroke="var(--accent-base)" strokeWidth="1"/><path d="M4 7.5L6.5 10L11 5" stroke="#0c0c12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/></svg>
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((col, i) => {
                      const isLast = i === columns.length - 1;
                      return (
                        <td key={col.key} className={`px-4 py-3 ${getAlign(col, isLast)}`}>
                          {col.render
                            ? col.render(row)
                            : (
                                <span className={`text-xs ${col.primary ? "font-mono text-foreground-secondary" : col.badge ? "" : "text-white"}`}>
                                  {renderCellValue(row, col)}
                                </span>
                              )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const id = getRowId(row);
          const isSelected = mobileSelected?.(row) ?? selectedIds?.has(id) ?? false;
          return (
            <div
              key={id}
              className="bg-surface-1 border border-border-subtle rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {hasCheckbox && (
                    <button
                      onClick={() => onToggleRow?.(id)}
                      className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded border"
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" fill="var(--accent-base)" stroke="var(--accent-base)" strokeWidth="1"/><path d="M4 7.5L6.5 10L11 5" stroke="#0c0c12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/></svg>
                      )}
                    </button>
                  )}
                  <div className="min-w-0">
                    {mobileColumns.map((col) => {
                      if (!col.primary) return null;
                      const value = renderCellValue(row, col);
                      return (
                        <span key={col.key} className="text-sm font-semibold text-white block truncate">
                          {value}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {mobileColumns.find((c) => c.badge) && (
                  <div className="flex-shrink-0">
                    {mobileColumns.map((col) => {
                      if (!col.badge) return null;
                      return col.render ? (
                        <span key={col.key}>{col.render(row)}</span>
                      ) : (
                        <span key={col.key} className="text-xs text-foreground-secondary">{renderCellValue(row, col)}</span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {mobileColumns.map((col) => {
                  if (col.primary || col.badge) return null;
                  return (
                    <div key={col.key} className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                        {col.label}
                      </span>
                      {col.render ? (
                        col.render(row)
                      ) : (
                        <span className="text-xs text-foreground-secondary">{renderCellValue(row, col)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {onRowClick && (
                <button
                  onClick={() => onRowClick(row)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] border border-border-subtle text-[11px] font-medium text-foreground-muted hover:text-foreground-secondary hover:bg-surface-2 transition-colors active:scale-[0.98]"
                >
                  View Details
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function renderCellValue<T>(row: T, col: CardTableColumn<T>): ReactNode {
  if (col.render) return col.render(row);
  const val = (row as Record<string, unknown>)[col.key];
  if (val === null || val === undefined) return "—";
  return String(val);
}
