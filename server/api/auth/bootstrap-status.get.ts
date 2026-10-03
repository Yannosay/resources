import { isBootstrapAvailable, getBootstrapTokenDebug } from '../../utils/auth/bootstrap'
import { getKV } from '../../utils/storage'
import { countUsers } from '../../utils/auth/users'

export default defineEventHandler(async (event) => {
  const available = await isBootstrapAvailable(event)
  const debug = getBootstrapTokenDebug(event)

  const kv = getKV(event)
  const consumed = await kv.get<boolean>('bootstrap:consumed')
  const userKeys = await kv.list('user:')
  const sessionKeys = await kv.list('session:')
  const inviteKeys = await kv.list('invite:')
  const bootstrapKeys = await kv.list('bootstrap:')

  return {
    available,
    debug,
    kv: {
      consumedFlag: consumed,
      userCount: userKeys.length,
      userKeys,
      sessionCount: sessionKeys.length,
      inviteCount: inviteKeys.length,
      bootstrapKeys
    }
  }
})