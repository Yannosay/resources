<template>
  <div class="members">
    <header class="members__header">
      <div>
        <h1 class="members__title">Team members</h1>
        <p class="members__lede">
          Everyone with access to this site. {{ members.length }} in total.
        </p>
      </div>
    </header>

    <p v-if="pending" class="state">Loading…</p>
    <p v-else-if="error" class="state state--error">Unable to load team members.</p>
    <p v-else-if="members.length === 0" class="state">No team members yet.</p>

    <ul v-else class="member-grid">
      <li v-for="member in members" :key="member.username" class="member-card">
        <div class="member-card__head">
          <NuxtLink :to="`/u/${member.username}`" class="member-card__avatar" :aria-label="`View ${member.displayName}'s profile`">
            <img
              v-if="member.avatarUrl"
              :src="member.avatarUrl"
              :alt="member.displayName"
              loading="lazy"
              decoding="async"
            >
            <span v-else>{{ member.displayName.charAt(0).toUpperCase() }}</span>
          </NuxtLink>

          <div class="member-card__identity">
            <NuxtLink :to="`/u/${member.username}`" class="member-card__name">
              {{ member.displayName }}
            </NuxtLink>
            <p class="member-card__handle">@{{ member.username }}</p>
          </div>

          <span :class="['member-card__role', `member-card__role--${member.role}`]">{{ member.role }}</span>
        </div>

        <dl class="member-card__stats">
          <div>
            <dt>Resources</dt>
            <dd>{{ member.resourceCount }}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{{ member.publishedCount }}</dd>
          </div>
          <div>
            <dt>Downloads</dt>
            <dd>{{ member.totalDownloads }}</dd>
          </div>
        </dl>

        <div class="member-card__footer">
          <p class="member-card__meta">
            <span>Joined {{ formatShort(member.createdAt) }}</span>
            <template v-if="member.lastLoginAt">
              <span class="dot" aria-hidden="true">·</span>
              <span>Seen {{ formatRelative(member.lastLoginAt) }}</span>
            </template>
          </p>

          <div class="member-card__actions">
            <NuxtLink :to="`/u/${member.username}`" class="member-card__link">
              View profile
            </NuxtLink>
            <template v-if="isAdmin && member.username !== currentUsername">
              <button
                type="button"
                class="member-card__action"
                :disabled="busy"
                @click="toggleDisabled(member)"
              >
                {{ member.disabled ? 'Enable' : 'Disable' }}
              </button>
              <button
                type="button"
                class="member-card__action member-card__action--danger"
                :disabled="busy"
                @click="confirmDelete(member)"
              >
                Remove
              </button>
            </template>
            <span v-else-if="member.username === currentUsername" class="member-card__self">You</span>
          </div>
        </div>

        <span v-if="member.disabled" class="member-card__disabled">Disabled</span>
      </li>
    </ul>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

useHead({
  title: 'Team',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

interface MemberEntry {
  username: string
  displayName: string
  role: 'admin' | 'member'
  disabled: boolean
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
  resourceCount: number
  publishedCount: number
  draftCount: number
  archivedCount: number
  totalDownloads: number
}

const { user, isAdmin } = useTeamSession()
const currentUsername = computed(() => user.value?.username ?? '')

const { data, pending, error, refresh } = await useFetch<{ members: MemberEntry[] }>('/api/team/members', {
  key: 'team-members'
})

const members = computed(() => data.value?.members ?? [])
const busy = ref(false)
const errorMessage = ref('')

function formatShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatRelative(iso: string): string {
  const target = new Date(iso).getTime()
  if (!Number.isFinite(target)) return '—'
  const diff = Date.now() - target
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

async function toggleDisabled(member: MemberEntry): Promise<void> {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/users/${member.username}`, {
      method: 'PATCH',
      body: { disabled: !member.disabled }
    })
    await refresh()
  } catch {
    errorMessage.value = 'Could not update that member.'
  } finally {
    busy.value = false
  }
}

async function confirmDelete(member: MemberEntry): Promise<void> {
  if (busy.value) return
  const confirmed = window.confirm(`Remove ${member.username} from the team? Their resources stay on the site.`)
  if (!confirmed) return
  busy.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/users/${member.username}`, { method: 'DELETE' })
    await refresh()
  } catch {
    errorMessage.value = 'Could not remove that member.'
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
.members {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.members__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.members__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.35rem;
  color: #f5f5f6;
}

.members__lede {
  font-size: 0.9rem;
  color: rgba(245, 245, 246, 0.55);
}

.state {
  padding: 2.5rem 0;
  text-align: center;
  color: rgba(245, 245, 246, 0.55);
  font-size: 0.9rem;
}

.state--error { color: #f87171; }

.member-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: 1rem;
}

.member-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 12px;
  background: rgba(245, 245, 246, 0.015);
}

.member-card__head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.member-card__avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: rgba(245, 245, 246, 0.05);
  border: 1px solid rgba(245, 245, 246, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  text-decoration: none;
  color: #f5f5f6;
  font-size: 1rem;
  font-weight: 500;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.member-card__identity {
  min-width: 0;
  flex: 1 1 auto;
}

.member-card__name {
  display: block;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.005em;
  color: #f5f5f6;
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

.member-card__handle {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: rgba(245, 245, 246, 0.4);
  margin-top: 0.15rem;
}

.member-card__role {
  padding: 0.18rem 0.55rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 4px;
  border: 1px solid;
  flex-shrink: 0;
}

.member-card__role--admin {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.08);
}

.member-card__role--member {
  color: rgba(245, 245, 246, 0.55);
  border-color: rgba(245, 245, 246, 0.12);
}

.member-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.85rem 0;
  border-top: 1px solid rgba(245, 245, 246, 0.08);
  border-bottom: 1px solid rgba(245, 245, 246, 0.08);
  margin: 0;
}

.member-card__stats > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.member-card__stats dt {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
}

.member-card__stats dd {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 500;
  color: #f5f5f6;
  margin: 0;
}

.member-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.member-card__meta {
  font-size: 0.72rem;
  color: rgba(245, 245, 246, 0.4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
}

.member-card__meta .dot { opacity: 0.5; }

.member-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.member-card__link {
  padding: 0.35rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #0a0a0b;
  background: #f5f5f6;
  border: 1px solid #f5f5f6;
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.15s;
}

.member-card__link:hover {
  background: #ffffff;
}

.member-card__action {
  padding: 0.35rem 0.7rem;
  font-family: inherit;
  font-size: 0.72rem;
  color: rgba(245, 245, 246, 0.6);
  background: transparent;
  border: 1px solid rgba(245, 245, 246, 0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.member-card__action:hover:not(:disabled) {
  color: #f5f5f6;
  border-color: rgba(245, 245, 246, 0.24);
}

.member-card__action:disabled { opacity: 0.4; cursor: not-allowed; }

.member-card__action--danger {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.35);
}

.member-card__action--danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.08);
  border-color: #f87171;
}

.member-card__self {
  font-size: 0.7rem;
  color: rgba(245, 245, 246, 0.35);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.member-card__disabled {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.18rem 0.55rem;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(20, 20, 22, 0.85);
  border-radius: 4px;
}

.error {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #f87171;
  background: rgba(248, 113, 113, 0.06);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
}
</style>