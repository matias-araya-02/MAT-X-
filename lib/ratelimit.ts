import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Si Upstash no está configurado, usamos un mock que siempre permite
function createRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Mock para desarrollo sin Upstash
    return {
      limit: async (_key: string) => ({ success: true, limit: 5, remaining: 5, reset: 0 }),
    }
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
    prefix: 'mat-x:ratelimit',
  })
}

export const ratelimit = createRatelimit()
