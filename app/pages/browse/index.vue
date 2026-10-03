<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { CATEGORY_DEFS } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import ResourceCard from '~/components/ui/ResourceCard.vue'

interface ResourceRecord {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  size: number
  downloads: number
  visibility?: ResourceVisibility
  status?: ResourceStatus
  ownerUsername?: string
  ownerDisplayName?: string
  mimeType?: string
  tags?: string[]
  previewUrl?: string | null
}

useHead({ title: 'Browse :: Yannosay Resources' })

const { data: session } = useFetch<{ authenticated: boolean; user?: { username: string; role: string } }>(
  '/api/auth/session',
  { key: 'browse-session', default: () => ({ authenticated: false }) }
)

const authenticated = computed(() => Boolean(session.value?.authenticated))

type LibraryMode = 'public' | 'members'
type MemberFilter = 'all' | 'intern' | 'closed'

const libraryMode = ref<LibraryMode>('public')
const memberFilter = ref<MemberFilter>('all')
const activeCategory = ref<string>('all')
const searchQuery = ref<string>('')

const { data: raw, pending } = await useFetch<unknown>('/api/public/resources')

function extract(input: unknown): ResourceRecord[] {
  let arr: unknown = input
  if (arr && typeof arr === 'object' && !Array.isArray(arr) && 'resources' in arr) {
    arr = (arr as { resources: unknown }).resources
  }
  if (!Array.isArray(arr)) return []
  return (arr as Array<Record<string, unknown>>).map(r => ({
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    description: r.description != null ? String(r.description) : '',
    category: (r.category != null ? String(r.category) : 'other') as ResourceCategory,
    size: Number(r.size ?? 0),
    downloads: Number(r.downloads ?? 0),
    visibility: r.visibility as ResourceVisibility | undefined,
    status: r.status as ResourceStatus | undefined,
    ownerUsername: r.ownerUsername != null ? String(r.ownerUsername) : undefined,
    ownerDisplayName: r.ownerDisplayName != null ? String(r.ownerDisplayName) : undefined,
    mimeType: r.mimeType != null ? String(r.mimeType) : undefined,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    previewUrl: r.previewUrl != null ? String(r.previewUrl) : null
  }))
}

const allResources = computed(() => extract(raw.value))

const scoped = computed<ResourceRecord[]>(() => {
  if (libraryMode.value === 'public') {
    return allResources.value.filter(r => (r.visibility ?? 'general') === 'general' && (r.status ?? 'published') === 'published')
  }
  const base = allResources.value.filter(r => {
    const v = r.visibility ?? 'general'
    return v === 'intern' || v === 'closed'
  })
  if (memberFilter.value === 'all') return base
  return base.filter(r => (r.visibility ?? 'general') === memberFilter.value)
})

const categories = computed(() =>
  Object.entries(CATEGORY_DEFS as Record<string, { label?: string }>).map(([key, def]) => ({
    value: key,
    label: def?.label ?? key
  }))
)

