import { isValidRole } from '#shared/user'
import { requireAdminSession } from '../../../utils/auth/session'
import { createInvite } from '../../../utils/auth/invites'

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)

  const body = await readBody<{ role?: unknown; ttlSeconds?: unknown; uses?: unknown; note?: unknown }>(event)

  const role = isValidRole(body?.role) ? body.role : 'member'
  const ttlSeconds = typeof body?.ttlSeconds === 'number' ? body.ttlSeconds : 900
  const uses = typeof body?.uses === 'number' ? body.uses : 1
  const note = typeof body?.note === 'string' ? body.note : ''

  const result = await createInvite(event, {
    role,
    ttlSeconds,
    uses,
    note,
    createdBy: session.username
  })

  return {
    ok: true,
    token: result.token,
    hash: result.hash,
    role: result.record.role,
    expiresAt: result.record.expiresAt,
    uses: result.record.totalUses
  }
})