import { requireAdminSession } from '../../../utils/auth/session'
import { revokeInvite } from '../../../utils/auth/invites'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const hash = String(getRouterParam(event, 'hash') ?? '')
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invite identifier' })
  }
  const ok = await revokeInvite(event, hash)
  if (!ok) throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  return { ok: true }
})