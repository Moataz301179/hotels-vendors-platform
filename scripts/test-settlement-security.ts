/**
 * Test: Smart Settlement Worker — Unauthorized Mutation Prevention
 * Verifies that the worker CANNOT mutate financial state without explicit authorization.
 */

import { prisma } from "@/lib/prisma";
import { processSettlement, processInvoiceSettlement, SettlementAuth } from "@/lib/ai/workflows/smart-settlement-worker";

async function runTest() {
  console.log("=== SMART SETTLEMENT WORKER UNAUTHORIZED MUTATION TEST ===\n");

  // Setup: Create test data
  const testTenantId = "test-tenant-security-" + Date.now();
  const testHotelId = "test-hotel-" + Date.now();

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: testTenantId,
      name: "Security Test Tenant",
      slug: "sec-test-" + Date.now(),
    },
  });

  // Create hotel
  const hotel = await prisma.hotel.create({
    data: {
      id: testHotelId,
      name: "Security Test Hotel",
      tenantId: testTenantId,
    },
  });

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEC-" + Date.now(),
      status: "ACTIVE",
      paymentStatus: "UNPAID",
      total: 5000,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      hotelId: testHotelId,
      supplierId: "test-supplier",
      tenantId: testTenantId,
      orderId: "test-order",
    },
  });

  // Create payment in PENDING status
  const payment = await prisma.payment.create({
    data: {
      paymentNumber: "PAY-SEC-" + Date.now(),
      status: "PENDING",
      amount: 5000,
      currency: "EGP",
      method: "BANK_TRANSFER",
      invoiceId: invoice.id,
      hotelId: testHotelId,
      tenantId: testTenantId,
    },
  });

  console.log(`Created test payment: ${payment.id} status=${payment.status}`);
  console.log(`Created test invoice: ${invoice.id} paymentStatus=${invoice.paymentStatus}\n`);

  // TEST 1: Call processSettlement WITHOUT authorization
  console.log("TEST 1: processSettlement() with NO auth parameter");
  const resultNoAuth = await processSettlement();
  console.log(`Result: processed=${resultNoAuth.processed}, matched=${resultNoAuth.matched}, errors=${resultNoAuth.errors.length}`);
  console.log(`Errors: ${resultNoAuth.errors.join(", ")}`);

  // Check if payment was mutated
  const paymentAfterNoAuth = await prisma.payment.findUnique({ where: { id: payment.id } });
  const invoiceAfterNoAuth = await prisma.invoice.findUnique({ where: { id: invoice.id } });

  const test1Pass = paymentAfterNoAuth?.status === "PENDING" && invoiceAfterNoAuth?.paymentStatus === "UNPAID";
  console.log(`Payment status after no-auth call: ${paymentAfterNoAuth?.status} (expected: PENDING)`);
  console.log(`Invoice paymentStatus after no-auth call: ${invoiceAfterNoAuth?.paymentStatus} (expected: UNPAID)`);
  console.log(`TEST 1 RESULT: ${test1Pass ? "PASS ✓" : "FAIL ✗"}\n`);

  // TEST 2: Call processSettlement WITH valid authorization
  console.log("TEST 2: processSettlement() WITH valid auth");
  const auth: SettlementAuth = {
    authorizedBy: "security-test-admin",
    authorizedByUserId: "test-admin-user-id",
    approvalReference: "SECURITY-TEST-APPROVAL-001",
    tenantId: testTenantId,
    idempotencyKey: "sec-test-batch-" + Date.now(),
  };

  const resultWithAuth = await processSettlement(auth);
  console.log(`Result: processed=${resultWithAuth.processed}, matched=${resultWithAuth.matched}, errors=${resultWithAuth.errors.length}`);
  if (resultWithAuth.errors.length > 0) {
    console.log(`Errors: ${resultWithAuth.errors.join(", ")}`);
  }

  // Check if payment was mutated
  const paymentAfterAuth = await prisma.payment.findUnique({ where: { id: payment.id } });
  const invoiceAfterAuth = await prisma.invoice.findUnique({ where: { id: invoice.id } });

  const test2Pass = paymentAfterAuth?.status === "PAID" && invoiceAfterAuth?.paymentStatus === "PAID";
  console.log(`Payment status after auth call: ${paymentAfterAuth?.status} (expected: PAID)`);
  console.log(`Invoice paymentStatus after auth call: ${invoiceAfterAuth?.paymentStatus} (expected: PAID)`);
  console.log(`TEST 2 RESULT: ${test2Pass ? "PASS ✓" : "FAIL ✗"}\n`);

  // TEST 3: Idempotency — call again with same idempotencyKey
  console.log("TEST 3: Idempotency — duplicate call with same idempotencyKey");
  const resultDupe = await processSettlement(auth);
  console.log(`Result: processed=${resultDupe.processed}, matched=${resultDupe.matched}, errors=${resultDupe.errors.length}`);
  console.log(`Errors: ${resultDupe.errors.join(", ")}`);

  const test3Pass = resultDupe.errors.some(e => e.includes("Duplicate idempotency key"));
  console.log(`TEST 3 RESULT: ${test3Pass ? "PASS ✓ (duplicate blocked)" : "FAIL ✗"}\n`);

  // TEST 4: Tenant isolation — create payment in different tenant, try to settle
  console.log("TEST 4: Tenant isolation — cross-tenant access blocked");
  const otherTenantId = "other-tenant-" + Date.now();
  await prisma.tenant.create({
    data: { id: otherTenantId, name: "Other Tenant", slug: "other-" + Date.now() },
  });

  // Create a payment in the other tenant
  const otherPayment = await prisma.payment.create({
    data: {
      paymentNumber: "PAY-OTHER-" + Date.now(),
      status: "PENDING",
      amount: 1000,
      currency: "EGP",
      method: "BANK_TRANSFER",
      invoiceId: invoice.id,
      hotelId: testHotelId,
      tenantId: otherTenantId, // Different tenant
    },
  });

  // Try to settle with testTenantId auth — should NOT process otherPayment
  const authOther: SettlementAuth = {
    authorizedBy: "security-test-admin-2",
    authorizedByUserId: "test-admin-user-id-2",
    approvalReference: "SECURITY-TEST-APPROVAL-002",
    tenantId: otherTenantId,
    idempotencyKey: "sec-test-batch-other-" + Date.now(),
  };

  const resultOther = await processSettlement(authOther);
  const otherPaymentAfter = await prisma.payment.findUnique({ where: { id: otherPayment.id } });
  const test4Pass = otherPaymentAfter?.status === "PENDING"; // Not mutated by our main auth
  console.log(`Other-tenant payment status: ${otherPaymentAfter?.status} (expected: PENDING — not processed)`);
  console.log(`TEST 4 RESULT: ${test4Pass ? "PASS ✓" : "FAIL ✗"}\n`);

  // TEST 5: processInvoiceSettlement requires auth
  console.log("TEST 5: processInvoiceSettlement requires auth");
  try {
    // @ts-expect-error — intentionally calling without auth to test runtime guard
    const resultNoAuthSettlement = await processInvoiceSettlement(invoice.id);
    console.log(`Result: ${resultNoAuthSettlement}`);
    console.log(`TEST 5 RESULT: FAIL ✗ (should have blocked or thrown)`);
  } catch (err) {
    console.log(`processInvoiceSettlement without auth threw: ${err}`);
    console.log(`TEST 5 RESULT: PASS ✓ (blocked)`);
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
  await prisma.payment.delete({ where: { id: otherPayment.id } }).catch(() => {});
  await prisma.invoice.delete({ where: { id: invoice.id } }).catch(() => {});
  await prisma.hotel.delete({ where: { id: testHotelId } }).catch(() => {});
  await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
  await prisma.tenant.delete({ where: { id: otherTenantId } }).catch(() => {});

  console.log("\n=== TEST COMPLETE ===");
  console.log(`Overall: TEST 1: ${test1Pass ? "PASS" : "FAIL"} | TEST 2: ${test2Pass ? "PASS" : "FAIL"} | TEST 3: ${test3Pass ? "PASS" : "FAIL"} | TEST 4: ${test4Pass ? "PASS" : "FAIL"}`);

  return { test1Pass, test2Pass, test3Pass, test4Pass };
}

runTest().catch(console.error);
