export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/admin/login' || to.path === '/admin/signup' || to.path === '/admin/bootstrap') return

  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/auth/session', {
      headers: { Accept: 'application/json' }
    })
    if (!session?.authenticated) {
      return navigateTo(`/admin/login?next=${encodeURIComponent(to.fullPath)}`, { replace: true })
    }
  } catch {
    return navigateTo('/admin/login', { replace: true })
  }
})