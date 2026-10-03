const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/ogg': 'ogv',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/gzip': 'gz',
  'application/json': 'json',
  'application/xml': 'xml',
  'application/javascript': 'js',
  'application/typescript': 'ts',
  'application/wasm': 'wasm',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
  'text/css': 'css',
  'text/javascript': 'js',
  'text/csv': 'csv',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
  'font/woff': 'woff',
  'font/woff2': 'woff2',
  'application/font-woff': 'woff',
  'application/font-woff2': 'woff2',
  'application/x-font-ttf': 'ttf',
  'application/x-font-otf': 'otf'
}

export function extensionFromMime(mime: string): string {
  const lower = (mime || '').toLowerCase().split(';')[0]?.trim() ?? ''
  return MIME_EXTENSION_MAP[lower] ?? 'bin'
}

export function extractExtension(filename: string): string {
  if (!filename) return ''
  const dot = filename.lastIndexOf('.')
  if (dot === -1 || dot === filename.length - 1) return ''
  const ext = filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!ext || ext.length > 8) return ''
  return ext
}