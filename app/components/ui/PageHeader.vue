<template>
  <header class="page-header">
    <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
    <h1 class="page-header__title">{{ title }}</h1>
    <p v-if="lede" class="page-header__lede">{{ lede }}</p>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  lede?: string
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.page-header__eyebrow {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fg-dim);
  margin: 0;
}

.page-header__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.5rem, 3.2vw, 2rem);
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--fg);
  margin: 0;
}

.page-header__lede {
  font-size: 0.9rem;
  color: var(--fg-muted);
  line-height: 1.7;
  max-width: 60ch;
  margin: 0;
}

.page-header__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
</style>