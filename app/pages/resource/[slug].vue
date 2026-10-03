<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORY_DEFS } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import ResourcePreview from '~/components/resource/ResourcePreview.vue'

interface FullResource {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  visibility: ResourceVisibility
  status: ResourceStatus
  license: string
  tags: string[]
  attribution: string
  metadata: Record<string, string | number>
  size: number
  mimeType: string
  extension: string
  downloads: number
  ownerUsername: string
  ownerDisplayName: string
  ownerHasAvatar?: boolean
  uploadedAt: string
  updatedAt: string
  publishedAt: string
  fileCount: number
  uploadKind: string
  coverKey: string | null
}

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: session } = await useFetch<{ authenticated: boolean; user?: { username: string; role: string } }>(
  '/api/auth/session',
  { key: 'resource-session', default: () => ({ authenticated: false }) }
)

const { data: resource, error } = await useFetch<FullResource>(() => `/api/public/resources/${slug.value}`, {
  key: () => `resource-${slug.value}`
})

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
}

useHead(() => ({ title: `${resource.value?.title ?? 'Resource'} :: Yannosay Resources` }))

const authenticated = computed(() => Boolean(session.value?.authenticated))
const isAdmin = computed(() => session.value?.user?.role === 'admin')
const currentUsername = computed(() => session.value?.user?.username ?? null)
const isOwner = computed(() => Boolean(resource.value) && resource.value!.ownerUsername === currentUsername.value)
const isMember = computed(() => authenticated.value)
const canManageClosed = computed(() => isOwner.value || isAdmin.value)

const visibility = computed<ResourceVisibility>(() => resource.value?.visibility ?? 'general')

const downloadUrl = computed(() => `/api/public/resources/${slug.value}/download`)
const inlineUrl = computed(() => `/api/public/resources/${slug.value}/download?file=0&inline=1`)
const textPreviewUrl = computed(() => `/api/public/resources/${slug.value}/text`)

const absoluteAssetUrl = computed(() => {
  const target = resource.value && resource.value.fileCount > 1
    ? `/api/public/resources/${slug.value}/download`
    : `/api/public/resources/${slug.value}/download?file=0&inline=1`
  if (typeof window === 'undefined') return target
  return new URL(target, window.location.origin).toString()
})

const canDownload = computed(() => {
  if (visibility.value === 'general') return true
  if (visibility.value === 'intern') return false
  if (visibility.value === 'closed') return isMember.value && canManageClosed.value
  return false
})

const canCopyAssetLink = computed(() => {
  if (visibility.value === 'general') return true
  if (visibility.value === 'intern') return true
  if (visibility.value === 'closed') return isMember.value
  return false
})

const canOpenAsset = computed(() => {
  if (visibility.value === 'general') return true
  if (visibility.value === 'intern') return true
  if (visibility.value === 'closed') return isMember.value
  return false
})

const copied = ref(false)

async function copyAssetLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(absoluteAssetUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch (err) {
    console.error('[resource] copy failed:', err)
  }
}

const avatarFailed = ref(false)

function onAvatarError(): void {
  avatarFailed.value = true
}

const hasOwner = computed(() => Boolean(resource.value?.ownerUsername))

const avatarUrl = computed(() => {
  if (!resource.value?.ownerUsername) return ''
  return `/api/public/users/${resource.value.ownerUsername}/avatar`
})

const previewPayload = computed(() => {
  if (!resource.value) return null
  return {
    slug: resource.value.slug,
    title: resource.value.title,
    category: resource.value.category,
    mimeType: resource.value.mimeType,
    extension: resource.value.extension,
    previewUrl: null,
    inlineUrl: inlineUrl.value,
    textPreviewUrl: textPreviewUrl.value,
    primaryIndex: 0
  }
})

const categoryLabel = computed(() => {
  const def = CATEGORY_DEFS[resource.value?.category ?? 'other']
  return def?.label ?? resource.value?.category ?? 'Other'
})

const metadataEntries = computed(() => {
  if (!resource.value) return [] as Array<{ key: string; label: string; value: string }>
  const def = CATEGORY_DEFS[resource.value.category]
  const labels = new Map<string, string>()
  for (const f of def.fields) labels.set(f.key, f.label)
  return Object.entries(resource.value.metadata ?? {})
    .filter(([_, v]) => v != null && String(v).length > 0)
    .map(([k, v]) => ({ key: k, label: labels.get(k) ?? k, value: String(v) }))
})

function formatBytes(n: number): string {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return iso }
}

const visibilityLabel = computed(() => {
  if (visibility.value === 'intern') return 'Intern'
  if (visibility.value === 'closed') return 'Closed'
  return 'Public'
})

