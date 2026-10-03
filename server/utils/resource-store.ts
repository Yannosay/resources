import type { H3Event } from 'h3'
import type {
  ResourceCategory,
  ResourceStatus,
  ResourceVisibility
} from '~~/shared/resource'
import {
  isResourceCategory,
  isResourceStatus,
  isResourceVisibility
} from '~~/shared/resource'
import { getKV } from './storage'

export interface ResourceRecord {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  visibility: ResourceVisibility
  status: ResourceStatus
  license: string
  tags: string[]
  attribution: string
  metadata: Record<string, string | number>

  size: number
  fileCount: number
  uploadKind: string

  mimeType: string
  extension: string
  originalFilename: string
  primaryFileKey: string

  coverKey: string | null
  coverMimeType: string | null

  assetPrefix: string
  storageKey: string

  ownerUsername: string
  downloads: number
  uploadedAt: string
  updatedAt: string
  publishedAt: string | null
}

export function normalizeRecord(raw: unknown): ResourceRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Partial<ResourceRecord> & Record<string, unknown>
  if (typeof input.slug !== 'string' || !/^[a-z0-9-]{1,64}$/.test(input.slug)) return null

  const uploadedAt = typeof input.uploadedAt === 'string' ? input.uploadedAt : new Date().toISOString()
  const status: ResourceStatus = isResourceStatus(input.status) ? input.status : 'published'
  const publishedAt =
    typeof input.publishedAt === 'string'
      ? input.publishedAt
      : status === 'draft'
        ? null
        : uploadedAt

  const legacyStorageKey = typeof input.storageKey === 'string' ? input.storageKey : ''
  const assetPrefix = typeof input.assetPrefix === 'string' && input.assetPrefix.length > 0
    ? input.assetPrefix
    : (legacyStorageKey ? '' : `resources/${input.slug}`)

  const primaryFileKey = typeof input.primaryFileKey === 'string' && input.primaryFileKey.length > 0
    ? input.primaryFileKey
    : legacyStorageKey

  const fileCount = Number.isFinite(Number(input.fileCount))
    ? Math.max(1, Math.floor(Number(input.fileCount)))
    : 1

  const uploadKind = typeof input.uploadKind === 'string' && input.uploadKind.length > 0
    ? input.uploadKind
    : 'single-file'

  const coverKey = typeof input.coverKey === 'string' && input.coverKey.length > 0
    ? input.coverKey
    : null

  const coverMimeType = typeof input.coverMimeType === 'string' && input.coverMimeType.length > 0
    ? input.coverMimeType
    : null

  return {
    slug: input.slug,
    title: typeof input.title === 'string' ? input.title.slice(0, 200) : '',
    description: typeof input.description === 'string' ? input.description.slice(0, 2000) : '',
    category: isResourceCategory(input.category) ? input.category : 'other',
    visibility: isResourceVisibility(input.visibility) ? input.visibility : 'general',
    status,
    license: typeof input.license === 'string' ? input.license : 'CC0 1.0',
    tags: Array.isArray(input.tags) ? input.tags.filter((t): t is string => typeof t === 'string').slice(0, 20) : [],
    attribution: typeof input.attribution === 'string' ? input.attribution.slice(0, 1000) : '',
    metadata: input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, string | number>)
      : {},
    size: Number.isFinite(Number(input.size)) ? Number(input.size) : 0,
    fileCount,
    uploadKind,
    mimeType: typeof input.mimeType === 'string' ? input.mimeType : 'application/octet-stream',
    extension: typeof input.extension === 'string' ? input.extension : '',
    originalFilename: typeof input.originalFilename === 'string' ? input.originalFilename : '',
    primaryFileKey,
    coverKey,
    coverMimeType,
    assetPrefix,
    storageKey: legacyStorageKey,
    ownerUsername: typeof input.ownerUsername === 'string' ? input.ownerUsername : '',
    downloads: Number.isFinite(Number(input.downloads)) ? Math.max(0, Math.floor(Number(input.downloads))) : 0,
    uploadedAt,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : uploadedAt,
    publishedAt
  }
}

export async function getResourceRecord(event: H3Event, slug: string): Promise<ResourceRecord | null> {
  const kv = getKV(event)
  const raw = await kv.get<unknown>(`resource:${slug}`)
  return normalizeRecord(raw)
}

export async function putResourceRecord(event: H3Event, record: ResourceRecord): Promise<void> {
  const kv = getKV(event)
  await kv.set(`resource:${record.slug}`, record)
}

export async function deleteResourceRecord(event: H3Event, slug: string): Promise<void> {
  const kv = getKV(event)
  await kv.delete(`resource:${slug}`)
}

export async function listResourceRecords(event: H3Event): Promise<ResourceRecord[]> {
  const kv = getKV(event)
  const keys = await kv.list('resource:')
  const records: ResourceRecord[] = []
  for (const key of keys) {
    const raw = await kv.get<unknown>(key)
    const normalized = normalizeRecord(raw)
    if (normalized) records.push(normalized)
  }
  return records
}