# Oracle deployment and updates

The canonical production application is available at `https://local-action.com`. DNS for `local-action.com` and `www.local-action.com` points to the Oracle VM. Public TCP ports 80 and 443 terminate at Caddy, which serves the canonical hostname, permanently redirects `www.local-action.com` and the legacy `redsearch.qd.je` hostname to `https://local-action.com{uri}`, and reverse-proxies only the canonical hostname to `127.0.0.1:3040`. Port 3040 must never be exposed publicly.

The application runs as the dedicated, non-login `googlemaps` user from `/opt/google-maps-toolbox` under `google-maps-toolbox.service`. Caddy runs under `caddy.service`. Both services are enabled at boot. The protected runtime file is `/opt/google-maps-toolbox/.env.production` and must remain mode `0600`, owned by `googlemaps:googlemaps`.

Production uses `APP_URL=https://local-action.com`, enables trusted proxy headers, and treats Caddy's `X-Forwarded-For` value as the authoritative client IP. Caddy must remain the only public ingress because its default reverse-proxy behavior discards spoofed client forwarding values before setting the upstream header.

The VM has approximately 956 MiB RAM and a persistent 4 GiB `/swapfile` with mode `0600`. Keep `vm.swappiness=10`; verify swap before dependency installation or production builds. The persisted firewall policy permits public TCP 80 and 443 for Caddy and SSH TCP 22 for administration.

## Prepare an update locally

Create a new timestamped source archive from the project directory. Use an allowlist containing `src`, `prisma`, `scripts`, `package.json`, `package-lock.json`, the TypeScript/Next/Prisma configuration files, `.env.example`, and production documentation. Explicitly exclude `.env`, `.env.*` except `.env.example`, `.neon`, `node_modules`, `.next`, `.git`, `.tmp*`, coverage and browser artifacts, test databases, local storage/mail data, and `ssh-key-2026-08-19.key`.

List and inspect the archive before transfer, calculate its SHA-256 hash, then copy only the archive to `/tmp` with `scp -i .\ssh-key-2026-08-19.key`. Transfer changed production secrets separately; never place them in the source archive.

## Apply an update on Oracle

1. Confirm the database and private Object Storage have a coordinated provider backup or recovery point.
2. Verify the uploaded archive hash and recheck its entries for excluded files.
3. Preserve `/opt/google-maps-toolbox/.env.production`; do not print it.
4. Stop only `google-maps-toolbox.service`. Do not stop or change the design-services email scheduler.
5. Replace only the Toolbox source/configuration paths from the verified archive. Do not remove the protected environment file or reuse another application's directories.
6. Restore `googlemaps:googlemaps` ownership, directory mode `0750`, ordinary source mode `0640`, and environment mode `0600`.
7. As `googlemaps`, run `npm ci` with the lockfile and all build dependencies, then `npm run db:generate` and `npx prisma validate`.
8. Export the protected environment, run `npm run config:check`, `npx prisma migrate status`, and `npm run db:migrate`. Never reset or seed production.
9. Set `NEXT_DEPLOYMENT_ID` in the staged release environment to the exact commit SHA, then build on Oracle with `NEXT_TELEMETRY_DISABLED=1 npm run build`. The same value must be available to `next start`; this lets Next.js detect tabs from an older release and reload them before they invoke stale Server Actions.
10. Restart only `google-maps-toolbox.service` and verify `systemctl status`, `journalctl`, `127.0.0.1:3040`, a static asset, and `npm run ops -- health`.
11. Verify `google-maps-toolbox-email-retry.timer` and `google-maps-toolbox-retention.timer` remain enabled and successful.
12. Remove the uploaded archive after successful validation. Retain the previous recovery point until the deployment is accepted.

After an update, validate the loopback origin and `https://local-action.com`. Confirm Caddy presents valid certificates for `local-action.com` and `www.local-action.com`; HTTP redirects to HTTPS; `www.local-action.com` and `redsearch.qd.je` preserve path/query while permanently redirecting to the canonical hostname; public routes respond; port 3040 remains loopback-only; and the unrelated design-services email scheduler remains active.
