/**
 * Shared BullMQ connection configuration.
 * Avoid opening queue connections during build/static generation.
 */
export function isBuildEnvironment(): boolean {
  return process.env.HV_BUILD === "1" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "true";
}

export function getRedisConnection() {
  const rawUrl = process.env.REDIS_URL;
  const url = rawUrl ? new URL(rawUrl) : null;
  const connection: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    tls?: Record<string, never>;
    maxRetriesPerRequest: null;
  } = {
    host: url?.hostname || process.env.REDIS_HOST || "127.0.0.1",
    port: Number(url?.port || process.env.REDIS_PORT || "6379"),
    username: url?.username ? decodeURIComponent(url.username) : undefined,
    password: url?.password ? decodeURIComponent(url.password) : process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
  if (url?.protocol === "rediss:") connection.tls = {};
  return connection;
}
