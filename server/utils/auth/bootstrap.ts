import type { H3Event } from 'h3'
import { getKV } from '../storage'
import { countUsers } from './users'

const BOOTSTRAP_CONSUMED_KEY = 'bootstrap:consumed'
const MIN_TOKEN_LENGTH = 24

interface CloudflareEnv {
  NUXT_BOOTSTRAP_TOKEN?: string
}

function readCloudflareEnv(event: H3Event): string | null {
  const context = event.context as { cloudflare?: { env?: CloudflareEnv } }
  const value = context.cloudflare?.env?.NUXT_BOOTSTRAP_TOKEN
  if (typeof value === 'string' && value.length > 0) return value
  return null
}

function readProcessEnv(): string | null {
  const value = process.env.NUXT_BOOTSTRAP_TOKEN
  if (typeof value === 'string' && value.length > 0) return value
  return null
}

function readRuntimeConfig(event: H3Event): string | null {
  try {
    const config = useRuntimeConfig(event)
    const value = String(config.bootstrapToken || '')
    if (value.length > 0) return value
  } catch {
  }
  return null
}

export function getBootstrapToken(event: H3Event): string | null {
  const candidates = [
    readCloudflareEnv(event),
    readProcessEnv(),
    readRuntimeConfig(event)
  ]
  for (const candidate of candidates) {
    if (candidate && candidate.length >= MIN_TOKEN_LENGTH) {
      return candidate
    }
  }
  return null
}

export function getBootstrapTokenDebug(event: H3Event): {
  cloudflareLength: number
  processLength: number
  runtimeLength: number
  effectiveLength: number
} {
  const cf = readCloudflareEnv(event)
  const proc = readProcessEnv()
  const runtime = readRuntimeConfig(event)
  const effective = getBootstrapToken(event)
  return {
    cloudflareLength: cf?.length ?? 0,
    processLength: proc?.length ?? 0,
    runtimeLength: runtime?.length ?? 0,
    effectiveLength: effective?.length ?? 0
  }
}

export async function isBootstrapAvailable(event: H3Event): Promise<boolean> {
  if (!getBootstrapToken(event)) return false
  const kv = getKV(event)
  const consumed = await kv.get<boolean>(BOOTSTRAP_CONSUMED_KEY)
  if (consumed) return false
  const users = await countUsers(event)
  return users === 0
}

export function verifyBootstrapToken(event: H3Event, submitted: string): boolean {
  const expected = getBootstrapToken(event)
  if (!expected) return false
  if (submitted.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < submitted.length; i += 1) {
    diff |= submitted.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function markBootstrapConsumed(event: H3Event): Promise<void> {
  const kv = getKV(event)
  await kv.set(BOOTSTRAP_CONSUMED_KEY, true)
}