# Cron Trigger Error Fix - Deployment Guide

## Problem

Cloudflare is showing the following error:
```
Handler does not export a scheduled() function
```

This happens because the OpenNext-generated worker doesn't include the `scheduled()` export required for cron triggers.

## Solution Summary

I've implemented a post-build patch script that automatically adds the `scheduled()` export to your worker after the OpenNext build process. Here's what was changed:

### Changes Made

1. **Created patch script**: `scripts/patch-worker-cron.mjs`
   - Automatically adds `scheduled()` export to `.open-next/worker.js`
   - Runs after OpenNext build

2. **Updated build scripts** in `package.json`:
   - New `build:cf` command: Builds for Cloudflare with cron support
   - Updated `deploy` and `preview` to use `build:cf`

3. **Updated configuration**:
   - `wrangler.jsonc`: Added CRON_SECRET documentation
   - `README.md`: Updated with new setup instructions
   - `CRON_SETUP.md`: Comprehensive cron documentation

## Deployment Steps

Follow these steps to fix the error in production:

### Step 1: Set the CRON_SECRET

```bash
# Generate a secure random secret
openssl rand -base64 32

# Set it in Cloudflare
wrangler secret put CRON_SECRET
# Paste the generated secret when prompted
```

### Step 2: Verify CURSOR_API_KEY is set

```bash
# Check if it exists
wrangler secret list

# If not set, add it:
wrangler secret put CURSOR_API_KEY
```

### Step 3: (Optional) Set Worker Domain

If you want to explicitly set your worker domain, uncomment the `vars` section in `wrangler.jsonc`:

```jsonc
"vars": {
  "WORKER_DOMAIN": "cursor-dashboard.cfi-ops.workers.dev"
}
```

### Step 4: Build and Deploy

```bash
# Build with cron support
npm run build:cf

# Verify the patch was applied
grep -A 5 "export async function scheduled" .open-next/worker.js

# Deploy to Cloudflare
npm run deploy
```

## Verification

After deployment, verify the cron trigger is working:

1. **Check Cloudflare Dashboard**:
   - Go to Workers & Pages → cursor-dashboard
   - Navigate to Triggers → Cron Triggers
   - Should show: `0 * * * *`

2. **Check Logs**:
   - After the next hour mark, check the worker logs
   - Should see: `[Cron Trigger] Scheduled event fired: 0 * * * *`

3. **Manual Test** (optional):
   ```bash
   curl -X GET https://cursor-dashboard.cfi-ops.workers.dev/api/cron/sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "X-Cron-Trigger: manual"
   ```

## How It Works

### Build Process Flow

```
npm run deploy
  ↓
npm run build:cf
  ↓
1. opennextjs-cloudflare build
   → Generates .open-next/worker.js (no scheduled export)
  ↓
2. node scripts/patch-worker-cron.mjs
   → Adds scheduled() export to .open-next/worker.js
  ↓
3. opennextjs-cloudflare deploy
   → Deploys patched worker to Cloudflare
```

### Runtime Flow

```
Cloudflare Cron Trigger (every hour at :00)
  ↓
worker.js scheduled() function
  ↓
HTTP GET to https://your-domain/api/cron/sync
  ↓
/api/cron/sync route handler
  ↓
runIncrementalSync()
  ↓
Updates database and achievements
```

## Troubleshooting

### Error: "Handler does not export a scheduled() function"

**Cause**: The patch script didn't run or failed

**Solution**:
1. Ensure you used `npm run build:cf` (not `opennextjs-cloudflare build`)
2. Check build logs for patch script errors
3. Manually verify the export exists:
   ```bash
   grep "export async function scheduled" .open-next/worker.js
   ```

### Error: "CRON_SECRET not configured"

**Cause**: Secret not set in Cloudflare

**Solution**:
```bash
wrangler secret put CRON_SECRET
```

### Cron Runs But Sync Fails

**Cause**: Missing API keys or incorrect domain

**Solution**:
1. Verify `CURSOR_API_KEY` is set: `wrangler secret list`
2. Check worker logs for specific error messages
3. Ensure `WORKER_DOMAIN` matches your actual domain (or leave unset for default)

### 401 Authentication Error

**Cause**: CRON_SECRET mismatch

**Solution**:
1. The secret in Cloudflare must match what the cron handler sends
2. Re-run `wrangler secret put CRON_SECRET` to update

## Local Development

To test the cron locally:

1. Add to `.dev.vars`:
   ```
   CRON_SECRET=test-secret-local
   CURSOR_API_KEY=your_api_key
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Trigger manually:
   ```bash
   curl -X GET http://localhost:3000/api/cron/sync \
     -H "Authorization: Bearer test-secret-local" \
     -H "X-Cron-Trigger: manual"
   ```

## Next Steps

After successful deployment:

1. ✅ Monitor first cron execution (next hour mark)
2. ✅ Check sync status in dashboard or via API
3. ✅ Verify achievements are updating hourly
4. ✅ Set up alerting for cron failures (Cloudflare Email Workers)

## Support Files

- **Detailed Setup**: [CRON_SETUP.md](./CRON_SETUP.md)
- **General Deployment**: [README.md](./README.md#deployment)
- **Patch Script**: [scripts/patch-worker-cron.mjs](./scripts/patch-worker-cron.mjs)
- **Configuration**: [wrangler.jsonc](./wrangler.jsonc)

## Questions?

If you encounter issues:
1. Check the build output for patch script errors
2. Verify all secrets are set: `wrangler secret list`
3. Review Cloudflare worker logs for runtime errors
4. Ensure your domain is correctly configured
