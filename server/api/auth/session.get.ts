import { readSession } from '../../utils/auth/session'
import { getUser, toSessionUser } from '../../utils/auth/users'

export default defineEventHandler(async (event) => {
  try {
    const session = await readSession(event)
    if (!session) return { authenticated: false }

    const user = await getUser(event, session.username)
    if (!user || user.disabled) return { authenticated: false }

    return { authenticated: true, user: toSessionUser(user) }
  } catch {
    return { authenticated: false }
  }
})