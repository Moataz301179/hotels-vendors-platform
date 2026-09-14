"use client"

import type { ReactNode } from "react"

export interface Column<T> {
  key: string
  header: string
  align?: "left" | "center" | "right"
  render?: (item: T) => ReactNode
}

export function DataTableMini<T extends Record<string, unknown>>({
  columns,
  data,
}: {
  columns: Column<T>[]
  data: T[]
}) {
  if (!data.length) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-tertiary)" }}>
        No data available
      </div>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || "left",
                  padding: "10px 12px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align || "left",
                    padding: "10px 12px",
                    color: "var(--text-primary)",
                  }}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
