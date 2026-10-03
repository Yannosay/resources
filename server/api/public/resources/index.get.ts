import type { ResourceVisibility } from '~~/shared/resource'

interface ResourceSummary {
  slug: string
  title: string
  description: string
  category: string
  visibility: ResourceVisibility
  size: number
  downloads: number
  mimeType: string
  previewUrl: string | null
  ownerUsername: string
  ownerDisplayName: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoryFilter = typeof query.category === 'string' ? query.category : null
  const visibilityFilter = typeof query.visibility === 'string' ? query.visibility : null
  const ownerFilter = typeof query.owner === 'string' ? query.owner.toLowerCase() : null
  const limitParam = Number(query.limit)
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 60 ? limitParam : null

  const session = await readSession(event)
  const isTeamMember = session !== null

  const records = await listResourceRecords(event)
  const users = await listUsers(event)
  const nameMap = new Map(users.map(u => [u.username, u.displayName]))

  const filtered = []
  for (const record of records) {
    if (!isTeamMember) {
      if (record.status !== 'published') continue
      if (record.visibility !== 'general') continue
      if (visibilityFilter && visibilityFilter !== 'general') continue
    } else {
      if (record.status === 'archived' && visibilityFilter !== 'archived') continue
      if (visibilityFilter && record.visibility !== visibilityFilter) continue
    }
    if (categoryFilter && record.category !== categoryFilter) continue
    if (ownerFilter && record.ownerUsername !== ownerFilter) continue
    filtered.push(record)
  }

  filtered.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  const sliced = limit ? filtered.slice(0, limit) : filtered

  const summaries: ResourceSummary[] = sliced.map(record => ({
    slug: record.slug,
    title: record.title,
    description: record.description,
    category: record.category,
    visibility: record.visibility,
    size: record.size,
    downloads: record.downloads,
    mimeType: record.mimeType,
    previewUrl: record.mimeType.startsWith('image/')
      ? `/api/public/resources/${record.slug}/download?inline=1`
      : null,
    ownerUsername: record.ownerUsername,
    ownerDisplayName: nameMap.get(record.ownerUsername) ?? (record.ownerUsername || 'Unknown')
  }))

  setHeader(event, 'Cache-Control', isTeamMember ? 'private, no-store' : 'public, max-age=60, s-maxage=120')
  return { resources: summaries }
})