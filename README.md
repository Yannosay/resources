# Yannosay Resources

Public and private resource library for Yannosay Productions. Nuxt 4 on
Cloudflare Pages, backed by R2 for object storage and KV for metadata and
admin sessions.

## Stack

- Nuxt 4 (Vue 3, Nitro)
- Cloudflare Pages (Nitro preset)
- Cloudflare R2 (file storage)
- Cloudflare KV (resource metadata, admin sessions)
- TypeScript strict
- SCSS with shared mixins
- Self-hosted fonts (Unbounded, DM Serif Display, JetBrains Mono)

## Local development

    pnpm install
    pnpm dev

The site serves at http://localhost:3000.

In dev mode, R2 and KV are emulated under `.data/r2/` and `.data/kv/`.
No Cloudflare credentials are required for local work.

## Type check

    pnpm typecheck

## Production build

    pnpm build

Output goes to `dist/`.

## Deployment

    pnpm exec wrangler pages deploy dist --project-name=yannosay-resources --branch=main

## Cloudflare setup

One-time setup in the Cloudflare dashboard:

1. Create the KV namespace:

       pnpm exec wrangler kv namespace create RESOURCES_KV
       pnpm exec wrangler kv namespace create RESOURCES_KV --preview

   Copy the two IDs into `wrangler.toml` under `[[kv_namespaces]]`.

2. Create the R2 bucket:

       pnpm exec wrangler r2 bucket create yannosay-resources

   The binding is already declared in `wrangler.toml` as `RESOURCES_BUCKET`.
   Do **not** attach a public domain to this bucket. All reads go through
   the Worker so visibility rules and download counting are enforced.

3. Set the admin password hash (see SECURITY.md for how to generate it):

       pnpm exec wrangler pages secret put NUXT_ADMIN_PASSWORD_HASH --project-name=yannosay-resources

4. Set the session secret (optional, reserved for future use):

       pnpm exec wrangler pages secret put NUXT_SESSION_SECRET --project-name=yannosay-resources

5. Attach the custom domain:

   Pages → yannosay-resources → Custom domains → add `resources.yannosay.com`.

## Assets required in `public/`

- `public/assets/images/logo/logo.png` — Yannosay wordmark, transparent PNG.
- `public/fonts/unbounded-200.woff2`
- `public/fonts/unbounded-400.woff2`
- `public/fonts/unbounded-900.woff2`
- `public/fonts/dm-serif-display-400.woff2`
- `public/fonts/dm-serif-display-400-italic.woff2`
- `public/fonts/jetbrains-mono-400.woff2`
- `public/favicon.ico`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`
- `public/og/og-default.png` — 1200×630 PNG.

Fonts are sourced from @fontsource on cdn.jsdelivr.net. Never from Google
Fonts.

## Routes

Public:

- `/` — landing page
- `/browse` — all public resources
- `/browse/[category]` — filtered by category
- `/resource/[slug]` — resource detail
- `/about` — about page
- `/contact` — contact page
- `/legal/terms`, `/legal/privacy`, `/legal/license`, `/legal/dmca` — legal pages

Admin (session required):

- `/admin/login` — sign-in
- `/admin` — dashboard
- `/admin/upload` — new resource
- `/admin/resource/[slug]` — edit existing

## API

Public:

- `GET /api/public/resources` — list public resources
- `GET /api/public/resources/[slug]` — resource metadata
- `GET /api/public/resources/[slug]/download` — stream file

Admin (session + Origin check):

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/stats`
- `GET /api/admin/resources`
- `POST /api/admin/resources`
- `GET /api/admin/resources/[slug]`
- `PATCH /api/admin/resources/[slug]`
- `DELETE /api/admin/resources/[slug]`

See SECURITY.md for the threat model.