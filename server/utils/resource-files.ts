import type { H3Event } from 'h3'
import { getStorage, type StorageBackend } from './storage'

export type UploadKind = 'single-file' | 'multi-file' | 'folder' | 'folder-or-file'

export interface ManifestFile {
  index: number
  key: string
  originalPath: string
  size: number
  mimeType: string
  extension: string
}

export interface ResourceManifest {
  version: 1
  slug: string
  uploadKind: UploadKind
  primaryIndex: number
  coverKey: string | null
  coverMimeType: string | null
  files: ManifestFile[]
  totalSize: number
  createdAt: string
}

export const MANIFEST_FILENAME = 'manifest.json'

export function assetPrefixFor(slug: string): string {
  return `resources/${slug}`
}

export function manifestKeyFor(slug: string): string {
  return `${assetPrefixFor(slug)}/${MANIFEST_FILENAME}`
}

export function sanitizeSegment(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '')
  return (cleaned.slice(0, 180) || 'file')
}

export function sanitizeRelativePath(input: string): string {
  const parts = input
    .split(/[\\/]/)
    .filter(s => s.length > 0 && s !== '.' && s !== '..')
    .map(s => s.replace(/[<>:"|?*\u0000-\u001f]/g, '_').slice(0, 120))
  return (parts.join('/').slice(0, 400) || 'file')
}

export function fileKeyFor(slug: string, index: number, originalPath: string): string {
  const name = sanitizeSegment(originalPath)
  return `${assetPrefixFor(slug)}/files/${index}-${name}`
}

export function coverKeyFor(slug: string, originalName: string): string {
  const name = sanitizeSegment(originalName)
  return `${assetPrefixFor(slug)}/cover/${name}`
}

export function extensionOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,12})$/.exec(name)
  return m && m[1] ? m[1].toLowerCase() : ''
}

export function shouldDeflate(mimeType: string): boolean {
  const m = mimeType.toLowerCase()
  if (m.startsWith('text/')) return true
  if (m.startsWith('application/json')) return true
  if (m.startsWith('application/javascript')) return true
  if (m.startsWith('application/xml')) return true
  if (m === 'application/toml') return true
  if (m === 'application/x-yaml') return true
  if (m.startsWith('image/svg')) return true
  return false
}

export async function readManifest(event: H3Event, slug: string): Promise<ResourceManifest | null> {
  const storage = getStorage(event)
  const object = await storage.get(manifestKeyFor(slug))
  if (!object) return null
  const reader = object.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.byteLength
    }
  }
  const buffer = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    buffer.set(c, offset)
    offset += c.byteLength
  }
  try {
    const text = new TextDecoder('utf-8').decode(buffer)
    const parsed = JSON.parse(text) as ResourceManifest
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export async function writeManifest(event: H3Event, manifest: ResourceManifest): Promise<void> {
  const storage = getStorage(event)
  const bytes = new TextEncoder().encode(JSON.stringify(manifest))
  await storage.put(manifestKeyFor(manifest.slug), bytes, 'application/json')
}

export async function deleteResourceAssets(event: H3Event, slug: string, record?: { storageKey?: string }): Promise<void> {
  const storage = getStorage(event)
  const manifest = await readManifest(event, slug)
  if (manifest) {
    if (manifest.coverKey) {
      try { await storage.delete(manifest.coverKey) } catch { void 0 }
    }
    for (const f of manifest.files) {
      try { await storage.delete(f.key) } catch { void 0 }
    }
    try { await storage.delete(manifestKeyFor(slug)) } catch { void 0 }
  }
  if (record?.storageKey) {
    try { await storage.delete(record.storageKey) } catch { void 0 }
  }
}

export function buildZipStream(
  storage: StorageBackend,
  files: ManifestFile[],
  slug: string
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const { Zip, ZipDeflate, ZipPassThrough } = await import('fflate')
      const zip = new Zip((err, chunk, final) => {
        if (err) {
          controller.error(err)
          return
        }
        if (chunk) controller.enqueue(chunk)
        if (final) controller.close()
      })
      try {
        for (const f of files) {
          const object = await storage.get(f.key)
          if (!object) continue
          const entryName = f.originalPath || `${slug}-${f.index}`
          const entry = shouldDeflate(f.mimeType)
            ? new ZipDeflate(entryName, { level: 6 })
            : new ZipPassThrough(entryName)
          zip.add(entry)
          const reader = object.body.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) entry.push(value)
          }
          entry.push(new Uint8Array(0), true)
        }
        zip.end()
      } catch (err) {
        controller.error(err)
      }
    }
  })
}