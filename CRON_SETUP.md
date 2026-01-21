# Cron Trigger Setup for Cloudflare Workers

This document explains how the scheduled cron trigger is configured for automatic data synchronization.

## Overview

The application uses Cloudflare Workers cron triggers to automatically sync achievement data every hour. The cron job is configured to run at minute 0 of every hour (`0 * * * *`).

## How It Works

1. **Cron Configuration**: Defined in `wrangler.jsonc` under `triggers.crons`
2. **Worker Handler**: A post-build script adds a `scheduled()` export to the OpenNext-generated worker
3. **Sync Endpoint**: The cron trigger calls `/api/cron/sync` which handles the actual data synchronization
4. **Authentication**: Uses a `CRON_SECRET` to authenticate the cron trigger

## Setup Instructions

### 1. Set the CRON_SECRET

The cron trigger requires a secret token for authentication. Set it using Wrangler:

```bash
# Generate a secure random secret
openssl rand -base64 32

# Set the secret in Cloudflare
wrangler secret put CRON_SECRET
# (paste the generated secret when prompted)
```

### 2. Configure Worker Domain (Optional)

If you want to specify a custom domain for the cron callback, add it to `wrangler.jsonc`:

```jsonc
"vars": {
  "WORKER_DOMAIN": "your-custom-domain.com"
}
```

If not set, it defaults to `cursor-dashboard.cfi-ops.workers.dev`.

### 3. Build and Deploy

The build process automatically patches the worker to add cron support:

```bash
# Build for Cloudflare
npm run build:cf

# Deploy to Cloudflare
npm run deploy

# Or preview locally
npm run preview
```

## Local Development

For local testing, create a `.dev.vars` file with:

```bash
CRON_SECRET=your-random-cron-secret-for-dev
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=your_random_secret_for_dev
BETTER_AUTH_URL=http://localhost:3000
CURSOR_API_KEY=your_cursor_api_key
```

### Testing the Cron Endpoint Locally

You can manually trigger the sync endpoint:

```bash
curl -X GET http://localhost:3000/api/cron/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "X-Cron-Trigger: manual"
```

## Build Process Details

### The Patch Script

The `scripts/patch-worker-cron.mjs` script runs after the OpenNext build:

1. Reads the generated `.open-next/worker.js` file
2. Adds a `scheduled()` export function
3. The `scheduled()` function calls the sync endpoint when triggered by Cloudflare

### Why This Approach?

OpenNext generates a worker that only exports a default `fetch()` handler for HTTP requests. Cloudflare Workers cron triggers require a separate `scheduled()` export. Since we can't modify the OpenNext generation process directly, we patch the output file post-build.

## Troubleshooting

### "Handler does not export a scheduled() function"

This error means the `scheduled()` export is missing. Solutions:

1. Ensure you ran `npm run build:cf` before deploying (not just `opennextjs-cloudflare build`)
2. Check that the patch script ran successfully during build
3. Verify `.open-next/worker.js` contains the `scheduled` export

### Cron Not Running

1. Check Cloudflare dashboard → Workers → your-worker → Triggers → Cron Triggers
2. Verify the cron schedule is configured: `0 * * * *`
3. Check the worker logs for errors

### Authentication Errors

1. Verify `CRON_SECRET` is set: `wrangler secret list`
2. Ensure the secret matches between Cloudflare and your local `.dev.vars`
3. Check the `/api/cron/sync` endpoint accepts the Authorization header

## Monitoring

You can check the cron execution status:

```bash
# Check recent cron executions in Cloudflare dashboard
# Or query the sync status via API:
curl -X POST https://your-worker.workers.dev/api/cron/sync \
  -H "Content-Type: application/json"
```

The sync endpoint at `/api/cron/sync` includes:
- Lock management to prevent concurrent syncs
- Rate limiting
- Error handling and logging
- Sync status tracking in KV storage

## Architecture

```
Cloudflare Cron Trigger (every hour)
  ↓
worker.js scheduled() export
  ↓
HTTP GET to /api/cron/sync
  ↓
runIncrementalSync()
  ↓
- Fetch data from Cursor API
- Update D1 database
- Calculate achievements
- Update KV metadata
```

## Related Files

- `wrangler.jsonc` - Cron trigger configuration
- `scripts/patch-worker-cron.mjs` - Post-build patch script
- `src/app/api/cron/sync/route.ts` - Sync endpoint handler
- `src/lib/achievement-sync.ts` - Sync logic implementation
- `src/lib/sync-metadata-kv.ts` - Lock and metadata management
