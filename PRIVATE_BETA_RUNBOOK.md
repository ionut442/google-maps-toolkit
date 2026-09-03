# Private-beta runbook

Run commands from the application directory with production variables loaded. Commands expose operational metadata, not full Quote bodies or private object keys.

## Health and businesses

```powershell
npm run ops -- health
npm run ops -- list-businesses
```

Accounts use normal signup. Approve selected beta businesses operationally before sharing URLs. To stop an abusive or compromised business immediately:

```powershell
npm run ops -- unpublish <business-id>
```

## Email failures

```powershell
npm run ops -- failed-emails
npm run ops -- retry-emails
```

Confirm provider configuration, sender verification, and connectivity before repeated retries. Jobs stop after five attempts.

## Retention cleanup

Run daily:

```powershell
npm run ops -- cleanup
```

This removes analytics older than 90 days, Quotes/uploads older than 365 days, expired sessions, and rate-limit rows older than 24 hours. Failed private-file removal leaves the Quote row and reports a failure for retry.

## Deletion requests

First unpublish, verify exact ID/email twice, and take a recovery backup if policy allows. Commands require literal confirmation:

```powershell
npm run ops -- delete-business <business-id> --confirm=<business-id>
npm run ops -- delete-user owner@example.com --confirm=owner@example.com
```

Business deletion removes Quote photos and Trust evidence before cascading database records. Account deletion removes solely owned businesses and the user from shared businesses. If file deletion fails, database deletion stops; fix storage access and retry.

## Migration and recovery

Before deploy: coordinated database/private-storage backup, `npm run config:check`, then `npm run db:migrate`. After deploy: `npm run ops -- health`, inspect failed emails, and perform a synthetic journey. Rehearse provider-specific restore steps against disposable infrastructure.
