<template>
  <div
    ref="wrapperRef"
    :class="['select', { 'select--open': open, 'select--disabled': disabled }]"
  >
    <button
      ref="triggerRef"
      type="button"
      class="select__trigger"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listboxId"
      aria-haspopup="listbox"
      :disabled="disabled"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="select__value">{{ selectedLabel }}</span>
      <svg
        class="select__chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Transition name="select-pop">
      <ul
        v-if="open"
        :id="listboxId"
        ref="listboxRef"
        class="select__menu"
        role="listbox"
        tabindex="-1"
        @keydown="onListboxKeydown"
      >
        <li
          v-for="(option, index) in options"
          :key="option.value"
          :ref="(el) => setOptionRef(el, index)"
          :class="[
            'select__option',
            { 'select__option--active': index === activeIndex },
            { 'select__option--selected': option.value === modelValue }
          ]"
          role="option"
          :aria-selected="option.value === modelValue ? 'true' : 'false'"
          @click="select(option.value)"
          @mouseenter="activeIndex = index"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface CustomSelectOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: CustomSelectOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const listboxRef = ref<HTMLUListElement | null>(null)
const optionRefs = ref<Array<HTMLLIElement | null>>([])
const open = ref(false)
const activeIndex = ref(0)

const listboxId = `cs-${Math.random().toString(36).slice(2, 9)}`

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found?.label ?? ''
})

function toggle(): void {
  if (props.disabled) return
  open.value = !open.value
}

function select(value: string): void {
  emit('update:modelValue', value)
  open.value = false
  nextTick(() => {
    triggerRef.value?.focus()
  })
}

function setOptionRef(el: unknown, index: number): void {
  if (el instanceof HTMLLIElement) {
    optionRefs.value[index] = el
  } else {
    optionRefs.value[index] = null
  }
}

function openWithActive(): void {
  const selectedIdx = props.options.findIndex(o => o.value === props.modelValue)
  activeIndex.value = selectedIdx >= 0 ? selectedIdx : 0
  open.value = true
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    openWithActive()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openWithActive()
  }
}

function onListboxKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1)
    scrollActiveIntoView()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActiveIntoView()
  } else if (event.key === 'Home') {
    event.preventDefault()
    activeIndex.value = 0
    scrollActiveIntoView()
  } else if (event.key === 'End') {
    event.preventDefault()
    activeIndex.value = props.options.length - 1
    scrollActiveIntoView()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const option = props.options[activeIndex.value]
    if (option) select(option.value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    open.value = false
    nextTick(() => {
      triggerRef.value?.focus()
    })
  } else if (event.key === 'Tab') {
    open.value = false
  }
}

function scrollActiveIntoView(): void {
  nextTick(() => {
    const el = optionRefs.value[activeIndex.value]
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onClickOutside(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Node)) return
  if (wrapperRef.value?.contains(target)) return
  open.value = false
}

watch(open, async (next) => {
  if (next) {
    await nextTick()
    listboxRef.value?.focus()
  }
})

watch(() => props.disabled, (next) => {
  if (next) open.value = false
})

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style lang="scss" scoped>
.select {
  position: relative;
  width: 100%;
  min-width: 0;
}

.select__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  color: #f5f5f6;
  background: rgba(245, 245, 246, 0.03);
  border: 1px solid rgba(245, 245, 246, 0.08);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background-color 0.15s;
}

.select__trigger:hover:not(:disabled) {
  border-color: rgba(245, 245, 246, 0.15);
  background: rgba(245, 245, 246, 0.04);
}

.select__trigger:focus-visible {
  outline: none;
  border-color: rgba(245, 245, 246, 0.55);
}

.select__trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select--open .select__trigger {
  border-color: rgba(245, 245, 246, 0.55);
  background: rgba(245, 245, 246, 0.05);
}

.select__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select__chevron {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: rgba(245, 245, 246, 0.4);
  transition: transform 0.15s;
}

.select--open .select__chevron {
  transform: rotate(180deg);
}

.select__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 16rem;
  overflow-y: auto;
  list-style: none;
  padding: 0.3rem;
  margin: 0;
  background: #141416;
  border: 1px solid rgba(245, 245, 246, 0.1);
  border-radius: 8px;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.9);
}

.select__menu:focus {
  outline: none;
}

.select__option {
  padding: 0.55rem 0.75rem;
  border-radius: 5px;
  font-size: 0.85rem;
  color: rgba(245, 245, 246, 0.75);
  cursor: pointer;
  transition: background-color 0.1s, color 0.1s;
}

.select__option--active {
  background: rgba(245, 245, 246, 0.06);
  color: #f5f5f6;
}

.select__option--selected {
  color: #f5f5f6;
  font-weight: 500;
}

.select__option--selected.select__option--active {
  background: rgba(245, 245, 246, 0.09);
}

.select-pop-enter-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.select-pop-leave-active {
  transition: opacity 0.08s ease, transform 0.08s ease;
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .select-pop-enter-active,
  .select-pop-leave-active,
  .select__chevron {
    transition-duration: 0.001ms;
  }
}
</style>