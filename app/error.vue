<template>
  <div class="error-page">
    <div class="error-page__content">
      <p class="error-page__eyebrow">Yannosay Resources</p>
      <h1 class="error-page__code">{{ code }}</h1>
      <p class="error-page__message">{{ message }}</p>
      <div class="error-page__actions">
        <NuxtLink to="/" class="error-page__link error-page__link--primary">Home</NuxtLink>
        <NuxtLink to="/browse" class="error-page__link">Browse resources</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string } | null
}>()

const statusCode = computed<number>(() => {
  const raw = props.error?.statusCode
  const numeric = Number(raw)
  if (!Number.isFinite(numeric) || numeric <= 0) return 500
  return numeric
})

const code = computed<string>(() => String(statusCode.value))

const message = computed<string>(() => {
  if (statusCode.value === 404) return 'This page does not exist.'
  if (statusCode.value === 403) return 'You do not have permission to view this page.'
  if (statusCode.value === 500) return 'Something went wrong on our end.'
  return 'The page could not be loaded.'
})
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--black);
  color: var(--white);
  text-align: center;
}

.error-page__content {
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-page__eyebrow {
  font-size: 0.6rem;
  font-weight: 200;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.error-page__code {
  font-family: var(--font-sans);
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.9;
  margin-bottom: 1rem;
}

.error-page__message {
  color: var(--muted);
  margin-bottom: 2.5rem;
  font-weight: 300;
}

.error-page__actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-page__link {
  display: inline-block;
  padding: 0.7rem 1.6rem;
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &--primary {
    background: rgba(255, 255, 255, 0.95);
    color: var(--black);
    border-color: rgba(255, 255, 255, 0.25);

    &:hover {
      background: #fff;
    }
  }
}
</style>