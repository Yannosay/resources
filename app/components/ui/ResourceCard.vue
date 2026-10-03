<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import CategoryIcon from '~/components/ui/CategoryIcon.vue'

export interface ResourceSummary {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  size: number
  downloads: number
  visibility?: ResourceVisibility
  status?: ResourceStatus
  previewUrl?: string | null
  ownerUsername?: string
  ownerDisplayName?: string
}

const props = withDefaults(defineProps<{
  resource: ResourceSummary
  showVisibilityBadge?: boolean
  showStatusBadge?: boolean
  showOwner?: boolean
}>(), {
  showVisibilityBadge: false,
  showStatusBadge: false,
  showOwner: true
})

const categoryKey = computed(() => props.resource.category)

const sizeLabel = computed(() => formatBytes(props.resource.size))

const visibilityLabel = computed(() => {
  if (props.resource.visibility === 'intern') return 'Intern'
  if (props.resource.visibility === 'closed') return 'Closed'
  return null
})

const statusLabel = computed(() => {
  if (props.resource.status === 'draft') return 'Draft'
  if (props.resource.status === 'archived') return 'Archived'
  return null
})

function formatBytes(n: number): string {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDownloads(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1000000).toFixed(1)}M`
}
</script>

<template>
  <NuxtLink :to="`/resource/${resource.slug}`" class="card">
    <div class="card__preview" :class="`card__preview--${categoryKey}`">
      <img
        v-if="resource.previewUrl"
        :src="resource.previewUrl"
        :alt="resource.title"
        loading="lazy"
        class="card__image"
      >
      <template v-else>
        <div class="card__gradient" />
        <div class="card__placeholder">
          <CategoryIcon :category="categoryKey" :size="40" />
          <span class="card__placeholder-label">{{ categoryKey.toUpperCase() }}</span>
        </div>
      </template>

      <span v-if="showVisibilityBadge && visibilityLabel" class="card__badge card__badge--visibility" :class="`card__badge--${resource.visibility}`">
        {{ visibilityLabel }}
      </span>
      <span v-if="showStatusBadge && statusLabel" class="card__badge card__badge--status" :class="`card__badge--${resource.status}`">
        {{ statusLabel }}
      </span>
    </div>

    <div class="card__body">
      <h3 class="card__title truncate">{{ resource.title }}</h3>
      <p v-if="resource.description" class="card__description">{{ resource.description }}</p>

      <div class="card__meta">
        <span v-if="showOwner && resource.ownerDisplayName" class="card__owner truncate">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          {{ resource.ownerDisplayName }}
        </span>
        <span class="card__stats">
          <span class="card__stat">{{ sizeLabel }}</span>
          <span class="card__dot">·</span>
          <span class="card__stat card__stat--downloads" :title="`${resource.downloads} downloads`">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {{ formatDownloads(resource.downloads) }}
          </span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 140ms ease, transform 140ms ease;
  height: 100%;

  &:hover {
    border-color: var(--color-border-strong, #404040);
    transform: translateY(-2px);
  }
}

.card__preview {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0e0e13;
}

.card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card__gradient {
  position: absolute;
  inset: 0;
  opacity: 0.9;
}

.card__preview--images .card__gradient {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(139, 92, 246, 0.08));
}

.card__preview--audio .card__gradient {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(219, 39, 119, 0.08));
}

.card__preview--video .card__gradient {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(37, 99, 235, 0.08));
}

.card__preview--code .card__gradient {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.22), rgba(22, 163, 74, 0.08));
}

.card__preview--templates .card__gradient {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.08));
}

.card__preview--documents .card__gradient {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(2, 132, 199, 0.08));
}

.card__preview--fonts .card__gradient {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(168, 85, 247, 0.08));
}

.card__preview--archives .card__gradient {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(100, 116, 139, 0.08));
}

.card__preview--other .card__gradient {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.22), rgba(75, 85, 99, 0.08));
}

.card__placeholder {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.card__placeholder-label {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.45);
}

.card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  color: #e5e7eb;
}

.card__badge--intern { color: #fbbf24; }
.card__badge--closed { color: #f87171; }
.card__badge--draft { color: #a3a3a3; }
.card__badge--archived { color: #a3a3a3; }

.card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 96px;
}

.card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.card__description {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-fg-muted, #a3a3a3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
  min-width: 0;
}

.card__owner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.card__stats {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.card__stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.card__stat--downloads {
  color: var(--color-fg, #e5e7eb);
}

.card__dot {
  opacity: 0.5;
}
</style>