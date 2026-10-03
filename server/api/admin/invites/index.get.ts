import { requireAdminSession } from '../../../utils/auth/session'
import { listInvites } from '../../../utils/auth/invites'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const invites = await listInvites(event)
  return {
    invites: invites.map(invite => ({
      hash: invite.hash,
      role: invite.role,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      usesRemaining: invite.usesRemaining,
      totalUses: invite.totalUses,
      note: invite.note,
      consumedBy: invite.consumedBy,
      revoked: invite.revoked
    }))
  }
})