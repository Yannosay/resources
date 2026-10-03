const HTML_TAG_RE = /<[^>]*>/g
const WHITESPACE_RE = /\s+/g

export function sanitizePlain(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const stripped = value.replace(HTML_TAG_RE, '').replace(WHITESPACE_RE, ' ').trim()
  if (stripped.length === 0) return ''
  return stripped.slice(0, maxLength)
}

export function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const stripped = value.replace(HTML_TAG_RE, '').trim()
  if (stripped.length === 0) return ''
  return stripped.slice(0, maxLength)
}

export function sanitizeSlug(value: unknown): string {
  if (typeof value !== 'string') return ''
  const lower = value.toLowerCase().trim()
  if (!/^[a-z0-9-]{1,64}$/.test(lower)) return ''
  if (lower.startsWith('-') || lower.endsWith('-')) return ''
  if (lower.includes('--')) return ''
  return lower
}

export function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const tag = entry.replace(HTML_TAG_RE, '').trim().slice(0, 40)
    if (!tag) continue
    if (out.includes(tag)) continue
    out.push(tag)
    if (out.length >= 20) break
  }
  return out
}

export function parseTagString(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return sanitizeTags(value.split(','))
}