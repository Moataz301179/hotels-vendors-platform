/**
 * Graceful Shutdown Handler — Hotels Vendors
 * CRITICAL FIX: SIGTERM/SIGINT handlers for clean process termination.
 *
 * Handles:
 *  - SIGTERM (Docker stop, PM2 stop, OS shutdown)
 *  - SIGINT  (Ctrl+C, terminal close)
 *  - PM2 shutdown message
 *
 * Shutdown sequence:
 *  1. Stop accepting new HTTP connections
 *  2. Drain BullMQ workers (finish in-flight jobs)
 *  3. Disconnect Redis
 *  4. Disconnect Prisma
 *  5. Flush logs
 *  6. Exit
 */

import { logger } from "@/lib/logger";

const SHUTDOWN_TIMEOUT_MS = 8_000;
const DRAIN_TIMEOUT_MS = 5_000;

type ShutdownCallback = () => Promise<void>;

const shutdownCallbacks: ShutdownCallback[] = [];
let isShuttingDown = false;

/**
 * Register a callback to run during shutdown.
 * Example: registerShutdownHandler(() => worker.close());
 */
export function registerShutdownHandler(cb: ShutdownCallback): void {
  shutdownCallbacks.push(cb);
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const startedAt = Date.now();
  logger.info({ signal }, "Graceful shutdown initiated");

  const timeout = setTimeout(() => {
    logger.error({ signal }, "Shutdown timed out — forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  try {
    // Execute all registered shutdown callbacks in parallel
    const results = await Promise.allSettled(
      shutdownCallbacks.map((cb, i) =>
        Promise.race(
          [
            cb(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Shutdown callback ${i} timed out`)), DRAIN_TIMEOUT_MS)
            ),
          ]
        )
      )
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      logger.warn(
        { failures: failures.map((f) => (f as PromiseRejectedResult).reason?.message) },
        "Some shutdown callbacks failed"
      );
    }

    logger.info({ signal, durationMs: Date.now() - startedAt }, "Graceful shutdown complete");
  } catch (err) {
    logger.error({ err, signal }, "Error during graceful shutdown");
  } finally {
    clearTimeout(timeout);
    process.exit(0);
  }
}

/**
 * Initialize shutdown handlers. Call once at application startup.
 */
export function initGracefulShutdown(): void {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // PM2 sends 'shutdown' message for graceful stop
  process.on("message", (msg: string) => {
    if (msg === "shutdown") {
      gracefulShutdown("PM2_SHUTDOWN");
    }
  });

  // Catch unhandled errors to prevent zombie processes
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — initiating emergency shutdown");
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });

  logger.info("Graceful shutdown handlers initialized");
}
