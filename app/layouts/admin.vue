<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="admin-header__inner">
        <NuxtLink to="/admin" class="admin-header__brand" aria-label="Yannosay Resources team">
          <img
            src="/assets/images/logo/logo.png"
            alt="Yannosay"
            class="admin-header__logo"
            width="120"
            height="28"
            decoding="async"
          >
          <span class="admin-header__divider" aria-hidden="true" />
          <span class="admin-header__label">Team</span>
        </NuxtLink>

        <nav class="admin-header__nav" aria-label="Admin navigation">
          <NuxtLink to="/admin" class="admin-header__link" active-class="admin-header__link--active" exact-active-class="admin-header__link--active">Dashboard</NuxtLink>
          <NuxtLink to="/admin/upload" class="admin-header__link" active-class="admin-header__link--active">Upload</NuxtLink>
          <NuxtLink to="/admin/members" class="admin-header__link" active-class="admin-header__link--active">Members</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin/invites" class="admin-header__link" active-class="admin-header__link--active">Invites</NuxtLink>
          <NuxtLink to="/admin/settings" class="admin-header__link" active-class="admin-header__link--active">Profile</NuxtLink>
          <NuxtLink to="/" class="admin-header__link">Site</NuxtLink>
          <button type="button" class="admin-header__logout" :disabled="loggingOut" @click="logout">
            {{ loggingOut ? '…' : 'Sign out' }}
          </button>
        </nav>
      </div>
    </header>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { isAdmin, refresh } = useTeamSession()
const loggingOut = ref(false)

async function logout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch {
  }
  await refresh()
  await navigateTo('/admin/login', { replace: true })
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0a0a0b;
  color: #f5f5f6;
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid rgba(245, 245, 246, 0.08);
  background-color: rgba(10, 10, 11, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.admin-header__inner {
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;

  @media (min-width: 768px) {
    padding: 0 2rem;
  }
}

.admin-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #f5f5f6;
  min-width: 0;
}

.admin-header__logo {
  height: 1.5rem;
  width: auto;
  max-width: 8rem;
  display: block;
  object-fit: contain;
}

.admin-header__divider {
  width: 1px;
  height: 1.25rem;
  background: rgba(245, 245, 246, 0.12);
}

.admin-header__label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: rgba(245, 245, 246, 0.55);
}

.admin-header__nav {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  font-size: 0.8rem;

  @media (min-width: 768px) {
    gap: 1.5rem;
  }
}

.admin-header__link {
  color: rgba(245, 245, 246, 0.55);
  text-decoration: none;
  transition: color 0.15s;

  &:hover {
    color: #f5f5f6;
  }

  &.admin-header__link--active {
    color: #f5f5f6;
  }
}

.admin-header__logout {
  padding: 0;
  font-family: inherit;
  font-size: 0.78rem;
  color: rgba(245, 245, 246, 0.55);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;

  &:hover:not(:disabled) {
    color: #f5f5f6;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.admin-main {
  flex: 1 1 0%;
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;

  @media (min-width: 768px) {
    padding: 3rem 2rem 6rem;
  }
}
</style>