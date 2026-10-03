<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORY_DEFS, RESOURCE_LICENSES } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus } from '~~/shared/resource'
import ResourceFields from '~/components/resource/ResourceFields.vue'
import CategoryIcon from '~/components/ui/CategoryIcon.vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

useHead({ title: 'Edit resource :: Admin', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

interface AdminResource {
  slug: string
  title: string
  description: string
  category: ResourceCategory
  visibility: ResourceVisibility
  status: ResourceStatus
  license: string
  tags: string[]
  attribution: string
  metadata: Record<string, string | number>
  size: number
  mimeType: string
  extension: string
  downloads: number
  ownerUsername: string
  ownerDisplayName: string
  uploadedAt: string
  updatedAt: string
  publishedAt: string
}

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.id ?? ''))

const { data: session } = await useFetch<{ authenticated: boolean; user?: { username: string; role: string } }>(
  '/api/auth/session',
  { key: 'edit-session', default: () => ({ authenticated: false }) }
)

const { data: rawResource, pending, error } = await useFetch<AdminResource>(
  () => `/api/admin/resources/${slug.value}`,
  { key: () => `admin-resource-${slug.value}` }
)

const errorMessage = computed(() => {
  const status = (error.value as { statusCode?: number } | null)?.statusCode
  if (status === 403) return 'You do not have permission to edit this resource.'
  if (status === 404) return 'Resource not found.'
  return 'Unable to load this resource.'
})

const isAdmin = computed(() => session.value?.user?.role === 'admin')
const currentUsername = computed(() => session.value?.user?.username ?? null)
const isOwner = computed(() => Boolean(rawResource.value) && rawResource.value!.ownerUsername === currentUsername.value)
const canEdit = computed(() => isAdmin.value || isOwner.value)

const title = ref('')
const description = ref('')
const visibility = ref<ResourceVisibility>('general')
const status = ref<ResourceStatus>('draft')
const license = ref('All Rights Reserved')
const tagsRaw = ref('')
const attribution = ref('')
const metadata = ref<Record<string, string | number>>({})

watch(rawResource, (r) => {
  if (!r) return
  title.value = r.title
  description.value = r.description ?? ''
  visibility.value = r.visibility
  status.value = r.status
  license.value = r.license ?? 'All Rights Reserved'
  tagsRaw.value = (r.tags ?? []).join(', ')
  attribution.value = r.attribution ?? ''
  metadata.value = { ...(r.metadata ?? {}) }
}, { immediate: true })

const category = computed<ResourceCategory>(() => rawResource.value?.category ?? 'other')
const categoryDef = computed(() => CATEGORY_DEFS[category.value])
const hasMetadataFields = computed(() => categoryDef.value.fields.length > 0)

const saving = ref(false)
const deleting = ref(false)
const actionMessage = ref<string | null>(null)
const actionError = ref(false)

const licenseOptions = RESOURCE_LICENSES.map(l => ({ value: l, label: l }))

const visibilityOptions: Array<{ value: ResourceVisibility; label: string; hint: string }> = [
  { value: 'general', label: 'General', hint: 'Public. Anyone can view and download.' },
  { value: 'intern', label: 'Intern', hint: 'Listed only in the member library. Copy asset URL for direct use.' },
  { value: 'closed', label: 'Closed', hint: 'Owner and admins only.' }
]

