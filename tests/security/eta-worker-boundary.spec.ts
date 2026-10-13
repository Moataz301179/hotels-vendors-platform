import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ handlers: [] as ((job: unknown) => Promise<unknown>)[], invoice: vi.fn(), update: vi.fn(), submit: vi.fn(), audit: vi.fn() }));
vi.mock("bullmq", () => ({ Queue: class {}, Worker: class { constructor(_name: string, handler: (job: unknown) => Promise<unknown>) { m.handlers.push(handler); } on() {} } }));
vi.mock("@/lib/queues/connection", () => ({ isBuildEnvironment: () => true, getRedisConnection: () => ({}) }));
vi.mock("@/lib/prisma", () => ({ prisma: { invoice: { findFirst: m.invoice, findUnique: m.invoice, update: m.update } } }));
vi.mock("@/lib/eta/client", () => ({ etaClient: { submitInvoice: m.submit } }));
vi.mock("@/lib/eta/validator", () => ({ validateForSubmission: async () => ({ valid: true }) }));
vi.mock("@/lib/swarm/monitoring", () => ({ recordSwarmEvent: vi.fn() }));
vi.mock("@/lib/queues/dead-letter", () => ({ moveToDeadLetter: vi.fn() }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
import { createEtaWorker } from "@/lib/eta/queue";
const job = { data: { invoiceId: "invoice-a", tenantId: "tenant-a", userId: "actor-a", platformRole: "SUPPLIER" } };
describe("ETA worker boundary", () => {
  beforeEach(() => { vi.resetAllMocks(); m.handlers.length = 0; createEtaWorker(); });
  it("does not mutate an invoice outside the job tenant", async () => { m.invoice.mockResolvedValue(null); await expect(m.handlers[0](job)).rejects.toThrow("not found"); expect(m.update).not.toHaveBeenCalled(); expect(m.submit).not.toHaveBeenCalled(); });
  it("refuses unsigned invoices before making any ETA request", async () => { m.invoice.mockResolvedValue({ id: "invoice-a", tenantId: "tenant-a", digitalSignature: null }); await expect(m.handlers[0](job)).rejects.toThrow("signature"); expect(m.submit).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); });
  it("records a submission receipt as pending, not tax acceptance", async () => { const party = { taxId: "test-only", name: "Test party", governorate: "Cairo", city: "Cairo", address: "Test address" }; m.invoice.mockResolvedValue({ id: "invoice-a", tenantId: "tenant-a", digitalSignature: "test-only-signature", supplier: party, hotel: party, issueDate: new Date(), invoiceNumber: "test-invoice", order: { orderNumber: "test-order", items: [] }, subtotal: 100, vatAmount: 14, total: 114 }); m.submit.mockResolvedValue({ uuid: "submission-receipt", status: "Submitted" }); await m.handlers[0](job); expect(m.update.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ where: { id: "invoice-a", tenantId: "tenant-a", deletedAt: null }, data: expect.objectContaining({ etaStatus: "PENDING", status: "SUBMITTED" }) })); expect(m.update.mock.calls.some(([args]) => args.data.etaStatus === "ACCEPTED")).toBe(false); });
});