const filtered = computed<ResourceRecord[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return scoped.value.filter(r => {
    if (activeCategory.value !== 'all' && r.category !== activeCategory.value) return false
    if (q) {
      const hay = [r.title, r.description, r.ownerUsername, ...(r.tags ?? [])].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const groupedByCategory = computed(() => {
  const buckets = new Map<string, { category: string; label: string; resources: ResourceRecord[] }>()
  for (const r of filtered.value) {
    const cat = r.category || 'other'
    if (!buckets.has(cat)) {
      const def = (CATEGORY_DEFS as Record<string, { label?: string } | undefined>)[cat]
      buckets.set(cat, { category: cat, label: def?.label ?? cat, resources: [] })
    }
    buckets.get(cat)!.resources.push(r)
  }
  const order = new Map<string, number>()
  Object.keys(CATEGORY_DEFS).forEach((k, i) => order.set(k, i))
  return Array.from(buckets.values()).sort((a, b) => (order.get(a.category) ?? 999) - (order.get(b.category) ?? 999))
})

const isGrouped = computed(() => activeCategory.value === 'all' && searchQuery.value.trim().length === 0)

const memberCount = computed(() => allResources.value.filter(r => {
  const v = r.visibility ?? 'general'
  return v === 'intern' || v === 'closed'
}).length)

watch(authenticated, v => { if (!v && libraryMode.value === 'members') libraryMode.value = 'public' })
onMounted(() => {
  if (!authenticated.value && libraryMode.value === 'members') libraryMode.value = 'public'
})

function resourceToCard(r: ResourceRecord) {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    size: r.size,
    downloads: r.downloads,
    visibility: r.visibility,
    status: r.status,
    previewUrl: r.previewUrl ?? null,
    ownerUsername: r.ownerUsername,
    ownerDisplayName: r.ownerDisplayName
  }
}
</script>

<template>
  <div class="browse">
    <header class="browse__header">
      <div class="browse__heading">
        <h1>Browse</h1>
        <p v-if="libraryMode === 'public'">Public assets anyone can download.</p>
        <p v-else>Member library. Intern and closed assets for internal use.</p>
      </div>

      <div class="browse__library-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="library-tab"
          :class="{ 'library-tab--active': libraryMode === 'public' }"
          :aria-selected="libraryMode === 'public'"
          @click="libraryMode = 'public'"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          Public
        </button>
        <button
          v-if="authenticated"
          type="button"
          role="tab"
          class="library-tab"
          :class="{ 'library-tab--active': libraryMode === 'members' }"
          :aria-selected="libraryMode === 'members'"
          @click="libraryMode = 'members'"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          Member Library
          <span v-if="memberCount > 0" class="library-tab__count">{{ memberCount }}</span>
        </button>
      </div>
    </header>

    <div v-if="libraryMode === 'members' && authenticated" class="member-filters" role="tablist">
      <button
        type="button"
        role="tab"
        class="member-tab"
        :class="{ 'member-tab--active': memberFilter === 'all' }"
        :aria-selected="memberFilter === 'all'"
        @click="memberFilter = 'all'"
      >All</button>
      <button
        type="button"
        role="tab"
        class="member-tab"
        :class="{ 'member-tab--active': memberFilter === 'intern' }"
        :aria-selected="memberFilter === 'intern'"
        @click="memberFilter = 'intern'"
      >Intern</button>
      <button
        type="button"
        role="tab"
        class="member-tab"
        :class="{ 'member-tab--active': memberFilter === 'closed' }"
        :aria-selected="memberFilter === 'closed'"
        @click="memberFilter = 'closed'"
      >Closed</button>
    </div>

    <div class="browse__controls">
      <div class="browse__search-wrap">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          v-model="searchQuery"
          class="browse__search"
          type="search"
          placeholder="Search resources..."
          aria-label="Search resources"
        >
      </div>

      <div class="browse__pills" role="tablist">
        <button
          type="button"
          role="tab"
          class="browse__pill"
          :class="{ 'browse__pill--active': activeCategory === 'all' }"
          :aria-selected="activeCategory === 'all'"
          @click="activeCategory = 'all'"
        >All</button>
        <button
          v-for="c in categories"
          :key="c.value"
          type="button"
          role="tab"
          class="browse__pill"
          :class="{ 'browse__pill--active': activeCategory === c.value }"
          :aria-selected="activeCategory === c.value"
          @click="activeCategory = c.value"
        >{{ c.label }}</button>
      </div>
    </div>

    <p class="browse__count">
      {{ filtered.length }} {{ filtered.length === 1 ? 'resource' : 'resources' }}
    </p>

    <div v-if="!pending && filtered.length === 0" class="browse__empty">
      <p class="browse__empty-title">
        <template v-if="libraryMode === 'members'">No members-only assets in this view.</template>
        <template v-else>No resources match</template>
      </p>
      <p class="browse__empty-text">
        <template v-if="libraryMode === 'members'">Switch the filter or open a different category.</template>
        <template v-else>Try a different category or clear your search.</template>
      </p>
    </div>

    <template v-else-if="isGrouped">
      <section v-for="group in groupedByCategory" :key="group.category" class="browse__group">
        <h2 class="browse__group-title">
          {{ group.label }}
          <span class="browse__group-count">({{ group.resources.length }})</span>
        </h2>
        <div class="browse__grid">
          <ResourceCard
            v-for="r in group.resources"
            :key="r.slug"
            :resource="resourceToCard(r)"
            :show-visibility-badge="libraryMode === 'members'"
          />
        </div>
      </section>
    </template>

    <div v-else class="browse__grid">
      <ResourceCard
        v-for="r in filtered"
        :key="r.slug"
        :resource="resourceToCard(r)"
        :show-visibility-badge="libraryMode === 'members'"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.browse {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
}

.browse__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.browse__heading {
  h1 {
    margin: 0 0 4px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    color: var(--color-fg-muted, #a3a3a3);
    font-size: 14px;
  }
}

.browse__library-tabs {
  display: inline-flex;
  padding: 4px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 999px;
}

.library-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: transparent;
  border: none;
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms, color 120ms;

  &:hover { color: var(--color-fg, #e5e7eb); }

  &--active {
    background: var(--color-bg, #0a0a0a);
    color: var(--color-fg, #e5e7eb);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}

.library-tab__count {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.member-filters {
  display: inline-flex;
  gap: 4px;
  margin-top: 20px;
  padding: 4px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 999px;
}

.member-tab {
  padding: 5px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 12px;
  cursor: pointer;

  &:hover { color: var(--color-fg, #e5e7eb); }

  &--active {
    background: var(--color-fg, #e5e7eb);
    color: var(--color-bg, #0a0a0a);
  }
}

.browse__controls {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browse__search-wrap {
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 14px;
    color: var(--color-fg-muted, #a3a3a3);
    pointer-events: none;
  }
}

.browse__search {
  width: 100%;
  padding: 10px 14px 10px 42px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 10px;
  color: inherit;
  font: inherit;

  &:focus {
    outline: none;
    border-color: var(--color-accent, #8b5cf6);
  }
}

.browse__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.browse__pill {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-fg-muted, #a3a3a3);
  background: transparent;
  border: 1px solid var(--color-border, #262626);
  border-radius: 999px;
  cursor: pointer;
  transition: background 120ms, color 120ms, border-color 120ms;

  &:hover {
    color: var(--color-fg, #e5e7eb);
    border-color: var(--color-border-strong, #404040);
  }

  &--active {
    color: var(--color-bg, #0a0a0a);
    background: var(--color-fg, #e5e7eb);
    border-color: var(--color-fg, #e5e7eb);
  }
}

.browse__count {
  margin: 20px 0 16px;
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
}

.browse__empty {
  margin: 60px 0;
  text-align: center;
}

.browse__empty-title {
  margin: 0 0 6px;
  font-weight: 600;
  font-size: 15px;
}

.browse__empty-text {
  margin: 0;
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 13px;
}

.browse__group {
  margin-top: 32px;
}

.browse__group-title {
  margin: 0 0 14px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.browse__group-count {
  font-weight: 400;
  color: var(--color-fg-muted, #a3a3a3);
  margin-left: 6px;
}

.browse__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
</style>