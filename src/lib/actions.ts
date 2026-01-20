'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { getTeamMembers, getDailyUsageData, aggregateUserMetrics } from './cursor-api';
import { calculateDateRange } from './date-range-presets';
import type { LeaderboardEntry, DailyUsageRecord } from '@/types/cursor';
import type { UserStats, UserAchievement, DailySnapshot } from '@/db/schema';

export async function fetchLeaderboardData(
  startDate: number,
  endDate: number
): Promise<LeaderboardEntry[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    
    // Check if date range exceeds 30 days
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 30) {
      // Small range: fetch directly from API (React best practice: async-parallel)
      const [members, usageData] = await Promise.all([
        getTeamMembers(),
        getDailyUsageData(startDate, endDate),
      ]);
      return aggregateUserMetrics(usageData, members);
    } else {
      // Large range: fetch from database instead of API
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      const [members, snapshotsData] = await Promise.all([
        getTeamMembers(),
        db.select()
          .from(schema.dailySnapshots)
          .where(
            and(
              gte(schema.dailySnapshots.date, startDateStr),
              lte(schema.dailySnapshots.date, endDateStr)
            )
          ),
      ]);
      
      // Convert database snapshots to DailyUsageRecord format
      const usageData: DailyUsageRecord[] = snapshotsData.map(snap => ({
        date: new Date(snap.date).getTime(),
        email: snap.userEmail,
        isActive: snap.isActive,
        acceptedLinesAdded: snap.linesAdded,
        totalTabsAccepted: snap.tabAccepts,
        chatRequests: snap.chatRequests,
        composerRequests: snap.composerRequests,
        agentRequests: snap.agentRequests,
        // Fields not in database (set to 0)
        totalLinesAdded: snap.linesAdded,
        totalLinesDeleted: 0,
        acceptedLinesDeleted: 0,
        totalApplies: 0,
        totalAccepts: 0,
        totalRejects: 0,
        totalTabsShown: 0,
        cmdkUsages: 0,
        subscriptionIncludedReqs: 0,
        apiKeyReqs: 0,
        usageBasedReqs: 0,
        bugbotUsages: 0,
        mostUsedModel: '',
        applyMostUsedExtension: '',
        tabMostUsedExtension: '',
        clientVersion: '',
      }));
      
      return aggregateUserMetrics(usageData, members);
    }
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}

export interface UserProfileData {
  userStats: UserStats | null;
  userAchievements: UserAchievement[];
  dailySnapshots: DailySnapshot[];
  userRank: number;
  totalUsers: number;
  leaderboardEntry: LeaderboardEntry | null;
}

/**
 * Fetch comprehensive user profile data with real-time Cursor API data
 * @param userEmail - The email of the user to fetch data for
 */
export async function fetchUserProfile(userEmail: string): Promise<UserProfileData> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Calculate last 30 days date range (reliable with API, extends after backfill)
    const dateRange = calculateDateRange('30days');

    // React best practice: Parallel fetching with Promise.all()
    // Fetch real-time data from Cursor API and achievements from database in parallel
    const [teamMembers, dailyUsageData, userAchievementsData] = 
      await Promise.all([
        // Real-time: Get team members from Cursor API (uses React.cache())
        getTeamMembers(),
        // Real-time: Get last 30 days of usage data from Cursor API (uses React.cache())
        getDailyUsageData(dateRange.startDate, dateRange.endDate),
        // Database: Get user achievements (calculated from historical data)
        db.select().from(schema.userAchievements).where(eq(schema.userAchievements.userEmail, userEmail)),
      ]);

    // Filter daily usage data for this specific user
    const userDailyData = dailyUsageData.filter(record => record.email === userEmail);

    // Aggregate user's all-time stats from daily data
    let totalLinesAdded = 0;
    let totalChatRequests = 0;
    let totalComposerRequests = 0;
    let totalAgentRequests = 0;
    let totalTabAccepts = 0;
    let totalAccepts = 0;
    let totalApplies = 0;
    let activeDays = new Set<string>();
    let mostUsedModel = 'N/A';
    const modelUsage = new Map<string, number>();

    for (const record of userDailyData) {
      totalLinesAdded += record.acceptedLinesAdded;
      totalChatRequests += record.chatRequests;
      totalComposerRequests += record.composerRequests;
      totalAgentRequests += record.agentRequests;
      totalTabAccepts += record.totalTabsAccepted;
      totalAccepts += record.totalAccepts;
      totalApplies += record.totalApplies;
      
      if (record.isActive) {
        activeDays.add(new Date(record.date).toISOString().split('T')[0]);
      }

      if (record.mostUsedModel) {
        modelUsage.set(
          record.mostUsedModel,
          (modelUsage.get(record.mostUsedModel) || 0) + 1
        );
      }
    }

    // Find most used model
    let maxUsage = 0;
    for (const [model, count] of modelUsage) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedModel = model;
      }
    }

    // Calculate acceptance rate
    const acceptanceRate = totalApplies > 0 
      ? (totalAccepts / totalApplies) * 100 
      : 0;

    // Get leaderboard data for ranking
    const leaderboardData = aggregateUserMetrics(dailyUsageData, teamMembers);
    const leaderboardEntry = leaderboardData.find(entry => entry.email === userEmail) || null;
    const userRank = leaderboardEntry 
      ? leaderboardData.findIndex(entry => entry.email === userEmail) + 1 
      : 0;

    // Create real-time user stats object
    const realtimeUserStats: UserStats = {
      email: userEmail,
      totalActiveDays: activeDays.size,
      maxConsecutiveDays: 0, // Would need more complex calculation
      currentStreak: 0, // Would need more complex calculation
      totalLinesAdded,
      totalAgentRequests,
      totalChatRequests,
      totalComposerRequests,
      totalTabAccepts,
      totalBugbotUsages: 0, // Not available in API response
      bestSingleDayLines: Math.max(...userDailyData.map(d => d.acceptedLinesAdded), 0),
      bestSingleDayAgent: Math.max(...userDailyData.map(d => d.agentRequests), 0),
      totalAcceptanceRate: acceptanceRate,
      updatedAt: new Date(),
    };

    // Transform daily data to snapshot format (most recent first, up to 30 days)
    const dailySnapshotsData = userDailyData
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
      .map(record => ({
        id: `${userEmail}-${record.date}`,
        userEmail,
        date: new Date(record.date).toISOString().split('T')[0],
        isActive: record.isActive,
        linesAdded: record.acceptedLinesAdded,
        agentRequests: record.agentRequests,
        chatRequests: record.chatRequests,
        composerRequests: record.composerRequests,
        tabAccepts: record.totalTabsAccepted,
      }));

    return {
      userStats: realtimeUserStats,
      userAchievements: userAchievementsData,
      dailySnapshots: dailySnapshotsData,
      userRank,
      totalUsers: leaderboardData.length,
      leaderboardEntry,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}
