<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORY_DEFS, RESOURCE_LICENSES } from '~~/shared/resource'
import type { ResourceCategory, ResourceVisibility, ResourceStatus, ResourceFieldDef } from '~~/shared/resource'
import ResourceFields from '~/components/resource/ResourceFields.vue'
import CategoryIcon from '~/components/ui/CategoryIcon.vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

useHead({ title: 'Upload resource :: Admin', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

type Step = 'category' | 'details'

const router = useRouter()

const step = ref<Step>('category')
const category = ref<ResourceCategory | null>(null)

const title = ref('')
const slug = ref('')
const description = ref('')
const visibility = ref<ResourceVisibility>('general')
const status = ref<ResourceStatus>('draft')
const license = ref('All Rights Reserved')
const tagsRaw = ref('')
const attribution = ref('')
const metadata = ref<Record<string, string | number>>({})

const files = ref<File[]>([])
const coverFile = ref<File | null>(null)

const saving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const categoryDef = computed(() => category.value ? CATEGORY_DEFS[category.value] : null)
const uploadCfg = computed(() => categoryDef.value?.upload ?? null)

const allCategories = computed(() =>
  (Object.entries(CATEGORY_DEFS) as Array<[ResourceCategory, typeof CATEGORY_DEFS[ResourceCategory]]>).map(([key, def]) => ({
    key,
    label: def.label,
    description: def.description,
    mark: def.mark
  }))
)

const licenseOptions = RESOURCE_LICENSES.map(l => ({ value: l, label: l }))

const visibilityOptions: Array<{ value: ResourceVisibility; label: string; hint: string }> = [
  { value: 'general', label: 'General', hint: 'Public. Anyone can view and download.' },
  { value: 'intern', label: 'Intern', hint: 'Public URL, not listed, no download button. Use copy source link.' },
  { value: 'closed', label: 'Closed', hint: 'Owner and admins only. Members can download.' }
]

const statusOptions: Array<{ value: ResourceStatus; label: string; hint: string }> = [
  { value: 'draft', label: 'Draft', hint: 'Not yet visible to members.' },
  { value: 'published', label: 'Published', hint: 'Visible per visibility rules.' },
  { value: 'archived', label: 'Archived', hint: 'Hidden from every list.' }
]

function pickCategory(key: ResourceCategory): void {
  category.value = key
  metadata.value = {}
  const accepted = CATEGORY_DEFS[key].upload.accept.join(',')
  if (accepted) { /* accept is applied via input attr */ }
  step.value = 'details'
}

function backToCategory(): void {
  step.value = 'category'
  category.value = null
  files.value = []
  coverFile.value = null
  metadata.value = {}
}

const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)

const acceptAttr = computed(() => {
  if (!uploadCfg.value) return ''
  return uploadCfg.value.accept.filter(a => a !== '*').join(',')
})

const allowFolder = computed(() => uploadCfg.value?.kind === 'folder' || uploadCfg.value?.kind === 'folder-or-file')
const allowMultiple = computed(() => uploadCfg.value?.kind === 'multi-file' || allowFolder.value)
const allowSingle = computed(() => uploadCfg.value?.kind === 'single-file' || uploadCfg.value?.kind === 'multi-file' || uploadCfg.value?.kind === 'folder-or-file')

function onPickFiles(e: Event): void {
  const target = e.target as HTMLInputElement
  const list = Array.from(target.files ?? [])
  if (list.length === 0) return

  if (uploadCfg.value?.kind === 'single-file' || uploadCfg.value?.kind === 'folder') {
    files.value = list.slice(0, uploadCfg.value.maxFiles)
  } else {
    const merged = [...files.value, ...list]
    files.value = merged.slice(0, uploadCfg.value?.maxFiles ?? 500)
  }

  const firstPicked = files.value[0]
  if (firstPicked && !title.value) {
    title.value = stripExtension(firstPicked.name)
  }
  if (!slug.value && title.value) {
    slug.value = toSlug(title.value)
  }
  target.value = ''
}

function onPickFolder(e: Event): void {
  const target = e.target as HTMLInputElement
  const list = Array.from(target.files ?? [])
  if (list.length === 0) return
  const limit = uploadCfg.value?.maxFiles ?? 500
  files.value = list.slice(0, limit)
  const firstPicked = files.value[0]
  if (firstPicked && !title.value) {
    const parts = (firstPicked.webkitRelativePath || firstPicked.name).split('/')
    title.value = parts[0] || stripExtension(firstPicked.name)
  }
  if (!slug.value && title.value) slug.value = toSlug(title.value)
  target.value = ''
}

function onPickCover(e: Event): void {
  const target = e.target as HTMLInputElement
  const list = Array.from(target.files ?? [])
  if (list.length === 0) return
  const firstPicked = list[0]
  if (firstPicked) coverFile.value = firstPicked
  target.value = ''
}

function removeFile(index: number): void {
  files.value.splice(index, 1)
}

function removeCover(): void {
  coverFile.value = null
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

function toSlug(input: string): string {
  return input.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function totalSize(): number {
  return files.value.reduce((acc, f) => acc + f.size, 0)
}

const canSubmit = computed(() =>
  step.value === 'details' &&
  !!category.value &&
  title.value.trim().length > 0 &&
  slug.value.trim().length > 0 &&
  files.value.length > 0
)

async function submit(): Promise<void> {
  if (!canSubmit.value || !category.value) return
  saving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const form = new FormData()
    if (files.value.length === 0) {
      errorMessage.value = 'No files selected.'
      saving.value = false
      return
    }

    for (const file of files.value) {
      const relative = file.webkitRelativePath && file.webkitRelativePath.length > 0
        ? file.webkitRelativePath
        : file.name
      form.append('files', file, relative)
    }

    if (coverFile.value) {
      form.append('cover', coverFile.value, coverFile.value.name)
    }

    form.append('slug', slug.value.trim())
    form.append('title', title.value.trim())
    form.append('description', description.value.trim())
    form.append('category', category.value)
    form.append('visibility', visibility.value)
    form.append('status', status.value)
    form.append('license', license.value)
    form.append('tags', tagsRaw.value.trim())
    form.append('attribution', attribution.value.trim())
    form.append('metadata', JSON.stringify(metadata.value))

    const response = await $fetch<{ ok: boolean; slug?: string; id?: string }>('/api/admin/resources', {
      method: 'POST',
      body: form
    })

    successMessage.value = 'Resource uploaded.'
    const target = response.slug ?? response.id ?? slug.value.trim()
    setTimeout(() => { void router.push(`/admin/resource/${target}`) }, 500)
  } catch (err) {
    errorMessage.value = String(err)
  } finally {
    saving.value = false
  }
}

watch(metadata, () => { /* noop: watch kept so component stays reactive */ }, { deep: true })
</script>

<template>
  <div class="upload">
    <header class="upload__header">
      <h1 class="upload__title">New resource</h1>
      <p class="upload__subtitle">
        <template v-if="step === 'category'">Pick the category first. The upload form adapts to it.</template>
        <template v-else>Uploading as <strong>{{ categoryDef?.label }}</strong>.</template>
      </p>
    </header>

    <section v-if="step === 'category'" class="picker">
      <button
        v-for="c in allCategories"
        :key="c.key"
        type="button"
        class="picker__card"
        @click="pickCategory(c.key)"
      >
        <div class="picker__icon">
          <CategoryIcon :category="c.key" :size="32" />
        </div>
        <div class="picker__label">{{ c.label }}</div>
        <div class="picker__desc">{{ c.description }}</div>
        <div class="picker__hint">{{ CATEGORY_DEFS[c.key].upload.hint }}</div>
      </button>
    </section>

    <section v-else class="form">
      <div class="form__row form__row--header">
        <button type="button" class="form__back" @click="backToCategory">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Change category
        </button>
        <div class="form__category-pill">
          <CategoryIcon :category="category!" :size="14" />
          {{ categoryDef?.label }}
        </div>
      </div>

      <div class="form__grid">
        <div class="form__column form__column--files">
          <h2 class="form__section-title">Files</h2>

          <div
            v-if="files.length === 0"
            class="dropzone"
            @click="allowFolder ? folderInput?.click() : fileInput?.click()"
          >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
            <p class="dropzone__title">
              <template v-if="uploadCfg?.kind === 'single-file'">Choose a file</template>
              <template v-else-if="uploadCfg?.kind === 'multi-file'">Choose one or more files</template>
              <template v-else-if="uploadCfg?.kind === 'folder'">Choose a folder</template>
              <template v-else>Choose files or a folder</template>
            </p>
            <p class="dropzone__hint">{{ uploadCfg?.hint }}</p>
            <div class="dropzone__actions">
              <button v-if="allowSingle" type="button" class="dz-btn" @click.stop="fileInput?.click()">Select files</button>
              <button v-if="allowFolder" type="button" class="dz-btn dz-btn--ghost" @click.stop="folderInput?.click()">Select folder</button>
            </div>
          </div>

          <div v-else class="filelist">
            <div class="filelist__head">
              <span>{{ files.length }} {{ files.length === 1 ? 'file' : 'files' }}</span>
              <span class="filelist__size">{{ humanSize(totalSize()) }}</span>
            </div>
            <ul class="filelist__list">
              <li v-for="(f, i) in files" :key="f.name + i" class="filelist__item">
                <span class="filelist__name truncate">{{ f.webkitRelativePath || f.name }}</span>
                <span class="filelist__meta">{{ humanSize(f.size) }}</span>
                <button type="button" class="filelist__remove" @click="removeFile(i)" title="Remove">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            </ul>
            <div class="filelist__actions">
              <button v-if="allowSingle" type="button" class="dz-btn" @click="fileInput?.click()">Add files</button>
              <button v-if="allowFolder" type="button" class="dz-btn dz-btn--ghost" @click="folderInput?.click()">Add folder</button>
            </div>
          </div>

          <div v-if="uploadCfg?.cover" class="cover">
            <h3 class="cover__title">Cover image</h3>
            <div v-if="!coverFile" class="cover__empty" @click="coverInput?.click()">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span>Add a cover image</span>
            </div>
            <div v-else class="cover__file">
              <span class="truncate">{{ coverFile.name }}</span>
              <span class="cover__meta">{{ humanSize(coverFile.size) }}</span>
              <button type="button" class="filelist__remove" @click="removeCover" title="Remove cover">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <input ref="fileInput" type="file" :accept="acceptAttr" :multiple="allowMultiple" hidden @change="onPickFiles">
          <input ref="folderInput" type="file" webkitdirectory directory multiple hidden @change="onPickFolder">
          <input ref="coverInput" type="file" accept="image/*" hidden @change="onPickCover">
        </div>

        <div class="form__column form__column--meta">
          <h2 class="form__section-title">Details</h2>

          <div class="field">
            <label for="f-title">Title</label>
            <input id="f-title" v-model="title" type="text" placeholder="Project Orchestral Jump">
          </div>

          <div class="field">
            <label for="f-slug">Slug</label>
            <input id="f-slug" v-model="slug" type="text" placeholder="orchestral-jump" @input="slug = toSlug(slug)">
            <p class="field__hint">Used in the URL. Auto-generated from the title.</p>
          </div>

          <div class="field">
            <label for="f-desc">Description</label>
            <textarea id="f-desc" v-model="description" rows="3" placeholder="Short summary"></textarea>
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
                @click="status = s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div class="field">
            <label for="f-license">License</label>
            <select id="f-license" v-model="license" class="select">
              <option v-for="opt in licenseOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="field">
            <label for="f-tags">Tags</label>
            <input id="f-tags" v-model="tagsRaw" type="text" placeholder="music, orchestral, cinematic">
            <p class="field__hint">Comma-separated.</p>
          </div>

          <div class="field">
            <label for="f-attr">Attribution</label>
            <input id="f-attr" v-model="attribution" type="text" placeholder="Composer name or required credit">
          </div>

          <div v-if="categoryDef && categoryDef.fields.length > 0" class="field field--wide">
            <label>{{ categoryDef.label }} details</label>
            <ResourceFields
              :category="category!"
              :model-value="metadata"
              @update:model-value="metadata = $event"
            />
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="alert alert--error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert--success">{{ successMessage }}</div>

      <div class="form__footer">
        <button type="button" class="btn btn--ghost" @click="backToCategory" :disabled="saving">Back</button>
        <button type="button" class="btn btn--primary" :disabled="!canSubmit || saving" @click="submit">
          <template v-if="saving">Uploading</template>
          <template v-else>Publish resource</template>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.upload {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
}

.upload__header {
  margin-bottom: 32px;
}

.upload__title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.upload__subtitle {
  margin: 0;
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 14px;
}

.picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.picker__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 22px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms, transform 120ms, background 120ms;

  &:hover {
    border-color: var(--color-accent, #8b5cf6);
    background: rgba(139, 92, 246, 0.05);
    transform: translateY(-2px);
  }
}

.picker__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.10);
  color: var(--color-accent, #8b5cf6);
  margin-bottom: 4px;
}

.picker__label {
  font-size: 16px;
  font-weight: 600;
}

.picker__desc {
  font-size: 13px;
  color: var(--color-fg-muted, #a3a3a3);
  line-height: 1.5;
}

.picker__hint {
  margin-top: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--color-fg-subtle, #6b7280);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form__row--header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.form__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--color-border, #262626);
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 13px;
  cursor: pointer;

  &:hover { color: var(--color-fg, #e5e7eb); border-color: var(--color-border-strong, #404040); }
}

.form__category-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.10);
  color: var(--color-accent, #8b5cf6);
  font-size: 13px;
  font-weight: 500;
}

.form__grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(360px, 1.2fr);
  gap: 32px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.form__column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form__section-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  border: 2px dashed var(--color-border, #262626);
  border-radius: 14px;
  color: var(--color-fg-muted, #a3a3a3);
  text-align: center;
  cursor: pointer;
  transition: border-color 120ms, background 120ms;

  &:hover { border-color: var(--color-accent, #8b5cf6); background: rgba(139, 92, 246, 0.04); }
}

.dropzone__title {
  margin: 0;
  font-size: 15px;
  color: var(--color-fg, #e5e7eb);
}

.dropzone__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-fg-muted, #a3a3a3);
}

.dropzone__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.dz-btn {
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--color-accent, #8b5cf6);
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover { background: var(--color-accent-hover, #a855f7); }

  &--ghost {
    background: transparent;
    color: var(--color-fg, #e5e7eb);
    border: 1px solid var(--color-border, #262626);

    &:hover { background: var(--color-surface-2, #1a1a1a); }
  }
}

.filelist {
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
  overflow: hidden;
}

.filelist__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #262626);
  font-size: 12px;
  color: var(--color-fg-muted, #a3a3a3);
}

.filelist__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 260px;
  overflow: auto;
}

.filelist__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border, #262626);
  font-size: 13px;

  &:last-child { border-bottom: none; }
}

.filelist__name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.filelist__meta {
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
  font-variant-numeric: tabular-nums;
}

.filelist__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-fg-subtle, #6b7280);
  cursor: pointer;

  &:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; }
}

.filelist__actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border, #262626);
}

.cover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-muted, #a3a3a3);
}

.cover__empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px dashed var(--color-border, #262626);
  border-radius: 10px;
  color: var(--color-fg-muted, #a3a3a3);
  font-size: 13px;
  cursor: pointer;

  &:hover { border-color: var(--color-accent, #8b5cf6); }
}

.cover__file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 10px;
  font-size: 13px;
}

.cover__meta {
  font-size: 11px;
  color: var(--color-fg-muted, #a3a3a3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--wide {
  grid-column: 1 / -1;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-muted, #a3a3a3);
  letter-spacing: 0.04em;
}

.field__hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-fg-subtle, #6b7280);
}

.field input,
.field textarea,
.field select,
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
}

.field textarea {
  resize: vertical;
  min-height: 72px;
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

  &:hover { border-color: var(--color-border-strong, #404040); }

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
  padding-top: 8px;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
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

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>