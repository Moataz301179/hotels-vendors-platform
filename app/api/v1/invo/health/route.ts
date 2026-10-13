import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const [database, redis] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    (async () => { const client = getRedis(); if (!client) throw new Error("Redis unavailable"); return client.ping(); })(),
  ]);
  const healthy = database.status === "fulfilled" && redis.status === "fulfilled";
  return Response.json({ success: healthy, data: { status: healthy ? "ok" : "degraded", service: "invo", timestamp: new Date().toISOString(), dependencies: { database: database.status === "fulfilled" ? "connected" : "unavailable", redis: redis.status === "fulfilled" ? "connected" : "unavailable", eta_bridge: "not_verified" } } }, { status: healthy ? 200 : 503 });
}
