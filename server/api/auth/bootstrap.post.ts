import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, isValidUsername } from '#shared/user'
import { isBootstrapAvailable, verifyBootstrapToken, markBootstrapConsumed } from '../../utils/auth/bootstrap'
import { hashPassword } from '../../utils/auth/password'
import { createSession } from '../../utils/auth/session'
import { getUser, putUser, toSessionUser, type UserRecord } from '../../utils/auth/users'

export default defineEventHandler(async (event) => {
  if (!await isBootstrapAvailable(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Bootstrap not available' })
  }

  const body = await readBody<{ token?: unknown; username?: unknown; password?: unknown }>(event)
  const token = typeof body?.token === 'string' ? body.token : ''
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!verifyBootstrapToken(event, token)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid bootstrap token' })
  }
  if (!isValidUsername(username)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid username' })
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw createError({ statusCode: 422, statusMessage: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters` })
  }

  const existing = await getUser(event, username)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Username already taken' })

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  const user: UserRecord = {
    username,
    displayName: username,
    bio: '',
    links: [],
    role: 'admin',
    passwordHash,
    avatarKey: null,
    avatarMimeType: null,
    bannerKey: null,
    bannerMimeType: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    disabled: false,
    createdViaInvite: null
  }

  await putUser(event, user)
  await markBootstrapConsumed(event)
  await createSession(event, username, 'admin')

  return { ok: true, user: toSessionUser(user) }
})