import { getStorage } from '../../../utils/storage'
import { getResourceRecord, putResourceRecord, type ResourceRecord } from '../../../utils/resource-store'
import { requireSession } from '../../../utils/auth/session'
import { sanitizePlain, sanitizeMultiline, sanitizeSlug, parseTagString } from '../../../utils/text'
import {
  validateCategory,
  validateVisibility,
  validateStatus,
  validateLicense,
  validateMimeType,
  validateMetadata
} from '../../../utils/validation'
import { extensionFromMime } from '../../../utils/mime'
import {
  assetPrefixFor,
  coverKeyFor,
  extensionOf,
  fileKeyFor,
  sanitizeRelativePath,
  shouldDeflate,
  writeManifest,
  type ManifestFile,
  type UploadKind
} from '../../../utils/resource-files'
import { CATEGORY_DEFS } from '~~/shared/resource'

const MAX_FILE_BYTES = 26214400
const MAX_TOTAL_BYTES = 104857600
const MAX_FILES = 500

interface PendingFile {
  data: Uint8Array
  originalPath: string
  mimeType: string
}

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Empty form submission' })
  }

  const pending: PendingFile[] = []
  let coverData: Uint8Array | null = null
  let coverName = ''
  let coverMime = ''
  const fields: Record<string, string> = {}

  for (const part of parts) {
    if (!part.name) continue

    if (part.name === 'files' && part.filename) {
      if (!part.data || part.data.byteLength === 0) continue
      if (part.data.byteLength > MAX_FILE_BYTES) {
        throw createError({
          statusCode: 413,
          statusMessage: `File "${part.filename}" exceeds the 25 MB per-file limit`
        })
      }
      const originalPath = sanitizeRelativePath(part.filename)
      const mimeType = validateMimeType(part.type || 'application/octet-stream')
      pending.push({ data: new Uint8Array(part.data), originalPath, mimeType })
      continue
    }

    if (part.name === 'cover' && part.filename) {
      if (!part.data || part.data.byteLength === 0) continue
      if (part.data.byteLength > MAX_FILE_BYTES) {
        throw createError({ statusCode: 413, statusMessage: 'Cover exceeds the 25 MB limit' })
      }
      coverData = new Uint8Array(part.data)
      coverName = sanitizeRelativePath(part.filename)
      coverMime = validateMimeType(part.type || 'image/png')
      continue
    }

    if (part.data) {
      fields[part.name] = part.data.toString('utf-8')
    }
  }

  if (pending.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'At least one file is required' })
  }
  if (pending.length > MAX_FILES) {
    throw createError({ statusCode: 422, statusMessage: `At most ${MAX_FILES} files per resource` })
  }

  const totalBytes = pending.reduce((acc, f) => acc + f.data.byteLength, 0)
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Total upload exceeds the 100 MB limit' })
  }

  const slug = sanitizeSlug(fields.slug)
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Invalid slug' })

  const existing = await getResourceRecord(event, slug)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Slug already in use' })
  }

  const title = sanitizePlain(fields.title, 200)
  if (!title) throw createError({ statusCode: 422, statusMessage: 'Title is required' })

  const description = sanitizeMultiline(fields.description ?? '', 2000)
  const attribution = sanitizeMultiline(fields.attribution ?? '', 1000)
  const category = validateCategory(fields.category)
  const visibility = validateVisibility(fields.visibility)
  const status = validateStatus(fields.status)
  const license = validateLicense(fields.license)
  const tags = parseTagString(fields.tags ?? '')

  const categoryDef = CATEGORY_DEFS[category]
  const accepted = categoryDef.upload.accept.filter(ext => ext !== '*')
  if (accepted.length > 0) {
    const rejected = pending.filter(f => {
      const ext = extensionOf(f.originalPath)
      return !accepted.includes(`.${ext}`)
    })
    if (rejected.length > 0) {
      const sample = rejected.slice(0, 3).map(r => r.originalPath).join(', ')
      throw createError({
        statusCode: 422,
        statusMessage: `Files do not match the "${categoryDef.label}" category: ${sample}`
      })
    }
  }

  if (categoryDef.upload.kind === 'single-file' && pending.length > 1) {
    throw createError({ statusCode: 422, statusMessage: 'This category accepts a single file only' })
  }

  let rawMetadata: unknown = {}
  if (fields.metadata) {
    try { rawMetadata = JSON.parse(fields.metadata) } catch {
      throw createError({ statusCode: 422, statusMessage: 'Malformed metadata payload' })
    }
  }
  const metadata = validateMetadata(category, rawMetadata)

  const storage = getStorage(event)
  const manifestFiles: ManifestFile[] = []

  try {
    for (const [i, item] of pending.entries()) {
      const key = fileKeyFor(slug, i, item.originalPath)
      await storage.put(key, item.data, item.mimeType)
      manifestFiles.push({
        index: i,
        key,
        originalPath: item.originalPath,
        size: item.data.byteLength,
        mimeType: item.mimeType,
        extension: extensionOf(item.originalPath) || extensionFromMime(item.mimeType)
      })
    }

    let coverKey: string | null = null
    let coverMimeStored: string | null = null
    if (coverData && coverName) {
      coverKey = coverKeyFor(slug, coverName)
      coverMimeStored = coverMime
      await storage.put(coverKey, coverData, coverMime)
    }

    const inferredKind: UploadKind = pending.length === 1
      ? (categoryDef.upload.kind === 'folder-or-file' ? 'folder-or-file' : categoryDef.upload.kind)
      : 'multi-file'

    const now = new Date().toISOString()
    await writeManifest(event, {
      version: 1,
      slug,
      uploadKind: inferredKind,
      primaryIndex: 0,
      coverKey,
      coverMimeType: coverMimeStored,
      files: manifestFiles,
      totalSize: totalBytes,
      createdAt: now
    })

    const primary = manifestFiles[0]
    if (!primary) {
      throw createError({ statusCode: 500, statusMessage: 'No files were stored for this resource' })
    }

    const record: ResourceRecord = {
      slug,
      title,
      description,
      category,
      visibility,
      status,
      license,
      tags,
      attribution,
      metadata,
      size: totalBytes,
      fileCount: manifestFiles.length,
      uploadKind: inferredKind,
      mimeType: primary.mimeType,
      extension: primary.extension,
      originalFilename: primary.originalPath,
      primaryFileKey: primary.key,
      coverKey,
      coverMimeType: coverMimeStored,
      assetPrefix: assetPrefixFor(slug),
      storageKey: '',
      ownerUsername: session.username,
      downloads: 0,
      uploadedAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null
    }

    await putResourceRecord(event, record)
  } catch (err) {
    for (const f of manifestFiles) {
      try { await storage.delete(f.key) } catch { void 0 }
    }
    if (coverData && coverName) {
      try { await storage.delete(coverKeyFor(slug, coverName)) } catch { void 0 }
    }
    throw err
  }

  return { ok: true, slug }
})