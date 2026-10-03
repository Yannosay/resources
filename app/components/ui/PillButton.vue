<script setup lang="ts">
/**
 * PillButton -- rounded call-to-action.
 *
 *   to="/path"    -> <RouterLink>  (SPA navigation)
 *   href="..."    -> <a>           (external / full page load)
 *   neither       -> <button>
 *
 * RouterLink is imported explicitly because nuxt.config.ts sets
 * `components: false`, so no component auto-resolution is guaranteed.
 */
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    to?: string
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    variant?: 'default' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    type: 'button',
    variant: 'default',
    size: 'md',
  }
)
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    class="pill-button"
    :class="[`pill-button--${variant}`, `pill-button--${size}`]"
  >
    <slot />
  </RouterLink>
  <a
    v-else-if="href"
    :href="href"
    class="pill-button"
    :class="[`pill-button--${variant}`, `pill-button--${size}`]"
  >
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    class="pill-button"
    :class="[`pill-button--${variant}`, `pill-button--${size}`]"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font: inherit;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  color: inherit;
  background: transparent;
  border: 1px solid var(--color-border-strong, #404040);
  border-radius: 999px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;

  &:hover:not(:disabled) {
    background: var(--color-surface-2, #141414);
    border-color: var(--color-fg-muted, #a3a3a3);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--ghost {
    border-color: transparent;

    &:hover:not(:disabled) {
      background: var(--color-surface-2, #141414);
    }
  }

  &--sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  &--lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
}
</style>