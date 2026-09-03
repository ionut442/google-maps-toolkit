# Troubleshooting

- Database connection: verify the pooled `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED`, Neon branch selection, and `npm run ops -- health`. Never run tests or seed against the production branch.
- Migration failure: stop rollout, preserve the database, inspect `npm run db:migrate`, and restore only from a verified coordinated backup. Do not rewrite migration history.
- Wrong QR/canonical/email destination: run `npm run config:check`; `APP_URL` must be the exact public HTTPS origin. Assets generate on demand after correction.
- Resend/email failure: verify transport, key, verified sender, outbound HTTPS, and provider status. Inspect failed jobs, then retry due work.
- Stuck email job: `PROCESSING` becomes retryable after ten minutes. Confirm only intended workers run, then retry.
- Upload/storage failure: confirm `PRIVATE_STORAGE_PROVIDER=neon`, Object Storage credentials/endpoint/region, and that the `uploads` bucket remains private. Deletion stops if an object cannot be removed. For local development, confirm the private directory is writable and outside `public/`.
- Rate limiting: verify ingress overwrites the chosen IP header. Missing/invalid trusted headers make production Quote submission fail closed with 503; repeated attempts receive 429 and `Retry-After`.
- QR/assets: confirm publication/review URL, `APP_URL`, memory, and optional remote-logo reachability. QR generation does not require a remote logo.
- Analytics: analytics is best effort and cannot block actions. Run cleanup, inspect structured `public_analytics_persist_failed` logs, and verify database health.
- Build/config: use supported Node/npm, run `npm ci`, `npm run config:check`, then format, lint, typecheck, tests, and build.
