const buckets = new Map();

function now() {
  return Date.now();
}

export function checkRateLimit(key, limit, windowMs) {
  if (!key || !Number.isFinite(limit) || !Number.isFinite(windowMs) || limit <= 0 || windowMs <= 0) {
    return { allowed: true, remaining: limit, resetInMs: 0 };
  }

  const currentTime = now();
  const bucket = buckets.get(key);

  if (!bucket || currentTime >= bucket.resetAt) {
    const resetAt = currentTime + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetInMs: windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, bucket.resetAt - currentTime) };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    resetInMs: Math.max(0, bucket.resetAt - currentTime)
  };
}
