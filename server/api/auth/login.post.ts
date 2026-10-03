import { USERNAME_PATTERN } from '~~/shared/user'
import { verifyPassword } from '../../utils/auth/password'
import { createSession } from '../../utils/auth/session'
import { getUser, putUser, toSessionUser } from '../../utils/auth/users'
import { getKV } from '../../utils/storage'

const WINDOW_SECONDS = 15 * 60
const MAX_IP_ATTEMPTS = 10
const MAX_USER_ATTEMPTS = 5

function getClientIp(event: Parameters<typeof getRequestHeader>[0]): string {
  const cf = getRequestHeader(event, 'cf-connecting-ip')
  if (cf) return cf
  const fwd = getRequestHeader(event, 'x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]
    if (first) return first.trim()
  }
  return 'unknown'
}

async function withinLimit(event: Parameters<typeof getKV>[0], key: string, max: number): Promise<boolean> {
  const kv = getKV(event)
  const record = await kv.get<{ count: number; firstAt: number }>(key)
  if (!record) return true
  if (Date.now() - record.firstAt >= WINDOW_SECONDS * 1000) return true
  return record.count < max
}

async function bumpFailure(event: Parameters<typeof getKV>[0], key: string): Promise<void> {
  const kv = getKV(event)
  const record = await kv.get<{ count: number; firstAt: number }>(key)
  const now = Date.now()
  if (!record || now - record.firstAt >= WINDOW_SECONDS * 1000) {
    await kv.set(key, { count: 1, firstAt: now }, { ttl: WINDOW_SECONDS })
  } else {
    await kv.set(key, { count: record.count + 1, firstAt: record.firstAt }, { ttl: WINDOW_SECONDS })
  }
}

async function clearLimit(event: Parameters<typeof getKV>[0], key: string): Promise<void> {
  const kv = getKV(event)
  await kv.delete(key)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: unknown; password?: unknown; rememberMe?: unknown }>(event)
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const rememberMe = body?.rememberMe === true

  const ip = getClientIp(event)
  const ipKey = `rl:login:ip:${ip}`
  const userKey = `rl:login:user:${username || 'unknown'}`

  if (!await withinLimit(event, ipKey, MAX_IP_ATTEMPTS)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts' })
  }
  if (username && !await withinLimit(event, userKey, MAX_USER_ATTEMPTS)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts' })
  }

  if (!USERNAME_PATTERN.test(username) || !password || password.length > 512) {
    await bumpFailure(event, ipKey)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const user = await getUser(event, username)
  if (!user || user.disabled) {
    await bumpFailure(event, ipKey)
    await bumpFailure(event, userKey)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    await bumpFailure(event, ipKey)
    await bumpFailure(event, userKey)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  await clearLimit(event, ipKey)
  await clearLimit(event, userKey)

  await createSession(event, user.username, user.role, { rememberMe })
  const now = new Date().toISOString()
  await putUser(event, { ...user, lastLoginAt: now, updatedAt: now })

  return { ok: true, user: toSessionUser(user) }
})