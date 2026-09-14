# V1 architecture

- Next.js App Router and React Server Components provide routing/rendering. Mutations use server actions; protected reads run on the server.
- Prisma provides a typed persistence boundary over Neon PostgreSQL. Runtime traffic uses the pooled `DATABASE_URL`; migrations and other session-sensitive operations use `DATABASE_URL_UNPOOLED`. Development and tests use isolated Neon branches rather than SQLite.
- Users own/manage businesses through `Membership`. Every business mutation resolves the authenticated user and verifies membership server-side.
- Authentication uses bcrypt password hashes plus random opaque session tokens. Only SHA-256 token hashes are stored; cookies are HTTP-only, same-site, secure in production, expiring, and revocable.
- Industry templates are a strongly typed registry in `src/lib/templates.ts`. Module types/configurations form a closed registry validated with strict Zod schemas; no arbitrary blocks or unvalidated JSON enter the database.
- Business profile is shared data. Modules reference the business rather than duplicate phone, email, branding, review URL, or contact values.
- Public pages use root slugs. Reserved application/system routes are blocked, collisions receive numeric suffixes, and unpublished businesses return 404.
- `src/lib/public-business.ts` is the public data boundary: one selected Prisma read returns only published profile fields plus enabled, ordered modules. Module JSON is parsed through the closed schema registry; malformed entries are omitted without exposing database or ownership fields.
- The public Action Page is server-rendered. `publicModuleRegistry` is the module-rendering boundary; only the Quote form, constrained estimator, and exact-postcode checker hydrate.
- Phone, WhatsApp, external URL, brand-colour, and vCard helpers are deterministic shared boundaries with defensive validation. Contact-card downloads repeat the published-business check and use a sanitized attachment filename.
- Quote configuration is a closed discriminated schema: text, number, dropdown, multiple choice, checkbox, address, contact, and photo fields. Owner mutations parse the complete result and enforce business membership on every write.
- Public quote submission repeats published/enabled/config validation on the server. It rejects unknown answer keys, validates field-specific values, checks photo signatures and limits, hashes the client identifier for a persistent per-business rate limit, and uses a honeypot plus strict origin/content-type/content-length guards.
- Quote persistence owns the atomic database boundary: answers, contact details, upload metadata, and a durable email-delivery job commit together. Private object writes happen first and are deleted if the transaction fails. A submission UUID provides replay idempotency.
- `PrivateObjectStorage` isolates storage. Development may use the local adapter; production selects `NeonPrivateStorage`, backed by the private `uploads` bucket through its S3-compatible endpoint. Downloads always pass through authenticated, business-scoped application routes and never expose object keys or public bucket URLs.
- Email delivery is downstream of lead persistence. Message content and destination are captured durably, and the Resend adapter records the provider message ID on success. Immediate transport failure leaves a retryable job; the retry command uses bounded attempts, exponential delay, atomic claims, and stale-claim recovery. No email result can roll back or duplicate a quote.
- Quote history/detail reads are owner-scoped. Successful persisted Quote Requests are the sole Quote metric source.
- Pricing uses strict discriminated JSON configs and integer minor units. Quote handoff transmits only option IDs/quantity and is authoritatively recalculated. Service-area matching is deterministic exact normalized text, not geospatial logic.
- Trust entries remain strict module config. `TrustEvidence` stores only private metadata/association; bytes reuse `PrivateObjectStorage`, and owner download repeats membership authorization. The public DTO never selects evidence. Expired entries are filtered during rendering and claims are labelled as business-provided.
- `AnalyticsEvent` is a minimal first-party append-only fact (`businessId`, controlled event type, timestamp). Public beacons resolve only published slugs, reject arbitrary names/metadata, and fail open after validation. No analytics cookie, IP, persistent visitor identity, fingerprint, arbitrary payload, external SDK, or Quote conversion event exists.
- Dashboard activity queries verify membership, aggregate an inclusive rolling 30-day window, and merge recent analytics with authoritative Quote rows in a bounded read DTO. No duplicate activity table or analytics platform exists.
- QR and Review Kit outputs are owner-authorized, deterministic, on-demand PNG responses. Destinations derive from server-owned business data and canonical `APP_URL`; no arbitrary URL/template endpoint exists. Review QR targets Google directly while Business Page QR targets the complete published Action Page. Fixed Sharp-based templates preserve QR contrast and contain safely fetched public HTTPS raster logos.
- Goal 6 centralizes canonical URL, session lifetime, trusted-ingress, and production prerequisite validation. Production never falls back to localhost or arbitrary request hosts.
- Email workers atomically claim delivery rows with a recoverable processing timeout, preventing normal concurrent workers from sending the same job twice.
- Private-beta operations remain scripts, not an admin product. Cleanup retains analytics for 90 days, Quotes/uploads for 365 days, expired sessions until cleanup, and rate-limit rows for at most 24 hours.
- Business/account deletion unpublishes first, removes known private objects, then relies on database cascades. Object-removal failure stops database deletion for safe retry.
- CRM, SMS, calendars, maps, geocoding/GIS, arbitrary pricing formulas, arbitrary form builders, public credential documents, external surveillance analytics, graphic editors, and general-purpose uploads remain outside Goal 5.

# Billing and publication entitlement

Paddle Billing is LocalAction's Merchant of Record. A `BusinessBilling` record
belongs one-to-one to `Business`, because the €9.99/month plus applicable tax
subscription is sold per business rather than per user. The configured recurring
price includes a one-month free trial and collects payment details at trial start.

Paddle webhooks are the subscription source of truth. Only verified
`subscription.created` and `subscription.updated` events update the local billing
record. Event IDs make repeat delivery safe and `occurred_at` prevents stale
events from overwriting newer state. Checkout custom data carries the LocalAction
business ID plus a server signature so a browser cannot assign a subscription to
an arbitrary business.

`trialing`, `active`, and `past_due` are entitled. Paddle recommends retaining
access while it retries past-due payments; the dashboard directs the owner to the
portal. `paused` and `canceled` are not entitled and their webhook unpublishes the
page without deleting configuration. An entitled initial-onboarding webhook may
auto-publish only while `onboardingStep < 7` and all existing readiness checks
pass, so it cannot republish a page an owner later unpublished. Paddle's hosted
customer portal handles payment methods, invoices, and cancellation.
