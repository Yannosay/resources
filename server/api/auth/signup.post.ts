import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, isValidUsername } from '~~/shared/user'
import { isBootstrapAvailable, verifyBootstrapToken, markBootstrapConsumed } from '../../utils/auth/bootstrap'
import { redeemInvite } from '../../utils/auth/invites'
import { hashPassword } from '../../utils/auth/password'
import { createSession } from '../../utils/auth/session'
import { getUser, putUser, toSessionUser, type UserRecord } from '../../utils/auth/users'

const INVITE_PREFIX = 'yri_'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: unknown; username?: unknown; password?: unknown }>(event)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!token) throw createError({ statusCode: 422, statusMessage: 'Token required' })
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw createError({ statusCode: 422, statusMessage: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters` })
  }

  const isInviteToken = token.startsWith(INVITE_PREFIX)

  let isBootstrapFlow = false

  if (isInviteToken) {
    if (!isValidUsername(username)) {
      throw createError({ statusCode: 422, statusMessage: 'Invalid username' })
    }
  } else {
    if (!await isBootstrapAvailable(event)) {
      throw createError({ statusCode: 403, statusMessage: 'Bootstrap not available' })
    }
    if (!verifyBootstrapToken(event, token)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }
    if (!isValidUsername(username, { allowReserved: true })) {
      throw createError({ statusCode: 422, statusMessage: 'Invalid username format' })
    }
    isBootstrapFlow = true
  }

  const existing = await getUser(event, username)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Username already taken' })

  let role: 'admin' | 'member'

  if (isBootstrapFlow) {
    role = 'admin'
  } else {
    const result = await redeemInvite(event, token, username)
    if (!result.ok) throw createError({ statusCode: 401, statusMessage: result.reason })
    role = result.role
  }

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  const user: UserRecord = {
    username,
    displayName: username,
    bio: '',
    links: [],
    role,
    passwordHash,
    avatarKey: null,
    avatarMimeType: null,
    bannerKey: null,
    bannerMimeType: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    disabled: false,
    createdViaInvite: isInviteToken ? 'yes' : null
  }

  await putUser(event, user)

  if (isBootstrapFlow) {
    await markBootstrapConsumed(event)
  }

  await createSession(event, username, role)

  return { ok: true, user: toSessionUser(user) }
})