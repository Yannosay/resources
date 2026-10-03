export default defineEventHandler(async (event) => {
  const username = String(getRouterParam(event, 'username') ?? '').toLowerCase()
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const user = await getUser(event, username)
  if (!user || !user.avatarKey) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const storage = getStorage(event)
  const object = await storage.get(user.avatarKey)
  if (!object) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  setHeader(event, 'Content-Type', user.avatarMimeType ?? object.contentType)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600')

  return object.body
})