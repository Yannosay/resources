import { getKV } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const host = getRequestHeader(event, 'host') ?? ''
  const isLocalhost = host === 'localhost' || host.startsWith('localhost:') || host === '127.0.0.1' || host.startsWith('127.0.0.1:')

  if (!isLocalhost) {
    throw createError({ statusCode: 403, statusMessage: 'Reset is only available on localhost' })
  }

  const kv = getKV(event)

  const userKeys = await kv.list('user:')
  for (const key of userKeys) {
    await kv.delete(key)
  }

  const sessionKeys = await kv.list('session:')
  for (const key of sessionKeys) {
    await kv.delete(key)
  }

  const inviteKeys = await kv.list('invite:')
  for (const key of inviteKeys) {
    await kv.delete(key)
  }

  const rateKeys = await kv.list('rl:')
  for (const key of rateKeys) {
    await kv.delete(key)
  }

  await kv.delete('bootstrap:consumed')

  return {
    ok: true,
    cleared: {
      users: userKeys.length,
      sessions: sessionKeys.length,
      invites: inviteKeys.length,
      rateLimits: rateKeys.length
    }
  }
})