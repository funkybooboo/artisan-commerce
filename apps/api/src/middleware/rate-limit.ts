/**
 * Rate-limit middleware -- in-memory token bucket per client IP.
 *
 * KNOWN LIMITATION: in-memory state is per Worker instance. Cloudflare
 * Workers run in many isolates across many machines; this rate limit will
 * not coordinate across instances. It provides a reasonable best-effort
 * defence for local dev and single-instance scenarios. A distributed
 * solution (e.g. Cloudflare KV or Durable Objects) is deferred to a
 * later milestone.
 *
 * The bucket store is injectable: pass a fresh Map in tests so each test
 * starts with a clean slate -- no shared module-level state to reset.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../index'

type BucketEntry = {
  count: number
  windowStart: number
}

export type BucketStore = Map<string, BucketEntry>

/**
 * Create a rate-limit middleware bound to the given bucket store.
 *
 * Production: call with no args -- uses a long-lived singleton store.
 * Tests: pass a fresh `new Map()` per test app so state never leaks.
 */
export function createRateLimitMiddleware(store: BucketStore = new Map()) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const { max, windowMs } = c.var.rateLimitConfig
    const now = Date.now()

    // Prefer the real client IP from CF headers, fall back to a placeholder.
    const ip =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
      'unknown'

    const entry = store.get(ip)

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now })
      await next()
      return
    }

    if (entry.count >= max) {
      return c.json(
        {
          error: 'Too many requests. Please wait before trying again.',
          retryAfterMs: windowMs - (now - entry.windowStart),
        },
        429
      )
    }

    entry.count++
    await next()
  })
}
