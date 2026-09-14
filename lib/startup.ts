/**
 * Server Startup — Graceful Shutdown Registration
 *
 * Imported once in root layout to register SIGTERM/SIGINT handlers.
 * Uses a module-level guard to prevent duplicate registration.
 */

import { initGracefulShutdown, registerShutdownHandler } from "@/lib/process/graceful-shutdown";

let initialized = false;

export function initServer() {
  if (initialized) return;
  initialized = true;

  initGracefulShutdown();

  // Lazy imports to avoid Edge Runtime issues
  registerShutdownHandler(async () => {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$disconnect();
    } catch {
      // Prisma may not be available in all contexts
    }
  });

  registerShutdownHandler(async () => {
    try {
      const { getRedis } = await import("@/lib/redis");
      const redis = getRedis();
      if (redis) redis.disconnect();
    } catch {
      // Redis may not be available
    }
  });
}
