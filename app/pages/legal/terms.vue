<template>
  <section class="legal">
    <div class="legal__container">
      <header class="legal__header">
        <p class="legal__eyebrow">Legal</p>
        <h1 class="legal__title">Terms of Service</h1>
        <p class="legal__updated">Last updated: 27 September 2026</p>
      </header>

      <article class="prose legal__body">
        <h2>1. Acceptance of terms</h2>
        <p>
          By accessing <strong>resources.yannosay.com</strong> (&ldquo;the Site&rdquo;),
          you agree to these Terms of Service. If you do not agree, do not use
          the Site.
        </p>

        <h2>2. What the Site provides</h2>
        <p>
          The Site hosts downloadable files (&ldquo;Resources&rdquo;) published
          by Yannosay Productions. Access to view and browse the Site is free.
          Downloading a Resource does not create an account, a payment
          obligation, or a continuing relationship.
        </p>

        <h2>3. License to use Resources</h2>
        <p>
          Each Resource carries its own license, displayed on its detail page.
          That license governs your rights to use, modify, and redistribute
          the Resource. These Terms do not override or expand any Resource
          license. See the <NuxtLink to="/legal/license">Licensing page</NuxtLink>
          for details.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Site to distribute malware, spyware, or any harmful software.</li>
          <li>Attempt to gain unauthorised access to the Site, its servers, or its APIs.</li>
          <li>Scrape the Site at a rate that degrades service for other users.</li>
          <li>Frame, mirror, or present the Site as your own work.</li>
          <li>Use automated systems to bulk-download Resources in a manner that abuses bandwidth.</li>
        </ul>
        <p>
          We reserve the right to block access to any client that violates
          these rules, at our discretion.
        </p>

        <h2>5. No warranty</h2>
        <p>
          The Site and its Resources are provided &ldquo;as is,&rdquo; without
          warranty of any kind, express or implied, including without limitation
          any warranty of merchantability, fitness for a particular purpose,
          or non-infringement. We do not guarantee that any Resource is free
          of defects, viruses, or errors.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Yannosay Productions shall
          not be liable for any indirect, incidental, special, consequential,
          or punitive damages arising out of or relating to your use of the
          Site or any Resource, even if advised of the possibility of such
          damages.
        </p>

        <h2>7. Copyright and DMCA</h2>
        <p>
          Yannosay Productions respects the intellectual property rights of
          others. If you believe a Resource on this Site infringes your
          copyright, see the <NuxtLink to="/legal/dmca">DMCA &amp; Takedown</NuxtLink>
          page for the process.
        </p>

        <h2>8. Changes to these terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will
          be reflected by a new &ldquo;Last updated&rdquo; date at the top of
          this page. Continued use of the Site after a change constitutes
          acceptance of the revised Terms.
        </p>

        <h2>9. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of
          Germany. Any dispute arising out of or relating to these Terms shall
          be subject to the exclusive jurisdiction of the courts of Germany.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these Terms should be directed to
          <strong>contact@yannosay.com</strong> or via the
          <NuxtLink to="/contact">contact page</NuxtLink>.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
useCanonical('/legal/terms')

useHead({
  title: 'Terms of Service',
  meta: [
    { name: 'description', content: 'Terms of Service for Yannosay Resources.' },
    { property: 'og:title', content: 'Terms of Service' }
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