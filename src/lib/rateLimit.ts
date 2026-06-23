// Pseudo-rate limit (Production ready would use Redis, but we use an in-memory Map for MVP per instructions)
const cache = new Map<string, { count: number, resetTime: number }>();

export function checkRateLimit(ip: string, endpoint: string, limit: number, windowMs: number): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const record = cache.get(key);
  if (!record) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
