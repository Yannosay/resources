import { getResourceRecord, putResourceRecord } from '../../../../utils/resource-store'
import { requireSession } from '../../../../utils/auth/session'
import { getStorage } from '../../../../utils/storage'
import { buildZipStream, readManifest } from '../../../../utils/resource-files'

async function trySession(event: Parameters<typeof requireSession>[0]) {
  try { return await requireSession(event) } catch { return null }
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug')
  const slug = String(raw ?? '').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const record = await getResourceRecord(event, slug)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })

  const session = await trySession(event)
  const isMember = Boolean(session)
  const isOwner = Boolean(session && record.ownerUsername && session.username === record.ownerUsername)
  const isAdmin = Boolean(session && session.role === 'admin')

  if (record.visibility === 'closed' && !(isOwner || isAdmin)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }
  if (record.status !== 'published' && !(isOwner || isAdmin)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  const storage = getStorage(event)
  const query = getQuery(event)
  const inline = query.inline === '1'
  const fileQuery = typeof query.file === 'string' ? query.file : undefined

  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  if (record.assetPrefix) {
    const manifest = await readManifest(event, slug)

    if (fileQuery !== undefined) {
      const idx = Number.parseInt(fileQuery, 10)
      if (!Number.isFinite(idx) || idx < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid file index' })
      }
      const meta = manifest?.files.find(f => f.index === idx)
      const key = meta?.key ?? (idx === 0 ? record.primaryFileKey : '')
      if (!key) throw createError({ statusCode: 404, statusMessage: 'File not found' })
      const object = await storage.get(key)
      if (!object) throw createError({ statusCode: 404, statusMessage: 'File not found' })

      const filename = meta?.originalPath ?? record.originalFilename ?? slug
      const mimeType = meta?.mimeType ?? object.contentType
      setHeader(event, 'Content-Type', mimeType)
      setHeader(event, 'Content-Length', Number(object.size))
      const disposition = inline ? 'inline' : 'attachment'
      setHeader(event, 'Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`)
      return object.body
    }

    const isMulti = record.fileCount > 1 || manifest?.files.length && manifest.files.length > 1

    if (!isMulti) {
      const key = manifest?.files[0]?.key ?? record.primaryFileKey
      if (!key) throw createError({ statusCode: 404, statusMessage: 'File not found' })
      const object = await storage.get(key)
      if (!object) throw createError({ statusCode: 404, statusMessage: 'File not found' })

      const filename = manifest?.files[0]?.originalPath ?? record.originalFilename ?? slug
      const mimeType = manifest?.files[0]?.mimeType ?? object.contentType
      setHeader(event, 'Content-Type', mimeType)
      setHeader(event, 'Content-Length', Number(object.size))
      const disposition = inline ? 'inline' : 'attachment'
      setHeader(event, 'Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`)

      if (record.visibility === 'general') {
        void putResourceRecord(event, { ...record, downloads: record.downloads + 1 }).catch(() => void 0)
      }

      return object.body
    }

    const files = manifest?.files ?? []
    if (files.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Resource is empty' })
    }

    setHeader(event, 'Content-Type', 'application/zip')
    setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(slug)}.zip"`)
    setHeader(event, 'Cache-Control', 'private, no-store')

    if (record.visibility === 'general') {
      void putResourceRecord(event, { ...record, downloads: record.downloads + 1 }).catch(() => void 0)
    }

    return buildZipStream(storage, files, slug)
  }

  if (!record.storageKey) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const object = await storage.get(record.storageKey)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  setHeader(event, 'Content-Type', record.mimeType || object.contentType)
  setHeader(event, 'Content-Length', Number(object.size))
  const disposition = inline ? 'inline' : 'attachment'
  const filename = record.originalFilename || `${slug}.${record.extension || 'bin'}`
  setHeader(event, 'Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`)

  if (record.visibility === 'general') {
    void putResourceRecord(event, { ...record, downloads: record.downloads + 1 }).catch(() => void 0)
  }

  return object.body
})