const statusOptions: Array<{ value: ResourceStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

const canSave = computed(() =>
  canEdit.value &&
  title.value.trim().length > 0 &&
  !saving.value
)

function tagsFrom(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

async function save(): Promise<void> {
  if (!canSave.value) return
  saving.value = true
  actionMessage.value = null
  actionError.value = false
  try {
    await $fetch(`/api/admin/resources/${slug.value}`, {
      method: 'PATCH',
      body: {
        title: title.value.trim(),
        description: description.value.trim(),
        visibility: visibility.value,
        status: status.value,
        license: license.value,
        tags: tagsFrom(tagsRaw.value),
        attribution: attribution.value.trim(),
        metadata: metadata.value
      }
    })
    actionMessage.value = 'Resource saved.'
    setTimeout(() => { if (actionMessage.value === 'Resource saved.') actionMessage.value = null }, 2400)
  } catch (err) {
    actionError.value = true
    actionMessage.value = String(err)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!rawResource.value) return
  const confirmed = window.confirm(`Delete "${rawResource.value.title}"? This cannot be undone.`)
  if (!confirmed) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/resources/${slug.value}`, { method: 'DELETE' })
    await router.push('/admin')
  } catch (err) {
    actionError.value = true
    actionMessage.value = String(err)
  } finally {
    deleting.value = false
  }
}

function formatBytes(n: number): string {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

const downloadUrl = computed(() => `/api/public/resources/${slug.value}/download`)
</script>

<template>
  <div class="edit">
    <header class="edit__header">
      <NuxtLink to="/admin" class="edit__back">&larr; Dashboard</NuxtLink>
      <h1 class="edit__title">{{ rawResource?.title ?? 'Resource' }}</h1>
      <div class="edit__subtitle">
        <code class="edit__slug">{{ rawResource?.slug ?? '' }}</code>
        <span
          v-if="rawResource"
          class="edit__status"
          :class="`edit__status--${rawResource.status}`"
        >{{ rawResource.status }}</span>
        <span
          v-if="rawResource"
          class="edit__visibility"
          :class="`edit__visibility--${rawResource.visibility}`"
        >{{ rawResource.visibility }}</span>
        <span v-if="!canEdit" class="edit__readonly">Read only</span>
      </div>
    </header>

    <p v-if="pending" class="edit__state">Loading&hellip;</p>
    <p v-else-if="error" class="edit__state edit__state--error">{{ errorMessage }}</p>

    <template v-else-if="rawResource">
      <section class="file-info">
        <div class="file-info__grid">
          <div class="file-info__cell">
            <span class="file-info__label">Category</span>
            <span class="file-info__value file-info__value--category">
              <CategoryIcon :category="category" :size="14" />
              {{ categoryDef.label }}
            </span>
            <span class="file-info__hint">Cannot be changed after upload.</span>
          </div>
          <div class="file-info__cell">
            <span class="file-info__label">Size</span>
            <span class="file-info__value">{{ formatBytes(rawResource.size) }}</span>
          </div>
          <div class="file-info__cell">
            <span class="file-info__label">Downloads</span>
            <span class="file-info__value">{{ rawResource.downloads }}</span>
          </div>
          <div class="file-info__cell">
            <span class="file-info__label">Owner</span>
            <span class="file-info__value">{{ rawResource.ownerDisplayName || rawResource.ownerUsername || 'Unknown' }}</span>
          </div>
          <div class="file-info__cell">
            <span class="file-info__label">Uploaded</span>
            <span class="file-info__value">{{ formatDate(rawResource.uploadedAt) }}</span>
          </div>
          <div class="file-info__cell">
            <span class="file-info__label">Updated</span>
            <span class="file-info__value">{{ formatDate(rawResource.updatedAt) }}</span>
          </div>
        </div>
      </section>

      <form class="form" @submit.prevent="save">
        <section class="form__section">
          <h2 class="form__section-title">Basic info</h2>

          <div class="field">
            <label for="f-title">Title</label>
            <input
              id="f-title"
              v-model="title"
              type="text"
              :disabled="!canEdit"
              placeholder="Resource title"
            >
          </div>

          <div class="field">
            <label for="f-desc">Description</label>
            <textarea
              id="f-desc"
              v-model="description"
              rows="4"
              :disabled="!canEdit"
              placeholder="Short summary"
            ></textarea>
          </div>

          <div class="field">
            <label>Visibility</label>
            <div class="choices">
              <button
                v-for="v in visibilityOptions"
                :key="v.value"
                type="button"
                class="choice"
                :class="{ 'choice--active': visibility === v.value }"
                :disabled="!canEdit"
                @click="visibility = v.value"
              >
                <span class="choice__label">{{ v.label }}</span>
                <span class="choice__hint">{{ v.hint }}</span>
              </button>
            </div>
          </div>

          <div class="field">
            <label>Status</label>
            <div class="choices choices--compact">
              <button
                v-for="s in statusOptions"
                :key="s.value"
                type="button"
                class="choice choice--compact"
                :class="{ 'choice--active': status === s.value }"
                :disabled="!canEdit"
                @click="status = s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </section>

        <section class="form__section">
          <h2 class="form__section-title">Metadata</h2>

          <div class="field">
            <label for="f-license">License</label>
            <select id="f-license" v-model="license" :disabled="!canEdit" class="select">
              <option v-for="opt in licenseOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="field">
            <label for="f-tags">Tags</label>
            <input
              id="f-tags"
              v-model="tagsRaw"
              type="text"
              :disabled="!canEdit"
              placeholder="music, orchestral, cinematic"
            >
            <p class="field__hint">Comma-separated.</p>
          </div>

          <div class="field">
            <label for="f-attr">Attribution</label>
            <input
              id="f-attr"
              v-model="attribution"
              type="text"
              :disabled="!canEdit"
              placeholder="Composer name or required credit"
            >
          </div>

          <div v-if="hasMetadataFields" class="field field--wide">
            <label>{{ categoryDef.label }} details</label>
            <ResourceFields
              :category="category"
              :model-value="metadata"
              @update:model-value="metadata = $event"
            />
          </div>
        </section>

        <p
          v-if="actionMessage"
          class="alert"
          :class="actionError ? 'alert--error' : 'alert--success'"
        >{{ actionMessage }}</p>

        <div class="form__footer">
          <a :href="downloadUrl" class="btn btn--ghost" download>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Download file
          </a>
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="!canSave"
          >
            {{ saving ? 'Saving\u2026' : 'Save changes' }}
          </button>
        </div>
      </form>

      <section v-if="canEdit" class="danger">
        <h2 class="danger__title">Danger zone</h2>
        <p class="danger__body">
          Deleting this resource removes the file from storage permanently. This cannot be undone.
        </p>
        <button
          type="button"
          class="btn btn--danger"
          :disabled="deleting"
          @click="confirmDelete"
        >
          {{ deleting ? 'Deleting\u2026' : 'Delete resource' }}
        </button>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.edit {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
}

.edit__header {
  margin-bottom: 28px;
}

.edit__back {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
  text-decoration: none;

  &:hover { color: var(--color-fg, #e5e7eb); }
}

.edit__title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.edit__subtitle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
}

.edit__slug {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
  background: var(--color-surface, #141414);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border, #262626);
}

.edit__status,
.edit__visibility,
.edit__readonly {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
}

.edit__status--published { background: rgba(74, 222, 128, 0.12); color: #4ade80; }
.edit__status--draft { background: rgba(163, 163, 163, 0.12); color: #a3a3a3; }
.edit__status--archived { background: rgba(163, 163, 163, 0.12); color: #a3a3a3; }

.edit__visibility--general { background: rgba(74, 222, 128, 0.12); color: #4ade80; }
.edit__visibility--intern { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
.edit__visibility--closed { background: rgba(248, 113, 113, 0.12); color: #f87171; }

.edit__readonly {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.edit__state {
  padding: 40px;
  text-align: center;
  color: var(--color-fg-muted, #a3a3a3);

  &--error { color: #fca5a5; }
}

.file-info {
  margin-bottom: 28px;
  padding: 20px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
}

.file-info__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.file-info__cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-info__label {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.file-info__value {
  font-size: 14px;
  color: var(--color-fg, #e5e7eb);

  &--category {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.file-info__hint {
  font-size: 11px;
  color: var(--color-fg-subtle, #6b7280);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form__section {
  padding: 24px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form__section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-fg-muted, #a3a3a3);
  }

  input,
  textarea,
  select,
  .select {
    width: 100%;
    padding: 10px 12px;
    background: var(--color-surface-2, #1a1a1a);
    border: 1px solid var(--color-border, #262626);
    border-radius: 10px;
    color: inherit;
    font: inherit;
    font-size: 13px;

    &:focus {
      outline: none;
      border-color: var(--color-accent, #8b5cf6);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
}

.field--wide {
  grid-column: 1 / -1;
}

.field__hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-fg-subtle, #6b7280);
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choices--compact {
  flex-direction: row;
  flex-wrap: wrap;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 10px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  font: inherit;

  &:hover:not(:disabled) { border-color: var(--color-border-strong, #404040); }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--active {
    border-color: var(--color-accent, #8b5cf6);
    background: rgba(139, 92, 246, 0.08);
  }

  &--compact {
    flex-direction: row;
    align-items: center;
    padding: 6px 14px;
    font-size: 12px;
  }
}

.choice__label {
  font-size: 13px;
  font-weight: 500;
}

.choice__hint {
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
  line-height: 1.4;
}

.alert {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;

  &--error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
  }

  &--success {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.25);
    color: #86efac;
  }
}

.form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.danger {
  margin-top: 40px;
  padding: 24px;
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
}

.danger__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f87171;
}

.danger__body {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
  line-height: 1.55;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 120ms, border-color 120ms;

  &--primary {
    background: var(--color-accent, #8b5cf6);
    color: white;

    &:hover:not(:disabled) { background: var(--color-accent-hover, #a855f7); }
  }

  &--ghost {
    background: transparent;
    color: var(--color-fg, #e5e7eb);
    border-color: var(--color-border, #262626);

    &:hover:not(:disabled) { border-color: var(--color-border-strong, #404040); }
  }

  &--danger {
    background: transparent;
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.3);

    &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.08); }
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>