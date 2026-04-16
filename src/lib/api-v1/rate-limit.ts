const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 100

const store = new Map<string, number[]>()

export function rateLimit(apiKeyId: string) {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  let timestamps = store.get(apiKeyId) ?? []
  timestamps = timestamps.filter((t) => t > windowStart)
  timestamps.push(now)
  store.set(apiKeyId, timestamps)

  const count = timestamps.length
  const resetAt = timestamps[0] + WINDOW_MS
  const remaining = Math.max(0, MAX_REQUESTS - count)
  const limited = count > MAX_REQUESTS

  return { limited, remaining, resetAt }
}
