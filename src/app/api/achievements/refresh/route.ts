import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq } from 'drizzle-orm';
import { createDb, syncMetadata } from '@/db';
import { runIncrementalSync } from '@/lib/achievement-sync';

// Rate limit: 1 refresh per 5 minutes
const RATE_LIMIT_SECONDS = 300;

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const apiKey = env.CURSOR_ADMIN_API_KEY as string;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Check rate limit
    const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync'));
    const lastSync = meta[0]?.lastSyncAt?.getTime() || 0;
    const now = Date.now();

    if (now - lastSync < RATE_LIMIT_SECONDS * 1000) {
      const waitTime = Math.ceil(
        (RATE_LIMIT_SECONDS * 1000 - (now - lastSync)) / 1000
      );
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitTime}s` },
        { status: 429 }
      );
    }

    // Check if a sync is already running
    if (meta[0]?.syncStatus === 'running') {
      return NextResponse.json(
        { error: 'A sync is already in progress' },
        { status: 409 }
      );
    }

    // Run incremental sync
    const result = await runIncrementalSync(db, apiKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      processed: result.processed,
      newAchievements: result.newAchievements,
    });
  } catch (error) {
    console.error('Refresh API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
