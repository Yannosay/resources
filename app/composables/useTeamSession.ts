import { computed } from 'vue'
import type { SessionUser } from '#shared/user'

interface SessionPayload {
  authenticated: boolean
  user?: SessionUser
}

export function useTeamSession() {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  const { data, pending, refresh } = useFetch<SessionPayload>('/api/auth/session', {
    key: 'team-session',
    headers,
    default: () => ({ authenticated: false })
  })

  const authenticated = computed(() => data.value?.authenticated === true)
  const user = computed<SessionUser | null>(() => data.value?.user ?? null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  return { session: data, authenticated, user, isAdmin, pending, refresh }
}