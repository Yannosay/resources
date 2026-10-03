import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '#shared/user'
import { requireSession } from '../../utils/auth/session'
import { getUser, putUser } from '../../utils/auth/users'
import { hashPassword, verifyPassword } from '../../utils/auth/password'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const user = await getUser(event, session.username)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const body = await readBody<{ currentPassword?: unknown; newPassword?: unknown }>(event)
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 422, statusMessage: 'Both passwords required' })
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH || newPassword.length > PASSWORD_MAX_LENGTH) {
    throw createError({ statusCode: 422, statusMessage: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters` })
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })

  const passwordHash = await hashPassword(newPassword)
  await putUser(event, { ...user, passwordHash, updatedAt: new Date().toISOString() })

  return { ok: true }
})