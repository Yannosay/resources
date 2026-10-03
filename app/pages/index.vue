<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_DEFS } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import ResourceCard from '~/components/ui/ResourceCard.vue'
import PillButton from '~/components/ui/PillButton.vue'

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

useHead({ title: 'Yannosay Resources' })

const { data: rawRecent } = await useFetch<unknown>('/api/public/resources')

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

const recent = computed<ResourceRecord[]>(() => {
  const all = extract(rawRecent.value)
  return all
    .filter(r => (r.visibility ?? 'general') === 'general')
    .filter(r => (r.status ?? 'published') === 'published')
    .slice(0, 6)
})

const categories = computed(() =>
  Object.entries(CATEGORY_DEFS as Record<string, { label?: string; description?: string }>).map(
    ([key, def]) => ({
      value: key,
      label: def?.label ?? key,
      description: def?.description ?? ''
    })
  )
)

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
</script>

<template>
  <div class="home">
    <section class="home__hero">
      <h1 class="home__hero-title">Yannosay Resources</h1>
      <p class="home__hero-subtitle">
        A curated library of production assets from Yannosay Productions.
      </p>
      <div class="home__hero-actions">
        <PillButton to="/browse">Browse the library</PillButton>
      </div>
    </section>

    <section class="home__section">
      <header class="home__section-head">
        <h2 class="home__section-title">Recently added</h2>
        <NuxtLink to="/browse" class="home__section-link">View all &rarr;</NuxtLink>
      </header>

      <div v-if="recent.length === 0" class="home__empty">
        <p class="home__empty-title">Nothing published yet</p>
        <p class="home__empty-text">The library is being populated. Check back soon.</p>
      </div>

      <div v-else class="home__grid">
        <ResourceCard v-for="r in recent" :key="r.slug" :resource="toCard(r)" />
      </div>
    </section>

    <section class="home__section">
      <header class="home__section-head">
        <h2 class="home__section-title">Browse by category</h2>
      </header>

      <div class="home__categories">
        <NuxtLink
          v-for="c in categories"
          :key="c.value"
          :to="`/browse/${c.value}`"
          class="home__category"
        >
          <span class="home__category-label">{{ c.label }}</span>
          <span v-if="c.description" class="home__category-desc">{{ c.description }}</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;

  &__hero {
    text-align: center;
    padding: 3rem 0 4rem;
  }

  &__hero-title {
    margin: 0 0 0.75rem;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  &__hero-subtitle {
    margin: 0 auto 2rem;
    max-width: 42rem;
    font-size: 1.125rem;
    color: var(--color-fg-muted, #a3a3a3);
  }

  &__hero-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  &__section {
    margin-top: 4rem;
  }

  &__section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  &__section-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  &__section-link {
    font-size: 0.9375rem;
    color: var(--color-fg-muted, #a3a3a3);
    text-decoration: none;

    &:hover {
      color: var(--color-fg, #fafafa);
    }
  }

  &__empty {
    padding: 4rem 1rem;
    text-align: center;
  }

  &__empty-title {
    margin: 0 0 0.5rem;
    font-weight: 600;
  }

  &__empty-text {
    margin: 0;
    color: var(--color-fg-muted, #a3a3a3);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }

  &__categories {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  &__category {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 1.25rem;
    background: var(--color-surface-2, #141414);
    border: 1px solid var(--color-border, #262626);
    border-radius: 0.75rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 120ms, transform 120ms;

    &:hover {
      border-color: var(--color-accent, #8b5cf6);
      transform: translateY(-2px);
    }
  }

  &__category-label {
    font-weight: 600;
  }

  &__category-desc {
    font-size: 0.8125rem;
    color: var(--color-fg-muted, #a3a3a3);
    line-height: 1.4;
  }
}
</style>