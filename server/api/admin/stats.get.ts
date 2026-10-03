import { getKV } from '../../utils/storage'

interface ResourceRecord {
  slug: string
  size: number
  visibility: string
  downloads: number
}

export default defineEventHandler(async (event) => {
  const kv = getKV(event)
  const keys = await kv.list('resource:')

  let totalBytes = 0
  let totalDownloads = 0
  let publicResources = 0

  for (const key of keys) {
    const record = await kv.get<ResourceRecord>(key)
    if (!record) continue
    totalBytes += Number(record.size) || 0
    totalDownloads += Number(record.downloads) || 0
    if (record.visibility === 'public') publicResources += 1
  }

  return {
    totalResources: keys.length,
    publicResources,
    totalBytes,
    totalDownloads
  }
})