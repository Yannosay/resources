import type { H3Event } from 'h3'
import type { UserRole } from '~~/shared/user'
import { getKV } from '../storage'

const INVITE_PREFIX = 'yri_'
const MIN_TTL_SECONDS = 60
const MAX_TTL_SECONDS = 3600
const DEFAULT_TTL_SECONDS = 900
const MAX_USES = 5

export interface InviteRecord {
  role: UserRole
  createdBy: string
  createdAt: string
  expiresAt: string
  usesRemaining: number
  totalUses: number
  note: string
  consumedBy: string[]
  revoked: boolean
}

function generateInviteToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return INVITE_PREFIX + b64
}

async function hashInvite(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i]!.toString(16).padStart(2, '0')
  return hex
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)))
}

export interface CreateInviteInput {
  role: UserRole
  ttlSeconds: number
  uses: number
  note: string
  createdBy: string
}

export async function createInvite(
  event: H3Event,
  input: CreateInviteInput
): Promise<{ token: string; hash: string; record: InviteRecord }> {
  const kv = getKV(event)
  const ttl = clamp(input.ttlSeconds || DEFAULT_TTL_SECONDS, MIN_TTL_SECONDS, MAX_TTL_SECONDS)
  const uses = clamp(input.uses || 1, 1, MAX_USES)

  const token = generateInviteToken()
  const hash = await hashInvite(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttl * 1000)

  const record: InviteRecord = {
    role: input.role,
    createdBy: input.createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    usesRemaining: uses,
    totalUses: uses,
    note: input.note.slice(0, 200),
    consumedBy: [],
    revoked: false
  }

  await kv.set(`invite:${hash}`, record, { ttl })

  return { token, hash, record }
}

export type RedeemResult =
  | { ok: true; role: UserRole }
  | { ok: false; reason: string }

export async function redeemInvite(
  event: H3Event,
  token: string,
  consumerUsername: string
): Promise<RedeemResult> {
  if (!token.startsWith(INVITE_PREFIX)) return { ok: false, reason: 'Invalid invite token' }

  const kv = getKV(event)
  const hash = await hashInvite(token)
  const record = await kv.get<InviteRecord>(`invite:${hash}`)

  if (!record) return { ok: false, reason: 'Invite not found or expired' }
  if (record.revoked) return { ok: false, reason: 'Invite has been revoked' }
  if (record.usesRemaining <= 0) return { ok: false, reason: 'Invite has no uses remaining' }
  if (new Date(record.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'Invite expired' }

  const next: InviteRecord = {
    ...record,
    usesRemaining: record.usesRemaining - 1,
    consumedBy: [...record.consumedBy, consumerUsername].slice(-20)
  }

  const expiresAtMs = new Date(record.expiresAt).getTime()
  const remaining = Math.max(60, Math.floor((expiresAtMs - Date.now()) / 1000))
  await kv.set(`invite:${hash}`, next, { ttl: remaining })

  return { ok: true, role: record.role }
}

export async function revokeInvite(event: H3Event, hash: string): Promise<boolean> {
  const kv = getKV(event)
  const record = await kv.get<InviteRecord>(`invite:${hash}`)
  if (!record) return false

  const next: InviteRecord = { ...record, revoked: true }
  const remaining = Math.max(60, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000))
  await kv.set(`invite:${hash}`, next, { ttl: remaining })
  return true
}

export interface InviteListEntry extends InviteRecord {
  hash: string
}

export async function listInvites(event: H3Event): Promise<InviteListEntry[]> {
  const kv = getKV(event)
  const keys = await kv.list('invite:')
  const out: InviteListEntry[] = []
  for (const key of keys) {
    const record = await kv.get<InviteRecord>(key)
    if (!record) continue
    out.push({ ...record, hash: key.slice('invite:'.length) })
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return out
}