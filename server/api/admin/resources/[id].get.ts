import { getResourceRecord } from '../../../utils/resource-store'
import { getUser } from '../../../utils/auth/users'
import { requireSession } from '../../../utils/auth/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const raw = getRouterParam(event, 'id')
  const slug = String(raw ?? '').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const record = await getResourceRecord(event, slug)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })

  const isOwner = record.ownerUsername === session.username
  const isAdmin = session.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'You can only edit your own resources' })
  }

  let ownerDisplayName = record.ownerUsername || 'Unknown'
  let ownerHasAvatar = false
  if (record.ownerUsername) {
    const owner = await getUser(event, record.ownerUsername)
    if (owner) {
      ownerDisplayName = owner.displayName
      ownerHasAvatar = owner.avatarKey !== null
    }
  }

  return {
    ...record,
    ownerDisplayName,
    ownerHasAvatar
  }
})