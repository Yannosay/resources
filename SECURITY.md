# Security

## Threat model

This project assumes:

- The public network is hostile.
- The R2 bucket is not publicly accessible and never will be.
- Cloudflare is a trusted infrastructure provider operating under a data
  processing agreement.
- Admin credentials are shared with exactly one person and stored in a
  password manager.
- The admin password is strong (16+ characters, not reused).

## Authentication

- Password is hashed with SHA-256 and compared using byte-by-byte constant
  time XOR. No branch on secret data.
- The hash is stored as a Cloudflare Pages secret (`NUXT_ADMIN_PASSWORD_HASH`).
  If it is unset or shorter than 64 hex characters, every login returns 503.
  Fail closed.
- Successful login issues a 32-byte random session token, base64url encoded.
- Sessions are stored in KV under `session:<token>` with an 8-hour TTL.
- The token is set as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie,
  path `/`, max age 8 hours. No JavaScript on the page can read it.
- Sign-out deletes the KV entry and clears the cookie.
- The session cookie is never used for public pages.

## Rate limiting

- Login attempts are counted per client IP in KV under `rl:login:<ip>`.
- Window is 15 minutes. Maximum 5 attempts. Sixth attempt returns 429.
- Successful login resets the counter.
- Client IP is read from `cf-connecting-ip`, falling back to the first hop
  of `x-forwarded-for`. Both are set by Cloudflare, not the client.

## Origin verification

All state-changing admin endpoints (`POST`, `PATCH`, `DELETE`) verify that
the `Origin` header matches the `Host` header. Requests without an
`Origin` header are rejected with 403. This blocks cross-site form
submissions that would otherwise be possible if `SameSite=Strict` were
ever misconfigured.

## Input validation

Server-side, always. Every field is validated in `server/utils/validation.ts`
and `server/utils/text.ts`:

- `slug` — `^[a-z0-9-]{1,64}$`, no leading/trailing/double hyphens.
- `title` — 1–200 chars, HTML tags stripped, whitespace collapsed.
- `description` — 0–2000 chars, HTML tags stripped.
- `attribution` — 0–1000 chars, HTML tags stripped.
- `category` — one of a fixed set.
- `visibility` — one of `public`, `unlisted`, `private`.
- `license` — one of a fixed set.
- `tags` — max 20, each max 40 chars, deduplicated, HTML stripped.
- `file` — max 25 MB. MIME type is normalised; known dangerous types
  (`text/html`, `application/x-msdownload`, shell scripts, etc.) are
  coerced to `application/octet-stream`.

## File serving

- R2 is never public. Every read streams through the Worker.
- Every response sets `Content-Disposition: attachment` by default. The
  `inline=1` query parameter downgrades this to `inline` and is only
  honoured for images — the `Content-Type` still comes from the stored
  object, and `X-Content-Type-Options: nosniff` prevents MIME sniffing.
- `Content-Security-Policy` disallows inline scripts from unknown sources
  and `object-src 'none'`.
- Files that could be served as HTML are coerced to
  `application/octet-stream` at upload time.

## Headers

`public/_headers` sets on every request:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying camera, microphone, geolocation, payment, USB
- `Content-Security-Policy` with `default-src 'self'` and `frame-ancestors 'none'`

## What this project does not do

- No analytics, no third-party scripts, no advertising.
- No public upload path. Only the authenticated admin can create resources.
- No client-side markdown rendering. All rendering is server-side.

## Generating the admin password hash

Run locally:

    $pw = Read-Host -Prompt 'New admin password' -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw)
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $hash = $sha.ComputeHash($bytes)
    $hex = -join ($hash | ForEach-Object { $_.ToString('x2') })
    Write-Host $hex
    Remove-Variable plain, bytes, hash

Copy the printed hex string into the Cloudflare Pages secret.

## Reporting a vulnerability

Do not open a public issue. Email security@yannosay.com. Include a
description, reproduction steps, and the potential impact. We will
acknowledge within 3 business days.