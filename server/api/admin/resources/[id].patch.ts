import { getResourceRecord, putResourceRecord } from '../../../utils/resource-store'
import { requireSession } from '../../../utils/auth/session'
import { sanitizePlain, sanitizeMultiline, sanitizeTags } from '../../../utils/text'
import {
  validateVisibility,
  validateStatus,
  validateLicense,
  validateMetadata
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const raw = getRouterParam(event, 'id')
  const slug = String(raw ?? '').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const existing = await getResourceRecord(event, slug)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })

  const isOwner = existing.ownerUsername && existing.ownerUsername === session.username
  const isAdmin = session.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'You can only edit your own resources' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 422, statusMessage: 'Invalid body' })
  }

  const title = sanitizePlain(body.title ?? existing.title, 200)
  if (!title) throw createError({ statusCode: 422, statusMessage: 'Title is required' })

  const description = sanitizeMultiline(body.description ?? existing.description, 2000)
  const attribution = sanitizeMultiline(body.attribution ?? existing.attribution, 1000)
  const visibility = validateVisibility(body.visibility ?? existing.visibility)
  const status = validateStatus(body.status ?? existing.status)
  const license = validateLicense(body.license ?? existing.license)
  const tags = sanitizeTags(body.tags ?? existing.tags)
  const metadata = validateMetadata(existing.category, body.metadata ?? existing.metadata)

  const now = new Date().toISOString()
  const publishedAt =
    status === 'published'
      ? existing.publishedAt ?? now
      : status === 'draft'
        ? null
        : existing.publishedAt

  const updated = {
    ...existing,
    title,
    description,
    attribution,
    visibility,
    status,
    license,
    tags,
    metadata,
    updatedAt: now,
    publishedAt
  }

  await putResourceRecord(event, updated)

  return { ok: true }
})