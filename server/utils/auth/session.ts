import type { H3Event } from 'h3'
import type { UserRole } from '~~/shared/user'
import { getKV } from '../storage'

export const SESSION_TTL_DEFAULT_SECONDS = 60 * 60 * 8
export const SESSION_TTL_REMEMBER_SECONDS = 60 * 60 * 24 * 30
const SESSION_COOKIE = 'yr_session'
const SESSION_PREFIX = 'yr_s_'

export interface SessionRecord {
  username: string
  role: UserRole
  createdAt: string
  lastSeenAt: string
  userAgent: string
  rememberMe: boolean
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return SESSION_PREFIX + b64
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i]!.toString(16).padStart(2, '0')
  return hex
}

export interface CreateSessionOptions {
  rememberMe?: boolean
}

export async function createSession(
  event: H3Event,
  username: string,
  role: UserRole,
  options: CreateSessionOptions = {}
): Promise<void> {
  const kv = getKV(event)
  const token = generateToken()
  const hash = await hashToken(token)
  const now = new Date().toISOString()
  const userAgent = (getRequestHeader(event, 'user-agent') ?? '').slice(0, 200)
  const rememberMe = options.rememberMe === true
  const ttl = rememberMe ? SESSION_TTL_REMEMBER_SECONDS : SESSION_TTL_DEFAULT_SECONDS

  const record: SessionRecord = {
    username,
    role,
    createdAt: now,
    lastSeenAt: now,
    userAgent,
    rememberMe
  }

  await kv.set(`session:${hash}`, record, { ttl })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttl
  })
}

export async function readSession(event: H3Event): Promise<SessionRecord | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token || !token.startsWith(SESSION_PREFIX)) return null
  const hash = await hashToken(token)
  const kv = getKV(event)
  return await kv.get<SessionRecord>(`session:${hash}`)
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token && token.startsWith(SESSION_PREFIX)) {
    const hash = await hashToken(token)
    const kv = getKV(event)
    await kv.delete(`session:${hash}`)
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function requireSession(event: H3Event): Promise<SessionRecord> {
  const session = await readSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  return session
}

export async function requireAdminSession(event: H3Event): Promise<SessionRecord> {
  const session = await requireSession(event)
  if (session.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  return session
}