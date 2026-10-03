<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

interface PreviewResource {
  slug: string
  title: string
  category: string
  mimeType?: string
  extension?: string
  previewUrl?: string | null
  downloadUrl?: string
  inlineUrl?: string
  textPreviewUrl?: string
  primaryIndex?: number
}

const props = defineProps<{ resource: PreviewResource }>()

const audioEl = ref<HTMLAudioElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const audioError = ref<string | null>(null)
const videoError = ref<string | null>(null)

const categoryKey = computed(() => props.resource.category)
const isImage = computed(() => categoryKey.value === 'images')
const isAudio = computed(() => categoryKey.value === 'audio' || categoryKey.value === 'sfx')
const isVideo = computed(() => categoryKey.value === 'video')
const isCode = computed(() => categoryKey.value === 'code')
const isFont = computed(() => categoryKey.value === 'fonts')
const isDocument = computed(() => categoryKey.value === 'documents')
const isArchive = computed(() => categoryKey.value === 'archives')
const isTemplate = computed(() => categoryKey.value === 'templates')

const resourceKey = computed(() => props.resource.slug)

const fontFamilyName = computed(() => {
  const base = props.resource.title.replace(/[^A-Za-z0-9]/g, '')
  return `preview-${base || 'font'}`
})

const fontFaceRule = computed(() => {
  if (!isFont.value || !props.resource.inlineUrl) return null
  return `@font-face { font-family: '${fontFamilyName.value}'; src: url('${props.resource.inlineUrl}'); font-display: swap; }`
})

function resetAll(): void {
  const a = audioEl.value
  if (a) {
    try { a.pause() } catch { void 0 }
    try { a.currentTime = 0 } catch { void 0 }
  }
  const v = videoEl.value
  if (v) {
    try { v.pause() } catch { void 0 }
    try { v.currentTime = 0 } catch { void 0 }
  }
  audioError.value = null
  videoError.value = null
}

function onAudioError(): void {
  audioError.value = 'This audio file could not be loaded.'
}

function onVideoError(): void {
  videoError.value = 'This video file could not be loaded.'
}

watch(resourceKey, resetAll)

onBeforeUnmount(resetAll)
</script>

<template>
  <div class="preview">
    <div v-if="isImage" class="preview__image">
      <img v-if="resource.inlineUrl" :src="resource.inlineUrl" :alt="resource.title">
      <p v-else class="preview__fallback">Image preview unavailable</p>
    </div>

    <div v-else-if="isAudio" class="preview__audio">
      <audio
        :key="resource.slug"
        ref="audioEl"
        class="preview__audio-el"
        :src="resource.inlineUrl"
        controls
        preload="metadata"
        @error="onAudioError"
      ></audio>
      <div v-if="audioError" class="preview__error">{{ audioError }}</div>
    </div>

    <div v-else-if="isVideo" class="preview__video">
      <video
        :key="resource.slug"
        ref="videoEl"
        class="preview__video-el"
        :src="resource.inlineUrl"
        :poster="resource.previewUrl ?? undefined"
        controls
        preload="metadata"
        playsinline
        @error="onVideoError"
      ></video>
      <div v-if="videoError" class="preview__error">{{ videoError }}</div>
    </div>

    <div v-else-if="isFont" class="preview__font">
      <component :is="'style'" v-if="fontFaceRule">{{ fontFaceRule }}</component>
      <div class="specimen">
        <div class="specimen__label">Aa Bb Cc Dd Ee</div>
        <div class="specimen__sample" :style="{ fontFamily: fontFamilyName + ', serif' }">
          The quick brown fox jumps over the lazy dog
        </div>
        <div class="specimen__large" :style="{ fontFamily: fontFamilyName + ', serif' }">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          abcdefghijklmnopqrstuvwxyz
          0123456789 !@#$%&amp;*()
        </div>
      </div>
    </div>

    <div v-else-if="isCode" class="preview__code">
      <div class="code-head">
        <span class="code-head__file">{{ resource.title }}</span>
        <span v-if="resource.extension" class="code-head__ext">.{{ resource.extension }}</span>
      </div>
      <pre class="code-body">Source preview is not shown inline for multi-file bundles.</pre>
      <div class="code-hint">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        Download to view the full source tree
      </div>
    </div>

    <div v-else-if="isDocument" class="preview__document">
      <div class="document-card">
        <div class="document-card__icon">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          </svg>
        </div>
        <div class="document-card__meta">
          <div class="document-card__title">{{ resource.title }}</div>
          <div v-if="resource.extension" class="document-card__ext">{{ resource.extension.toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="isArchive || isTemplate" class="preview__archive">
      <div class="archive-card">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
        </svg>
        <div class="archive-card__title">{{ isTemplate ? 'Template bundle' : 'Archive bundle' }}</div>
        <div v-if="resource.extension" class="archive-card__ext">{{ resource.extension.toUpperCase() }}</div>
      </div>
    </div>

    <div v-else class="preview__fallback">
      <p>No preview available for this format.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #262626);
}

.preview__image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0e0e13;
  min-height: 320px;

  img {
    max-width: 100%;
    max-height: 70vh;
    display: block;
    object-fit: contain;
  }
}

.preview__audio {
  padding: 20px;
  background: var(--color-surface-2, #1a1a1a);
}

.preview__audio-el {
  width: 100%;
  height: 54px;
  display: block;
  border-radius: 10px;
  filter: invert(0.9) hue-rotate(180deg);
  background: transparent;
}

.preview__video {
  background: #000;
  display: flex;
  flex-direction: column;

  video {
    width: 100%;
    max-height: 70vh;
    display: block;
    background: #000;
  }
}

.preview__error {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.preview__font {
  padding: 32px;
  background: #0e0e13;
}

.specimen {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e5e7eb;
}

.specimen__label {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6b7280;
}

.specimen__sample {
  font-size: 32px;
  line-height: 1.3;
}

.specimen__large {
  font-size: 18px;
  line-height: 1.65;
  white-space: pre-line;
}

.preview__code {
  background: #0e0e13;
  border-radius: 12px;
  overflow: hidden;
}

.code-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #1f2937;
  background: #111827;
}

.code-head__file {
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
}

.code-head__ext {
  font-size: 11px;
  color: #6b7280;
  font-family: var(--font-mono, monospace);
}

.code-body {
  margin: 0;
  padding: 16px;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: #9ca3af;
  min-height: 80px;
  white-space: pre-wrap;
}

.code-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #1f2937;
  background: #111827;
  color: #6b7280;
  font-size: 12px;
}

.preview__document,
.preview__archive {
  padding: 40px;
  display: flex;
  justify-content: center;
  background: #0e0e13;
}

.document-card,
.archive-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 32px;
  background: var(--color-surface-2, #1a1a1a);
  border: 1px solid var(--color-border, #262626);
  border-radius: 12px;
  color: #e5e7eb;
}

.document-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.document-card__title,
.archive-card__title {
  font-size: 15px;
  font-weight: 500;
}

.document-card__ext,
.archive-card__ext {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 0.08em;
}

.archive-card {
  flex-direction: column;
  text-align: center;
}

.preview__fallback {
  padding: 60px 24px;
  text-align: center;
  color: var(--color-fg-muted, #a3a3a3);
}
</style>