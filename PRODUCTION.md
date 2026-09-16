# Production deployment

## Runtime and first run

Use Node.js 20.9 or newer (Node 24 is tested), npm, Neon PostgreSQL, the private Neon Object Storage `uploads` bucket, and Resend.

```powershell
npm ci
npm run db:generate
npm run config:check
npm run db:migrate
npm run build
npm run start
```

Run `npm run ops -- health` after migration and start. Seed is development-only; do not run it against real production data.

## Required environment

- `DATABASE_URL`: pooled Neon PostgreSQL connection for application runtime.
- `DATABASE_URL_UNPOOLED`: direct Neon PostgreSQL connection for Prisma migrations.
- `APP_URL`: exact public HTTPS origin, with no path, query, or fragment. It controls canonical metadata, email links, and QR destinations.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: production Clerk publishable key; required during the Next.js build.
- `CLERK_SECRET_KEY`: production Clerk secret key; server-only and never a public build argument.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`, and both Clerk force-redirect values set to `/auth/continue`.
- `PRIVATE_STORAGE_PROVIDER=neon`.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION=us-east-2`: credentials and endpoint for the private Neon Object Storage `uploads` bucket.
- `QUOTE_RATE_LIMIT_SALT`: random secret of at least 32 characters.
- `TRUST_PROXY_HEADERS=true`: only behind ingress that removes client-supplied forwarding headers and writes the authoritative value.
- `TRUSTED_CLIENT_IP_HEADER`: `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip`.
- `EMAIL_TRANSPORT=resend`, `RESEND_API_KEY`, and verified `EMAIL_FROM`.
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_PRICE_ID`, and
  `NEXT_PUBLIC_PADDLE_ENVIRONMENT`. Sandbox uses `sandbox`, a `_sdbx_` API key,
  and a `test_` client token; Live uses `live`, a `_live_` key, and a `live_`
  token. All IDs and credentials must come from the same Paddle environment.

`npm run config:check` fails for localhost/insecure `APP_URL`, non-PostgreSQL or missing pooled/direct database URLs, local production storage, invalid Object Storage configuration, placeholders, invalid session lifetime, untrusted proxy settings, missing Resend configuration, or missing/mixed Paddle configuration.

## Ingress and abuse protection

Configure ingress to discard inbound forwarding headers, then set exactly one authoritative client-IP header. Keep TLS termination, request-size limits, and coarse login/signup throttling at ingress. The Quote endpoint also enforces same-origin multipart requests, actual/declared 16 MB limits, signature-checked uploads, a honeypot, and persistent 5-per-15-minute limits.

## Email retry

Run `npm run email:retry` every minute. Jobs use bounded exponential backoff, a five-attempt cap, atomic claims, and stale-claim recovery after ten minutes. The Quote remains stored when delivery fails. Use `npm run ops -- failed-emails` and `npm run ops -- retry-emails` for operations.

## Storage

Keep the Neon `uploads` bucket private. Quote photos accept at most three signature-validated JPG, PNG, or WebP files, each no larger than 5 MiB (`5 * 1024 * 1024` bytes). Trust evidence accepts one signature-validated PDF, JPG, or PNG with the same limit. Owners retrieve bytes only through authenticated, business-scoped application routes. The local adapter remains development-only and must never be mounted under `public/`.

## Backup and deployment order

Back up PostgreSQL and Object Storage as one recovery set before migrations. Stop writes or use snapshots with a shared consistency point. Deploy by: back up, run migrations with the direct URL, start, health check, then exercise one synthetic Quote and delivery job. Restore database and objects to the same recovery point. Backups and restores require live provider verification; repository tests do not prove them.
