"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Cpu,
  Sparkles,
  FileUp,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface ImportResult {
  fileName?: string;
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  message?: string;
}

const STEPS = [
  {
    icon: FileUp,
    title: "Extract",
    copy: "Upload supplier price lists as PDF, XLSX, or CSV. The parser reads rows, headers, and units automatically — no manual data entry.",
  },
  {
    icon: Cpu,
    title: "Enrich",
    copy: "AI maps every line to the marketplace taxonomy, cleans fields, and fleshes out product details so rows are publish-ready.",
  },
  {
    icon: Sparkles,
    title: "Publish",
    copy: "Enriched, ETA-compliant products go live in the catalog in minutes instead of days.",
  },
];

const TAXONOMY = [
  "F_AND_B",
  "Consumables",
  "Guest Amenities",
  "FF&E",
  "Services",
];

export default function AICatalogPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleIngest() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/supplier/catalog/import", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        const msg =
          body?.error ??
          (body?.message as string) ??
          `Request failed (${res.status})`;
        setError(msg);
        return;
      }

      const data = (body.data ?? {}) as ImportResult;
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unexpected error while uploading."
      );
    } finally {
      setUploading(false);
    }
  }

  const importedCount = result?.validRows ?? 0;
  const hasResult =
    result &&
    (typeof result.validRows === "number" ||
      typeof result.errorRows === "number" ||
      typeof result.totalRows === "number");

  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
        {/* Hero */}
        <section className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">
            AI Catalog Ingestion
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111827] mt-3 leading-tight">
            Turn supplier price sheets into a live, ETA-compliant catalog in
            minutes.
          </h1>
          <p className="text-slate-600 text-[15px] mt-4 leading-relaxed">
            Stop paying your team to rekey spreadsheets and painstakingly
            normalize rows by hand. Upload your Excel, CSV, or PDF price sheet
            once — AI parses it, maps every line to the marketplace taxonomy,
            and publishes products that meet ETA e-invoicing requirements from
            day one. Less admin, lower cost, faster time-to-market.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#314B43] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload a price sheet
            </button>
            <Link
              href="/register"
              className="inline-flex items-center px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]"
            >
              Get started free
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">
            How it works
          </div>
          <h2 className="text-2xl font-bold text-[#111827] mt-1">
            From spreadsheet to live catalog in three steps
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="bg-white border border-slate-200 rounded-lg p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-[#314B43]" />
                  </div>
                  <div className="text-2xl font-bold text-slate-200">
                    0{i + 1}
                  </div>
                </div>
                <div className="text-base font-semibold text-[#111827] mt-4">
                  {step.title}
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload widget */}
        <section className="mt-16">
          <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#314B43]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  Ingest a catalog
                </h2>
                <p className="text-[13px] text-slate-500">
                  Upload one price sheet for instant parsing and AI enrichment.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {fileName ?? "Choose a .csv, .xlsx, or .pdf price sheet"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Max 10 MB · parsed and mapped automatically
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a] disabled:opacity-50"
              >
                Browse file
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFileName(f ? f.name : null);
                  setError(null);
                }}
              />
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={handleIngest}
                disabled={!fileName || uploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#314B43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingesting…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Ingest Catalog
                  </>
                )}
              </button>
            </div>

            {/* Server result */}
            {hasResult && !error && (
              <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Import complete
                      {result.fileName ? ` — ${result.fileName}` : ""}
                    </p>
                    <p className="text-[13px] text-emerald-700 mt-1">
                      {importedCount > 0
                        ? `${importedCount} row${importedCount === 1 ? "s" : ""} imported`
                        : "No rows imported yet"}
                      {typeof result.errorRows === "number" &&
                        result.errorRows > 0 &&
                        ` · ${result.errorRows} error${
                          result.errorRows === 1 ? "" : "s"
                        }`}
                    </p>
                    {result.message && (
                      <p className="text-xs text-emerald-700 mt-1">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Server error */}
            {error && (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Import failed
                </p>
                <p className="text-[13px] text-red-700 mt-1">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Marketplace taxonomy */}
        <section className="mt-16">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">
            Marketplace taxonomy
          </div>
          <h2 className="text-2xl font-bold text-[#111827] mt-1">
            Every row maps to a canonical category
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-2xl">
            Enriched products are automatically filed under one of the
            marketplace&apos;s standard categories — so buyers find them fast
            and compliance stays consistent.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TAXONOMY.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 rounded-full border border-slate-300 bg-white text-[13px] font-medium text-slate-700"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}