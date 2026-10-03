<template>
  <div class="settings">
    <header class="settings__header">
      <h1 class="settings__title">Profile</h1>
      <p class="settings__lede">This is what other team members see. Your username cannot be changed.</p>
    </header>

    <section class="settings__section">
      <h2 class="settings__section-title">Avatar</h2>
      <div class="avatar-row">
        <div class="avatar-preview">
          <img v-if="user && user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" decoding="async">
          <span v-else>{{ initial }}</span>
        </div>
        <div class="avatar-actions">
          <input
            ref="avatarInput"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="settings__file"
            :disabled="uploadingAvatar"
            @change="uploadAvatar"
          >
          <p class="settings__help">PNG, JPEG, WebP, or GIF. Max 2 MB.</p>
          <p v-if="avatarMessage" :class="['settings__msg', avatarError ? 'settings__msg--error' : 'settings__msg--ok']">
            {{ avatarMessage }}
          </p>
        </div>
      </div>
    </section>

    <section class="settings__section">
      <h2 class="settings__section-title">Banner</h2>
      <div class="banner-preview" :style="bannerStyle">
        <span v-if="!bannerUrl" class="banner-empty">No banner</span>
      </div>
      <input
        ref="bannerInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        class="settings__file"
        :disabled="uploadingBanner"
        @change="uploadBanner"
      >
      <p class="settings__help">PNG, JPEG, WebP, or GIF. Max 5 MB. Recommended 1200×300.</p>
      <p v-if="bannerMessage" :class="['settings__msg', bannerError ? 'settings__msg--error' : 'settings__msg--ok']">
        {{ bannerMessage }}
      </p>
    </section>

    <section class="settings__section">
      <h2 class="settings__section-title">Display name & bio</h2>

      <div class="settings__field">
        <label for="set-display-name" class="settings__label">Display name</label>
        <input
          id="set-display-name"
          v-model="displayName"
          type="text"
          class="settings__input"
          maxlength="40"
          :disabled="savingProfile"
        >
        <p class="settings__help">
          What others see. Can be uppercase and can differ from your username.
          Leave blank to use your username.
        </p>
      </div>

      <div class="settings__field">
        <label for="set-bio" class="settings__label">Bio</label>
        <textarea
          id="set-bio"
          v-model="bio"
          class="settings__textarea"
          maxlength="500"
          :disabled="savingProfile"
        />
        <p class="settings__help">{{ bio.length }} / 500</p>
      </div>

      <div class="settings__field">
        <label class="settings__label">Links</label>
        <p class="settings__help">Up to 5 links. HTTPS only.</p>
        <div v-for="(link, index) in links" :key="index" class="link-row">
          <input
            v-model="link.label"
            type="text"
            class="settings__input link-row__label"
            placeholder="Label"
            maxlength="30"
            :disabled="savingProfile"
          >
          <input
            v-model="link.url"
            type="url"
            class="settings__input link-row__url"
            placeholder="https://…"
            maxlength="500"
            :disabled="savingProfile"
          >
          <button type="button" class="link-row__remove" @click="removeLink(index)" :disabled="savingProfile">×</button>
        </div>
        <button
          v-if="links.length < 5"
          type="button"
          class="settings__add"
          :disabled="savingProfile"
          @click="addLink"
        >
          + Add link
        </button>
      </div>

      <p v-if="profileMessage" :class="['settings__msg', profileError ? 'settings__msg--error' : 'settings__msg--ok']">
        {{ profileMessage }}
      </p>

      <button type="button" class="settings__submit" :disabled="savingProfile" @click="saveProfile">
        {{ savingProfile ? 'Saving…' : 'Save profile' }}
      </button>
    </section>

    <section class="settings__section">
      <h2 class="settings__section-title">Change password</h2>

      <div class="settings__field">
        <label for="set-current-password" class="settings__label">Current password</label>
        <input
          id="set-current-password"
          v-model="currentPassword"
          type="password"
          class="settings__input"
          autocomplete="current-password"
          :disabled="changingPassword"
        >
      </div>

      <div class="settings__field">
        <label for="set-new-password" class="settings__label">New password</label>
        <input
          id="set-new-password"
          v-model="newPassword"
          type="password"
          class="settings__input"
          autocomplete="new-password"
          minlength="12"
          :disabled="changingPassword"
        >
        <p class="settings__help">At least 12 characters.</p>
      </div>

      <p v-if="passwordMessage" :class="['settings__msg', passwordError ? 'settings__msg--error' : 'settings__msg--ok']">
        {{ passwordMessage }}
      </p>

      <button
        type="button"
        class="settings__submit"
        :disabled="changingPassword || !currentPassword || newPassword.length < 12"
        @click="changePassword"
      >
        {{ changingPassword ? 'Changing…' : 'Change password' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: 'Profile', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

interface ProfileResponse {
  username: string
  displayName: string
  bio: string
  links: Array<{ label: string; url: string }>
  avatarUrl: string | null
  bannerUrl: string | null
  createdAt: string
}

const { user, refresh: refreshSession } = useTeamSession()

const username = computed(() => user.value?.username ?? '')

const { data: profile, refresh: refreshProfile } = useFetch<ProfileResponse>(
  () => username.value ? `/api/public/users/${username.value}` : '',
  { key: () => `profile-${username.value || 'anon'}`, immediate: true }
)

const displayName = ref('')
const bio = ref('')
const links = ref<Array<{ label: string; url: string }>>([])

watch(profile, (next) => {
  if (!next) return
  displayName.value = next.displayName
  bio.value = next.bio
  links.value = next.links.map(l => ({ ...l }))
}, { immediate: true })

const initial = computed(() => {
  const name = user.value?.displayName || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

const bannerUrl = computed(() => profile.value?.bannerUrl ?? null)
const bannerStyle = computed(() => bannerUrl.value ? { backgroundImage: `url(${bannerUrl.value})` } : {})

const avatarInput = ref<HTMLInputElement | null>(null)
const bannerInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const uploadingBanner = ref(false)
const avatarMessage = ref('')
const avatarError = ref(false)
const bannerMessage = ref('')
const bannerError = ref(false)

const savingProfile = ref(false)
const profileMessage = ref('')
const profileError = ref(false)

const changingPassword = ref(false)
const passwordMessage = ref('')
const passwordError = ref(false)
const currentPassword = ref('')
const newPassword = ref('')

function addLink(): void {
  if (links.value.length >= 5) return
  links.value.push({ label: '', url: '' })
}

function removeLink(index: number): void {
  links.value.splice(index, 1)
}

async function afterProfileChange(): Promise<void> {
  await refreshProfile()
  await refreshSession()
}

async function uploadAvatar(event: Event): Promise<void> {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || !target.files?.[0]) return
  uploadingAvatar.value = true
  avatarMessage.value = ''
  avatarError.value = false

  const form = new FormData()
  form.append('file', target.files[0])

  try {
    await $fetch('/api/auth/avatar', { method: 'POST', body: form })
    avatarMessage.value = 'Avatar updated.'
    await afterProfileChange()
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    avatarError.value = true
    if (status === 413) avatarMessage.value = 'File too large. Max 2 MB.'
    else if (status === 422) avatarMessage.value = 'Unsupported format. Use PNG, JPEG, WebP, or GIF.'
    else if (status === 401) avatarMessage.value = 'Your session expired. Reload and sign in again.'
    else avatarMessage.value = 'Upload failed. Try again.'
  } finally {
    uploadingAvatar.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

async function uploadBanner(event: Event): Promise<void> {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || !target.files?.[0]) return
  uploadingBanner.value = true
  bannerMessage.value = ''
  bannerError.value = false

  const form = new FormData()
  form.append('file', target.files[0])

  try {
    await $fetch('/api/auth/banner', { method: 'POST', body: form })
    bannerMessage.value = 'Banner updated.'
    await afterProfileChange()
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    bannerError.value = true
    if (status === 413) bannerMessage.value = 'File too large. Max 5 MB.'
    else if (status === 422) bannerMessage.value = 'Unsupported format. Use PNG, JPEG, WebP, or GIF.'
    else if (status === 401) bannerMessage.value = 'Your session expired. Reload and sign in again.'
    else bannerMessage.value = 'Upload failed. Try again.'
  } finally {
    uploadingBanner.value = false
    if (bannerInput.value) bannerInput.value.value = ''
  }
}

async function saveProfile(): Promise<void> {
  if (savingProfile.value) return
  savingProfile.value = true
  profileMessage.value = ''
  profileError.value = false

  const cleanLinks = links.value
    .map(l => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter(l => l.label && l.url)

  try {
    const result = await $fetch<{ ok: boolean; displayName: string }>('/api/auth/profile', {
      method: 'PATCH',
      body: {
        displayName: displayName.value,
        bio: bio.value,
        links: cleanLinks
      }
    })
    profileMessage.value = `Saved. Your display name is "${result.displayName}".`
    await afterProfileChange()
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number; data?: { statusMessage?: string } } })?.response?.status
    const message = (error as { response?: { data?: { statusMessage?: string } } })?.response?.data?.statusMessage
    profileError.value = true
    if (status === 409) profileMessage.value = message || 'That display name is already in use.'
    else if (status === 401) profileMessage.value = 'Your session expired. Reload and sign in again.'
    else profileMessage.value = message || 'Save failed. Try again.'
  } finally {
    savingProfile.value = false
  }
}

async function changePassword(): Promise<void> {
  if (changingPassword.value) return
  changingPassword.value = true
  passwordMessage.value = ''
  passwordError.value = false

  try {
    await $fetch('/api/auth/password', {
      method: 'PATCH',
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value }
    })
    passwordMessage.value = 'Password changed. Use it next time you sign in.'
    passwordError.value = false
    currentPassword.value = ''
    newPassword.value = ''
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    passwordError.value = true
    if (status === 401) passwordMessage.value = 'Current password is incorrect.'
    else if (status === 422) passwordMessage.value = 'New password must be at least 12 characters.'
    else passwordMessage.value = 'Change failed. Try again.'
  } finally {
    changingPassword.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/css/components/form' as form;

.settings {
  max-width: 44rem;
}

.settings__header {
  margin-bottom: 2.5rem;
}

.settings__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.4rem;
}

.settings__lede {
  font-size: 0.9rem;
  color: var(--fg-muted);
}

.settings__section {
  padding-top: 2rem;
  margin-bottom: 2.5rem;
  border-top: 1px solid var(--line);
}

.settings__section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.settings__section-title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.005em;
  margin-bottom: 1.25rem;
}

.settings__field {
  margin-bottom: 1.25rem;
}

.settings__label { @include form.form-label; }
.settings__input { @include form.form-input; }
.settings__textarea { @include form.form-textarea; }
.settings__file { @include form.form-file; }
.settings__help { @include form.form-help; }

.settings__msg {
  font-size: 0.82rem;
  margin-top: 0.5rem;
  line-height: 1.5;
}

.settings__msg--ok { color: var(--success); }
.settings__msg--error { color: var(--danger); }

.settings__submit {
  margin-top: 0.5rem;
  padding: 0.7rem 1.4rem;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--bg);
  background: var(--fg);
  border: 1px solid var(--fg);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.avatar-row {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.avatar-preview {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background: rgba(245, 245, 246, 0.05);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 2rem;
  font-weight: 500;
  color: var(--fg);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.banner-preview {
  width: 100%;
  height: 7rem;
  border-radius: 10px;
  background-color: rgba(245, 245, 246, 0.03);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.banner-empty {
  font-size: 0.78rem;
  color: var(--fg-dim);
}

.link-row {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr) 2rem;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 2rem;
  }
}

.link-row__label,
.link-row__url {
  min-width: 0;
}

.link-row__remove {
  width: 2rem;
  height: 2rem;
  font-size: 1.1rem;
  color: var(--fg-muted);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    color: var(--danger);
    border-color: rgba(248, 113, 113, 0.4);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.settings__add {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.78rem;
  color: var(--fg-muted);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    color: var(--fg);
    border-color: var(--line-strong);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>