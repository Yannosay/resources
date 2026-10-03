import { isValidRole } from '#shared/user'
import { requireAdminSession } from '../../../utils/auth/session'
import { getUser, putUser } from '../../../utils/auth/users'

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)
  const username = String(getRouterParam(event, 'username') ?? '').toLowerCase()
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid username' })
  }

  const target = await getUser(event, username)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const body = await readBody<{ role?: unknown; disabled?: unknown }>(event)

  if (username === session.username) {
    if (isValidRole(body?.role) && body.role !== target.role) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot change own role' })
    }
    if (body?.disabled === true) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot disable own account' })
    }
  }

  const nextRole = isValidRole(body?.role) ? body.role : target.role
  const nextDisabled = typeof body?.disabled === 'boolean' ? body.disabled : target.disabled

  await putUser(event, {
    ...target,
    role: nextRole,
    disabled: nextDisabled,
    updatedAt: new Date().toISOString()
  })

  return { ok: true }
})