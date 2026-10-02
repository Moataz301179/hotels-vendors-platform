import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Hotels Vendors API",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      auth: "/api/v1/auth",
      hotels: "/api/v1/hotel",
      suppliers: "/api/v1/suppliers",
      products: "/api/v1/products",
      orders: "/api/v1/orders",
      invoices: "/api/v1/invoices",
      factoring: "/api/v1/factoring",
      intelligence: "/api/v1/intelligence",
      eta: "/api/v1/eta",
      ai: "/api/v1/ai",
      payments: "/api/v1/payments",
      checkout: "/api/v1/checkout",
      shipping: "/api/v1/shipping",
      admin: "/api/v1/admin",
      swarm: "/api/v1/swarm",
      social: "/api/v1/social",
    },
  });
}
