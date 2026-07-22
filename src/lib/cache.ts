import NodeCache from 'node-cache'
import { Redis } from '@upstash/redis'

// Cache driver selection:
//   CACHE_DRIVER=redis   → always use Upstash Redis (fail fast if missing)
//   CACHE_DRIVER=memory  → always use node-cache
//   unset / auto         → auto-detect: Redis if env vars present, else node-cache
const CACHE_DRIVER = (process.env.CACHE_DRIVER || 'auto').toLowerCase()
const DEFAULT_TTL = 600 // 10 minutes

// Local in-memory fallback
const nodeCache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: 120 })

// Upstash Redis for Serverless (Vercel)
let redis: Redis | null = null;
const hasRedisEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

if (CACHE_DRIVER === 'redis' && !hasRedisEnv) {
  console.error('CACHE_DRIVER=redis but UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Caching will be disabled.')
} else if (CACHE_DRIVER === 'redis' || (CACHE_DRIVER === 'auto' && hasRedisEnv)) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

const globalCache = {
  get: async (key: string) => {
    if (redis) {
      try {
        const val = await redis.get(key)
        if (val === null) return null
        // FIX: Handle both string and object responses from Redis
        try { return JSON.parse(val as string) } catch { return val }
      } catch (e) {
        console.warn('Redis get failed, falling back to node-cache', e)
      }
    }
    return nodeCache.get(key)
  },
  set: async (key: string, value: any, ttlSeconds: number = DEFAULT_TTL) => {
    // FIX: Serialize objects before storing in Redis
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    if (redis) {
      try {
        await redis.set(key, serialized, { ex: ttlSeconds })
        return true
      } catch (e) {
        console.warn('Redis set failed, falling back to node-cache', e)
      }
    }
    return nodeCache.set(key, value, ttlSeconds)
  },
  del: async (key: string) => {
    if (redis) {
      try {
        await redis.del(key)
      } catch (e) {
        console.warn('Redis del failed', e)
      }
    }
    nodeCache.del(key)
  }
}

export default globalCache