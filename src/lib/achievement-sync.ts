import { eq } from 'drizzle-orm';
import type { Database } from '@/db';
import {
  userStats,
  teamStats,
  dailySnapshots,
  syncMetadata,
  type NewUserStats,
} from '@/db/schema';
import {
  calculateUserStats,
  calculateTeamStats,
  checkAndAwardUserAchievements,
  checkAndAwardTeamAchievements,
} from './achievement-calculator';
import type { DailyUsageRecord } from './cursor-api';

export interface SyncResult {
  success: boolean;
  processed: number;
  newAchievements: {
    individual: string[];
    team: string[];
  };
  error?: string;
}

/**
 * Fetch daily usage data directly using API key
 * This avoids potential getCloudflareContext() issues in sync context
 */
async function fetchDailyUsageDataDirect(
  apiKey: string,
  startDate: number,
  endDate: number
): Promise<DailyUsageRecord[]> {
  const response = await fetch('https://api.cursor.com/teams/daily-usage-data', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();

  if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: DailyUsageRecord[] }).data;
  }

  console.warn('Unexpected API response format:', data);
  return [];
}

/**
 * Run an incremental sync - fetch only new data since last sync
 */
export async function runIncrementalSync(
  db: Database,
  apiKey: string
): Promise<SyncResult> {
  try {
    // Update sync status to running
    await db
      .update(syncMetadata)
      .set({ syncStatus: 'running', errorMessage: null })
      .where(eq(syncMetadata.id, 'sync'));

    // Get last sync date
    const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync'));
    const lastSyncDate = meta[0]?.lastSyncDate;

    // Calculate date range
    const yesterday = getYesterday();
    const startDate = lastSyncDate
      ? new Date(lastSyncDate).getTime()
      : Date.now() - 7 * 24 * 60 * 60 * 1000; // Default to 7 days ago
    const endDate = Date.now();

    // Fetch data from Cursor API directly
    const usageData = await fetchDailyUsageDataDirect(apiKey, startDate, endDate);

    if (usageData.length === 0) {
      await db
        .update(syncMetadata)
        .set({
          syncStatus: 'idle',
          lastSyncAt: new Date(),
          lastSyncDate: yesterday,
        })
        .where(eq(syncMetadata.id, 'sync'));

      return {
        success: true,
        processed: 0,
        newAchievements: { individual: [], team: [] },
      };
    }

    // Process the data
    const result = await processUsageData(db, usageData);

    // Update sync metadata
    await db
      .update(syncMetadata)
      .set({
        syncStatus: 'idle',
        lastSyncAt: new Date(),
        lastSyncDate: yesterday,
        errorMessage: null,
      })
      .where(eq(syncMetadata.id, 'sync'));

    return {
      success: true,
      processed: usageData.length,
      newAchievements: result,
    };
  } catch (error) {
    console.error('Sync error:', error);

    try {
      await db
        .update(syncMetadata)
        .set({
          syncStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(syncMetadata.id, 'sync'));
    } catch (updateError) {
      console.error('Failed to update sync metadata:', updateError);
    }

    return {
      success: false,
      processed: 0,
      newAchievements: { individual: [], team: [] },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run a full backfill - fetch all historical data (up to 30 days due to API limit)
 */
export async function runFullBackfill(
  db: Database,
  apiKey: string
): Promise<SyncResult> {
  try {
    // Calculate date range (30 days max due to Cursor API limit)
    const endDate = Date.now();
    const startDate = endDate - 30 * 24 * 60 * 60 * 1000;

    // Fetch all usage data directly
    const usageData = await fetchDailyUsageDataDirect(apiKey, startDate, endDate);

    if (usageData.length === 0) {
      return {
        success: true,
        processed: 0,
        newAchievements: { individual: [], team: [] },
      };
    }

    // Process the data
    const result = await processUsageData(db, usageData);

    // Initialize sync metadata
    const yesterday = getYesterday();
    await db
      .insert(syncMetadata)
      .values({
        id: 'sync',
        lastSyncAt: new Date(),
        lastSyncDate: yesterday,
        syncStatus: 'idle',
      })
      .onConflictDoUpdate({
        target: syncMetadata.id,
        set: {
          lastSyncAt: new Date(),
          lastSyncDate: yesterday,
          syncStatus: 'idle',
        },
      });

    return {
      success: true,
      processed: usageData.length,
      newAchievements: result,
    };
  } catch (error) {
    console.error('Backfill error:', error);
    return {
      success: false,
      processed: 0,
      newAchievements: { individual: [], team: [] },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process usage data and update all stats and achievements
 */
async function processUsageData(
  db: Database,
  usageData: DailyUsageRecord[]
): Promise<{ individual: string[]; team: string[] }> {
  const allIndividualAchievements: string[] = [];
  const allTeamAchievements: string[] = [];

  // Group usage data by user
  const userDataMap = new Map<string, DailyUsageRecord[]>();
  for (const record of usageData) {
    const existing = userDataMap.get(record.email) || [];
    existing.push(record);
    userDataMap.set(record.email, existing);
  }

  // Process each user
  for (const [email, records] of userDataMap) {
    // Insert daily snapshots
    for (const record of records) {
      const date = new Date(record.date).toISOString().split('T')[0];

      await db
        .insert(dailySnapshots)
        .values({
          userEmail: email,
          date,
          isActive: record.isActive,
          linesAdded: record.acceptedLinesAdded,
          agentRequests: record.agentRequests,
          chatRequests: record.chatRequests,
          composerRequests: record.composerRequests,
          tabAccepts: record.totalTabsAccepted,
        })
        .onConflictDoUpdate({
          target: [dailySnapshots.userEmail, dailySnapshots.date],
          set: {
            isActive: record.isActive,
            linesAdded: record.acceptedLinesAdded,
            agentRequests: record.agentRequests,
            chatRequests: record.chatRequests,
            composerRequests: record.composerRequests,
            tabAccepts: record.totalTabsAccepted,
          },
        });
    }

    // Calculate and update user stats
    const stats = await calculateUserStats(db, email);
    await db
      .insert(userStats)
      .values(stats as NewUserStats)
      .onConflictDoUpdate({
        target: userStats.email,
        set: stats,
      });

    // Check and award individual achievements
    const fullStats = await db.select().from(userStats).where(eq(userStats.email, email));
    if (fullStats.length > 0) {
      const newAchievements = await checkAndAwardUserAchievements(db, email, fullStats[0]);
      allIndividualAchievements.push(...newAchievements);
    }
  }

  // Calculate and update team stats
  const teamStatsData = await calculateTeamStats(db);
  await db
    .insert(teamStats)
    .values(teamStatsData)
    .onConflictDoUpdate({
      target: teamStats.id,
      set: teamStatsData,
    });

  // Check and award team achievements
  const fullTeamStats = await db.select().from(teamStats).where(eq(teamStats.id, 'team'));
  if (fullTeamStats.length > 0) {
    const newTeamAchievements = await checkAndAwardTeamAchievements(db, fullTeamStats[0]);
    allTeamAchievements.push(...newTeamAchievements);
  }

  return {
    individual: allIndividualAchievements,
    team: allTeamAchievements,
  };
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}
