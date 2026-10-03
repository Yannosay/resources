<template>
  <div class="site-layout">
    <a href="#main" class="skip-link">Skip to content</a>
    <LayoutSiteHeader />
    <main id="main" class="site-main">
      <slot />
    </main>
    <LayoutSiteFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutSiteHeader from '~/components/layout/SiteHeader.vue'
import LayoutSiteFooter from '~/components/layout/SiteFooter.vue'
</script>

<style lang="scss" scoped>
.site-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--black);
  color: var(--white);
}

.site-main {
  flex: 1 1 0%;
}
</style>