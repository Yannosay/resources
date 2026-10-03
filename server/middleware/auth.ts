import { readSession } from '../utils/auth/session'

const SESSION_FREE_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/signup',
  '/api/auth/bootstrap',
  '/api/auth/bootstrap-status',
  '/api/auth/bootstrap-reset'
])

const ADMIN_ONLY_PREFIXES = [
  '/api/admin/invites',
  '/api/admin/users'
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return

  const method = getMethod(event)
  const isMutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'

  if (isMutating && !url.pathname.startsWith('/api/public/')) {
    const origin = getRequestHeader(event, 'origin')
    const host = getRequestHeader(event, 'host')
    if (!origin) throw createError({ statusCode: 403, statusMessage: 'Origin header required' })
    let originHost: string
    try {
      originHost = new URL(origin).host
    } catch {
      throw createError({ statusCode: 403, statusMessage: 'Invalid origin' })
    }
    if (!host || originHost !== host) {
      throw createError({ statusCode: 403, statusMessage: 'Origin does not match host' })
    }
  }

  if (url.pathname.startsWith('/api/public/')) return
  if (SESSION_FREE_PATHS.has(url.pathname)) return

  const session = await readSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  for (const prefix of ADMIN_ONLY_PREFIXES) {
    if (url.pathname.startsWith(prefix) && session.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
    }
  }
})