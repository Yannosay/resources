import { getResourceRecord } from '../../../../utils/resource-store'
import { requireSession } from '../../../../utils/auth/session'
import { getStorage } from '../../../../utils/storage'

async function trySession(event: Parameters<typeof requireSession>[0]) {
  try { return await requireSession(event) } catch { return null }
}

const MAX_BYTES = 524288

function languageFromExtension(ext: string): string | undefined {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    vue: 'vue', rs: 'rust', py: 'python', go: 'go', java: 'java',
    kt: 'kotlin', cs: 'csharp', cpp: 'cpp', c: 'c', h: 'c',
    rb: 'ruby', php: 'php', swift: 'swift', sh: 'shell', ps1: 'powershell',
    sql: 'sql', json: 'json', toml: 'toml', yaml: 'yaml', yml: 'yaml',
    md: 'markdown', html: 'html', css: 'css', scss: 'scss', xml: 'xml',
    sinth: 'sinth'
  }
  return map[ext]
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
  const isOwner = Boolean(session && record.ownerUsername && session.username === record.ownerUsername)
  const isAdmin = Boolean(session && session.role === 'admin')

  if (record.visibility === 'closed' && !(isOwner || isAdmin)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }
  if (record.status !== 'published' && !(isOwner || isAdmin)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  const key = record.primaryFileKey || record.storageKey
  if (!key) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  const storage = getStorage(event)
  const object = await storage.get(key)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  if (object.size > MAX_BYTES) {
    return { text: '', truncated: true, language: languageFromExtension(record.extension) }
  }

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

  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  const truncated = object.size > MAX_BYTES

  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300')
  return {
    text: truncated ? text.slice(0, MAX_BYTES) : text,
    truncated,
    language: languageFromExtension(record.extension)
  }
})