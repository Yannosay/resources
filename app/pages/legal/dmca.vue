<template>
  <section class="legal">
    <div class="legal__container">
      <header class="legal__header">
        <p class="legal__eyebrow">Legal</p>
        <h1 class="legal__title">DMCA &amp; Takedown</h1>
        <p class="legal__updated">Last updated: 27 September 2026</p>
      </header>

      <article class="prose legal__body">
        <h2>Our position</h2>
        <p>
          Yannosay Productions respects the intellectual property rights of
          others. If you believe that a resource published on this Site
          infringes your copyright, we will act on a valid takedown notice
          promptly.
        </p>

        <h2>How to submit a takedown notice</h2>
        <p>
          Send a written notice to <strong>dmca@yannosay.com</strong>. Your
          notice must include all of the following. Incomplete notices will
          be returned.
        </p>

        <ol>
          <li>
            <strong>Identification of the copyrighted work</strong> you claim
            has been infringed. Provide a description and, if possible, a URL
            to the original work.
          </li>
          <li>
            <strong>Identification of the infringing material</strong> on
            this Site. Provide the exact URL(s) of the resource(s) you are
            reporting.
          </li>
          <li>
            <strong>Your contact information</strong> — full legal name,
            mailing address, telephone number, and email address.
          </li>
          <li>
            <strong>A statement of good faith</strong> that you believe the
            use of the material is not authorised by the copyright owner,
            its agent, or the law.
          </li>
          <li>
            <strong>A statement of accuracy</strong>, made under penalty of
            perjury, that the information in your notice is accurate and that
            you are the copyright owner or authorised to act on the owner's
            behalf.
          </li>
          <li>
            <strong>Your physical or electronic signature.</strong>
          </li>
        </ol>

        <h2>What happens next</h2>
        <p>
          On receipt of a complete notice, we will:
        </p>
        <ol>
          <li>Confirm receipt within 2 business days.</li>
          <li>
            Remove or disable access to the identified resource within 5
            business days, unless the notice is invalid on its face.
          </li>
          <li>
            Notify the uploader, if any, that the resource has been removed
            and provide them with a copy of the notice.
          </li>
        </ol>

        <h2>Counter-notice</h2>
        <p>
          If your resource was removed and you believe the removal was in
          error, you may submit a counter-notice to
          <strong>dmca@yannosay.com</strong>. A valid counter-notice must
          include:
        </p>
        <ol>
          <li>Your contact information.</li>
          <li>Identification of the removed resource and its prior location.</li>
          <li>
            A statement under penalty of perjury that you have a good faith
            belief the material was removed by mistake or misidentification.
          </li>
          <li>
            A statement that you consent to the jurisdiction of the courts
            of the Federal Republic of Germany.
          </li>
          <li>Your physical or electronic signature.</li>
        </ol>

        <h2>Repeat infringers</h2>
        <p>
          Yannosay Productions maintains a policy of terminating access for
          any uploader who repeatedly infringes copyright. Because this Site
          does not have public uploaders, that policy applies primarily to
          internal contributors and contracted artists.
        </p>

        <h2>Misrepresentation</h2>
        <p>
          Be aware that under applicable law, you may be liable for damages
          (including costs and attorneys&rsquo; fees) if you materially
          misrepresent that a resource is infringing your copyright.
        </p>

        <h2>Contact</h2>
        <p>
          Takedown notices: <strong>dmca@yannosay.com</strong>
        </p>
        <p>
          General legal enquiries: <strong>contact@yannosay.com</strong>
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
useCanonical('/legal/dmca')

useHead({
  title: 'DMCA & Takedown',
  meta: [
    { name: 'description', content: 'How to submit a takedown notice for content on Yannosay Resources.' },
    { property: 'og:title', content: 'DMCA & Takedown' }
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