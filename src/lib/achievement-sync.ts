import { eq, asc } from 'drizzle-orm';
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
import {
  getSyncMetadata,
  updateSyncMetadata,
} from './sync-metadata-kv';

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
 * 
 * @param db - D1 Database instance
 * @param apiKey - Cursor API key
 * @param kv - Optional KV namespace for metadata (preferred), falls back to D1 if not provided
 */
export async function runIncrementalSync(
  db: Database,
  apiKey: string,
  kv?: KVNamespace
): Promise<SyncResult> {
  try {
    // Update sync status to running (both KV and D1 for transition period)
    if (kv) {
      await updateSyncMetadata(kv, { syncStatus: 'running', errorMessage: null });
    }
    await db
      .update(syncMetadata)
      .set({ syncStatus: 'running', errorMessage: null })
      .where(eq(syncMetadata.id, 'sync'));

    // Get last sync date (prefer KV, fallback to D1)
    let lastSyncDate: string | null | undefined;
    if (kv) {
      const kvMeta = await getSyncMetadata(kv);
      lastSyncDate = kvMeta?.lastSyncDate;
    } else {
      const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync'));
      lastSyncDate = meta[0]?.lastSyncDate;
    }

    // Calculate date range
    const yesterday = getYesterday();
    const startDate = lastSyncDate
      ? new Date(lastSyncDate).getTime()
      : Date.now() - 7 * 24 * 60 * 60 * 1000; // Default to 7 days ago
    const endDate = Date.now();

    // Fetch data from Cursor API directly
    const usageData = await fetchDailyUsageDataDirect(apiKey, startDate, endDate);

    if (usageData.length === 0) {
      // Update both KV and D1 for transition period
      if (kv) {
        await updateSyncMetadata(kv, {
          syncStatus: 'idle',
          lastSyncAt: new Date().toISOString(),
          lastSyncDate: yesterday,
        });
      }
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

    // Query oldest data date for the 30-day rolling window
    const oldestDataDate = await getOldestDataDate(db);

    // Get existing metadata to preserve dataCollectionStartDate
    let dataCollectionStartDate: string | null = null;
    if (kv) {
      const existingMeta = await getSyncMetadata(kv);
      dataCollectionStartDate = existingMeta?.dataCollectionStartDate ?? oldestDataDate;
    } else {
      const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync'));
      dataCollectionStartDate = meta[0]?.dataCollectionStartDate ?? oldestDataDate;
    }

    // Update sync metadata (both KV and D1 for transition period)
    if (kv) {
      await updateSyncMetadata(kv, {
        syncStatus: 'idle',
        lastSyncAt: new Date().toISOString(),
        lastSyncDate: yesterday,
        errorMessage: null,
        dataCollectionStartDate,
        oldestDataDate,
      });
    }
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
      // Update both KV and D1 for transition period
      if (kv) {
        await updateSyncMetadata(kv, {
          syncStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
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
 * 
 * @param db - D1 Database instance
 * @param apiKey - Cursor API key
 * @param kv - Optional KV namespace for metadata
 */
export async function runFullBackfill(
  db: Database,
  apiKey: string,
  kv?: KVNamespace
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

    // Query oldest data date - this is the collection start date for backfill
    const oldestDataDate = await getOldestDataDate(db);
    const dataCollectionStartDate = oldestDataDate; // For backfill, oldest = start date

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

    // Update KV metadata if available
    if (kv) {
      await updateSyncMetadata(kv, {
        syncStatus: 'idle',
        lastSyncAt: new Date().toISOString(),
        lastSyncDate: yesterday,
        dataCollectionStartDate,
        oldestDataDate,
        errorMessage: null,
      });
    }

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
 * Run complete historical backfill using sequential 30-day requests
 * Walks backwards from today to account inception (June 16, 2025)
 * 
 * @param db - D1 Database instance
 * @param apiKey - Cursor API key
 * @param kv - Optional KV namespace for metadata
 */
export async function runCompleteHistoricalBackfill(
  db: Database,
  apiKey: string,
  kv?: KVNamespace
): Promise<SyncResult> {
  try {
    const ACCOUNT_INCEPTION = new Date('2025-06-16T00:00:00Z').getTime();
    const MAX_RANGE_DAYS = 30;
    const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds to respect rate limits
    
    const allUsageData: DailyUsageRecord[] = [];
    let currentEndDate = Date.now();
    let requestCount = 0;
    
    console.log('Starting complete historical backfill from inception (June 16, 2025)');
    
    // Walk backwards in 30-day chunks
    while (currentEndDate > ACCOUNT_INCEPTION) {
      const currentStartDate = Math.max(
        currentEndDate - (MAX_RANGE_DAYS * 24 * 60 * 60 * 1000),
        ACCOUNT_INCEPTION
      );
      
      requestCount++;
      console.log(`Fetching chunk ${requestCount}: ${new Date(currentStartDate).toISOString()} to ${new Date(currentEndDate).toISOString()}`);
      
      // Fetch 30-day chunk
      const chunkData = await fetchDailyUsageDataDirect(
        apiKey,
        currentStartDate,
        currentEndDate
      );
      
      console.log(`  → Retrieved ${chunkData.length} daily records`);
      allUsageData.push(...chunkData);
      
      // Move window backwards
      currentEndDate = currentStartDate - 1;
      
      // Rate limiting: wait between requests (except last one)
      if (currentEndDate > ACCOUNT_INCEPTION) {
        console.log(`  → Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    console.log(`Complete backfill: fetched ${allUsageData.length} daily records across ${requestCount} requests`);
    
    if (allUsageData.length === 0) {
      return {
        success: true,
        processed: 0,
        newAchievements: { individual: [], team: [] },
      };
    }
    
    // Process all data
    const result = await processUsageData(db, allUsageData);
    
    // Update metadata with true inception date
    const dataCollectionStartDate = '2025-06-16';
    const oldestDataDate = await getOldestDataDate(db);
    const yesterday = getYesterday();
    
    // Update D1 metadata
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
    
    // Update KV metadata if available
    if (kv) {
      await updateSyncMetadata(kv, {
        syncStatus: 'idle',
        lastSyncAt: new Date().toISOString(),
        lastSyncDate: yesterday,
        dataCollectionStartDate,
        oldestDataDate,
        errorMessage: null,
      });
    }
    
    console.log(`Historical backfill complete: processed ${allUsageData.length} records, awarded ${result.individual.length} individual and ${result.team.length} team achievements`);
    
    return {
      success: true,
      processed: allUsageData.length,
      newAchievements: result,
    };
  } catch (error) {
    console.error('Complete historical backfill error:', error);
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
        })
        .catch((err) => {
          // Ignore constraint errors on conflict
          if (!err.message?.includes('UNIQUE constraint')) {
            throw err;
          }
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

/**
 * Query the oldest data date from dailySnapshots
 */
async function getOldestDataDate(db: Database): Promise<string | null> {
  try {
    const oldest = await db
      .select({ date: dailySnapshots.date })
      .from(dailySnapshots)
      .orderBy(asc(dailySnapshots.date))
      .limit(1);
    
    return oldest.length > 0 ? oldest[0].date : null;
  } catch (error) {
    console.error('Failed to query oldest data date:', error);
    return null;
  }
}
