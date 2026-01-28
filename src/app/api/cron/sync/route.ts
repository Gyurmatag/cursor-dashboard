import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { runIncrementalSync } from '@/lib/achievement-sync';
import {
  acquireSyncLock,
  releaseSyncLock,
  updateSyncMetadata,
  getSyncStatus,
  canRunSync,
} from '@/lib/sync-metadata-kv';

/**
 * Cron-triggered sync endpoint
 * 
 * This endpoint is called by Cloudflare Cron Triggers every hour.
 * It can also be called manually for testing, but requires a secret token.
 * 
 * Security:
 * - In production, this should only be accessible via cron trigger
 * - For manual testing, requires CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const kv = env.SYNC_KV;
    const apiKey = env.CURSOR_ADMIN_API_KEY as string;

    // Verify: CRON_SECRET (header or Bearer), or Cloudflare cron (cf-cron)
    const envCronSecret = env.CRON_SECRET as string | undefined;
    const headerSecret = request.headers.get('x-cron-secret');
    const authHeader = request.headers.get('authorization');
    const bearerSecret =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = headerSecret ?? bearerSecret;

    if (envCronSecret && cronSecret !== envCronSecret) {
      const cfCron = request.headers.get('cf-cron');
      if (!cfCron) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    if (!apiKey) {
      console.error('[Cron Sync] API key not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Cron Sync] Starting scheduled sync...');

    // Check if we can run sync (rate limiting, lock check)
    const { canRun, reason } = await canRunSync(kv);
    if (!canRun) {
      console.log(`[Cron Sync] Cannot run sync: ${reason}`);
      return NextResponse.json(
        { skipped: true, reason },
        { status: 200 }
      );
    }

    // Try to acquire lock
    const lockAcquired = await acquireSyncLock(kv);
    if (!lockAcquired) {
      console.log('[Cron Sync] Failed to acquire lock');
      return NextResponse.json(
        { skipped: true, reason: 'Failed to acquire sync lock' },
        { status: 200 }
      );
    }

    console.log('[Cron Sync] Lock acquired, running sync...');

    try {
      // Update status to running
      await updateSyncMetadata(kv, {
        syncStatus: 'running',
        errorMessage: null,
      });

      // Run the sync
      const result = await runIncrementalSync(db, apiKey, kv);

      if (result.success) {
        // Update metadata with success
        await updateSyncMetadata(kv, {
          syncStatus: 'idle',
          lastSyncAt: new Date().toISOString(),
          lastSyncDate: getYesterday(),
          errorMessage: null,
          lastSyncResult: {
            processed: result.processed,
            newAchievements: result.newAchievements,
          },
        });

        console.log(
          `[Cron Sync] Success! Processed ${result.processed} records, ` +
          `${result.newAchievements.individual.length} individual achievements, ` +
          `${result.newAchievements.team.length} team achievements`
        );

        return NextResponse.json({
          success: true,
          syncedAt: new Date().toISOString(),
          processed: result.processed,
          newAchievements: result.newAchievements,
        });
      } else {
        // Update metadata with error
        await updateSyncMetadata(kv, {
          syncStatus: 'error',
          errorMessage: result.error || 'Unknown error',
        });

        console.error(`[Cron Sync] Error: ${result.error}`);

        return NextResponse.json(
          { error: result.error || 'Sync failed' },
          { status: 500 }
        );
      }
    } finally {
      // Always release the lock
      await releaseSyncLock(kv);
      console.log('[Cron Sync] Lock released');
    }
  } catch (error) {
    console.error('[Cron Sync] Unexpected error:', error);
    
    // Try to release lock and update status
    try {
      const { env } = await getCloudflareContext();
      const kv = env.SYNC_KV;
      await releaseSyncLock(kv);
      await updateSyncMetadata(kv, {
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (cleanupError) {
      console.error('[Cron Sync] Failed to cleanup after error:', cleanupError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Status endpoint to check sync status
 */
export async function POST() {
  try {
    const { env } = await getCloudflareContext();
    const kv = env.SYNC_KV;
    
    const status = await getSyncStatus(kv);
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('[Cron Sync] Failed to get status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
