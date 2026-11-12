import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getUserPermissions } from "@/lib/auth/rbac";
import { orderActions } from "@/lib/v2-order-actions";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { unreadCount } from "@/lib/notifications/service";
import { planMobileWorkspace, phonePermissions, RECEIVING_ROLES, type MobilePlan } from "@/lib/mobile/workspace";
import { carrierCheckpoints, proposeNextAction, type Proposal, type WorkFacts } from "@/lib/mobile/intelligence";

export type PhoneActor = {
  id: string;
  name: string | null;
  email: string | null;
  platformRole: string;
  role: string;
  tenantId: string;
  supplierId: string | null;
};

const ACCEPTED_ASSIGNMENT = ["ACCEPTED", "DELIVERED"] as const;

export function accountOf(actor: PhoneActor) {
  return {
    id: actor.id,
    name: actor.name,
    email: actor.email,
    platformRole: actor.platformRole,
    role: actor.role,
    tenantId: actor.tenantId,
  };
}

export async function loadSession(actor: PhoneActor) {
  const permissions = phonePermissions(await getUserPermissions({
    userId: actor.id,
    tenantId: actor.tenantId,
    platformRole: actor.platformRole,
  }));
  const plan = planMobileWorkspace(actor, permissions);
  return { plan, account: accountOf(actor), permissions };
}

export async function loadHome(actor: PhoneActor) {
  const session = await loadSession(actor);
  const tasks = await loadTasks(actor, session.plan);
  const facts = await loadFacts(actor, session.plan, tasks);
  let unread = 0;
  if (session.plan.capabilities.includes("notifications")) {
    unread = await unreadCount(actor.tenantId, actor.id);
  }
  return {
    ...session,
    proposal: proposeNextAction(facts),
    tasks,
    unread,
  };
}

export type PhoneTask = {
  id: string;
  module: "receive" | "quotes" | "tracking" | "respond" | "fulfill" | "code";
  title: string;
  detail: string;
  status: string;
  targetId: string;
  /** A quantity the server already computed. The client displays it; it does not parse prose. */
  amount?: number;
  lines?: number;
};

async function loadTasks(actor: PhoneActor, plan: MobilePlan): Promise<PhoneTask[]> {
  if (plan.workspace === "hotel") return hotelTasks(actor, plan);
  if (plan.workspace === "supplier") return supplierTasks(actor, plan);
  if (plan.workspace === "carrier-code") return carrierTasks(actor.tenantId);
  return [];
}

async function hotelTasks(actor: PhoneActor, plan: MobilePlan): Promise<PhoneTask[]> {
  const tasks: PhoneTask[] = [];
  if (plan.capabilities.includes("receive")) {
    const arrivals = await prisma.order.findMany({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { in: ["IN_TRANSIT", "PARTIALLY_DELIVERED"] },
        paymentGuaranteed: true,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: { where: { deletedAt: null }, select: { quantity: true, receivedQuantity: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 30,
    });
    for (const order of arrivals) {
      if (!orderActions(actor, { status: order.status, supplierId: "", tenantId: actor.tenantId, paymentGuaranteed: true }).includes("RECEIVE")) continue;
      const remaining = order.items.reduce((total, item) => total + Math.max(0, item.quantity - (item.receivedQuantity ?? 0)), 0);
      tasks.push({
        id: `receive:${order.id}`,
        module: "receive",
        title: order.orderNumber,
        detail: `${order.items.length} lines · ${remaining} remaining`,
        status: order.status,
        targetId: order.id,
        amount: remaining,
        lines: order.items.length,
      });
    }
  }
  if (plan.capabilities.includes("compare-quotes")) {
    const quotes = await prisma.procurementQuote.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, rfq: { status: "QUOTED", deletedAt: null } },
      select: { rfqId: true },
      take: 40,
    });
    const distinct = new Set(quotes.map((quote) => quote.rfqId));
    if (distinct.size > 0) {
      tasks.push({
        id: "quotes:open",
        module: "quotes",
        title: "Recorded responses",
        detail: `${distinct.size} requests have recorded terms. Supplier identity stays sealed.`,
        status: "QUOTED",
        targetId: "quotes",
        amount: distinct.size,
      });
    }
  }
  if (plan.capabilities.includes("tracking")) {
    const moving = await prisma.order.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED"] } },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    for (const order of moving) {
      tasks.push({
        id: `track:${order.id}`,
        module: "tracking",
        title: order.orderNumber,
        detail: "Movement referred from the carrier portal.",
        status: order.status,
        targetId: order.id,
      });
    }
  }
  return tasks;
}

