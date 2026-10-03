const IMAGE_MAGIC: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }
]

export function detectImageMime(bytes: Uint8Array): string | null {
  for (const entry of IMAGE_MAGIC) {
    if (bytes.length < entry.bytes.length) continue
    let matches = true
    for (let i = 0; i < entry.bytes.length; i += 1) {
      if (bytes[i] !== entry.bytes[i]) { matches = false; break }
    }
    if (matches) return entry.mime
  }
  if (bytes.length >= 12) {
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp'
    }
  }
  return null
}