import pino from "pino";

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "hotels-vendors",
    version: process.env.npm_package_version || "0.1.0",
  },
};

// Only use pino-pretty transport if the module is available
if (process.env.NODE_ENV !== "production") {
  try {
    require.resolve("pino-pretty");
    loggerOptions.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    };
  } catch {
    // pino-pretty not installed — use pino's default JSON output
  }
}

export const logger = pino(loggerOptions);

export function createRequestLogger(requestId: string, tenantId?: string, userId?: string) {
  return logger.child({ requestId, tenantId, userId });
}
