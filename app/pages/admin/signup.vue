<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <p class="auth-card__eyebrow">
        {{ isBootstrap ? 'First-run setup' : 'Create account' }}
      </p>
      <h1 class="auth-card__title">
        {{ isBootstrap ? 'Create the first admin' : 'Redeem invite' }}
      </h1>
      <p class="auth-card__lede">
        <template v-if="isBootstrap">
          Paste the bootstrap token from your server environment, then choose
          your admin username and password. As the first user, you may claim
          any username — including reserved ones like "yannosay" or "admin".
        </template>
        <template v-else>
          Paste the invite token you received from a team admin, then choose
          a username and password.
        </template>
      </p>

      <div class="auth-card__field">
        <label for="signup-token" class="auth-card__label">
          {{ isBootstrap ? 'Bootstrap token' : 'Invite token' }}
        </label>
        <input
          id="signup-token"
          v-model="token"
          type="text"
          class="auth-card__input auth-card__input--mono"
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          :disabled="submitting"
          required
        >
      </div>

      <div class="auth-card__field">
        <label for="signup-username" class="auth-card__label">Username</label>
        <input
          id="signup-username"
          :value="username"
          type="text"
          class="auth-card__input"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          minlength="3"
          maxlength="24"
          :disabled="submitting"
          required
          @input="onUsernameInput"
        >
        <p v-if="username.length === 0" class="auth-card__help">
          3–24 characters. Lowercase letters, digits, hyphens, underscores.
          Cannot be changed later.
        </p>
        <p v-else-if="usernameError" class="auth-card__help auth-card__help--error">
          {{ usernameError }}
        </p>
        <p v-else class="auth-card__help auth-card__help--ok">
          Username accepted.
        </p>
      </div>

      <div class="auth-card__field">
        <label for="signup-password" class="auth-card__label">Password</label>
        <input
          id="signup-password"
          v-model="password"
          type="password"
          class="auth-card__input"
          autocomplete="new-password"
          minlength="12"
          :disabled="submitting"
          required
        >
        <p v-if="password.length === 0" class="auth-card__help">At least 12 characters.</p>
        <p v-else-if="password.length < 12" class="auth-card__help auth-card__help--error">
          {{ 12 - password.length }} more character{{ 12 - password.length === 1 ? '' : 's' }} needed.
        </p>
        <p v-else class="auth-card__help auth-card__help--ok">Password length accepted.</p>
      </div>

      <div class="auth-card__field">
        <label for="signup-confirm" class="auth-card__label">Confirm password</label>
        <input
          id="signup-confirm"
          v-model="confirmPassword"
          type="password"
          class="auth-card__input"
          autocomplete="new-password"
          :disabled="submitting"
          required
        >
        <p v-if="confirmPassword.length > 0 && password !== confirmPassword" class="auth-card__help auth-card__help--error">
          Passwords do not match.
        </p>
        <p v-else-if="confirmPassword.length > 0 && password === confirmPassword" class="auth-card__help auth-card__help--ok">
          Passwords match.
        </p>
      </div>

      <p v-if="!canSubmit && blockerMessage" class="auth-card__hint">
        {{ blockerMessage }}
      </p>

      <p v-if="errorMessage" class="auth-card__error" role="alert">{{ errorMessage }}</p>

      <button type="submit" class="auth-card__submit" :disabled="submitting || !canSubmit">
        {{ submitting ? 'Creating account…' : 'Create account' }}
      </button>

      <p class="auth-card__foot">
        Already have an account? <NuxtLink to="/admin/login">Sign in</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usernameError as getUsernameError } from '~~/shared/user'

definePageMeta({ layout: false })
useHead({ title: 'Create account', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const token = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const isBootstrap = ref(false)

onMounted(async () => {
  const raw = route.query.token
  if (typeof raw === 'string' && raw.length > 0) token.value = raw

  try {
    const status = await $fetch<{ available: boolean }>('/api/auth/bootstrap-status')
    isBootstrap.value = status?.available === true
  } catch {
    isBootstrap.value = false
  }
})

function onUsernameInput(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const cleaned = target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24)
  username.value = cleaned
  if (target.value !== cleaned) {
    target.value = cleaned
  }
}

const usernameError = computed(() =>
  getUsernameError(username.value, { allowReserved: isBootstrap.value })
)

const canSubmit = computed(() => {
  if (!token.value.trim()) return false
  if (usernameError.value !== null) return false
  if (username.value.length === 0) return false
  if (password.value.length < 12) return false
  if (password.value !== confirmPassword.value) return false
  return true
})

const blockerMessage = computed(() => {
  if (!token.value.trim()) return 'Paste your token to continue.'
  if (username.value.length === 0) return 'Choose a username.'
  if (usernameError.value) return usernameError.value
  if (password.value.length < 12) return 'Password must be at least 12 characters.'
  if (password.value !== confirmPassword.value) return 'Passwords must match.'
  return ''
})

async function submit(): Promise<void> {
  if (submitting.value || !canSubmit.value) return
  errorMessage.value = ''

  submitting.value = true

  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        token: token.value.trim(),
        username: username.value,
        password: password.value
      },
      headers: { 'Content-Type': 'application/json' }
    })
    await navigateTo('/admin', { replace: true })
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number; data?: { statusMessage?: string } } })?.response?.status
    const message = (error as { response?: { data?: { statusMessage?: string } } })?.response?.data?.statusMessage
    if (status === 409) errorMessage.value = message || 'That username is already taken.'
    else if (status === 401) errorMessage.value = message || 'Token is invalid or expired.'
    else if (status === 403) errorMessage.value = message || 'Bootstrap is no longer available.'
    else if (status === 422) errorMessage.value = message || 'Please check the form.'
    else errorMessage.value = 'Signup failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/css/components/auth' as auth;

.auth-page { @include auth.auth-page; }
.auth-card { @include auth.auth-card; }
.auth-card__eyebrow { @include auth.auth-eyebrow; }
.auth-card__title { @include auth.auth-title; }
.auth-card__lede { @include auth.auth-lede; }
.auth-card__field { @include auth.auth-field; }
.auth-card__label { @include auth.auth-label; }
.auth-card__input { @include auth.auth-input; }
.auth-card__error { @include auth.auth-error; }
.auth-card__submit { @include auth.auth-submit; }
.auth-card__foot { @include auth.auth-foot; }

.auth-card__input--mono {
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.auth-card__help {
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: var(--fg-dim);
  line-height: 1.5;
}

.auth-card__help--error {
  color: var(--danger);
}

.auth-card__help--ok {
  color: var(--success);
}

.auth-card__hint {
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: var(--fg-dim);
  line-height: 1.5;
}
</style>