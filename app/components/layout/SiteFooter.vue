<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__top">
        <p class="site-footer__tagline">
          Free assets published by Yannosay Productions.
        </p>

        <div class="site-footer__columns">
          <div class="site-footer__column">
            <p class="site-footer__column-title">Browse</p>
            <NuxtLink to="/browse" class="site-footer__link">All resources</NuxtLink>
            <NuxtLink to="/browse/images" class="site-footer__link">Images</NuxtLink>
            <NuxtLink to="/browse/audio" class="site-footer__link">Audio</NuxtLink>
            <NuxtLink to="/browse/code" class="site-footer__link">Code</NuxtLink>
          </div>
          <div class="site-footer__column">
            <p class="site-footer__column-title">Legal</p>
            <NuxtLink to="/legal/terms" class="site-footer__link">Terms</NuxtLink>
            <NuxtLink to="/legal/privacy" class="site-footer__link">Privacy</NuxtLink>
            <NuxtLink to="/legal/license" class="site-footer__link">Licensing</NuxtLink>
            <NuxtLink to="/legal/dmca" class="site-footer__link">DMCA</NuxtLink>
          </div>
          <div class="site-footer__column">
            <p class="site-footer__column-title">Elsewhere</p>
            <a href="https://yannosay.com" class="site-footer__link" rel="noopener">Yannosay.com</a>
            <a href="https://github.com/Yannosay" class="site-footer__link" rel="noopener noreferrer" target="_blank">GitHub</a>
            <a href="https://discord.gg/SUvcrafTQm" class="site-footer__link" rel="noopener noreferrer" target="_blank">Discord</a>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <p class="site-footer__copy">&copy; {{ currentYear }} Yannosay Productions</p>
        <NuxtLink to="/admin" class="site-footer__admin">Admin</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style lang="scss" scoped>
.site-footer {
  border-top: 1px solid var(--line);
  padding: 3rem 0 2rem;
  margin-top: 5rem;
}

.site-footer__inner {
  max-width: 78rem;
  margin: 0 auto;
  padding: 0 1.5rem;

  @media (min-width: 768px) {
    padding: 0 2rem;
  }
}

.site-footer__top {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  padding-bottom: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
    gap: 4rem;
  }
}

.site-footer__tagline {
  color: var(--fg-muted);
  font-size: 0.82rem;
  line-height: 1.6;
  max-width: 32ch;
}

.site-footer__columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.site-footer__column {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.site-footer__column-title {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fg-dim);
  margin-bottom: 0.35rem;
}

.site-footer__link {
  color: var(--fg-muted);
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.15s;
  overflow-wrap: anywhere;
}

.site-footer__link:hover {
  color: var(--fg);
}

.site-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--line);
}

.site-footer__copy {
  color: var(--fg-dim);
  font-size: 0.75rem;
}

.site-footer__admin {
  color: var(--fg-dim);
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 0.15s;
}

.site-footer__admin:hover {
  color: var(--fg);
}
</style>