async function supplierTasks(actor: PhoneActor, plan: MobilePlan): Promise<PhoneTask[]> {
  if (!actor.supplierId) return [];
  const tasks: PhoneTask[] = [];
  if (plan.capabilities.includes("supplier-response")) {
    const grants = await prisma.rfqSupplierAccess.findMany({
      where: { supplierId: actor.supplierId, supplierTenantId: actor.tenantId, revokedAt: null, respondedAt: null },
      select: { rfqId: true },
      take: 30,
    });
    const rfqs = grants.length
      ? await prisma.rfqRequest.findMany({
          where: { id: { in: grants.map((grant) => grant.rfqId) }, deletedAt: null, status: { in: ["PENDING", "QUOTED"] } },
          select: { id: true, itemName: true, requestedQty: true, status: true },
        })
      : [];
    for (const rfq of rfqs) {
      tasks.push({
        id: `respond:${rfq.id}`,
        module: "respond",
        title: rfq.itemName ?? "Request",
        detail: `Requested quantity ${rfq.requestedQty}`,
        status: rfq.status,
        targetId: rfq.id,
        amount: rfq.requestedQty,
      });
    }
  }
  if (plan.capabilities.includes("orders")) {
    const orders = await prisma.order.findMany({
      where: {
        supplierId: actor.supplierId,
        tenantId: actor.tenantId,
        deletedAt: null,
        status: { in: ["APPROVED", "CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED"] },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: { where: { deletedAt: null }, select: { quantity: true, product: { select: { name: true, unitOfMeasure: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    for (const order of orders) {
      const names = order.items.slice(0, 2).map((item) => `${item.product.name} × ${item.quantity}${item.product.unitOfMeasure ? ` ${item.product.unitOfMeasure}` : ""}`);
      tasks.push({
        id: `fulfill:${order.id}`,
        module: "fulfill",
        title: order.orderNumber,
        detail: names.join(", ") || "No lines",
        status: order.status,
        targetId: order.id,
      });
    }
  }
  return tasks;
}

async function carrierTasks(carrierTenantId: string): Promise<PhoneTask[]> {
  const assignments = await prisma.carrierOrderAssignment.findMany({
    where: { carrierTenantId, deletedAt: null, status: { in: [...ACCEPTED_ASSIGNMENT] } },
    select: { id: true, status: true, orderId: true, order: { select: { orderNumber: true } } },
    orderBy: { assignedAt: "desc" },
    take: 30,
  });
  return assignments.map((assignment) => ({
    id: `code:${assignment.orderId}`,
    module: "code" as const,
    title: assignment.order.orderNumber,
    detail: "Confirmation code for a movement accepted on the carrier portal.",
    status: assignment.status,
    targetId: assignment.orderId,
  }));
}

async function loadFacts(actor: PhoneActor, plan: MobilePlan, tasks: PhoneTask[]): Promise<WorkFacts> {
  const receive = tasks.find((task) => task.module === "receive");
  const respond = tasks.find((task) => task.module === "respond");
  const track = tasks.find((task) => task.module === "tracking" || task.module === "code");
  let unconfirmed: WorkFacts["unconfirmedCode"] = null;
  if (plan.workspace === "hotel" && plan.capabilities.includes("confirm-delivery-code") && track) {
    const code = await prisma.deliveryConfirmationCode.findFirst({
      where: { orderId: track.targetId, hotelTenantId: actor.tenantId, deletedAt: null },
      select: { confirmedAt: true, orderId: true },
    });
    if (!code?.confirmedAt) unconfirmed = { id: track.targetId, orderNumber: track.title };
  }
  let quoteResponses: WorkFacts["quoteResponses"] = null;
  let openRequests = 0;
  if (plan.workspace === "hotel" && plan.capabilities.includes("compare-quotes")) {
    const quoted = tasks.find((task) => task.module === "quotes");
    const count = quoted?.amount ?? 0;
    if (count > 0) quoteResponses = { count, productName: null };
    openRequests = await prisma.rfqRequest.count({
      where: { tenantId: actor.tenantId, deletedAt: null, status: { in: ["PENDING", "QUOTED"] } },
    });
  }
  const remaining = receive?.amount ?? 0;
  return {
    workspace: plan.workspace,
    deskPath: plan.workspace === "desk" ? plan.deskPath : null,
    receivable: receive ? { id: receive.targetId, orderNumber: receive.title, remaining } : null,
    unconfirmedCode: receive ? null : unconfirmed,
    supplierRequest: respond
      ? {
          id: respond.targetId,
          itemName: respond.title,
          quantity: respond.amount ?? 0,
        }
      : null,
    quoteResponses: receive || unconfirmed ? null : quoteResponses,
    tracking: !receive && !respond && !quoteResponses && track
      ? { id: track.targetId, orderNumber: track.title, status: track.status }
      : null,
    openRequests,
  };
}

const SAFE_ORDER_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  estimatedDelivery: true,
  paymentGuaranteed: true,
  items: {
    where: { deletedAt: null },
    select: {
      id: true,
      quantity: true,
      receivedQuantity: true,
      product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
    },
  },
} as const;

export async function listPhoneOrders(actor: PhoneActor, plan: MobilePlan) {
  if (plan.workspace === "hotel") {
    const orders = await prisma.order.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: { not: "DRAFT" } },
      select: {
        ...SAFE_ORDER_SELECT,
        invoices: { where: { deletedAt: null }, select: { id: true }, take: 1 },
        supplier: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    return orders.map((order) => {
      const invoiceIssued = order.invoices.length > 0;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
        paymentGuaranteed: order.paymentGuaranteed,
        invoiceIssued,
        supplierName: invoiceIssued ? order.supplier.name : null,
        items: order.items.map(publicItem),
      };
    });
  }
  if (plan.workspace === "supplier" && actor.supplierId) {
    const orders = await prisma.order.findMany({
      where: { supplierId: actor.supplierId, tenantId: actor.tenantId, deletedAt: null },
      select: SAFE_ORDER_SELECT,
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      items: order.items.map(publicItem),
    }));
  }
  if (plan.workspace === "carrier-code") {
    const assignments = await prisma.carrierOrderAssignment.findMany({
      where: { carrierTenantId: actor.tenantId, deletedAt: null, status: { in: [...ACCEPTED_ASSIGNMENT] } },
      select: { orderId: true, status: true, order: { select: { orderNumber: true, status: true, estimatedDelivery: true } } },
      orderBy: { assignedAt: "desc" },
      take: 40,
    });
    return assignments.map((assignment) => ({
      id: assignment.orderId,
      orderNumber: assignment.order.orderNumber,
      status: assignment.order.status,
      assignmentStatus: assignment.status,
      estimatedDelivery: assignment.order.estimatedDelivery?.toISOString() ?? null,
      items: [],
    }));
  }
  return [];
}

function publicItem(item: {
  id: string;
  quantity: number;
  receivedQuantity: number | null;
  product: { id: string; name: string; sku: string | null; unitOfMeasure: string | null };
}) {
  return {
    id: item.id,
    quantity: item.quantity,
    receivedQuantity: item.receivedQuantity ?? 0,
    product: item.product,
  };
}

export async function loadPhoneOrder(actor: PhoneActor, plan: MobilePlan, orderId: string) {
  const tracking = await loadTracking(actor, plan, orderId);
  if (!tracking) return null;
  const code = plan.capabilities.includes("delivery-code")
    ? await ensureDeliveryCode(actor, plan, orderId)
    : null;
  return { ...tracking, deliveryCode: code };
}

async function supplierTracking(actor: PhoneActor, orderId: string) {
  if (!actor.supplierId) return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId, supplierId: actor.supplierId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, orderNumber: true, status: true, estimatedDelivery: true },
  });
  if (!order) return null;
  const assignment = await prisma.carrierOrderAssignment.findFirst({
    where: { orderId: order.id, deletedAt: null, order: { supplierId: actor.supplierId, tenantId: actor.tenantId } },
    select: {
      status: true,
      assignedAt: true,
      respondedAt: true,
      deliveredAt: true,
      shipments: {
        where: { deletedAt: null },
        select: { status: true, originHub: true, destinationHub: true, dispatchDate: true, estimatedArrival: true },
        take: 1,
      },
    },
  });
  const shipment = assignment?.shipments[0] ?? null;
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    referredFrom: "carrier-portal" as const,
    estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    assignmentStatus: assignment?.status ?? null,
    originHub: shipment?.originHub ?? null,
    destinationHub: shipment?.destinationHub ?? null,
    checkpoints: carrierCheckpoints({
      assignmentStatus: assignment?.status ?? null,
      shipmentStatus: shipment?.status ?? null,
      assignedAt: assignment?.assignedAt.toISOString() ?? null,
      respondedAt: assignment?.respondedAt?.toISOString() ?? null,
      dispatchDate: shipment?.dispatchDate?.toISOString() ?? null,
      estimatedArrival: shipment?.estimatedArrival?.toISOString() ?? null,
      deliveredAt: assignment?.deliveredAt?.toISOString() ?? null,
    }),
  };
}

