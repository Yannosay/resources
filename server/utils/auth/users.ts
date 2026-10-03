import type { H3Event } from 'h3'
import type { UserRole, UserLink, PublicUser, SessionUser } from '~~/shared/user'
import { normalizeDisplayName } from '~~/shared/user'
import { getKV } from '../storage'

export interface UserRecord {
  username: string
  displayName: string
  bio: string
  links: UserLink[]
  role: UserRole
  passwordHash: string
  avatarKey: string | null
  avatarMimeType: string | null
  bannerKey: string | null
  bannerMimeType: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  disabled: boolean
  createdViaInvite: string | null
}

export async function getUser(event: H3Event, username: string): Promise<UserRecord | null> {
  const kv = getKV(event)
  return await kv.get<UserRecord>(`user:${username}`)
}

export async function putUser(event: H3Event, record: UserRecord): Promise<void> {
  const kv = getKV(event)
  await kv.set(`user:${record.username}`, record)
}

export async function deleteUser(event: H3Event, username: string): Promise<void> {
  const kv = getKV(event)
  await kv.delete(`user:${username}`)
}

export async function listUsers(event: H3Event): Promise<UserRecord[]> {
  const kv = getKV(event)
  const keys = await kv.list('user:')
  const users: UserRecord[] = []
  for (const key of keys) {
    const record = await kv.get<UserRecord>(key)
    if (record) users.push(record)
  }
  users.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
  return users
}

export async function countUsers(event: H3Event): Promise<number> {
  const kv = getKV(event)
  const keys = await kv.list('user:')
  return keys.length
}

export async function isDisplayNameTaken(
  event: H3Event,
  displayName: string,
  excludeUsername: string
): Promise<boolean> {
  const normalized = normalizeDisplayName(displayName)
  if (!normalized) return false
  const users = await listUsers(event)
  for (const user of users) {
    if (user.username === excludeUsername) continue
    if (normalizeDisplayName(user.displayName) === normalized) return true
  }
  return false
}

export function toPublicUser(record: UserRecord): PublicUser {
  return {
    username: record.username,
    displayName: record.displayName,
    bio: record.bio,
    links: record.links,
    avatarUrl: record.avatarKey ? `/api/public/users/${record.username}/avatar` : null,
    bannerUrl: record.bannerKey ? `/api/public/users/${record.username}/banner` : null,
    createdAt: record.createdAt
  }
}

export function toSessionUser(record: UserRecord): SessionUser {
  return {
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    avatarUrl: record.avatarKey ? `/api/public/users/${record.username}/avatar` : null
  }
}