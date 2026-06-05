import {getRedis} from "./redis";


const CHALLENGE_TTL = 60 * 5
const inMemory = new Map<string, string>()

export const challengeStore = {
  async get(key: string) {
    if (process.env.NODE_ENV === 'production') {
      return getRedis().get(key)
    }
    return inMemory.get(key) ?? null
  },
  async set(key: string, value: string) {
    if (process.env.NODE_ENV === 'production') {
      return getRedis().set(key, value, 'EX', CHALLENGE_TTL)
    }
    inMemory.set(key, value)
  },
  async del(key: string) {
    if (process.env.NODE_ENV === 'production') {
      return getRedis().del(key)
    }
    inMemory.delete(key)
  },
}