<template>
  <section class="legal">
    <div class="legal__container">
      <header class="legal__header">
        <p class="legal__eyebrow">Legal</p>
        <h1 class="legal__title">Licensing</h1>
        <p class="legal__updated">Last updated: 27 September 2026</p>
      </header>

      <article class="prose legal__body">
        <h2>Per-resource licensing</h2>
        <p>
          Every resource on this Site carries its own license. The license is
          shown on the resource detail page, in the metadata block. Before
          using a resource in any project, check the license on that specific
          resource page. Do not assume all resources share one license.
        </p>

        <h2>Licenses you will encounter</h2>

        <h3>CC0 1.0 (Public Domain)</h3>
        <p>
          No rights reserved. You may use, modify, and redistribute the work
          for any purpose, commercial or non-commercial, without attribution.
          Attribution is appreciated but not required.
        </p>

        <h3>CC-BY 4.0 (Attribution)</h3>
        <p>
          You may use, modify, and redistribute the work for any purpose,
          provided you credit the creator. A valid attribution for our
          resources is:
        </p>
        <p>
          <code>Yannosay Productions — CC-BY 4.0 — https://resources.yannosay.com</code>
        </p>

        <h3>MIT License</h3>
        <p>
          Applies to most code resources. You may use, modify, and distribute
          the code freely, including commercially, provided you include the
          copyright notice and permission notice in copies or substantial
          portions of the software.
        </p>

        <h3>Apache License 2.0</h3>
        <p>
          Applies to some larger code resources. Permissive like MIT, with
          additional provisions on patent grants and trademark use. See the
          resource page for the full notice.
        </p>

        <h3>All Rights Reserved (Reference Only)</h3>
        <p>
          A small number of resources are published for reference or personal
          viewing only and do not carry a redistribution license. These are
          explicitly marked. You may view and study them; you may not
          redistribute them or use them in derivative work.
        </p>

        <h2>What this site does not license</h2>
        <p>
          The Site itself — its design, layout, source code, and branding —
          is the property of Yannosay Productions. Nothing on this page grants
          you rights to copy, mirror, or reproduce the Site interface.
        </p>

        <h2>Third-party material</h2>
        <p>
          Where a resource incorporates third-party material (fonts,
          sound samples, code libraries), the resource page lists those
          components and their licenses. You are responsible for complying
          with all applicable licenses.
        </p>

        <h2>Reporting license violations</h2>
        <p>
          If you believe a resource is being used in violation of its license,
          see the <NuxtLink to="/legal/dmca">DMCA &amp; Takedown</NuxtLink>
          page.
        </p>

        <h2>Questions</h2>
        <p>
          For licensing questions specific to a resource, contact
          <strong>contact@yannosay.com</strong>.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
useCanonical('/legal/license')

useHead({
  title: 'Licensing',
  meta: [
    { name: 'description', content: 'Licensing terms for resources published on Yannosay Resources.' },
    { property: 'og:title', content: 'Licensing' }
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