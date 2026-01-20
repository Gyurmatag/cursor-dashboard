import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { runCompleteHistoricalBackfill } from '@/lib/achievement-sync';

export const runtime = 'edge';
export const maxDuration = 60; // Allow up to 60 seconds for complete backfill

/**
 * POST /api/achievements/backfill-complete
 * 
 * Run complete historical backfill using sequential 30-day requests
 * to fetch all data from account inception (June 16, 2025) to present
 * 
 * This endpoint:
 * - Makes ~8 sequential API requests (30-day chunks)
 * - Takes ~24 seconds to complete
 * - Fetches all metrics: Agent Lines, Accepted Diffs, Tab Completions, etc.
 * - Updates sync metadata with inception date
 */
export async function POST() {
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
    
    console.log('Starting complete historical backfill...');
    
    // Run complete historical backfill
    const result = await runCompleteHistoricalBackfill(db, apiKey, env.SYNC_KV);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Historical backfill failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Historical backfill completed successfully',
      processed: result.processed,
      dataFrom: '2025-06-16',
      dataTo: new Date().toISOString().split('T')[0],
      newAchievements: result.newAchievements,
      stats: {
        individualAchievements: result.newAchievements.individual.length,
        teamAchievements: result.newAchievements.team.length,
      },
    });
  } catch (error) {
    console.error('Backfill API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
