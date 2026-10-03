import { getResourceRecord, deleteResourceRecord } from '../../../utils/resource-store'
import { requireSession } from '../../../utils/auth/session'
import { deleteResourceAssets } from '../../../utils/resource-files'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const raw = getRouterParam(event, 'id')
  const slug = String(raw ?? '').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const record = await getResourceRecord(event, slug)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })

  const isOwner = record.ownerUsername && record.ownerUsername === session.username
  const isAdmin = session.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'You can only delete your own resources' })
  }

  await deleteResourceAssets(event, slug, { storageKey: record.storageKey || undefined })
  await deleteResourceRecord(event, slug)

  return { ok: true }
})