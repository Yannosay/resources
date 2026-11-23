import type { H3Event } from 'h3'
import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'

export interface StoredObject {
  body: ReadableStream<Uint8Array>
  size: number
  contentType: string
}

export interface StorageBackend {
  put(key: string, body: ArrayBuffer | Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<StoredObject | null>
  head(key: string): Promise<{ size: number; contentType: string } | null>
  delete(key: string): Promise<void>
}

interface CloudflareR2Object {
  size: number
  httpMetadata?: { contentType?: string }
  body: ReadableStream<Uint8Array>
}

interface CloudflareR2Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<CloudflareR2Object | null>
  head(key: string): Promise<{ size: number; httpMetadata?: { contentType?: string } } | null>
  delete(key: string): Promise<void>
}

interface CloudflareEnv {
  RESOURCES_BUCKET?: CloudflareR2Bucket
}

function getCloudflareEnv(event: H3Event): CloudflareEnv | null {
  const context = event.context as { cloudflare?: { env?: CloudflareEnv } }
  return context.cloudflare?.env ?? null
}

const LOCAL_DATA_DIR = join(process.cwd(), '.data', 'r2')

async function ensureLocalDirectory(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true })
}

function createLocalBackend(): StorageBackend {
  return {
    async put(key, body, contentType) {
      const filePath = join(LOCAL_DATA_DIR, key)
      await ensureLocalDirectory(filePath)
      const buffer = body instanceof Uint8Array ? body : new Uint8Array(body)
      await fs.writeFile(filePath, buffer)
      const metaPath = `${filePath}.meta.json`
      await fs.writeFile(metaPath, JSON.stringify({ contentType, size: buffer.byteLength }))
    },
    async get(key) {
      const filePath = join(LOCAL_DATA_DIR, key)
      try {
        const buffer = await fs.readFile(filePath)
        const metaPath = `${filePath}.meta.json`
        let contentType = 'application/octet-stream'
        try {
          const metaRaw = await fs.readFile(metaPath, 'utf-8')
          const meta = JSON.parse(metaRaw) as { contentType?: string }
          if (meta.contentType) contentType = meta.contentType
        } catch {
        }
        const uint8 = new Uint8Array(buffer)
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(uint8)
            controller.close()
          }
        })
        return { body, size: uint8.byteLength, contentType }
      } catch {
        return null
      }
    },
    async head(key) {
      const filePath = join(LOCAL_DATA_DIR, key)
      try {
        const stat = await fs.stat(filePath)
        const metaPath = `${filePath}.meta.json`
        let contentType = 'application/octet-stream'
        try {
          const metaRaw = await fs.readFile(metaPath, 'utf-8')
          const meta = JSON.parse(metaRaw) as { contentType?: string }
          if (meta.contentType) contentType = meta.contentType
        } catch {
        }
        return { size: stat.size, contentType }
      } catch {
        return null
      }
    },
    async delete(key) {
      const filePath = join(LOCAL_DATA_DIR, key)
      try {
        await fs.unlink(filePath)
      } catch {
      }
      try {
        await fs.unlink(`${filePath}.meta.json`)
      } catch {
      }
    }
  }
}

function createCloudflareBackend(bucket: CloudflareR2Bucket): StorageBackend {
  return {
    async put(key, body, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } })
    },
    async get(key) {
      const object = await bucket.get(key)
      if (!object) return null
      return {
        body: object.body,
        size: object.size,
        contentType: object.httpMetadata?.contentType ?? 'application/octet-stream'
      }
    },
    async head(key) {
      const object = await bucket.head(key)
      if (!object) return null
      return {
        size: object.size,
        contentType: object.httpMetadata?.contentType ?? 'application/octet-stream'
      }
    },
    async delete(key) {
      await bucket.delete(key)
    }
  }
}

export function getStorage(event: H3Event): StorageBackend {
  const env = getCloudflareEnv(event)
  if (env?.RESOURCES_BUCKET) {
    return createCloudflareBackend(env.RESOURCES_BUCKET)
  }
  return createLocalBackend()
}

