import { destroySession } from '../../utils/auth/session'

export default defineEventHandler(async (event) => {
  await destroySession(event)
  return { ok: true }
})