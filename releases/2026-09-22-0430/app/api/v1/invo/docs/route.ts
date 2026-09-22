import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      openapi: "3.0.0",
      info: {
        title: "INVO API",
        version: "1.0.0",
        description: "Infrastructure API for Egyptian hospitality commerce",
      },
      servers: [{ url: "https://invo.hotelsvendors.com/api/v1/invo" }],
      endpoints: [
        {
          path: "/health",
          method: "GET",
          description: "Service health check",
        },
        {
          path: "/catalog",
          method: "GET",
          description: "List catalog items",
          params: ["supplierId", "category", "search", "page", "limit"],
        },
        {
          path: "/catalog",
          method: "POST",
          description: "Create or update catalog item",
          body: ["sku", "name", "category", "price", "quantity", "supplierId", "unit"],
        },
        {
          path: "/delivery/quote",
          method: "POST",
          description: "Get delivery quote",
          body: ["pickup", "dropoff", "weightKg", "volumeM3", "urgency"],
        },
        {
          path: "/delivery/route",
          method: "POST",
          description: "Assign optimized route",
          body: ["orderIds", "vehicleType", "consolidate"],
        },
        {
          path: "/settlement",
          method: "POST",
          description: "Execute payment settlement",
          body: ["invoiceId", "supplierId", "amount", "method"],
        },
        {
          path: "/partners/onboard",
          method: "POST",
          description: "Register new partner",
          body: ["type", "name", "taxId", "email", "phone", "contactName", "address", "categories", "documents"],
        },
        {
          path: "/partners/status/{id}",
          method: "GET",
          description: "Check onboarding status",
        },
      ],
      auth: {
        type: "Bearer",
        header: "Authorization: Bearer <INVO_SERVICE_KEY>",
      },
    },
  });
}
