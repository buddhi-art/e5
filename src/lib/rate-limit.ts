import 'server-only'
import { Redis } from '@upstash/redis'

/**
 * Distributed fixed-window rate limiter.
 *
 * In serverless (Vercel), each function invocation may run in a fresh isolate,
 * so an in-memory `Map` provides effectively no protection. When Upstash Redis
 * env vars are present we use an atomic INCR + EXPIRE window shared across all
 * invocations. If Redis is not configured (local dev) we fall back to an
 * in-memory map so behavior is still sane on a single process.
 */

const hasRedisEnv = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis: Redis | null = hasRedisEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// In-memory fallback (single-process only)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Check and record a hit against a fixed window.
 *
 * @param identifier  Unique key for the caller (e.g. `login:user@x.com`, `ai:<userId>`)
 * @param limit       Max requests allowed within the window
 * @param windowMs    Window length in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000)

  if (redis) {
    try {
      const key = `ratelimit:${identifier}`
      const count = await redis.incr(key)
      // Set the expiry only on the first hit of a new window.
      if (count === 1) {
        await redis.expire(key, windowSeconds)
      }
      return { success: count <= limit, remaining: Math.max(0, limit - count) }
    } catch (e) {
      console.warn('Rate limit: Redis unavailable, falling back to memory', e)
      // fall through to in-memory
    }
  }

  const now = Date.now()
  const entry = memoryStore.get(identifier)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  entry.count++
  return { success: entry.count <= limit, remaining: Math.max(0, limit - entry.count) }
}
