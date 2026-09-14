"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FINANCING_OPTIONS = [30, 60, 90, 120] as const;
const MINIMUM_EGP = 5000;
const VAT_RATE = 0.14;
const ADVANCE_RATE = 0.88;
const PLATFORM_FEE_RATE = 0.02;

interface InvoiceFormData {
  invoiceNumber: string;
  etaUuid: string;
  supplierName: string;
  supplierTaxId: string;
  subtotalEgp: number;
  vatEgp: number;
  totalEgp: number;
  invoiceDate: string;
  dueDate: string;
  financingDays: number;
  photoFile: File | null;
  photoPreview: string | null;
}

interface InvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  platformFee: number;
  financingAmount: number;
  advancePercentage: number;
}

const initialFormData: InvoiceFormData = {
  invoiceNumber: "",
  etaUuid: "",
  supplierName: "",
  supplierTaxId: "",
  subtotalEgp: 0,
  vatEgp: 0,
  totalEgp: 0,
  invoiceDate: "",
  dueDate: "",
  financingDays: 60,
  photoFile: null,
  photoPreview: null,
};

function formatEgp(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeDueDate(invoiceDate: string, financingDays: number): string {
  if (!invoiceDate) return "";
  const d = new Date(invoiceDate);
  d.setDate(d.getDate() + financingDays);
  return d.toISOString().split("T")[0];
}

export default function InvoiceUploadFlow() {
  const [step, setStep] = useState<"upload" | "details" | "confirm" | "result">("upload");
  const [form, setForm] = useState<InvoiceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platformFee = form.totalEgp * PLATFORM_FEE_RATE;
  const financingAmount = form.totalEgp * ADVANCE_RATE;

  const updateField = useCallback(
    <K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "subtotalEgp") {
          const vat = (value as number) * VAT_RATE;
          next.vatEgp = Math.round(vat * 100) / 100;
          next.totalEgp = Math.round(((value as number) + vat) * 100) / 100;
        }
        // Auto-compute due date when invoice date or financing days change
        if (key === "invoiceDate" || key === "financingDays") {
          const date = key === "invoiceDate" ? (value as string) : prev.invoiceDate;
          const days = key === "financingDays" ? (value as number) : prev.financingDays;
          if (date && days) {
            next.dueDate = computeDueDate(date, days);
          }
        }
        return next;
      });
      setError(null);
    },
    []
  );

  const handlePhotoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, photoFile: file, photoPreview: preview }));
      setStep("details");
    },
    []
  );

  const openCameraOrUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateDetails = useCallback((): string | null => {
    if (!form.invoiceNumber.trim()) return "Invoice Number is required";
    if (!form.supplierName.trim()) return "Supplier Name is required";
    if (!form.supplierTaxId.trim()) return "Supplier Tax ID is required";
    if (form.subtotalEgp < MINIMUM_EGP) return `Minimum invoice amount is ${formatEgp(MINIMUM_EGP)}`;
    if (form.totalEgp < MINIMUM_EGP) return `Total must be at least ${formatEgp(MINIMUM_EGP)}`;
    return null;
  }, [form]);

  const goToConfirm = useCallback(() => {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("confirm");
  }, [validateDetails]);

  const submitForFinancing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        invoiceNumber: form.invoiceNumber,
        etaUuid: form.etaUuid || undefined,
        supplierName: form.supplierName,
        supplierTaxId: form.supplierTaxId,
        subtotalEgp: form.subtotalEgp,
        vatEgp: form.vatEgp,
        totalEgp: form.totalEgp,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        financingDays: form.financingDays,
      };

      const res = await fetch("/api/v1/financing/invoice-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error (${res.status})`);
      }

      const data: InvoiceResult = await res.json();
      setResult(data);
      setStep("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  const resetFlow = useCallback(() => {
    if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
    setForm(initialFormData);
    setResult(null);
    setError(null);
    setStep("upload");
  }, [form.photoPreview]);

  return (
    <div className="min-h-screen bg-canvas text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="mx-auto max-w-xl px-4 py-8">
        {/* DEMO MODE WARNING — Simulated ETA integration, not connected to Egyptian Tax Authority */}
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-400">⚠️ DEMO MODE — Simulated ETA Integration</p>
          <p className="text-[11px] text-amber-400/60 mt-0.5">ETA UUID field is not connected to the Egyptian Tax Authority. This is a demo environment.</p>
        </div>

        <StepIndicator currentStep={step} />

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === "upload" && (
          <UploadStep onOpenCamera={openCameraOrUpload} onEnterManually={() => setStep("details")} />
        )}

        {step === "details" && (
          <DetailsStep
            form={form}
            photoPreview={form.photoPreview}
            onUpdate={updateField}
            onBack={() => setStep("upload")}
            onNext={goToConfirm}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            form={form}
            platformFee={platformFee}
            financingAmount={financingAmount}
            loading={loading}
            onBack={() => setStep("details")}
            onSubmit={submitForFinancing}
          />
        )}

        {step === "result" && result && (
          <ResultStep result={result} onNewInvoice={resetFlow} />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: string }) {
  const steps = ["upload", "details", "confirm", "result"];
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i <= currentIdx
                ? "bg-emerald-400 text-white"
                : "bg-surface-2 text-foreground-tertiary"
            }`}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                i < currentIdx ? "bg-emerald-400" : "bg-surface-2"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function UploadStep({
  onOpenCamera,
  onEnterManually,
}: {
  onOpenCamera: () => void;
  onEnterManually: () => void;
}) {
  return (
    <Card className="bg-surface-1 border-border-subtle">
      <CardHeader>
        <CardTitle>Upload Invoice for Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          onClick={onOpenCamera}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-surface-1 p-8 text-center transition-colors hover:border-emerald-400/40"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--accent-base)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <div>
            <p className="font-medium text-white">Take Photo or Upload File</p>
            <p className="mt-1 text-sm text-foreground-tertiary">
              JPG, PNG, or PDF — up to 10 MB
            </p>
          </div>
        </button>

        <button
          onClick={onEnterManually}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border-subtle p-6 text-center transition-colors hover:bg-surface-2"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#64b5f6" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          <div>
            <p className="font-medium text-white">Enter Details Manually</p>
            <p className="mt-1 text-sm text-foreground-tertiary">
              Type invoice information directly
            </p>
          </div>
        </button>

        <div className="flex items-center justify-center gap-3 rounded-xl border border-border-subtle p-6 text-center opacity-40 cursor-not-allowed">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--purple-base)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.156a4.5 4.5 0 00-6.364-6.364L4.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
          </svg>
          <div>
            <p className="font-medium text-white">Supplier Plugin (Phase 2)</p>
            <p className="mt-1 text-sm text-foreground-tertiary">
              Auto-sync from supplier integrations
            </p>
          </div>
          <Badge variant="outline" className="border-purple-400/30 text-purple-400 bg-purple-400/10">
            Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsStep({
  form,
  photoPreview,
  onUpdate,
  onBack,
  onNext,
}: {
  form: InvoiceFormData;
  photoPreview: string | null;
  onUpdate: <K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card className="bg-surface-1 border-border-subtle">
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {photoPreview && (
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <img src={photoPreview} alt="Invoice preview" className="h-40 w-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <Field label="Invoice Number" required>
            <input
              type="text"
              value={form.invoiceNumber}
              onChange={(e) => onUpdate("invoiceNumber", e.target.value)}
              placeholder="INV-2026-0001"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white placeholder-foreground-muted outline-none focus:border-emerald-400/50"
            />
          </Field>

          <Field label="ETA UUID (DEMO)">
            <input
              type="text"
              value={form.etaUuid}
              onChange={(e) => onUpdate("etaUuid", e.target.value)}
              placeholder="Not connected to real ETA — demo only"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white placeholder-foreground-muted outline-none focus:border-emerald-400/50"
            />
          </Field>

          <Field label="Supplier Name" required>
            <input
              type="text"
              value={form.supplierName}
              onChange={(e) => onUpdate("supplierName", e.target.value)}
              placeholder="Supplier legal name"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white placeholder-foreground-muted outline-none focus:border-emerald-400/50"
            />
          </Field>

          <Field label="Supplier Tax ID" required>
            <input
              type="text"
              value={form.supplierTaxId}
              onChange={(e) => onUpdate("supplierTaxId", e.target.value)}
              placeholder="Tax registration number"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white placeholder-foreground-muted outline-none focus:border-emerald-400/50"
            />
          </Field>

          <Field label="Subtotal EGP" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.subtotalEgp || ""}
              onChange={(e) => onUpdate("subtotalEgp", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white placeholder-foreground-muted outline-none focus:border-emerald-400/50"
            />
          </Field>

          <Field label="VAT 14%">
            <input
              type="text"
              readOnly
              value={formatEgp(form.vatEgp)}
              className="w-full cursor-default rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground-secondary"
            />
          </Field>

          <Field label="Total EGP" required>
            <input
              type="text"
              readOnly
              value={formatEgp(form.totalEgp)}
              className="w-full cursor-default rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground-secondary"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice Date">
              <input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => onUpdate("invoiceDate", e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
              />
            </Field>
            <Field label="Due Date">
              <input
                type="date"
                value={form.dueDate}
                readOnly
                className="w-full cursor-default rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground-secondary"
              />
            </Field>
          </div>

          <Field label="Financing Days" required>
            <select
              value={form.financingDays}
              onChange={(e) => onUpdate("financingDays", parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
            >
              {FINANCING_OPTIONS.map((d) => (
                <option key={d} value={d} className="bg-surface-1 text-white">
                  {d} days
                </option>
              ))}
            </select>
          </Field>
        </div>

        {form.totalEgp > 0 && form.totalEgp < MINIMUM_EGP && (
          <p className="text-sm text-orange-400">
            Minimum invoice amount is {formatEgp(MINIMUM_EGP)}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={onNext} className="flex-1 bg-accent-base text-white hover:bg-accent-base/90">
            Review & Confirm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmStep({
  form,
  platformFee,
  financingAmount,
  loading,
  onBack,
  onSubmit,
}: {
  form: InvoiceFormData;
  platformFee: number;
  financingAmount: number;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const netPayout = form.totalEgp - platformFee;

  return (
    <Card className="bg-surface-1 border-border-subtle">
      <CardHeader>
        <CardTitle>Confirm & Submit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummarySection title="Invoice Details">
          <SummaryRow label="Invoice #" value={form.invoiceNumber} />
          <SummaryRow label="Supplier" value={form.supplierName} />
          <SummaryRow label="Tax ID" value={form.supplierTaxId} />
          <SummaryRow label="Invoice Date" value={formatDate(form.invoiceDate)} />
          <SummaryRow label="Due Date" value={formatDate(form.dueDate)} />
          <SummaryRow label="ETA UUID (DEMO)" value={form.etaUuid || "—"} />
        </SummarySection>

        <SummarySection title="Financing Breakdown">
          <SummaryRow label="Subtotal" value={formatEgp(form.subtotalEgp)} />
          <SummaryRow label="VAT (14%)" value={formatEgp(form.vatEgp)} />
          <SummaryRow
            label="Total"
            value={formatEgp(form.totalEgp)}
            valueClassName="font-bold text-white"
          />
          <div className="my-2 border-t border-border-subtle" />
          <SummaryRow
            label={`${ADVANCE_RATE * 100}% Advance`}
            value={formatEgp(financingAmount)}
            valueClassName="text-accent-base"
          />
          <SummaryRow
            label="Platform Fee (2%)"
            value={`− ${formatEgp(platformFee)}`}
            valueClassName="text-orange-base"
          />
          <SummaryRow
            label="Net Payout"
            value={formatEgp(netPayout)}
            valueClassName="font-bold text-accent-base"
          />
          <SummaryRow label="Credit Period" value={`${form.financingDays} days`} />
        </SummarySection>

        <div className="rounded-lg border border-[#64b5f6]/20 bg-[#64b5f6]/10 p-3 text-xs text-[#64b5f6]">
          By submitting, you confirm the invoice is authentic and agree to the platform financing terms.
          Non-recourse factoring — the platform assumes credit risk.
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Back
          </Button>
          <Button
            onClick={onSubmit}
            className="flex-1 bg-accent-base text-white hover:bg-accent-base/90"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Submitting…
              </span>
            ) : (
              "Submit for Financing"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultStep({
  result,
  onNewInvoice,
}: {
  result: InvoiceResult;
  onNewInvoice: () => void;
}) {
  return (
    <Card className="bg-surface-1 border-border-subtle">
      <CardContent className="flex flex-col items-center space-y-6 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-base/12">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--accent-base)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">Invoice Submitted</h2>
          <p className="mt-1 text-sm text-foreground-tertiary">
            Your financing request is being processed
          </p>
        </div>

        <div className="w-full space-y-2 rounded-lg border border-border-subtle bg-surface-1 p-4">
          <SummaryRow label="Invoice #" value={result.invoiceNumber} />
          <SummaryRow label="Total" value={formatEgp(result.total)} />
          <SummaryRow
            label="Platform Fee"
            value={formatEgp(result.platformFee)}
            valueClassName="text-orange-base"
          />
          <SummaryRow
            label="Financing Amount"
            value={formatEgp(result.financingAmount)}
            valueClassName="font-bold text-accent-base"
          />
        </div>

        <div className="w-full rounded-lg border border-[#64b5f6]/20 bg-[#64b5f6]/10 p-3 text-xs text-[#64b5f6]">
          Next step: Our team will review and verify the invoice within 24 hours. You will receive a
          notification once the financing is approved and funds are disbursed.
        </div>

        <Button
          onClick={onNewInvoice}
          variant="outline"
          className="w-full"
        >
          Upload Another Invoice
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white">
        {label}
        {required && <span className="text-orange-base"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground-tertiary">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-foreground-tertiary">{label}</span>
      <span className={valueClassName ?? "text-white"}>{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
