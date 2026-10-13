import { z } from "zod";
export const operationsSections = ["procurement", "catalog", "verification", "documents", "logistics", "returns", "finance", "automation", "compliance"] as const;
export const operationsSection = z.enum(operationsSections);
export const operationsQuery = z.object({ search: z.string().trim().max(120).default(""), page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).strict();
export const operationsLabels: Record<typeof operationsSections[number], { title: string; description: string }> = {
  procurement: { title: "Procurement oversight", description: "Recorded purchase orders and payment-guarantee status. No unrestricted order-status editing." },
  catalog: { title: "Catalog governance", description: "Fixed-price products, availability and provenance. Fixture products are excluded." },
  verification: { title: "Supplier verification", description: "Business profile review. Verification decisions require an evidence-backed approval request." },
  documents: { title: "Evidence registry", description: "Document ownership, category and record IDs for verification. Private files, filenames and download URLs are not exposed." },
  logistics: { title: "Delivery operations", description: "Recorded shipments, hubs and dispatch timing. Driver contact details are not exposed." },
  returns: { title: "Returns oversight", description: "Recorded return requests and quantities. Refunds are not executed by this table." },
  finance: { title: "Finance oversight", description: "Invoice values and recorded fees by currency, not an assertion of settled payments." },
  automation: { title: "Automation history", description: "Persisted job records and attempts. A job record is not proof of a running worker." },
  compliance: { title: "Compliance exception queue", description: "Submission recovery metadata only. Payloads, signing material and provider error text remain server-side." },
};
export interface OperationsResult { section: typeof operationsSections[number]; columns: { key: string; label: string }[]; rows: Record<string, string | number | boolean | null>[]; pagination: { page: number; limit: number; total: number; totalPages: number }; generatedAt: string; scope: "platform" }
