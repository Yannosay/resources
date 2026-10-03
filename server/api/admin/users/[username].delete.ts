import { requireAdminSession } from '../../../utils/auth/session'
import { deleteUser, getUser } from '../../../utils/auth/users'

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)
  const username = String(getRouterParam(event, 'username') ?? '').toLowerCase()
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid username' })
  }
  if (username === session.username) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete own account' })
  }

  const user = await getUser(event, username)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  await deleteUser(event, username)
  return { ok: true }
})