/** lib/redis.ts — Hotels Vendors */
/** Redis Layer — idempotency, rate limiting, session cache, SSE events. */
/** Graceful fallback to in-memory when Redis is unavailable or during build. */

import { Redis, RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// ── Build-time guard ───────────────────────────────────────────────────────────
const isBuild = process.env.HV_BUILD === "1" || process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "true";
const production = !isBuild && Boolean(REDIS_URL);

// ── Singleton ─────────────────────────────────────────────────────────────────
let redis: Redis | null = null;

function createRedis(): Redis | null {
  if (!production) return null;
  try {
    const opts: RedisOptions = {
      maxRetriesPerRequest: null,
      retryStrategy: () => undefined,
      connectTimeout: 2000,
      lazyConnect: true,
      showFriendlyErrorStack: false,
    };
    if (REDIS_PASSWORD) {
      opts.password = REDIS_PASSWORD;
    }
    return new Redis(REDIS_URL!, opts);
  } catch {
    return null;
  }
}

export function getRedis(): Redis | null {
  if (!redis) redis = createRedis();
  return redis;
}

export const redisAvailable = production;

// ── In-memory fallback stores ─────────────────────────────────────────────────
const memoryIdempotency = new Map<string, { value: string; expiresAt: number }>();
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>();
const memorySessions = new Map<string, { data: string; expiresAt: number }>();
const memoryEvents = new Map<string, string[]>();

function cleanExpired(map: Map<string, { expiresAt: number }>) {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (v.expiresAt < now) map.delete(k);
  }
}

// ── Redis-or-memory dispatcher ────────────────────────────────────────────────
async function redisOrMemory<T>(
  redisFn: (r: Redis) => Promise<T>,
  memoryFn: () => T,
): Promise<T> {
  const r = getRedis();
  if (r && production) {
    try {
      return await redisFn(r);
    } catch {
      return memoryFn();
    }
  }
  return memoryFn();
}

// ── Idempotency ───────────────────────────────────────────────────────────────
export async function checkIdempotencyKey(
  key: string,
  scope: string,
  ttlSeconds = 86400,
): Promise<{ exists: boolean; previousResult?: string }> {
  const fullKey = `idempotency:${scope}:${key}`;
  return redisOrMemory(
    async (r) => {
      const existing = await r.get(fullKey);
      if (existing) return { exists: true, previousResult: existing };
      await r.setex(fullKey, ttlSeconds, "PENDING");
      return { exists: false };
    },
    () => {
      cleanExpired(memoryIdempotency);
      const entry = memoryIdempotency.get(fullKey);
      if (entry) return { exists: true, previousResult: entry.value };
      memoryIdempotency.set(fullKey, { value: "PENDING", expiresAt: Date.now() + ttlSeconds * 1000 });
      return { exists: false };
    },
  );
}

export async function completeIdempotency(
  key: string,
  scope: string,
  result: string,
  ttlSeconds = 86400,
): Promise<void> {
  const fullKey = `idempotency:${scope}:${key}`;
  await redisOrMemory(
    async (r) => {
      await r.setex(fullKey, ttlSeconds, result);
    },
    () => {
      memoryIdempotency.set(fullKey, { value: result, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
  );
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
export async function checkRateLimit(
  identifier: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const windowKey = `${identifier}:${windowStart}`;
  return redisOrMemory(
    async (r) => {
      const current = await r.incr(`ratelimit:${windowKey}`);
      if (current === 1) await r.expire(`ratelimit:${windowKey}`, windowSeconds);
      const allowed = current <= maxRequests;
      const remaining = Math.max(0, maxRequests - current);
      const resetAt = windowStart + windowSeconds;
      return { allowed, remaining, resetAt };
    },
    () => {
      const entry = memoryRateLimits.get(windowKey);
      let current = 1;
      if (entry && entry.resetAt > now) {
        current = entry.count + 1;
        entry.count = current;
      } else {
        memoryRateLimits.set(windowKey, { count: current, resetAt: windowStart + windowSeconds });
      }
      const allowed = current <= maxRequests;
      const remaining = Math.max(0, maxRequests - current);
      const resetAt = windowStart + windowSeconds;
      return { allowed, remaining, resetAt };
    },
  );
}

// ── Session Cache ─────────────────────────────────────────────────────────────
export async function cacheSession(
  userId: string,
  data: Record<string, unknown>,
  ttlSeconds = 604800,
): Promise<void> {
  const key = `session:${userId}`;
  const payload = JSON.stringify(data);
  await redisOrMemory(
    async (r) => {
      await r.setex(key, ttlSeconds, payload);
    },
    () => {
      memorySessions.set(key, { data: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
  );
}

export async function getCachedSession(userId: string): Promise<Record<string, unknown> | null> {
  const key = `session:${userId}`;
  return redisOrMemory(
    async (r) => {
      const data = await r.get(key);
      return data ? JSON.parse(data) : null;
    },
    () => {
      const entry = memorySessions.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        memorySessions.delete(key);
        return null;
      }
      return JSON.parse(entry.data);
    },
  );
}

// ── SSE Event Buffer ──────────────────────────────────────────────────────────
export async function bufferEvent(channel: string, event: string, ttlSeconds = 3600): Promise<void> {
  const key = `events:${channel}`;
  await redisOrMemory(
    async (r) => {
      await r.lpush(key, event);
      await r.ltrim(key, 0, 999);
      await r.expire(key, ttlSeconds);
    },
    () => {
      const list = memoryEvents.get(key) || [];
      list.unshift(event);
      if (list.length > 1000) list.length = 1000;
      memoryEvents.set(key, list);
    },
  );
}

export async function getBufferedEvents(channel: string): Promise<string[]> {
  const key = `events:${channel}`;
  return redisOrMemory(
    async (r) => r.lrange(key, 0, -1),
    () => memoryEvents.get(key) || [],
  );
}

// ── Health Check ──────────────────────────────────────────────────────────────
export async function redisHealth(): Promise<{ status: string; latencyMs: number }> {
  const r = getRedis();
  if (!r) return { status: "no-redis", latencyMs: 0 };
  try {
    const start = Date.now();
    await r.ping();
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unavailable", latencyMs: 0 };
  }
}
