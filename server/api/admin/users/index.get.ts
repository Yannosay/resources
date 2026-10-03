import { requireAdminSession } from '../../../utils/auth/session'
import { listUsers } from '../../../utils/auth/users'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const users = await listUsers(event)
  return {
    users: users.map(user => ({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      disabled: user.disabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      avatarUrl: user.avatarKey ? `/api/public/users/${user.username}/avatar` : null
    }))
  }
})