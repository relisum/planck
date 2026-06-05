import Redis from 'ioredis'

let _redis: Redis | null = null

export function getRedis() {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
    })
  }
  return _redis
}