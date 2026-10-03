import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import {
  CATEGORY_DEFS,
  RESOURCE_CATEGORIES,
  RESOURCE_LICENSES,
  RESOURCE_STATUSES,
  RESOURCE_VISIBILITIES
} from '~~/shared/resource'

const BLOCKED_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'application/x-httpd-php',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-bat',
  'application/x-executable',
  'application/vnd.microsoft.portable-executable'
])

const HTML_TAG_RE = /<[^>]*>/g
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/
const LANGUAGE_RE = /^[a-z0-9+#-]{1,32}$/i
const URL_RE = /^https?:\/\//i

export function validateCategory(value: unknown): ResourceCategory {
  if (typeof value !== 'string' || !(RESOURCE_CATEGORIES as readonly string[]).includes(value)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid category' })
  }
  return value as ResourceCategory
}

export function validateVisibility(value: unknown): ResourceVisibility {
  if (typeof value !== 'string' || !(RESOURCE_VISIBILITIES as readonly string[]).includes(value)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid visibility' })
  }
  return value as ResourceVisibility
}

export function validateStatus(value: unknown): ResourceStatus {
  if (typeof value !== 'string' || !(RESOURCE_STATUSES as readonly string[]).includes(value)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid status' })
  }
  return value as ResourceStatus
}

export function validateLicense(value: unknown): string {
  if (typeof value !== 'string' || !(RESOURCE_LICENSES as readonly string[]).includes(value)) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid license' })
  }
  return value
}

export function validateMimeType(value: string): string {
  const lower = value.toLowerCase().split(';')[0]?.trim() ?? 'application/octet-stream'
  if (BLOCKED_MIME_TYPES.has(lower)) return 'application/octet-stream'
  return lower
}

export function validateMetadata(category: ResourceCategory, raw: unknown): Record<string, string | number> {
  const def = CATEGORY_DEFS[category]
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const out: Record<string, string | number> = {}

  for (const field of def.fields) {
    const value = input[field.key]
    if (value === undefined || value === null || value === '') continue

    if (field.kind === 'number') {
      const num = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(num)) continue
      const floored = Math.floor(num)
      if (field.min !== undefined && floored < field.min) continue
      if (field.max !== undefined && floored > field.max) continue
      out[field.key] = floored
      continue
    }

    if (typeof value !== 'string') continue
    const trimmed = value.replace(HTML_TAG_RE, '').trim().slice(0, field.maxLength ?? 500)
    if (!trimmed) continue

    if (field.kind === 'hex-color' && !HEX_COLOR_RE.test(trimmed)) continue
    if (field.kind === 'language' && !LANGUAGE_RE.test(trimmed)) continue
    if (field.kind === 'url' && !URL_RE.test(trimmed)) continue

    out[field.key] = trimmed
  }

  return out
}