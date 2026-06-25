import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';

// Simple in-memory sliding window rate limiter (Redis-swappable)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000).unref();

export function rateLimit(options: { windowMs?: number; max?: number; keyPrefix?: string } = {}) {
  const { windowMs = 60_000, max = 10, keyPrefix = 'rl' } = options;

  return (req: Request, _res: Response, next: NextFunction) => {
    const identifier = req.user?.userId || req.ip || 'anonymous';
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      return next(new RateLimitError());
    }

    next();
  };
}