export async function loadTracking(actor: PhoneActor, plan: MobilePlan, orderId: string) {
  if (plan.workspace === "desk") return null;
  if (plan.workspace === "supplier") return supplierTracking(actor, orderId);
  const assignment = await prisma.carrierOrderAssignment.findFirst({
    where: {
      orderId,
      deletedAt: null,
      ...(plan.workspace === "hotel" ? { hotelTenantId: actor.tenantId } : {}),
      ...(plan.workspace === "carrier-code" ? { carrierTenantId: actor.tenantId } : {}),
    },
    select: {
      status: true,
      assignedAt: true,
      respondedAt: true,
      deliveredAt: true,
      hotelTenantId: true,
      carrierTenantId: true,
      order: { select: { id: true, orderNumber: true, status: true, tenantId: true, supplierId: true, estimatedDelivery: true } },
      shipments: {
        where: { deletedAt: null },
        select: { status: true, originHub: true, destinationHub: true, dispatchDate: true, estimatedArrival: true },
        take: 1,
      },
    },
  });

  if (!assignment) {
    if (plan.workspace !== "hotel") return null;
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: actor.tenantId, deletedAt: null },
      select: { id: true, orderNumber: true, status: true, estimatedDelivery: true },
    });
    if (!order) return null;
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      referredFrom: "carrier-portal" as const,
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      assignmentStatus: null,
      originHub: null,
      destinationHub: null,
      checkpoints: carrierCheckpoints({
        assignmentStatus: null,
        shipmentStatus: null,
        assignedAt: null,
        respondedAt: null,
        dispatchDate: null,
        estimatedArrival: null,
        deliveredAt: null,
      }),
    };
  }

  if (plan.workspace === "hotel" && assignment.hotelTenantId !== actor.tenantId) return null;
  if (plan.workspace === "carrier-code" && assignment.carrierTenantId !== actor.tenantId) return null;
  const shipment = assignment.shipments[0] ?? null;
  return {
    orderId: assignment.order.id,
    orderNumber: assignment.order.orderNumber,
    status: assignment.order.status,
    referredFrom: "carrier-portal" as const,
    estimatedDelivery: assignment.order.estimatedDelivery?.toISOString() ?? null,
    assignmentStatus: assignment.status,
    originHub: shipment?.originHub ?? null,
    destinationHub: shipment?.destinationHub ?? null,
    checkpoints: carrierCheckpoints({
      assignmentStatus: assignment.status,
      shipmentStatus: shipment?.status ?? null,
      assignedAt: assignment.assignedAt.toISOString(),
      respondedAt: assignment.respondedAt?.toISOString() ?? null,
      dispatchDate: shipment?.dispatchDate?.toISOString() ?? null,
      estimatedArrival: shipment?.estimatedArrival?.toISOString() ?? null,
      deliveredAt: assignment.deliveredAt?.toISOString() ?? null,
    }),
  };
}

