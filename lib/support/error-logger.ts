/**
 * Error Logger — when a support ticket is TECHNICAL, automatically log it
 * to Redis and record via recordSwarmEvent so it surfaces in the admin panel.
 */

import { getRedis } from "@/lib/redis";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";

export interface ErrorLogEntry {
  ticketId: string;
  tenantId: string;
  description: string;
  stackTrace?: string;
  userAgent?: string;
  route?: string;
  timestamp: string;
}

/**
 * Log a technical support ticket as an error entry in Redis + swarm telemetry.
 * Non-blocking: failures are caught and logged, never propagated.
 */
export async function logSupportError(entry: ErrorLogEntry): Promise<void> {
  const redisKey = `hv:errors:${entry.tenantId}:${entry.timestamp}`;

  // 1. Store in Redis (TTL: 30 days)
  try {
    const redis = getRedis();
    if (redis) {
      await redis.setex(redisKey, 2_592_000, JSON.stringify(entry));
    }
  } catch (err) {
    console.error("[error-logger] Redis write failed:", err instanceof Error ? err.message : err);
  }

  // 2. Record via swarm monitoring so it appears in admin telemetry
  try {
    await recordSwarmEvent("support_error_logger", "ERROR", {
      tenantId: entry.tenantId,
      ticketId: entry.ticketId,
      description: entry.description,
      route: entry.route,
      userAgent: entry.userAgent,
      timestamp: entry.timestamp,
    });
  } catch (err) {
    console.error("[error-logger] Swarm telemetry record failed:", err instanceof Error ? err.message : err);
  }
}
