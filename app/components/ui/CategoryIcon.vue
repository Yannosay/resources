<template>
  <svg
    class="category-icon"
    :viewBox="'0 0 24 24'"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="category === 'images'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </template>

    <template v-else-if="category === 'audio'">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </template>

    <template v-else-if="category === 'video'">
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <path d="M22 8l-6 4 6 4V8z" />
    </template>

    <template v-else-if="category === 'code'">
      <polyline points="9 18 3 12 9 6" />
      <polyline points="15 6 21 12 15 18" />
    </template>

    <template v-else-if="category === 'documents'">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </template>

    <template v-else-if="category === 'fonts'">
      <path d="M4 20l6-16 6 16" />
      <line x1="6" y1="14" x2="14" y2="14" />
      <line x1="17" y1="20" x2="22" y2="20" />
      <line x1="19.5" y1="12" x2="19.5" y2="20" />
    </template>

    <template v-else-if="category === 'templates'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </template>

    <template v-else-if="category === 'archives'">
      <path d="M3 7l2-4h14l2 4" />
      <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </template>

    <template v-else>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceCategory } from '~~/shared/resource'

const props = withDefaults(defineProps<{
  category: ResourceCategory
  size?: number
  strokeWidth?: number
}>(), {
  size: 24,
  strokeWidth: 1.5
})

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  images: '#a78bfa',
  audio: '#f472b6',
  sfx: '#f97316',
  video: '#60a5fa',
  code: '#4ade80',
  templates: '#2dd4bf',
  documents: '#fbbf24',
  fonts: '#fb923c',
  archives: '#f87171',
  other: '#a3a3a3'
}

const color = computed(() => CATEGORY_COLORS[props.category] ?? CATEGORY_COLORS.other)
</script>

<style scoped>
.category-icon {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
