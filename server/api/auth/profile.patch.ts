import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  LINK_MAX_COUNT,
  LINK_LABEL_MAX_LENGTH,
  LINK_URL_MAX_LENGTH,
  normalizeDisplayName,
  type UserLink
} from '~~/shared/user'
import { requireSession } from '../../utils/auth/session'
import { getUser, putUser, isDisplayNameTaken } from '../../utils/auth/users'

const HTML_TAG_RE = /<[^>]*>/g

function sanitize(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(HTML_TAG_RE, '').trim().replace(/\s+/g, ' ').slice(0, max)
}

function sanitizeBio(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(HTML_TAG_RE, '').trim().slice(0, max)
}

function sanitizeLinks(raw: unknown): UserLink[] {
  if (!Array.isArray(raw)) return []
  const links: UserLink[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const label = sanitize((item as { label?: unknown }).label, LINK_LABEL_MAX_LENGTH)
    const url = sanitize((item as { url?: unknown }).url, LINK_URL_MAX_LENGTH)
    if (!label || !url) continue
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') continue
    } catch { continue }
    links.push({ label, url })
    if (links.length >= LINK_MAX_COUNT) break
  }
  return links
}

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const user = await getUser(event, session.username)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const body = await readBody<{ displayName?: unknown; bio?: unknown; links?: unknown }>(event)

  const rawDisplayName = sanitize(body?.displayName, DISPLAY_NAME_MAX_LENGTH)
  const displayName = rawDisplayName || user.username

  const normalizedNext = normalizeDisplayName(displayName)
  const normalizedCurrent = normalizeDisplayName(user.displayName)

  if (normalizedNext !== normalizedCurrent) {
    const taken = await isDisplayNameTaken(event, displayName, user.username)
    if (taken) {
      throw createError({ statusCode: 409, statusMessage: 'That display name is already in use.' })
    }
  }

  const bio = sanitizeBio(body?.bio, BIO_MAX_LENGTH)
  const links = sanitizeLinks(body?.links ?? user.links)

  await putUser(event, {
    ...user,
    displayName,
    bio,
    links,
    updatedAt: new Date().toISOString()
  })

  return { ok: true, displayName }
})