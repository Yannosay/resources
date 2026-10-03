export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug')
  const slug = String(raw ?? '').toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  const session = await readSession(event)

  const record = await getResourceRecord(event, slug)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })

  const isAdmin = session?.role === 'admin'
  const isOwner = session && record.ownerUsername === session.username
  const isTeamMember = session !== null

  if (!isTeamMember && record.status !== 'published') {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  if (record.visibility === 'closed') {
    const canView = isAdmin || isOwner
    if (!canView) throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  if (record.visibility === 'intern' && !isTeamMember) {
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }

  let ownerDisplayName = record.ownerUsername || 'Unknown'
  let ownerHasAvatar = false
  let ownerBio = ''
  if (record.ownerUsername) {
    const owner = await getUser(event, record.ownerUsername)
    if (owner) {
      ownerDisplayName = owner.displayName
      ownerHasAvatar = owner.avatarKey !== null
      ownerBio = owner.bio
    }
  }

  setHeader(event, 'Cache-Control', isTeamMember ? 'private, no-store' : 'public, max-age=60, s-maxage=120')

  return {
    slug: record.slug,
    title: record.title,
    description: record.description,
    category: record.category,
    visibility: record.visibility,
    status: record.status,
    size: record.size,
    mimeType: record.mimeType,
    downloads: record.downloads,
    license: record.license,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
    previewUrl: record.mimeType.startsWith('image/')
      ? `/api/public/resources/${record.slug}/download?inline=1`
      : null,
    tags: record.tags,
    attribution: record.attribution || null,
    metadata: record.metadata,
    ownerUsername: record.ownerUsername,
    ownerDisplayName,
    ownerHasAvatar,
    ownerBio
  }
})