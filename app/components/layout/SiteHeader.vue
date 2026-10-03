<template>
  <header class="site-header">
    <div class="site-header__inner">
      <NuxtLink to="/" class="brand" aria-label="Yannosay Resources home">
        <img
          :src="logoSrc"
          alt="Yannosay"
          class="brand__logo"
          width="140"
          height="32"
          decoding="async"
        >
        <span class="brand__label">Resources</span>
      </NuxtLink>

      <nav class="nav" aria-label="Primary">
        <NuxtLink to="/browse" class="nav__link" active-class="nav__link--active">Browse</NuxtLink>
        <NuxtLink to="/about" class="nav__link" active-class="nav__link--active">About</NuxtLink>
        <NuxtLink to="/contact" class="nav__link" active-class="nav__link--active">Contact</NuxtLink>

        <template v-if="user">
          <NuxtLink :to="`/u/${user.username}`" class="nav__user">
            <span class="nav__avatar" aria-hidden="true">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" loading="lazy" decoding="async">
              <span v-else>{{ initial }}</span>
            </span>
            <span class="nav__user-name">{{ user.displayName }}</span>
          </NuxtLink>
          <NuxtLink to="/admin" class="nav__link">Dashboard</NuxtLink>
          <button type="button" class="nav__signout" :disabled="signingOut" @click="signOut">
            {{ signingOut ? '…' : 'Sign out' }}
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/admin/login" class="nav__signin">Sign in</NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const logoSrc = '/assets/images/logo/logo.png'

const { user, refresh } = useTeamSession()
const signingOut = ref(false)

const initial = computed(() => {
  const name = user.value?.displayName || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

async function signOut(): Promise<void> {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch {
  }
  await refresh()
  await navigateTo('/', { replace: true })
}
</script>

<style lang="scss" scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 10, 11, 0.9);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.site-header__inner {
  max-width: 78rem;
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

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--fg);
  text-decoration: none;
  min-width: 0;
}

.brand__logo {
  height: 1.5rem;
  width: auto;
  max-width: 8rem;
  display: block;
  object-fit: contain;
}

.brand__label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--fg-dim);
  padding-left: 0.65rem;
  border-left: 1px solid var(--line);

  @media (max-width: 480px) {
    display: none;
  }
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  font-size: 0.82rem;

  @media (min-width: 768px) {
    gap: 1.5rem;
  }
}

.nav__link {
  color: var(--fg-muted);
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: var(--fg);
  }

  &.nav__link--active {
    color: var(--fg);
  }
}

.nav__user {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--fg-muted);
  transition: color 0.15s;

  &:hover {
    color: var(--fg);
  }
}

.nav__avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(245, 245, 246, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--fg);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.nav__user-name {
  @media (max-width: 720px) {
    display: none;
  }
}

.nav__signin {
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  color: var(--fg);
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(245, 245, 246, 0.05);
    border-color: rgba(245, 245, 246, 0.24);
  }
}

.nav__signout {
  padding: 0;
  font-family: inherit;
  font-size: 0.78rem;
  color: var(--fg-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;

  &:hover:not(:disabled) {
    color: var(--fg);
  }

  &:focus-visible {
    outline: 2px solid var(--fg);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>