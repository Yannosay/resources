<script setup lang="ts">
import { computed, ref } from 'vue'
import { CATEGORY_DEFS } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import ResourceCard from '~/components/ui/ResourceCard.vue'

const route = useRoute()
const categoryKey = computed(() => String(route.params.category ?? ''))

const def = computed(() => {
  const entry = (CATEGORY_DEFS as Record<string, { label?: string; description?: string } | undefined>)[categoryKey.value]
  return entry ?? null
})

if (!def.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown category' })
}

useHead({ title: `${def.value?.label ?? categoryKey.value} :: Browse :: Yannosay Resources` })

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
  previewUrl?: string | null
}

const { data: raw } = await useFetch<unknown>('/api/public/resources')

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
    previewUrl: r.previewUrl != null ? String(r.previewUrl) : null
  }))
}

const items = computed(() => extract(raw.value).filter(r =>
  r.category === categoryKey.value &&
  (r.visibility ?? 'general') === 'general' &&
  (r.status ?? 'published') === 'published'
))

function toCard(r: ResourceRecord) {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    size: r.size,
    downloads: r.downloads,
    previewUrl: r.previewUrl ?? null,
    ownerUsername: r.ownerUsername,
    ownerDisplayName: r.ownerDisplayName
  }
}

const searchQuery = ref('')
const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(r => [r.title, r.description].filter(Boolean).join(' ').toLowerCase().includes(q))
})
</script>

<template>
  <div class="category-page">
    <header class="category-page__head">
      <NuxtLink to="/browse" class="category-page__back">&larr; All categories</NuxtLink>
      <h1 class="category-page__title">{{ def?.label ?? categoryKey }}</h1>
      <p v-if="def?.description" class="category-page__desc">{{ def.description }}</p>
    </header>

    <input v-model="searchQuery" class="category-page__search" type="search" placeholder="Search in this category...">

    <p class="category-page__count">{{ filtered.length }} {{ filtered.length === 1 ? 'resource' : 'resources' }}</p>

    <div v-if="filtered.length === 0" class="category-page__empty">
      <p>Nothing here yet.</p>
    </div>

    <div v-else class="category-page__grid">
      <ResourceCard v-for="r in filtered" :key="r.slug" :resource="toCard(r)" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.category-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
}

.category-page__back {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
  text-decoration: none;

  &:hover { color: var(--color-fg, #e5e7eb); }
}

.category-page__title {
  margin: 0 0 6px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.category-page__desc {
  margin: 0 0 24px;
  color: var(--color-fg-muted, #a3a3a3);
}

.category-page__search {
  width: 100%;
  padding: 10px 14px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 10px;
  color: inherit;
  font: inherit;

  &:focus { outline: none; border-color: var(--color-accent, #8b5cf6); }
}

.category-page__count {
  margin: 20px 0 16px;
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
}

.category-page__empty {
  margin: 60px 0;
  text-align: center;
  color: var(--color-fg-muted, #a3a3a3);
}

.category-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
</style>