const ownerInitial = computed(() => {
  const name = resource.value?.ownerDisplayName || resource.value?.ownerUsername || '?'
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <div v-if="resource" class="resource">
    <div class="resource__main">
      <ResourcePreview v-if="previewPayload" :resource="previewPayload" />

      <section class="resource__info">
        <div class="resource__title-row">
          <h1 class="resource__title">{{ resource.title }}</h1>
          <span class="resource__visibility" :class="`resource__visibility--${visibility}`">
            {{ visibilityLabel }}
          </span>
        </div>

        <div v-if="hasOwner" class="publisher">
          <NuxtLink :to="`/u/${resource.ownerUsername}`" class="publisher__link">
            <span class="publisher__avatar-wrap">
              <img
                v-if="!avatarFailed"
                :src="avatarUrl"
                :alt="resource.ownerDisplayName || resource.ownerUsername"
                class="publisher__avatar"
                @error="onAvatarError"
              >
              <span v-else class="publisher__avatar publisher__avatar--fallback">
                {{ ownerInitial }}
              </span>
            </span>
            <span class="publisher__meta">
              <span class="publisher__name">{{ resource.ownerDisplayName || resource.ownerUsername }}</span>
              <span class="publisher__handle">@{{ resource.ownerUsername }}</span>
            </span>
          </NuxtLink>

          <span v-if="resource.publishedAt" class="publisher__date">
            Published {{ formatDate(resource.publishedAt) }}
          </span>
        </div>

        <p v-if="resource.description" class="resource__description">{{ resource.description }}</p>

        <div class="resource__actions">
          <a v-if="canDownload" :href="downloadUrl" class="action action--primary" download>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {{ resource.fileCount > 1 ? 'Download archive' : 'Download' }}
          </a>

          <button v-if="canCopyAssetLink" type="button" class="action action--primary" @click="copyAssetLink">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {{ copied ? 'Copied asset URL' : 'Copy asset URL' }}
          </button>

          <a v-if="canOpenAsset" :href="inlineUrl" target="_blank" rel="noopener" class="action action--ghost">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6M10 14 21 3" />
            </svg>
            Open asset
          </a>
        </div>

        <div v-if="visibility === 'intern'" class="resource__notice resource__notice--intern">
          Internal asset. It is served at a stable direct URL for team use. Use <strong>Copy asset URL</strong> to embed it in your project.
        </div>
        <div v-else-if="visibility === 'closed' && !isMember" class="resource__notice resource__notice--closed">
          This asset is restricted to team members.
        </div>
      </section>

      <section class="resource__details">
        <h2 class="resource__details-title">Details</h2>

        <dl class="detail-list">
          <div class="detail-list__row">
            <dt>Category</dt>
            <dd>{{ categoryLabel }}</dd>
          </div>
          <div v-if="resource.license" class="detail-list__row">
            <dt>License</dt>
            <dd>{{ resource.license }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>Size</dt>
            <dd>{{ formatBytes(resource.size) }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>Downloads</dt>
            <dd>
              <span class="detail-list__downloads">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                {{ resource.downloads }}
              </span>
            </dd>
          </div>
          <div v-if="resource.attribution" class="detail-list__row">
            <dt>Attribution</dt>
            <dd>{{ resource.attribution }}</dd>
          </div>
        </dl>

        <template v-if="metadataEntries.length > 0">
          <h3 class="resource__subhead">Metadata</h3>
          <dl class="detail-list">
            <div v-for="entry in metadataEntries" :key="entry.key" class="detail-list__row">
              <dt>{{ entry.label }}</dt>
              <dd>{{ entry.value }}</dd>
            </div>
          </dl>
        </template>

        <div v-if="resource.tags && resource.tags.length > 0" class="resource__tags">
          <span v-for="tag in resource.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.resource {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem;
}

.resource__main {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.resource__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.resource__title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.resource__visibility {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-fg-muted, #a3a3a3);

  &--general { color: #4ade80; }
  &--intern { color: #fbbf24; }
  &--closed { color: #f87171; }
}

.publisher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
  flex-wrap: wrap;
}

.publisher__link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  padding: 4px 8px 4px 4px;
  border-radius: 10px;
  transition: background 120ms;

  &:hover { background: rgba(255, 255, 255, 0.04); }
  &:hover .publisher__name { color: var(--color-accent, #8b5cf6); }
}

.publisher__avatar-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface-2, #1a1a1a);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.publisher__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.publisher__avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-accent, #8b5cf6);
  background: rgba(139, 92, 246, 0.12);
}

.publisher__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.publisher__name {
  font-size: 14px;
  font-weight: 500;
  transition: color 100ms;
}

.publisher__handle {
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
  font-family: var(--font-mono, monospace);
}

.publisher__date {
  font-size: 12px;
  color: var(--color-fg-muted, #a3a3a3);
}

.resource__description {
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--color-fg-muted, #a3a3a3);
  max-width: 72ch;
}

.resource__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 120ms, border-color 120ms;

  &--primary {
    background: var(--color-accent, #8b5cf6);
    color: white;

    &:hover { background: var(--color-accent-hover, #a855f7); }
  }

  &--ghost {
    background: transparent;
    color: var(--color-fg, #e5e7eb);
    border-color: var(--color-border, #262626);

    &:hover { border-color: var(--color-border-strong, #404040); }
  }
}

.resource__notice {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;

  &--intern {
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.25);
    color: #fcd34d;

    strong {
      color: #fde68a;
      font-weight: 600;
    }
  }

  &--closed {
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.25);
    color: #fca5a5;
  }
}

.resource__details {
  padding: 28px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
}

.resource__details-title {
  margin: 0 0 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.resource__subhead {
  margin: 28px 0 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.detail-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.detail-list__row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border, #262626);
  font-size: 14px;

  &:last-child { border-bottom: none; }

  dt {
    color: var(--color-fg-muted, #a3a3a3);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    align-self: center;
  }

  dd {
    margin: 0;
    color: var(--color-fg, #e5e7eb);
  }
}

.detail-list__downloads {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.resource__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 24px;
}

.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-fg-muted, #a3a3a3);
}
</style>