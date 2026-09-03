# Data and privacy

## Stored data

- Owners: normalized email, bcrypt password hash, opaque-session hash/expiry, business profile, ownership membership, and bounded module configuration.
- Quote customers: submitted contact values, answers, optional private photos, submission UUID, and delivery diagnostic state.
- Trust: business-provided claims plus optional private PDF/JPG/PNG evidence.
- Analytics: business ID, controlled event type, and timestamp only.
- Abuse protection: salted hash of a transient network identifier, window time, and count. Raw addresses are not stored.

No analytics cookie, visitor ID, fingerprint, persistent visitor identity, arbitrary event metadata, or external analytics SDK exists. The owner session cookie is necessary authentication, not analytics; it is HTTP-only, SameSite=Lax, secure in production, expiring, and revocable.

## Retention

- Analytics: 90 days, supporting the rolling 30-day dashboard.
- Quotes, contact values, delivery diagnostics, and Quote photos: 365 days.
- Trust claims/evidence: while configured by an active business; replacement and business deletion remove files.
- Sessions: configured lifetime, default 30 days; expired rows are removed by cleanup.
- Rate-limit rows: at most 24 hours.

Run `npm run ops -- cleanup` daily. Business/account deletion procedures include private-object cleanup.

## Legal boundary

`/privacy` and `/terms` state product facts and link from public Action Pages. They do not claim GDPR, CCPA, or other jurisdiction-specific compliance. Obtain jurisdiction-specific legal review, identify the controller/operator, add contact details, and finalize language before public launch.
