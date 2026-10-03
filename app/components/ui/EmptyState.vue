<template>
  <div class="empty-state">
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.empty-state {
  padding: 3.5rem 0;
  text-align: center;
}

.empty-state__title {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--fg);
  margin-bottom: 0.35rem;
}

.empty-state__description {
  font-size: 0.85rem;
  color: var(--fg-muted);
  line-height: 1.6;
  max-width: 42ch;
  margin: 0 auto;
}

.empty-state__action {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>