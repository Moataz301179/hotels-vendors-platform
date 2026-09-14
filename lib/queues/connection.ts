/**
 * Shared Redis connection for BullMQ queues
 */

export function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return { url };
}
