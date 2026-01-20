import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb, dailySnapshots } from '@/db';
import { runFullBackfill } from '@/lib/achievement-sync';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
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

    // Check if already backfilled
    const existingSnapshots = await db.select().from(dailySnapshots).limit(1);
    if (existingSnapshots.length > 0) {
      return NextResponse.json(
        { error: 'Backfill already completed. Use /api/achievements/refresh for updates.' },
        { status: 400 }
      );
    }

    // Run full backfill
    const result = await runFullBackfill(db, apiKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Backfill failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backfill completed successfully',
      processed: result.processed,
      newAchievements: result.newAchievements,
    });
  } catch (error) {
    console.error('Backfill API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
