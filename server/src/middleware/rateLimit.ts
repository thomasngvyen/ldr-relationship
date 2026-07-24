import type { NextFunction, Request, Response } from 'express';

type WindowEntry = {
  count: number;
  resetAt: number;
};

/**
 *
 * @param maxRequests - Max requests allowed inside one window
 * @param timeWindowMs - Window length in milliseconds (e.g. 60_000 = 1 minute)
 */
export default function rateLimit(maxRequests: number, timeWindowMs: number) {
  const hits = new Map<string, WindowEntry>();

  function prune(now: number) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      req.ip ||
      req.socket.remoteAddress ||
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined);

    if (!ip) {
      return res.status(400).json({ error: 'Could not determine client IP' });
    }

    const now = Date.now();
    if (hits.size > 500) {
      prune(now);
    }

    const windowStart = Math.floor(now / timeWindowMs) * timeWindowMs;
    const resetAt = windowStart + timeWindowMs;
    const key = `${ip}:${windowStart}`;

    const existing = hits.get(key);
    const count = (existing?.count ?? 0) + 1;
    hits.set(key, { count, resetAt });

    const remaining = Math.max(0, maxRequests - count);
    const retryAfterSec = Math.ceil((resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too many requests. Please try again shortly.',
        retryAfterSeconds: retryAfterSec,
      });
    }

    return next();
  };
}
