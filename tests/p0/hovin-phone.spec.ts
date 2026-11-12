import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { carrierCheckpoints, proposeNextAction } from "@/lib/mobile/intelligence";
import { planMobileWorkspace } from "@/lib/mobile/workspace";
import { inspectReceiptImage, stripReceiptMetadata } from "@/lib/evidence/receipt-image";

describe("HOVIN phone workspace", () => {
  it("keeps department heads, funders, and administrators on the desk", () => {
    expect(planMobileWorkspace({ platformRole: "HOTEL", role: "DEPARTMENT_HEAD" }, ["order:read", "order:update"]).workspace).toBe("desk");
    expect(planMobileWorkspace({ platformRole: "FACTORING", role: "OWNER" }, []).workspace).toBe("desk");
    expect(planMobileWorkspace({ platformRole: "ADMIN", role: "OWNER" }, ["order:update"]).workspace).toBe("desk");
  });

  it("gives a hotel receiver the phone, including receipt upload, and withholds supplier identity", () => {
    const plan = planMobileWorkspace({ platformRole: "HOTEL", role: "RECEIVING_CLERK" }, ["order:read", "order:update"]);
    expect(plan.workspace).toBe("hotel");
    expect(plan.capabilities).toEqual(expect.arrayContaining(["receive", "upload-evidence", "tracking", "delivery-code"]));
    expect(plan.capabilities).not.toContain("supplier-response");
    expect(plan.withheld.join(" ")).toMatch(/Supplier identity/i);
  });

  it("lets a supplier answer on the phone and keeps carrier acceptance on the portal", () => {
    const supplier = planMobileWorkspace({ platformRole: "SUPPLIER", role: "OWNER" }, ["order:read", "quote:submit"]);
    expect(supplier.workspace).toBe("supplier");
    expect(supplier.capabilities).toContain("supplier-response");
    expect(supplier.capabilities).not.toContain("upload-evidence");
    const carrier = planMobileWorkspace({ platformRole: "SHIPPING", role: "OWNER" }, ["order:update"]);
    expect(carrier.workspace).toBe("carrier-code");
    expect(carrier.capabilities).toEqual(["tracking", "delivery-code"]);
    expect(carrier.summary).toMatch(/portal/i);
    expect(carrier.capabilities.join(" ")).not.toMatch(/accept|decline/i);
  });
});

describe("HOVIN next action", () => {
  it("proposes the receivable order from server facts and does not invent a supplier or a price", () => {
    const proposal = proposeNextAction({
      workspace: "hotel",
      deskPath: null,
      receivable: { id: "order-1", orderNumber: "PO-14", remaining: 4 },
      unconfirmedCode: { id: "order-9", orderNumber: "PO-9" },
      supplierRequest: null,
      quoteResponses: { count: 3, productName: "Rice" },
      tracking: null,
      openRequests: 2,
    });
    expect(proposal).toEqual({
      action: "receive",
      targetId: "order-1",
      evidence: [
        { key: "order", value: "PO-14" },
        { key: "remaining", value: "4" },
      ],
      authority: "server",
    });
    expect(JSON.stringify(proposal)).not.toMatch(/supplier|price|invoice|Rice/i);
  });

  it("sends a desk role to the desk instead of inventing phone work", () => {
    const proposal = proposeNextAction({
      workspace: "desk",
      deskPath: "/orders",
      receivable: { id: "order-1", orderNumber: "PO-14", remaining: 4 },
      unconfirmedCode: null,
      supplierRequest: null,
      quoteResponses: null,
      tracking: null,
      openRequests: 0,
    });
    expect(proposal.action).toBe("desk");
    expect(proposal.evidence).toEqual([{ key: "desk", value: "/orders" }]);
  });
});

describe("carrier portal referral", () => {
  it("marks only the checkpoints the portal has recorded", () => {
    const steps = carrierCheckpoints({
      assignmentStatus: "ACCEPTED",
      shipmentStatus: "IN_TRANSIT",
      assignedAt: "2026-11-12T08:00:00.000Z",
      respondedAt: "2026-11-12T09:00:00.000Z",
      dispatchDate: "2026-11-12T10:00:00.000Z",
      estimatedArrival: "2026-11-12T16:00:00.000Z",
      deliveredAt: null,
    });
    expect(steps.map((step) => [step.key, step.state])).toEqual([
      ["assigned", "done"],
      ["accepted", "done"],
      ["picked-up", "done"],
      ["in-transit", "done"],
      ["delivered", "current"],
    ]);
    expect(steps.find((step) => step.key === "delivered")?.state).toBe("current");
    expect(steps.find((step) => step.key === "delivered")?.at).toBeNull();
  });
});

describe("receipt photo EXIF policy", () => {
  it("strips a comment marker before the photo can be stored", async () => {
    const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#d8c7ae" } }).jpeg().toBuffer();
    const secret = "HOVIN-GPS-SECRET-DO-NOT-KEEP";
    const body = Buffer.from(secret, "utf8");
    const segment = Buffer.concat([
      Buffer.from([0xff, 0xfe, (body.length + 2) >> 8, (body.length + 2) & 0xff]),
      body,
    ]);
    const marked = Buffer.concat([jpeg.subarray(0, 2), segment, jpeg.subarray(2)]);
    expect(marked.includes(secret)).toBe(true);
    const stripped = await stripReceiptMetadata(inspectReceiptImage(marked, "image/jpeg"));
    expect(stripped.bytes.includes(secret)).toBe(false);
    expect(stripped.contentType).toBe("image/jpeg");
  });

  it("rejects a payload that is not a jpeg, png, or webp", () => {
    expect(() => inspectReceiptImage(Buffer.from("not-an-image"), "image/jpeg")).toThrow("RECEIPT_IMAGE_TYPE_INVALID");
  });

  it("keeps receipt upload and file reads inside the hotel tenant", () => {
    const upload = readFileSync(new URL("../../app/api/v2/evidence/files/route.ts", import.meta.url), "utf8");
    const read = readFileSync(new URL("../../app/api/v2/evidence/files/[fileId]/route.ts", import.meta.url), "utf8");
    expect(upload).toContain('actor.platformRole === "ADMIN"');
    expect(upload).toContain('actor.platformRole === "SHIPPING"');
    expect(upload).toContain("stripReceiptMetadata");
    expect(read).toContain('actor.platformRole !== "HOTEL"');
    expect(read).toContain("tenantId: actor.tenantId");
  });
});
