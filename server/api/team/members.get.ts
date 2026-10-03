import { requireSession } from '../../utils/auth/session'
import { listUsers } from '../../utils/auth/users'
import { listResourceRecords } from '../../utils/resource-store'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const users = await listUsers(event)
  const records = await listResourceRecords(event)

  const stats = new Map<string, { total: number; published: number; drafts: number; archived: number; downloads: number }>()

  for (const record of records) {
    const key = record.ownerUsername || ''
    if (!key) continue
    if (!stats.has(key)) {
      stats.set(key, { total: 0, published: 0, drafts: 0, archived: 0, downloads: 0 })
    }
    const entry = stats.get(key)!
    entry.total += 1
    entry.downloads += Number(record.downloads) || 0
    if (record.status === 'published') entry.published += 1
    else if (record.status === 'draft') entry.drafts += 1
    else if (record.status === 'archived') entry.archived += 1
  }

  const members = users.map(user => {
    const entry = stats.get(user.username) ?? { total: 0, published: 0, drafts: 0, archived: 0, downloads: 0 }
    return {
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      disabled: user.disabled,
      avatarUrl: user.avatarKey ? `/api/public/users/${user.username}/avatar` : null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      resourceCount: entry.total,
      publishedCount: entry.published,
      draftCount: entry.drafts,
      archivedCount: entry.archived,
      totalDownloads: entry.downloads
    }
  })

  members.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
    return a.username.localeCompare(b.username)
  })

  return { members }
})