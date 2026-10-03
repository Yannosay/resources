<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_DEFS } from '~~/shared/resource'

/**
 * Category-specific metadata editor.
 *
 * Renders one input per field declared in CATEGORY_DEFS[category].fields.
 * The parent owns the metadata object; this component only emits updates.
 *
 * IMPORTANT: components:false is set in nuxt.config.ts -- every consumer
 * MUST import this file explicitly.
 *
 * Type note: callers store metadata as `Record<string, string | number>`
 * because category field definitions may hold numeric defaults (year,
 * bitrate, bpm, ...). We accept that union on the way in, and emit the
 * same union on the way out; user-typed values are always strings.
 */

export interface ResourceFieldDef {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'url' | 'number' | 'select'
  placeholder?: string
  hint?: string
  required?: boolean
  options?: ReadonlyArray<{ value: string; label: string }>
}

type MetadataMap = Record<string, string | number>

const props = withDefaults(
  defineProps<{
    category: string
    modelValue: MetadataMap
  }>(),
  {
    modelValue: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: MetadataMap): void
}>()

const def = computed(
  () => CATEGORY_DEFS[props.category as keyof typeof CATEGORY_DEFS]
)

const fields = computed<ResourceFieldDef[]>(() => {
  const raw = def.value?.fields as ResourceFieldDef[] | undefined
  return Array.isArray(raw) ? raw : []
})

function set(key: string, value: string): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function display(key: string): string {
  const v = props.modelValue[key]
  return v === undefined || v === null ? '' : String(v)
}
</script>

<template>
  <div v-if="fields.length" class="resource-fields">
    <div
      v-for="field in fields"
      :key="field.key"
      class="resource-field"
    >
      <label :for="`rf-${field.key}`" class="resource-field__label">
        {{ field.label }}
        <span v-if="field.required" aria-hidden="true">*</span>
      </label>

      <textarea
        v-if="field.type === 'textarea'"
        :id="`rf-${field.key}`"
        class="resource-field__control"
        :value="display(field.key)"
        :placeholder="field.placeholder"
        :required="field.required"
        rows="3"
        @input="set(field.key, ($event.target as HTMLTextAreaElement).value)"
      />

      <select
        v-else-if="field.type === 'select' && field.options?.length"
        :id="`rf-${field.key}`"
        class="resource-field__control"
        :value="display(field.key)"
        :required="field.required"
        @change="set(field.key, ($event.target as HTMLSelectElement).value)"
      >
        <option value="">-- Select --</option>
        <option
          v-for="opt in field.options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <input
        v-else
        :id="`rf-${field.key}`"
        class="resource-field__control"
        :type="field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'"
        :value="display(field.key)"
        :placeholder="field.placeholder"
        :required="field.required"
        @input="set(field.key, ($event.target as HTMLInputElement).value)"
      />

      <p v-if="field.hint" class="resource-field__hint">{{ field.hint }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.resource-fields {
  display: grid;
  gap: 1rem;
}

.resource-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-fg, #e5e7eb);
    letter-spacing: 0.01em;
  }

  &__control {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font: inherit;
    color: inherit;
    background: var(--color-surface-2, #18181b);
    border: 1px solid var(--color-border, #27272a);
    border-radius: 0.5rem;
    transition: border-color 120ms ease, box-shadow 120ms ease;

    &::placeholder {
      color: var(--color-fg-muted, #71717a);
    }

    &:focus {
      outline: none;
      border-color: var(--color-accent, #8b5cf6);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent, #8b5cf6) 25%, transparent);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__hint {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--color-fg-muted, #71717a);
  }
}
</style>