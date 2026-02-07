import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { userStats, teamStats, dailySnapshots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  calculateUserStats,
  calculateTeamStats,
  checkAndAwardUserAchievements,
  checkAndAwardTeamAchievements,
} from '@/lib/achievement-calculator';

/**
 * Recalculate all user and team stats from existing daily_snapshots data
 * 
 * This endpoint recalculates stats without fetching new data from Cursor API.
 * Useful when stats are out of sync with snapshots.
 * 
 * POST /api/achievements/recalculate-stats
 * 
 * Requires CRON_SECRET for authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Verify authentication
    const envCronSecret = env.CRON_SECRET as string | undefined;
    const headerSecret = request.headers.get('x-cron-secret');
    const authHeader = request.headers.get('authorization');
    const bearerSecret =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = headerSecret ?? bearerSecret;

    if (envCronSecret && cronSecret !== envCronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Recalculate Stats] Starting stats recalculation...');

    // Get all unique user emails from daily_snapshots
    const allSnapshots = await db.select().from(dailySnapshots);
    const uniqueEmails = [...new Set(allSnapshots.map(s => s.userEmail))];

    console.log(`[Recalculate Stats] Found ${uniqueEmails.length} users with snapshots`);

    const userResults: { email: string; stats: Record<string, number>; newAchievements: string[] }[] = [];

    // Recalculate stats for each user
    for (const email of uniqueEmails) {
      try {
        // Calculate user stats from snapshots
        const stats = await calculateUserStats(db, email);
        
        // Upsert user stats
        await db
          .insert(userStats)
          .values({
            email,
            totalActiveDays: stats.totalActiveDays ?? 0,
            maxConsecutiveDays: stats.maxConsecutiveDays ?? 0,
            currentStreak: stats.currentStreak ?? 0,
            totalLinesAdded: stats.totalLinesAdded ?? 0,
            totalAgentRequests: stats.totalAgentRequests ?? 0,
            totalChatRequests: stats.totalChatRequests ?? 0,
            totalComposerRequests: stats.totalComposerRequests ?? 0,
            totalTabAccepts: stats.totalTabAccepts ?? 0,
            totalBugbotUsages: 0,
            bestSingleDayLines: stats.bestSingleDayLines ?? 0,
            bestSingleDayAgent: stats.bestSingleDayAgent ?? 0,
            totalAcceptanceRate: 0,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userStats.email,
            set: {
              totalActiveDays: stats.totalActiveDays ?? 0,
              maxConsecutiveDays: stats.maxConsecutiveDays ?? 0,
              currentStreak: stats.currentStreak ?? 0,
              totalLinesAdded: stats.totalLinesAdded ?? 0,
              totalAgentRequests: stats.totalAgentRequests ?? 0,
              totalChatRequests: stats.totalChatRequests ?? 0,
              totalComposerRequests: stats.totalComposerRequests ?? 0,
              totalTabAccepts: stats.totalTabAccepts ?? 0,
              bestSingleDayLines: stats.bestSingleDayLines ?? 0,
              bestSingleDayAgent: stats.bestSingleDayAgent ?? 0,
              updatedAt: new Date(),
            },
          });

        // Check and award individual achievements
        const fullStats = await db.select().from(userStats).where(eq(userStats.email, email));
        let newAchievements: string[] = [];
        if (fullStats.length > 0) {
          newAchievements = await checkAndAwardUserAchievements(db, email, fullStats[0]);
        }

        userResults.push({
          email,
          stats: {
            totalLinesAdded: stats.totalLinesAdded ?? 0,
            totalActiveDays: stats.totalActiveDays ?? 0,
            totalAgentRequests: stats.totalAgentRequests ?? 0,
          },
          newAchievements,
        });

        console.log(`[Recalculate Stats] Updated stats for ${email}: ${stats.totalLinesAdded} lines`);
      } catch (err) {
        console.error(`[Recalculate Stats] Error processing ${email}:`, err);
      }
    }

    // Recalculate team stats
    const teamStatsData = await calculateTeamStats(db);
    
    await db
      .insert(teamStats)
      .values({
        id: 'team',
        totalMembers: teamStatsData.totalMembers ?? 0,
        totalTeamLines: teamStatsData.totalTeamLines ?? 0,
        totalTeamAgentRequests: teamStatsData.totalTeamAgentRequests ?? 0,
        totalTeamChatRequests: teamStatsData.totalTeamChatRequests ?? 0,
        totalTeamComposerRequests: teamStatsData.totalTeamComposerRequests ?? 0,
        totalTeamActiveDays: teamStatsData.totalTeamActiveDays ?? 0,
        membersWithStreaks: teamStatsData.membersWithStreaks ?? 0,
        bestTeamDayLines: teamStatsData.bestTeamDayLines ?? 0,
        bestTeamDayDate: teamStatsData.bestTeamDayDate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: teamStats.id,
        set: {
          totalMembers: teamStatsData.totalMembers ?? 0,
          totalTeamLines: teamStatsData.totalTeamLines ?? 0,
          totalTeamAgentRequests: teamStatsData.totalTeamAgentRequests ?? 0,
          totalTeamChatRequests: teamStatsData.totalTeamChatRequests ?? 0,
          totalTeamComposerRequests: teamStatsData.totalTeamComposerRequests ?? 0,
          totalTeamActiveDays: teamStatsData.totalTeamActiveDays ?? 0,
          membersWithStreaks: teamStatsData.membersWithStreaks ?? 0,
          bestTeamDayLines: teamStatsData.bestTeamDayLines ?? 0,
          bestTeamDayDate: teamStatsData.bestTeamDayDate,
          updatedAt: new Date(),
        },
      });

    console.log(`[Recalculate Stats] Team stats updated: ${teamStatsData.totalTeamLines} total lines`);

    // Check and award team achievements
    const fullTeamStats = await db.select().from(teamStats).where(eq(teamStats.id, 'team'));
    let newTeamAchievements: string[] = [];
    if (fullTeamStats.length > 0) {
      newTeamAchievements = await checkAndAwardTeamAchievements(db, fullTeamStats[0]);
    }

    const result = {
      success: true,
      recalculatedAt: new Date().toISOString(),
      usersProcessed: uniqueEmails.length,
      teamStats: {
        totalTeamLines: teamStatsData.totalTeamLines,
        totalMembers: teamStatsData.totalMembers,
        totalTeamAgentRequests: teamStatsData.totalTeamAgentRequests,
        bestTeamDayLines: teamStatsData.bestTeamDayLines,
      },
      newTeamAchievements,
      userResults: userResults.slice(0, 10), // Return first 10 for debugging
    };

    console.log('[Recalculate Stats] Completed successfully:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Recalculate Stats] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get current stats summary
 */
export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    const [allUserStats, allTeamStats, snapshotCount] = await Promise.all([
      db.select().from(userStats),
      db.select().from(teamStats),
      db.select().from(dailySnapshots),
    ]);

    const currentTeamStats = allTeamStats.find(t => t.id === 'team');

    return NextResponse.json({
      userCount: allUserStats.length,
      snapshotCount: snapshotCount.length,
      teamStats: currentTeamStats ? {
        totalTeamLines: currentTeamStats.totalTeamLines,
        totalMembers: currentTeamStats.totalMembers,
        totalTeamAgentRequests: currentTeamStats.totalTeamAgentRequests,
        bestTeamDayLines: currentTeamStats.bestTeamDayLines,
        updatedAt: currentTeamStats.updatedAt,
      } : null,
      topUsers: allUserStats
        .sort((a, b) => b.totalLinesAdded - a.totalLinesAdded)
        .slice(0, 5)
        .map(u => ({
          email: u.email,
          totalLinesAdded: u.totalLinesAdded,
          totalActiveDays: u.totalActiveDays,
        })),
    });
  } catch (error) {
    console.error('[Recalculate Stats] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
