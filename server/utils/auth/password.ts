const PBKDF2_ITERATIONS = 100000
const PBKDF2_HASH = 'SHA-256'
const PBKDF2_KEY_BITS = 256
const SALT_BYTES = 16

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!
  return diff === 0
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: PBKDF2_HASH },
    key,
    PBKDF2_KEY_BITS
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)
  const derived = await derive(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4) return false
  const algo = parts[0]
  const iterStr = parts[1]
  const saltB64 = parts[2]
  const expectedB64 = parts[3]
  if (algo !== 'pbkdf2-sha256' || !iterStr || !saltB64 || !expectedB64) return false
  const iterations = Number(iterStr)
  if (!Number.isFinite(iterations) || iterations < 10000 || iterations > 5000000) return false
  const salt = base64ToBytes(saltB64)
  const expected = base64ToBytes(expectedB64)
  const actual = await derive(password, salt, iterations)
  return constantTimeEqual(actual, expected)
}