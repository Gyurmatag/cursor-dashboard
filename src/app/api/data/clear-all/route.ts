import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import {
  dailySnapshots,
  userStats,
  teamStats,
  userAchievements,
  teamAchievements,
  syncMetadata,
} from '@/db/schema';

/**
 * POST /api/data/clear-all
 * 
 * Safely delete all historical data from the database.
 * This endpoint clears:
 * - dailySnapshots - all daily usage data
 * - userStats - all aggregated user statistics
 * - teamStats - all team statistics
 * - userAchievements - all user achievements
 * - teamAchievements - all team achievements
 * - syncMetadata - sync tracking data
 * 
 * WARNING: This is a destructive operation. Use only for local development
 * or when performing a complete data reset before backfill.
 */
export async function POST() {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    console.log('Starting data cleanup...');

    // Delete all data in transaction-safe order
    // Delete child records first, then parent records
    await db.delete(dailySnapshots);
    await db.delete(userStats);
    await db.delete(teamStats);
    await db.delete(userAchievements);
    await db.delete(teamAchievements);
    await db.delete(syncMetadata);

    console.log('Data cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
    });
  } catch (error) {
    console.error('Data cleanup error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to clear data',
      },
      { status: 500 }
    );
  }
}
