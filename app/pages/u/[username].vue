<template>
  <div class="profile">
    <p v-if="pending" class="state">Loading…</p>
    <p v-else-if="error || !profile" class="state state--error">Profile not found.</p>

    <template v-else>
      <article class="profile__article">
        <div
          class="profile__banner"
          :style="profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : {}"
        />

        <header class="profile__head">
          <div class="profile__avatar">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.displayName" decoding="async">
            <span v-else>{{ profile.displayName.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="profile__headings">
            <h1 class="profile__name">{{ profile.displayName }}</h1>
            <p class="profile__handle">@{{ profile.username }}</p>
          </div>
        </header>

        <p v-if="profile.bio" class="profile__bio">{{ profile.bio }}</p>

        <ul v-if="profile.links.length > 0" class="profile__links">
          <li v-for="link in profile.links" :key="link.url">
            <a :href="link.url" target="_blank" rel="noopener noreferrer" class="profile__link">
              <span class="profile__link-label">{{ link.label }}</span>
              <span class="profile__link-url">{{ prettyHost(link.url) }}</span>
            </a>
          </li>
        </ul>

        <p class="profile__since">Member since {{ formatDate(profile.createdAt) }}</p>
      </article>

      <section class="resources">
        <header class="resources__header">
          <h2 class="resources__title">
            {{ isOwnProfile ? 'Your resources' : `${profile.displayName}'s resources` }}
          </h2>
          <p class="resources__count">
            {{ profile.resources.length }}
            {{ profile.resources.length === 1 ? 'resource' : 'resources' }}
          </p>
        </header>

        <p v-if="profile.resources.length === 0" class="resources__empty">
          Nothing published yet.
        </p>

        <div v-else class="resources__grid">
          <ResourceCard
            v-for="item in profile.resources"
            :key="item.slug"
            :resource="item"
            :show-visibility-badge="isOwnProfile || isAdmin"
            :show-status-badge="isOwnProfile || isAdmin"
            :show-delete="canDeleteAny"
            :deleting="deletingSlug === item.slug"
            @delete="confirmDelete"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ResourceCard from '~/components/ui/ResourceCard.vue'
import type { ResourceCategory, ResourceStatus, ResourceVisibility } from '~~/shared/resource'

interface ProfileResource {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  visibility: ResourceVisibility
  status: ResourceStatus
  size: number
  downloads: number
  mimeType: string
  previewUrl: string | null
  uploadedAt: string
  ownerUsername: string
  ownerDisplayName: string
}

interface ProfileResponse {
  username: string
  displayName: string
  bio: string
  links: Array<{ label: string; url: string }>
  avatarUrl: string | null
  bannerUrl: string | null
  createdAt: string
  isOwnProfile: boolean
  resources: ProfileResource[]
}

const route = useRoute()
const username = computed(() => String(route.params.username ?? '').toLowerCase())

const { data: profile, pending, error, refresh } = await useFetch<ProfileResponse>(
  () => `/api/public/users/${username.value}`,
  { key: () => `profile-${username.value}` }
)

const { user } = useTeamSession()
const isAdmin = computed(() => user.value?.role === 'admin')
const isOwnProfile = computed(() => profile.value?.isOwnProfile === true)

const canDeleteAny = computed(() => isAdmin.value === true)

const deletingSlug = ref<string | null>(null)
const deleteError = ref('')

async function confirmDelete(slug: string): Promise<void> {
  if (deletingSlug.value) return
  const confirmed = window.confirm(`Delete "${slug}" permanently? This cannot be undone.`)
  if (!confirmed) return

  deletingSlug.value = slug
  deleteError.value = ''
  try {
    await $fetch(`/api/admin/resources/${slug}`, { method: 'DELETE' })
    await refresh()
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 403) deleteError.value = 'You do not have permission to delete this resource.'
    else deleteError.value = 'Delete failed. Try again.'
    window.alert(deleteError.value)
  } finally {
    deletingSlug.value = null
  }
}

useCanonical(() => `/u/${username.value}`)

useHead(() => ({
  title: profile.value ? `${profile.value.displayName} (@${profile.value.username})` : 'Profile',
  meta: [
    { name: 'description', content: profile.value?.bio || `Profile of @${username.value}` },
    { property: 'og:title', content: profile.value?.displayName ?? 'Profile' },
    { property: 'og:description', content: profile.value?.bio ?? '' },
    { property: 'og:type', content: 'profile' }
  ]
}))

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function prettyHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
</script>

<style lang="scss" scoped>
.profile {
  max-width: 78rem;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;

  @media (min-width: 768px) {
    padding: 4rem 2rem 6rem;
  }
}

.state {
  padding: 3rem 0;
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.9rem;
}

.state--error { color: var(--danger); }

.profile__article {
  max-width: 44rem;
  margin: 0 auto 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile__banner {
  height: 12rem;
  border-radius: 12px;
  background-color: rgba(245, 245, 246, 0.03);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--line);
}

.profile__head {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  margin-top: -4rem;
  padding-left: 1.5rem;

  @media (max-width: 640px) {
    margin-top: -3rem;
    padding-left: 0.5rem;
    gap: 0.9rem;
  }
}

.profile__avatar {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background: #141416;
  border: 3px solid var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 2rem;
  font-weight: 500;
  color: var(--fg);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 640px) {
    width: 4.5rem;
    height: 4.5rem;
    font-size: 1.5rem;
  }
}

.profile__headings {
  padding-bottom: 0.5rem;
  min-width: 0;
}

.profile__name {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--fg);
  overflow-wrap: anywhere;
}

.profile__handle {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--fg-dim);
  margin-top: 0.2rem;
}

.profile__bio {
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--fg-muted);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.profile__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.profile__link {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, background-color 0.15s;
}

.profile__link:hover {
  border-color: var(--line-strong);
  background: rgba(245, 245, 246, 0.03);
}

.profile__link-label {
  font-weight: 500;
  color: var(--fg);
  font-size: 0.9rem;
}

.profile__link-url {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-dim);
  margin-left: auto;
}

.profile__since {
  font-size: 0.78rem;
  color: var(--fg-dim);
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.resources {
  padding-top: 3rem;
  border-top: 1px solid var(--line);
}

.resources__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.resources__title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
  color: var(--fg);
}

.resources__count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--fg-dim);
  letter-spacing: 0.03em;
}

.resources__empty {
  padding: 3rem 0;
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.88rem;
}

.resources__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 1.5rem 1.25rem;
}
</style>