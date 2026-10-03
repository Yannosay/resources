import { listResourceRecords } from '../../../utils/resource-store'
import { listUsers } from '../../../utils/auth/users'
import { requireSession } from '../../../utils/auth/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const records = await listResourceRecords(event)
  const users = await listUsers(event)
  const nameMap = new Map(users.map(u => [u.username, u.displayName]))

  const visible = session.role === 'admin'
    ? records
    : records.filter(r => r.ownerUsername === session.username)

  visible.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))

  return {
    scope: session.role === 'admin' ? 'all' : 'own',
    resources: visible.map(record => ({
      slug: record.slug,
      title: record.title,
      description: record.description,
      category: record.category,
      visibility: record.visibility,
      status: record.status,
      size: record.size,
      downloads: record.downloads,
      mimeType: record.mimeType,
      extension: record.extension,
      ownerUsername: record.ownerUsername,
      ownerDisplayName: nameMap.get(record.ownerUsername) ?? (record.ownerUsername || 'Unknown'),
      uploadedAt: record.uploadedAt,
      updatedAt: record.updatedAt,
      publishedAt: record.publishedAt,
      canEdit: session.role === 'admin' || record.ownerUsername === session.username
    }))
  }
})