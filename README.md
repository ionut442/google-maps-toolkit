# Google Maps Toolkit / LocalAction

V1 SaaS for customer-facing Action Pages, constrained Quote Requests, customer-decision tools, Review Kit, QR downloads, and lightweight activity analytics for local service businesses.

## Local setup

Prerequisites: Node.js 20.9+ (tested with Node 24), npm, and an isolated non-production Neon branch.

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Set both Neon database URLs in `.env`, using the pooled URL for `DATABASE_URL` and the direct URL for `DATABASE_URL_UNPOOLED`. Never seed or run tests on the production branch. Open `http://localhost:3000`. Seed logins: `owner@example.test` and `other-owner@example.test`, both with `LocalDevOnly!123` (development data only).

Public Action Pages use `/{business-slug}`. Published, enabled Quote modules render a mobile form from the owner's validated field configuration. Successful requests appear in `/dashboard/quotes`; photos are private and stream only through an authenticated, ownership-checked route.

Quote submission stores the lead before attempting email. Local development captures delivery through the persisted `EmailDelivery` row. Run `npm run email:retry` from a scheduler to retry due failures. Production email uses Resend when `EMAIL_TRANSPORT=resend`; missing production configuration fails closed without losing the lead.

Public submissions use a hidden honeypot, same-origin multipart requests, a required bounded `Content-Length`, strict dynamic-field validation, and a persistent limit of 5 attempts per hashed client/business pair per 15-minute window. Raw network addresses are not stored.

To exercise the full local flow, open `/rapidflow-plumbing` at a phone-sized viewport, submit its Quote form with a real JPG/PNG/WebP image, then log in as `owner@example.test` and open **Quote Requests → View history**. The detail page shows captured answers, delivery state, and ownership-protected photo links. `/brightjet-washing` provides the Pressure Washing form; `other-owner@example.test` owns it for authorization checks.

## Goal 4 customer-decision tools

- **Pricing** is one strict module with either a scannable price list or a constrained estimator: integer-minor-unit base amount, up to 12 fixed add-ons, and at most one bounded integer quantity × unit price. It has no formula, tax, discount, or invoice language. Estimator URL context carries only stable option IDs and quantity; both the page and Quote endpoint recalculate it before displaying/persisting a non-binding summary.
- **Service Area** stores up to 20 display areas and 20 exact postcodes. Area whitespace is collapsed for uniqueness. Postcodes are trimmed, uppercased, and stripped of ASCII spaces/hyphens for exact matching; display text is preserved. A missing postcode is deliberately described as “not listed,” not refused. No maps, geocoding, GIS, coordinates, radius, or external lookup exists.
- **Trust / Credentials** stores up to 12 business-provided entries with optional description, reference, expiry, and one private evidence file. Evidence accepts signature-validated PDF, JPG, or PNG up to 5 MB. It reuses `PrivateObjectStorage`, opaque keys, safe display filenames, ownership queries, and cleanup. Files never enter the public DTO and download only from an authenticated owner route. Expired entries remain visible with a dashboard warning but are omitted publicly.
- **FAQ** retains the Goal 2 plain-text, length-bounded CRUD/reordering and native `<details>` accordion. Plumbing, HVAC, Pressure Washing, and Cleaning templates provide focused starter questions.

Goal 4 adds no environment variables. Migration `20260827062039_add_trust_evidence` adds private Trust evidence metadata and its business relationship.

## Goal 5 review, QR, and activity

- A valid configured HTTP(S) review destination enables the public “Leave Us a Review” link, owner Test Review Link, direct Review QR, printable 2480 × 3508 PNG sign, and fixed 1200 × 1200 social PNG. Business Page QR instead opens the complete canonical Action Page. Both QR downloads are deterministic 1024 × 1024 high-contrast PNGs with a four-module quiet zone.
- Review Kit layouts are platform-controlled and generated on demand. Brand contrast is normalized, QR colours never inherit branding, long names wrap predictably, absent logos use an intentional monogram/clean fallback, and remotely referenced PNG/JPEG/WebP logos are fetched only over public HTTPS with strict size/type/redirect/address controls and contained without distortion.
- First-party analytics stores only `Business ID + controlled event type + timestamp` for `PAGE_VIEW`, `CALL_CLICK`, `WHATSAPP_CLICK`, and `REVIEW_CLICK`. A page view means one hydrated Action Page load, not a unique visitor. Native links send best-effort beacons without preventing navigation; failures are invisible to customers.
- Quote metrics query successfully persisted Quote Requests directly, so no client conversion event can double-count them. Last 30 Days is an inclusive rolling 30 × 24-hour window. Recent Activity merges a bounded set of analytics events and Quote Requests at read time.
- Goal 5 analytics creates no analytics cookie, retains no IP address, and creates no visitor identifier or fingerprint. V1 retains its deliberately tiny event rows indefinitely; Goal 6 should review retention and production policy without adding tracking identity.

Migration `20260827090000_goal_5_analytics` adds `AnalyticsEvent` and indexed business/time lookups. Goal 5 adds no environment variable; `APP_URL` is the canonical base used by Business Page QR and should be set to the public origin outside local development.

## Environment

- `DATABASE_URL`: pooled Neon PostgreSQL URL used by the application.
- `DATABASE_URL_UNPOOLED`: direct Neon PostgreSQL URL used for migrations.
- `APP_URL`: origin-only application URL for public links, metadata, email links, and QR destinations. Production requires a public HTTPS origin; development defaults to `http://localhost:3000`.
- `SESSION_TTL_DAYS`: opaque login-session lifetime; defaults to 30.
- `PRIVATE_STORAGE_PROVIDER`: `local` for development or `neon` for production.
- `PRIVATE_STORAGE_DIR`: private local development object root. It must not be web-served or placed under `public/`.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`: Neon Object Storage S3-compatible credentials and endpoint. Production uses the private `uploads` bucket.
- `QUOTE_RATE_LIMIT_SALT`: production secret used to hash client network identifiers before persistence.
- `TRUST_PROXY_HEADERS`: production must set `true` only when trusted ingress overwrites the selected client-IP header.
- `TRUSTED_CLIENT_IP_HEADER`: `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip`.
- `EMAIL_TRANSPORT`: `development` outside production or `resend` in production.
- `EMAIL_FROM`: verified sender used by the Resend adapter.
- `RESEND_API_KEY`: required only for production Resend delivery.

Production must supply the pooled/direct Neon URLs, Object Storage credentials, rate-limit salt, trusted-ingress settings, and Resend values. `EMAIL_FROM` must be a sender accepted by Resend; use a verified domain sender for deployment. Development can use local private storage and the capture email transport.

## Database and validation

Migrations live in `prisma/migrations`. `npm run db:migrate` deploys them through the direct Neon URL; `npm run db:seed` is idempotent and development-only. Tests require `TEST_DATABASE_URL` plus `TEST_DATABASE_URL_UNPOOLED`, or a linked non-production Neon branch. `npm run db:reset` refuses the configured application database and requires an explicit test database URL.

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Vitest applies migrations to the isolated PostgreSQL test branch before the run. Set `NEON_STORAGE_INTEGRATION=1` to include the real private-bucket storage test.

See [ARCHITECTURE.md](ARCHITECTURE.md) for architecture decisions. Production and private-beta operations are documented in [PRODUCTION.md](PRODUCTION.md), [PRIVATE_BETA_RUNBOOK.md](PRIVATE_BETA_RUNBOOK.md), [DATA_AND_PRIVACY.md](DATA_AND_PRIVACY.md), and [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
