<template>
  <section class="contact">
    <div class="contact__container">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        lede="Questions, takedown requests, or collaboration — pick the channel that fits."
      />

      <div class="contact__grid">
        <article class="contact__card">
          <h2 class="contact__card-title">General enquiries</h2>
          <p class="contact__card-body">
            For questions about the site, licensing, or anything not covered
            below. Response time is usually 1–3 business days.
          </p>
          <p class="contact__card-address">contact@yannosay.com</p>
        </article>

        <article class="contact__card">
          <h2 class="contact__card-title">Takedown &amp; DMCA</h2>
          <p class="contact__card-body">
            If you believe a resource infringes your copyright, see the
            takedown page for the process and required information.
          </p>
          <NuxtLink to="/legal/dmca" class="contact__card-link">Takedown procedure →</NuxtLink>
        </article>

        <article class="contact__card">
          <h2 class="contact__card-title">Security</h2>
          <p class="contact__card-body">
            Suspected vulnerabilities in this site or its APIs should be
            reported privately. Do not open a public issue.
          </p>
          <p class="contact__card-address">security@yannosay.com</p>
        </article>

        <article class="contact__card">
          <h2 class="contact__card-title">Community</h2>
          <p class="contact__card-body">
            For informal chat and updates, join the Discord server.
          </p>
          <a
            href="https://discord.gg/SUvcrafTQm"
            class="contact__card-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Discord →
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PageHeader from '~/components/ui/PageHeader.vue'

useCanonical('/contact')

useHead({
  title: 'Contact',
  meta: [
    { name: 'description', content: 'Contact Yannosay Productions about resources, licensing, or security.' },
    { property: 'og:title', content: 'Contact' },
    { property: 'og:description', content: 'Contact Yannosay Productions.' }
  ]
})
</script>

<style lang="scss" scoped>
@use '~/assets/css/components/page' as page;

.contact {
  @include page.page;
  min-height: 100svh;
}

.contact__container {
  @include page.container;
}

.contact__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1.25rem;
  max-width: 60rem;
  margin: 0 auto;
}

.contact__card {
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.6rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
}

.contact__card-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--white);
  margin-bottom: 0.75rem;
}

.contact__card-body {
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--muted);
  margin-bottom: 1rem;
}

.contact__card-address {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--accent-soft);
  margin-top: auto;
  overflow-wrap: anywhere;
}

.contact__card-link {
  color: var(--accent-soft);
  text-decoration: none;
  font-size: 0.85rem;
  margin-top: auto;
  transition: color 0.15s;
}

.contact__card-link:hover {
  color: var(--accent);
}
</style>