export async function ensureDeliveryCode(actor: PhoneActor, plan: MobilePlan, orderId: string) {
  if (!plan.capabilities.includes("delivery-code")) return { available: false as const, reason: "DELIVERY_CODE_NOT_ON_THIS_PHONE" };
  const assignment = await prisma.carrierOrderAssignment.findFirst({
    where: {
      orderId,
      deletedAt: null,
      status: { in: [...ACCEPTED_ASSIGNMENT] },
      ...(plan.workspace === "hotel" ? { hotelTenantId: actor.tenantId } : {}),
      ...(plan.workspace === "carrier-code" ? { carrierTenantId: actor.tenantId } : {}),
    },
    select: { hotelTenantId: true, carrierTenantId: true, order: { select: { orderNumber: true, tenantId: true, supplierId: true } } },
  });
  if (!assignment) return { available: false as const, reason: "CARRIER_ACCEPTANCE_REQUIRED" };
  if (plan.workspace === "supplier") return { available: false as const, reason: "DELIVERY_CODE_NOT_ON_THIS_PHONE" };
  if (plan.workspace === "hotel" && assignment.hotelTenantId !== actor.tenantId) return { available: false as const, reason: "ORDER_NOT_FOUND" };
  if (plan.workspace === "carrier-code" && assignment.carrierTenantId !== actor.tenantId) return { available: false as const, reason: "ORDER_NOT_FOUND" };

  const existing = await prisma.deliveryConfirmationCode.findFirst({
    where: { orderId, deletedAt: null },
    select: { code: true, confirmedAt: true },
  });
  if (existing) {
    return { available: true as const, code: existing.code, confirmedAt: existing.confirmedAt?.toISOString() ?? null, orderNumber: assignment.order.orderNumber };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  try {
    const created = await prisma.deliveryConfirmationCode.create({
      data: { orderId, hotelTenantId: assignment.hotelTenantId, carrierTenantId: assignment.carrierTenantId, code },
      select: { code: true, confirmedAt: true },
    });
    return { available: true as const, code: created.code, confirmedAt: null, orderNumber: assignment.order.orderNumber };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const raced = await prisma.deliveryConfirmationCode.findFirst({
      where: { orderId, deletedAt: null },
      select: { code: true, confirmedAt: true },
    });
    if (!raced) throw error;
    return { available: true as const, code: raced.code, confirmedAt: raced.confirmedAt?.toISOString() ?? null, orderNumber: assignment.order.orderNumber };
  }
}

export async function confirmDeliveryCode(actor: PhoneActor, orderId: string, presented: string) {
  const receiving = actor.platformRole === "HOTEL" && (RECEIVING_ROLES as readonly string[]).includes(actor.role);
  if (!receiving) return { error: "RECEIVING_ROLE_REQUIRED" as const, status: 403 as const };
  const row = await prisma.deliveryConfirmationCode.findFirst({
    where: { orderId, hotelTenantId: actor.tenantId, deletedAt: null },
    select: { id: true, code: true, confirmedAt: true },
  });
  if (!row || !timingSafeEqual(row.code, presented.trim())) {
    return { error: "DELIVERY_CODE_MISMATCH" as const, status: 409 as const };
  }
  if (!row.confirmedAt) {
    await prisma.deliveryConfirmationCode.update({
      where: { id: row.id },
      data: { confirmedAt: new Date(), confirmedByUserId: actor.id },
    });
    await appendAuditEntry({
      entityName: "ORDER",
      entityId: orderId,
      actionType: "UPDATE",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { deliveryConfirmation: "MATCHED" },
    });
  }
  return { ok: true as const, idempotent: Boolean(row.confirmedAt) };
}

function timingSafeEqual(expected: string, presented: string) {
  const left = createHash("sha256").update(expected).digest();
  const right = createHash("sha256").update(presented).digest();
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

export type { Proposal };
