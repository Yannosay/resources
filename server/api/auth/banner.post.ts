import { ALLOWED_IMAGE_MIME_TYPES, BANNER_MAX_BYTES } from '#shared/user'
import { requireSession } from '../../utils/auth/session'
import { getUser, putUser } from '../../utils/auth/users'
import { getStorage } from '../../utils/storage'
import { detectImageMime } from '../../utils/image-magic'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const user = await getUser(event, session.username)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) throw createError({ statusCode: 422, statusMessage: 'No file uploaded' })

  let data: Buffer | null = null
  for (const part of parts) {
    if (part.name === 'file' && part.filename) {
      data = part.data
      break
    }
  }

  if (!data || data.byteLength === 0) throw createError({ statusCode: 422, statusMessage: 'No file uploaded' })
  if (data.byteLength > BANNER_MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'File too large' })

  const bytes = new Uint8Array(data)
  const mime = detectImageMime(bytes)
  if (!mime || !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    throw createError({ statusCode: 422, statusMessage: 'Unsupported image format' })
  }

  const storage = getStorage(event)
  await storage.put(`banners/${user.username}`, bytes, mime)
  await putUser(event, {
    ...user,
    bannerKey: `banners/${user.username}`,
    bannerMimeType: mime,
    updatedAt: new Date().toISOString()
  })

  return { ok: true, bannerUrl: `/api/public/users/${user.username}/banner` }
})