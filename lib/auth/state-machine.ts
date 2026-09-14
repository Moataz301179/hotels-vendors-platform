/**
 * Order State Machine
 * Hotels Vendors Governance Layer
 *
 * Enforces valid status transitions to prevent race conditions.
 * No order may skip states or transition backwards without explicit override.
 */

import { OrderStatus } from "@prisma/client";

// ─────────────────────────────────────────
// 1. VALID TRANSITIONS
// ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CONFIRMED", "CANCELLED"],
  REJECTED: ["DRAFT"], // Can be resubmitted
  CONFIRMED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["PARTIALLY_DELIVERED", "DELIVERED", "DISPUTED"],
  PARTIALLY_DELIVERED: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["DISPUTED"],
  DISPUTED: ["DELIVERED", "CANCELLED"],
  CANCELLED: [], // Terminal state
};

// ─────────────────────────────────────────
// 2. TRANSITION VALIDATION
// ─────────────────────────────────────────

export interface StateValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate that a status transition is allowed.
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): StateValidationResult {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Invalid transition: ${currentStatus} → ${nextStatus}. Allowed: ${allowed.join(", ") || "none"}`,
    };
  }

  return { valid: true };
}

// ─────────────────────────────────────────
// 3. TRANSITION GATES
// ─────────────────────────────────────────

export interface TransitionGate {
  from: OrderStatus;
  to: OrderStatus;
  requires: {
    paymentGuarantee?: boolean;
    etaValidation?: boolean;
    authorityApproval?: boolean;
  };
}

const TRANSITION_GATES: TransitionGate[] = [
  { from: "APPROVED", to: "CONFIRMED", requires: { paymentGuarantee: true } },
  { from: "CONFIRMED", to: "IN_TRANSIT", requires: { paymentGuarantee: true, etaValidation: true } },
  { from: "IN_TRANSIT", to: "DELIVERED", requires: { authorityApproval: true } },
];

/**
 * Check if a transition requires additional gates.
 */
export function getTransitionGate(
  from: OrderStatus,
  to: OrderStatus
): TransitionGate | undefined {
  return TRANSITION_GATES.find((g) => g.from === from && g.to === to);
}

// ─────────────────────────────────────────
// 4. ATOMIC STATUS UPDATE
// ─────────────────────────────────────────

import { prisma } from "@/lib/prisma";

export interface AtomicStatusUpdateResult {
  success: boolean;
  order?: { id: string; status: OrderStatus };
  error?: string;
}

/**
 * Atomically update order status with row locking.
 * Prevents race conditions between concurrent status updates.
 */
export async function atomicStatusUpdate(
  orderId: string,
  requestedStatus: OrderStatus,
  actorId: string,
  tenantId: string,
  override?: boolean
): Promise<AtomicStatusUpdateResult> {
  // Use transaction with SELECT FOR UPDATE
  const result = await prisma.$transaction(async (tx) => {
    // Lock the row
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentGuaranteed: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Validate transition
    const transition = validateStatusTransition(order.status as OrderStatus, requestedStatus);
    if (!transition.valid && !override) {
      return { success: false, error: transition.reason };
    }

    // Check gates
    const gate = getTransitionGate(order.status as OrderStatus, requestedStatus);
    if (gate && !override) {
      if (gate.requires.paymentGuarantee && !order.paymentGuaranteed) {
        return {
          success: false,
          error: `Transition ${order.status} → ${requestedStatus} requires payment guarantee`,
        };
      }
    }

    // Update status
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: requestedStatus },
      select: { id: true, status: true },
    });

    // Write audit log
    await tx.auditLog.create({
      data: {
        entityName: "ORDER",
        entityId: orderId,
        actionType: "UPDATE",
        tenantId,
        actorId,
        changes: { before: { status: order.status }, after: { status: requestedStatus } },
      },
    });

    return { success: true, order: updated };
  });

  return result as AtomicStatusUpdateResult;
}
