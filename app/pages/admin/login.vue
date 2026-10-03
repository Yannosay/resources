<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <p class="auth-card__eyebrow">Team access</p>
      <h1 class="auth-card__title">Sign in</h1>
      <p class="auth-card__lede">Sign in with your team username and password.</p>

      <div class="auth-card__field">
        <label for="login-username" class="auth-card__label">Username</label>
        <input
          id="login-username"
          v-model="username"
          type="text"
          class="auth-card__input"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          :disabled="submitting"
          required
          autofocus
        >
      </div>

      <div class="auth-card__field">
        <label for="login-password" class="auth-card__label">Password</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          class="auth-card__input"
          autocomplete="current-password"
          :disabled="submitting"
          required
        >
      </div>

      <label class="auth-card__remember">
        <input
          v-model="rememberMe"
          type="checkbox"
          :disabled="submitting"
        >
        <span>
          <strong>Remember me for 30 days</strong>
          <em>Only on this device. Do not use on shared computers.</em>
        </span>
      </label>

      <p v-if="errorMessage" class="auth-card__error" role="alert">{{ errorMessage }}</p>

      <button type="submit" class="auth-card__submit" :disabled="submitting || !username || !password">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="auth-card__foot">
        Have an invite? <NuxtLink to="/admin/signup">Create account</NuxtLink>
      </p>
      <NuxtLink to="/" class="auth-card__back">← Back to site</NuxtLink>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: false })
useHead({ title: 'Sign in', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

async function submit(): Promise<void> {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value.trim().toLowerCase(),
        password: password.value,
        rememberMe: rememberMe.value
      },
      headers: { 'Content-Type': 'application/json' }
    })
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/')
      ? route.query.next
      : '/admin'
    await navigateTo(next, { replace: true })
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 429) errorMessage.value = 'Too many attempts. Try again in a few minutes.'
    else if (status === 401) errorMessage.value = 'Invalid username or password.'
    else errorMessage.value = 'Sign-in failed. Please try again.'
    password.value = ''
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
.auth-card__back { @include auth.auth-back; }

.auth-card__remember {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.7rem 0.85rem;
  margin-bottom: 1.1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.auth-card__remember:hover {
  border-color: var(--line-strong);
  background: rgba(245, 245, 246, 0.02);
}

.auth-card__remember input {
  margin-top: 0.2rem;
  flex-shrink: 0;
  accent-color: var(--fg);
}

.auth-card__remember span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.auth-card__remember strong {
  font-weight: 500;
  font-size: 0.82rem;
  color: var(--fg);
}

.auth-card__remember em {
  font-style: normal;
  font-size: 0.72rem;
  color: var(--fg-dim);
  line-height: 1.5;
}
</style>