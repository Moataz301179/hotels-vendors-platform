/**
 * Extended Seed — Orders, Invoices, Leads, Swarm Jobs, and Rich Demo Data
 *
 * Run: npx tsx prisma/seed-extended.ts
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Starting extended seed...");

  // ── Lookup existing seeded entities ──
  const hotelTenant = await prisma.tenant.findUnique({ where: { slug: "demo-hotel" } });
  const supplierTenant = await prisma.tenant.findUnique({ where: { slug: "demo-supplier" } });
  const factoringTenant = await prisma.tenant.findUnique({ where: { slug: "demo-factoring" } });
  const platformTenant = await prisma.tenant.findUnique({ where: { slug: "platform" } });

  if (!hotelTenant || !supplierTenant || !factoringTenant || !platformTenant) {
    console.error("❌ Base seed not found. Run `npx prisma db seed` first.");
    process.exit(1);
  }

  const hotel = await prisma.hotel.findFirst({ where: { tenantId: hotelTenant.id } });
  const supplier = await prisma.supplier.findFirst({ where: { tenantId: supplierTenant.id } });
  const factoringCompany = await prisma.factoringCompany.findFirst({ where: { tenantId: factoringTenant.id } });

  if (!hotel || !supplier || !factoringCompany) {
    console.error("❌ Base entities not found.");
    process.exit(1);
  }

  // ── More Suppliers ──
  const extraSuppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { taxId: "200-111-333" },
      update: {},
      create: {
        name: "CleanMax Professional",
        legalName: "CleanMax Professional SAE",
        taxId: "200-111-333",
        commercialReg: "CR-2018-112",
        address: "12 Chemical Zone, 10th of Ramadan",
        city: "10th of Ramadan",
        governorate: "Sharqia",
        phone: "+20 15 5001 2233",
        email: "orders@cleanmax.com",
        tenantId: supplierTenant.id,
      },
    }),
    prisma.supplier.upsert({
      where: { taxId: "200-222-444" },
      update: {},
      create: {
        name: "Cotton House Linens",
        legalName: "Cotton House for Textiles SAE",
        taxId: "200-222-444",
        commercialReg: "CR-2020-789",
        address: "88 Textile District, 6th of October",
        city: "6th of October",
        governorate: "Giza",
        phone: "+20 2 3855 9911",
        email: "sales@cottonhouse.com",
        tenantId: supplierTenant.id,
      },
    }),
    prisma.supplier.upsert({
      where: { taxId: "200-333-555" },
      update: {},
      create: {
        name: "Al-Gomhouria Food Supply",
        legalName: "Al-Gomhouria Food Supply Co.",
        taxId: "200-333-555",
        commercialReg: "CR-2015-321",
        address: "55 Food Market, Alexandria",
        city: "Alexandria",
        governorate: "Alexandria",
        phone: "+20 3 4888 7700",
        email: "info@gomhouriafood.com",
        tenantId: supplierTenant.id,
      },
    }),
  ]);
  console.log(`🏭 ${extraSuppliers.length} extra suppliers seeded`);

  // ── More Hotels ──
  const extraHotels = await Promise.all([
    prisma.hotel.upsert({
      where: { taxId: "100-111-222" },
      update: {},
      create: {
        name: "Marriott Cairo",
        legalName: "Marriott Cairo Hotel LLC",
        taxId: "100-111-222",
        commercialReg: "CR-2010-001",
        address: "16 Saray El Gezira Street, Zamalek",
        city: "Cairo",
        governorate: "Cairo",
        phone: "+20 2 2735 8888",
        email: "procurement@marriottcairo.com",
        starRating: 5,
        roomCount: 320,
        tenantId: hotelTenant.id,
      },
    }),
    prisma.hotel.upsert({
      where: { taxId: "100-222-333" },
      update: {},
      create: {
        name: "Four Seasons Giza",
        legalName: "Four Seasons Hotel Giza",
        taxId: "100-222-333",
        commercialReg: "CR-2012-045",
        address: "35 Giza Street, Giza",
        city: "Giza",
        governorate: "Giza",
        phone: "+20 2 3567 9000",
        email: "purchasing@fsgiza.com",
        starRating: 5,
        roomCount: 280,
        tenantId: hotelTenant.id,
      },
    }),
    prisma.hotel.upsert({
      where: { taxId: "100-333-444" },
      update: {},
      create: {
        name: "Hilton Alexandria",
        legalName: "Hilton Alexandria Corniche",
        taxId: "100-333-444",
        commercialReg: "CR-2014-078",
        address: "544 El Geish Road, Alexandria",
        city: "Alexandria",
        governorate: "Alexandria",
        phone: "+20 3 5490 935",
        email: "buying@hiltonalex.com",
        starRating: 4,
        roomCount: 180,
        tenantId: hotelTenant.id,
      },
    }),
  ]);
  console.log(`🏨 ${extraHotels.length} extra hotels seeded`);

  // ── More Products ──
  const allSuppliers = [supplier, ...extraSuppliers];
  const productData = [
    { sku: "FNB-004", name: "Sunflower Oil 10L", category: "F_AND_B", subcategory: "Oils & Fats", unitPrice: 320, stockQuantity: 90, minOrderQty: 5 },
    { sku: "FNB-005", name: "Pasta Penne 5kg", category: "F_AND_B", subcategory: "Grains", unitPrice: 150, stockQuantity: 150, minOrderQty: 10 },
    { sku: "FNB-006", name: "Beef Tenderloin 1kg", category: "F_AND_B", subcategory: "Meat", unitPrice: 650, stockQuantity: 40, minOrderQty: 10 },
    { sku: "HSK-003", name: "Guest Slippers (Pair)", category: "CONSUMABLES", subcategory: "Amenities", unitPrice: 18, stockQuantity: 2000, minOrderQty: 100 },
    { sku: "HSK-004", name: "Toilet Paper 48 Rolls", category: "CONSUMABLES", subcategory: "Hygiene", unitPrice: 220, stockQuantity: 300, minOrderQty: 5 },
    { sku: "HSK-005", name: "Laundry Detergent 20L", category: "GUEST_SUPPLIES", subcategory: "Cleaning", unitPrice: 380, stockQuantity: 75, minOrderQty: 3 },
    { sku: "ENG-001", name: "LED Downlight 12W", category: "FFE", subcategory: "Lighting", unitPrice: 95, stockQuantity: 200, minOrderQty: 20 },
    { sku: "ENG-002", name: "Air Filter HVAC", category: "FFE", subcategory: "HVAC", unitPrice: 450, stockQuantity: 30, minOrderQty: 5 },
    { sku: "FFE-001", name: "Dining Chair Wood", category: "FFE", subcategory: "Furniture", unitPrice: 1200, stockQuantity: 24, minOrderQty: 4 },
    { sku: "FFE-002", name: "Bedside Table", category: "FFE", subcategory: "Furniture", unitPrice: 850, stockQuantity: 16, minOrderQty: 4 },
  ];

  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    const sup = allSuppliers[i % allSuppliers.length];
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        currency: "EGP",
        supplierId: sup.id,
        tenantId: supplierTenant.id,
      },
    });
  }
  console.log(`📦 ${productData.length} extra products seeded`);

  // ── Get a requester user ──
  const requester = await prisma.user.findFirst({ where: { tenantId: hotelTenant.id } });
  if (!requester) {
    console.error("❌ No hotel user found for requesterId");
    process.exit(1);
  }

  // ── Orders ──
  const orderData = [
    { status: "PENDING_APPROVAL" as const, total: 47880, items: 2 },
    { status: "CONFIRMED" as const, total: 142500, items: 3 },
    { status: "DELIVERED" as const, total: 96900, items: 3 },
    { status: "IN_TRANSIT" as const, total: 25600, items: 2 },
    { status: "PENDING_APPROVAL" as const, total: 89000, items: 4 },
    { status: "APPROVED" as const, total: 124000, items: 5 },
    { status: "DELIVERED" as const, total: 45000, items: 2 },
    { status: "CANCELLED" as const, total: 32000, items: 1 },
    { status: "PENDING_APPROVAL" as const, total: 67500, items: 3 },
    { status: "CONFIRMED" as const, total: 188000, items: 6 },
    { status: "DELIVERED" as const, total: 56000, items: 2 },
    { status: "IN_TRANSIT" as const, total: 93000, items: 3 },
  ];

  // Check if orders already exist
  const existingOrderCount = await prisma.order.count();
  let createdOrders = [];
  if (existingOrderCount >= 12) {
    createdOrders = await prisma.order.findMany({ orderBy: { createdAt: "asc" } });
    console.log(`📋 ${existingOrderCount} orders already exist, skipping`);
  } else {
    for (let i = 0; i < orderData.length; i++) {
      const o = orderData[i];
      const subtotal = o.total / 1.14;
      const vat = o.total - subtotal;
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-2026-${String(i + 1).padStart(4, "0")}`,
          status: o.status,
          subtotal,
          vatAmount: vat,
          total: o.total,
          currency: "EGP",
          paymentGuaranteed: o.status !== "PENDING_APPROVAL" && o.status !== "CANCELLED",
          hotelId: hotel.id,
          supplierId: allSuppliers[i % allSuppliers.length].id,
          requesterId: requester.id,
          tenantId: hotelTenant.id,
        },
      });
      createdOrders.push(order);

      // Create order items
      const products = await prisma.product.findMany({ take: o.items });
      for (let j = 0; j < o.items && j < products.length; j++) {
        const qty = Math.floor(Math.random() * 20) + 5;
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: products[j].id,
            quantity: qty,
            unitPrice: products[j].unitPrice,
            total: products[j].unitPrice * qty,
          },
        });
      }
    }
    console.log(`📋 ${createdOrders.length} orders seeded`);
  }

  // ── Invoices ──
  const existingInvoiceCount = await prisma.invoice.count();
  let createdInvoices = [];
  if (existingInvoiceCount >= 8) {
    createdInvoices = await prisma.invoice.findMany({ orderBy: { createdAt: "asc" } });
    console.log(`🧾 ${existingInvoiceCount} invoices already exist, skipping`);
  } else {
    const invoiceStatuses = ["DRAFT", "ISSUED", "SUBMITTED", "VALIDATED", "DISPUTED", "CREDIT_NOTE", "DRAFT", "ISSUED"] as const;
    for (let i = 0; i < 8; i++) {
      const order = createdOrders[i % createdOrders.length];
      const subtotal = order.total / 1.14;
      const vat = order.total - subtotal;
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${String(i + 80).padStart(4, "0")}`,
          status: invoiceStatuses[i % invoiceStatuses.length],
          subtotal,
          vatRate: 14,
          vatAmount: vat,
          total: order.total,
          currency: "EGP",
          etaUuid: i < 5 ? `ETA-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null,
          issueDate: new Date(Date.now() - i * 86400000),
          orderId: order.id,
          hotelId: hotel.id,
          supplierId: order.supplierId,
          tenantId: hotelTenant.id,
        },
      });
      createdInvoices.push(inv);
    }
    console.log(`🧾 ${createdInvoices.length} invoices seeded`);
  }

  // ── Factoring Requests ──
  const existingFrCount = await prisma.factoringRequest.count();
  if (existingFrCount >= 4) {
    console.log(`🏦 ${existingFrCount} factoring requests already exist, skipping`);
  } else {
    for (let i = 0; i < 4; i++) {
      const inv = createdInvoices[i];
      if (!inv) continue;
      await prisma.factoringRequest.create({
        data: {
          status: i < 2 ? "APPROVED" : "PENDING",
          requestedAmount: inv.total,
          invoice: { connect: { id: inv.id } },
          factoringCompany: { connect: { id: factoringCompany.id } },
          tenant: { connect: { id: factoringTenant.id } },
          riskScore: 50 + i * 10,
          riskTier: i < 2 ? "LOW" : i === 2 ? "MEDIUM" : "HIGH",
          discountRate: 0.022,
          advanceRate: 0.90,
          platformFeeRate: 0.015,
          grossAmount: inv.total,
          platformFee: inv.total * 0.015,
          factoringFee: inv.total * 0.022,
          disbursedAmount: inv.total * 0.90,
        },
      });
    }
    console.log(`🏦 4 factoring requests seeded`);
  }

  // ── Leads ──
  const leadData = [
    { name: "Sphinx Hospitality Supplies", city: "Cairo", industry: "F&B", estimatedValue: 500000 },
    { name: "Nile Fresh Foods", city: "Giza", industry: "F&B", estimatedValue: 320000 },
    { name: "Royal Linens Egypt", city: "Alexandria", industry: "Textiles", estimatedValue: 780000 },
    { name: "Delta Chemicals", city: "10th of Ramadan", industry: "Chemicals", estimatedValue: 210000 },
    { name: "Pyramid Engineering", city: "Cairo", industry: "Engineering", estimatedValue: 950000 },
    { name: "Coastal Fresh Produce", city: "Hurghada", industry: "F&B", estimatedValue: 180000 },
    { name: "Mena Amenities", city: "6th of October", industry: "Amenities", estimatedValue: 420000 },
    { name: "Alexandria Seafood Direct", city: "Alexandria", industry: "F&B", estimatedValue: 650000 },
    { name: "Red Sea Logistics", city: "Hurghada", industry: "Logistics", estimatedValue: 300000 },
    { name: "Cairo Capital Catering", city: "Cairo", industry: "F&B", estimatedValue: 880000 },
  ];

  for (const l of leadData) {
    await prisma.lead.create({
      data: {
        entityType: l.industry === "Logistics" ? "SUPPLIER" : "SUPPLIER",
        name: l.name,
        email: `${l.name.toLowerCase().replace(/\s+/g, "-")}@demo.com`,
        phone: `+20 1${Math.floor(Math.random() * 5) + 1} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
        city: l.city,
        category: l.industry,
        source: ["scraped", "referral", "manual", "ai_discovered", "partner"][Math.floor(Math.random() * 5)],
        discoveredBy: "lead-scout",
        status: ["DISCOVERED", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"][Math.floor(Math.random() * 5)],
        tenantId: platformTenant.id,
      },
    });
  }
  console.log(`🔍 ${leadData.length} leads seeded`);

  // ── Swarm Jobs ──
  const swarmJobData = [
    { queueName: "growth", jobType: "lead_scout", jobName: "Scout Alexandria Hotels", squad: "growth", status: "COMPLETED" as const, assignedAgent: "lead-scout", payload: JSON.stringify({ city: "Alexandria", count: 12 }), output: JSON.stringify({ leads: 12, qualified: 8 }) },
    { queueName: "intelligence", jobType: "price_check", jobName: "Benchmark Olive Oil", squad: "intelligence", status: "COMPLETED" as const, assignedAgent: "price-analyst", payload: JSON.stringify({ sku: "FNB-001" }), output: JSON.stringify({ avgPrice: 450, trend: "down" }) },
    { queueName: "supplier", jobType: "trust_evaluation", jobName: "Q2 Trust Scores", squad: "supplier", status: "RUNNING" as const, assignedAgent: "trust-assessor", payload: JSON.stringify({ quarter: "Q2" }) },
    { queueName: "director", jobType: "battle_plan", jobName: "Daily Battle Plan", squad: "director", status: "COMPLETED" as const, assignedAgent: "director", payload: JSON.stringify({ date: "2026-05-05" }) },
    { queueName: "growth", jobType: "competitor_audit", jobName: "MaxAB Price Audit", squad: "growth", status: "COMPLETED" as const, assignedAgent: "web-navigator", payload: JSON.stringify({ competitor: "maxab" }) },
    { queueName: "intelligence", jobType: "demand_forecast", jobName: "Ramadan Forecast", squad: "intelligence", status: "COMPLETED" as const, assignedAgent: "demand-forecaster", payload: JSON.stringify({ event: "ramadan" }), output: JSON.stringify({ spike: 0.34 }) },
    { queueName: "growth", jobType: "content_generation", jobName: "Coastal SEO Content", squad: "growth", status: "RUNNING" as const, assignedAgent: "content-forge", payload: JSON.stringify({ target: "coastal" }) },
    { queueName: "operations", jobType: "health_check", jobName: "Platform Health Check", squad: "operations", status: "COMPLETED" as const, assignedAgent: "health-monitor", payload: JSON.stringify({ scope: "all" }) },
  ];

  for (const j of swarmJobData) {
    await prisma.swarmJob.create({
      data: {
        queueName: j.queueName,
        jobType: j.jobType,
        jobName: j.jobName,
        squad: j.squad,
        status: j.status,
        assignedAgent: j.assignedAgent,
        payload: j.payload,
        output: j.output,
      },
    });
  }
  console.log(`🐝 ${swarmJobData.length} swarm jobs seeded`);

  // ── Swarm Memory ──
  const memoryData = [
    { memoryType: "STRATEGY" as const, category: "strategy", key: "daily-battle-plan-2026-05-05", content: "Priority: Close 3 hotel deals in Alexandria. Onboard 2 coastal suppliers. Optimize shared routes for North Coast cluster.", confidence: 0.92, agentId: "director", agentName: "The Director" },
    { memoryType: "FACT" as const, category: "lead", key: "lead-alexandria-batch-1", content: "12 hotels identified in Alexandria with procurement spend > EGP 500K/month. Top targets: Marriott Alexandria, Hilton Corniche, Four Seasons San Stefano.", confidence: 0.88, agentId: "lead-scout", agentName: "Lead Scout" },
    { memoryType: "INSIGHT" as const, category: "market", key: "price-olive-oil-may-2026", content: "Olive oil prices trending down -8% vs March. Recommend hotels stock up before summer peak.", confidence: 0.85, agentId: "price-analyst", agentName: "Price Analyst" },
    { memoryType: "FACT" as const, category: "supplier", key: "trust-delta-food", content: "Delta Food Supply: Trust Score 8.7/10. On-time delivery 96%. 3 minor quality flags resolved. Credit limit: EGP 2M.", confidence: 0.95, agentId: "trust-assessor", agentName: "Trust Assessor" },
    { memoryType: "FACT" as const, category: "hotel", key: "spend-nile-palace-q2", content: "Nile Palace Hotel Q2 spend: EGP 287K across 3 suppliers. Top category: F&B (62%). Average order: EGP 96K.", confidence: 0.90, agentId: "hotel-analyst", agentName: "Hotel Analyst" },
  ];

  const existingMemories = await prisma.swarmMemory.count();
  if (existingMemories >= memoryData.length) {
    console.log(`🧠 ${existingMemories} swarm memories already exist, skipping`);
  } else {
    for (const m of memoryData) {
      await prisma.swarmMemory.create({
        data: {
          memoryType: m.memoryType,
          category: m.category,
          key: m.key,
          content: m.content,
          confidence: m.confidence,
          agentId: m.agentId,
          agentName: m.agentName,
          tenantId: platformTenant.id,
        },
      });
    }
    console.log(`🧠 ${memoryData.length} swarm memories seeded`);
  }

  // ── Audit Logs ──
  const auditData = [
    { action: "CREATE", entityType: "Order", entityId: createdOrders[0]?.id || "", actorId: "system", beforeState: {}, afterState: {} },
    { action: "APPROVE", entityType: "Order", entityId: createdOrders[0]?.id || "", actorId: "admin@hotelsvendors.com", beforeState: {}, afterState: {} },
    { action: "SUBMIT", entityType: "Invoice", entityId: createdInvoices[0]?.id || "", actorId: "system", beforeState: {}, afterState: {} },
    { action: "UPDATE", entityType: "Supplier", entityId: supplier.id, actorId: "system", beforeState: {}, afterState: {} },
  ];

  for (const a of auditData) {
    if (!a.entityId) continue;
    await prisma.auditLog.create({
      data: {
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actorId: a.actorId,
        beforeState: JSON.stringify(a.beforeState),
        afterState: JSON.stringify(a.afterState),
        tenant: { connect: { id: platformTenant.id } },
      },
    });
  }
  console.log(`📜 ${auditData.filter(a => a.entityId).length} audit logs seeded`);

  // ── Delivery Zones ──
  const zones = [
    { zone: "Greater Cairo", minDays: 1, maxDays: 1, fee: 0 },
    { zone: "Alexandria", minDays: 2, maxDays: 3, fee: 150 },
    { zone: "North Coast", minDays: 2, maxDays: 4, fee: 300 },
    { zone: "Red Sea", minDays: 3, maxDays: 5, fee: 400 },
    { zone: "Luxor", minDays: 3, maxDays: 5, fee: 350 },
  ];
  for (const z of zones) {
    await prisma.deliveryZone.create({
      data: {
        zone: z.zone,
        minDays: z.minDays,
        maxDays: z.maxDays,
        fee: z.fee,
        supplierId: supplier.id,
        tenantId: platformTenant.id,
      },
    });
  }
  console.log(`🚚 ${zones.length} delivery zones seeded`);

  console.log("\n✅ Extended seed complete!");
}

main()
  .then(async () => {
    const p = prisma as unknown as { $disconnect: () => Promise<void> };
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    const p = prisma as unknown as { $disconnect: () => Promise<void> };
    await p.$disconnect();
    process.exit(1);
  });
