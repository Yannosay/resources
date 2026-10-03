export default defineEventHandler(async (event) => {
  const username = String(getRouterParam(event, 'username') ?? '').toLowerCase()
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const user = await getUser(event, username)
  if (!user || user.disabled) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const session = await readSession(event)
  const viewerUsername = session?.username ?? null
  const viewerIsAdmin = session?.role === 'admin'
  const isOwnProfile = viewerUsername === username
  const canSeeEverything = viewerIsAdmin || isOwnProfile

  const allRecords = await listResourceRecords(event)
  const visible = allRecords.filter(record => {
    if (record.ownerUsername !== username) return false
    if (canSeeEverything) return true
    if (record.visibility !== 'general') return false
    if (record.status !== 'published') return false
    return true
  })
  visible.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))

  setHeader(event, 'Cache-Control', canSeeEverything ? 'private, no-store' : 'public, max-age=60, s-maxage=300')

  return {
    ...toPublicUser(user),
    isOwnProfile,
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
      previewUrl: record.mimeType.startsWith('image/')
        ? `/api/public/resources/${record.slug}/download?inline=1`
        : null,
      uploadedAt: record.uploadedAt
    }))
  }
})