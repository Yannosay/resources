import { isBootstrapAvailable } from '../../utils/auth/bootstrap'

export default defineEventHandler(async (event) => {
  return { available: await isBootstrapAvailable(event) }
})