export interface KVBackend {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

interface CloudflareKVNamespace {
  get(key: string, options?: { type: 'json' }): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options: { prefix: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    list_complete: boolean
    cursor?: string
  }>
}

const INDEXED_PREFIXES = ['resource:', 'user:', 'invite:'] as const
const INDEX_KEY_PREFIX = '__index:'
const INDEX_MAX_AGE_MS = 60 * 60 * 1000
const INDEX_REBUILD_COOLDOWN_MS = 5 * 60 * 1000
const rebuildAttempts = new Map<string, number>()

interface KeyIndex {
  keys: string[]
  builtAt: number
}

function indexedPrefixOf(key: string): string | null {
  return INDEXED_PREFIXES.find(prefix => key.startsWith(prefix)) ?? null
}

function isKeyIndex(value: unknown): value is KeyIndex {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<KeyIndex>
  return Array.isArray(candidate.keys)
    && candidate.keys.every(key => typeof key === 'string')
    && typeof candidate.builtAt === 'number'
    && Number.isFinite(candidate.builtAt)
}

const LOCAL_KV_DIR = join(process.cwd(), '.data', 'kv')

function createLocalKV(): KVBackend {
  return {
    async get<T>(key: string) {
      const filePath = join(LOCAL_KV_DIR, `${key}.json`)
      try {
        const raw = await fs.readFile(filePath, 'utf-8')
        const parsed = JSON.parse(raw) as { value: T; expiresAt?: number }
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
          await fs.unlink(filePath).catch(() => undefined)
          return null
        }
        return parsed.value
      } catch {
        return null
      }
    },
    async set<T>(key: string, value: T, options?: { ttl?: number }) {
      const filePath = join(LOCAL_KV_DIR, `${key}.json`)
      await ensureLocalDirectory(filePath)
      const payload = {
        value,
        expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : undefined
      }
      await fs.writeFile(filePath, JSON.stringify(payload))
    },
    async delete(key: string) {
      const filePath = join(LOCAL_KV_DIR, `${key}.json`)
      try {
        await fs.unlink(filePath)
      } catch {
      }
    },
    async list(prefix: string) {
      try {
        const entries = await fs.readdir(LOCAL_KV_DIR)
        return entries
          .filter(name => name.startsWith(prefix) && name.endsWith('.json'))
          .map(name => name.replace(/\.json$/, ''))
      } catch {
        return []
      }
    }
  }
}

function createCloudflareKV(namespace: CloudflareKVNamespace): KVBackend {
  async function listAll(prefix: string): Promise<string[]> {
    const names: string[] = []
    let cursor: string | undefined
    do {
      const page = await namespace.list({ prefix, limit: 1000, cursor })
      for (const entry of page.keys) names.push(entry.name)
      cursor = page.list_complete ? undefined : page.cursor
    } while (cursor)
    return names
  }

  async function readIndex(prefix: string): Promise<KeyIndex | null> {
    const value = await namespace.get(INDEX_KEY_PREFIX + prefix, { type: 'json' })
    return isKeyIndex(value) ? value : null
  }

  async function writeIndex(prefix: string, index: KeyIndex): Promise<void> {
    try {
      await namespace.put(INDEX_KEY_PREFIX + prefix, JSON.stringify(index))
    } catch (error) {
      console.error(`Failed to write KV key index for "${prefix}"`, error)
    }
  }

  async function rebuildIndex(prefix: string, previous: KeyIndex | null): Promise<string[]> {
    const listed = await listAll(prefix)
    const listedSet = new Set(listed)
    const keys = [...listed]
    for (const key of previous?.keys ?? []) {
      if (listedSet.has(key)) continue
      if (await namespace.get(key) !== null) keys.push(key)
    }
    await writeIndex(prefix, { keys, builtAt: Date.now() })
    return keys
  }

  async function updateIndex(key: string, present: boolean): Promise<void> {
    const prefix = indexedPrefixOf(key)
    if (!prefix) return
    try {
      const index = await readIndex(prefix)
      if (!index) {
        await rebuildIndex(prefix, { keys: present ? [key] : [], builtAt: 0 })
        return
      }
      if (index.keys.includes(key) === present) return
      const keys = present ? [...index.keys, key] : index.keys.filter(existing => existing !== key)
      await writeIndex(prefix, { keys, builtAt: index.builtAt })
    } catch (error) {
      console.error(`Failed to update KV key index for "${key}"`, error)
    }
  }

  return {
    async get<T>(key: string) {
      const value = await namespace.get(key, { type: 'json' })
      return (value as T) ?? null
    },
    async set<T>(key: string, value: T, options?: { ttl?: number }) {
      await namespace.put(key, JSON.stringify(value), options?.ttl ? { expirationTtl: options.ttl } : undefined)
      await updateIndex(key, true)
    },
    async delete(key) {
      await namespace.delete(key)
      await updateIndex(key, false)
    },
    async list(prefix) {
      if (!INDEXED_PREFIXES.includes(prefix as typeof INDEXED_PREFIXES[number])) {
        return await listAll(prefix)
      }
      const index = await readIndex(prefix)
      const now = Date.now()
      if (index && now - index.builtAt < INDEX_MAX_AGE_MS) {
        return [...index.keys]
      }
      const lastAttempt = rebuildAttempts.get(prefix)
      if (index && lastAttempt !== undefined && now - lastAttempt < INDEX_REBUILD_COOLDOWN_MS) {
        return [...index.keys]
      }
      rebuildAttempts.set(prefix, now)
      try {
        return await rebuildIndex(prefix, index)
      } catch (error) {
        if (!index) throw error
        console.error(`Failed to rebuild KV key index for "${prefix}", serving stale index`, error)
        return [...index.keys]
      }
    }
  }
}

export function getKV(event: H3Event): KVBackend {
  const env = getCloudflareEnv(event) as { RESOURCES_KV?: CloudflareKVNamespace } | null
  if (env?.RESOURCES_KV) {
    return createCloudflareKV(env.RESOURCES_KV)
  }
  return createLocalKV()
}