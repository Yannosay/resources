<template>
  <section class="legal">
    <div class="legal__container">
      <header class="legal__header">
        <p class="legal__eyebrow">Legal</p>
        <h1 class="legal__title">Privacy Policy</h1>
        <p class="legal__updated">Last updated: 27 September 2026</p>
      </header>

      <article class="prose legal__body">
        <h2>Summary</h2>
        <p>
          Yannosay Resources collects as little as possible. No accounts for
          downloaders. No analytics. No third-party trackers. No cookies for
          public visitors. This page explains what is stored and why.
        </p>

        <h2>What we store</h2>

        <h3>Download counts</h3>
        <p>
          When you request a download, the server increments a counter
          associated with that resource. The counter records only a number.
          It does not record your IP address, user agent, or any identifier
          that could be linked back to you.
        </p>

        <h3>Server logs</h3>
        <p>
          Cloudflare, which hosts this Site, may retain standard request logs
          for a short period for the purpose of abuse prevention and
          reliability. These logs are held by Cloudflare under their own
          privacy policy and are not accessed by Yannosay Productions except
          in response to a specific incident.
        </p>

        <h3>Admin cookies</h3>
        <p>
          The administrative interface at <code>/admin</code> sets a
          single HttpOnly session cookie when an administrator signs in.
          Public visitors never receive this cookie. It is not used for
          tracking and is deleted on sign-out or after 8 hours of inactivity.
        </p>

        <h2>What we do not store</h2>
        <ul>
          <li>No names, email addresses, or postal addresses of visitors.</li>
          <li>No advertising identifiers, tracking pixels, or fingerprinting data.</li>
          <li>No IP addresses associated with download counts.</li>
          <li>No cookies for public visitors.</li>
          <li>No analytics of any kind.</li>
        </ul>

        <h2>Third parties</h2>
        <p>
          The Site is served by Cloudflare (Pages, R2, and KV). Cloudflare
          processes requests on our behalf and is subject to a data processing
          agreement. We do not send any data to any other third party.
        </p>

        <h2>Your rights under GDPR</h2>
        <p>
          Because we do not associate stored data with individual visitors,
          there is typically nothing to access, correct, or delete on request.
          If you believe we hold personal data about you, contact
          <strong>contact@yannosay.com</strong> and we will investigate.
        </p>

        <h2>Children</h2>
        <p>
          This Site is not directed at children under 13. We do not knowingly
          collect data from children.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          Material changes will be reflected by a new &ldquo;Last updated&rdquo;
          date at the top of this page.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy should be directed to
          <strong>contact@yannosay.com</strong>.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
useCanonical('/legal/privacy')

useHead({
  title: 'Privacy Policy',
  meta: [
    { name: 'description', content: 'Privacy Policy for Yannosay Resources.' },
    { property: 'og:title', content: 'Privacy Policy' }
  ]
})
</script>

<style lang="scss" scoped>
@use '~/assets/css/components/page' as page;

.legal {
  @include page.page;
  min-height: 100svh;
}

.legal__container {
  max-width: 48rem;
  margin: 0 auto;
}

.legal__header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--line);
}

.legal__eyebrow {
  font-size: 0.6rem;
  font-weight: 200;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 1.1rem;
}

.legal__title {
  font-family: var(--font-sans);
  font-weight: 900;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin-bottom: 0.75rem;
}

.legal__updated {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted-dim);
}
</style>