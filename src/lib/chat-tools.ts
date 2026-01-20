import { tool } from 'ai';
import { z } from 'zod';
import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { userStats, teamStats, userAchievements, teamAchievements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getTeamMembers, getDailyUsageData, aggregateUserMetrics } from './cursor-api';
import { calculateDateRange } from './date-range-presets';
import { ALL_ACHIEVEMENTS } from './achievements';
import type {
  GetLeaderboardParams,
  GetAchievementsParams,
  GetTeamStatsParams,
  GetUserProfileParams,
  LeaderboardResult,
  AchievementResult,
  TeamStatsResult,
  UserProfileResult,
} from '@/types/chat';

/**
 * Tool: Get Leaderboard
 * Fetches top users by activity metrics for a given time period
 */
export const getLeaderboardTool = tool({
  description: 'Get the top AI users leaderboard with activity scores, lines of code, and usage metrics. Use this to answer questions about top performers, user rankings, or who is using AI the most.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(50).optional(),
    dateRange: z.enum(['today', 'yesterday', '7days', '14days', '30days']).optional(),
    sortBy: z.enum(['totalActivityScore', 'acceptedLinesAdded', 'chatRequests', 'composerRequests', 'agentRequests']).optional(),
  }),
  execute: async (params: GetLeaderboardParams): Promise<LeaderboardResult> => {
    const { limit = 10, dateRange = '7days', sortBy = 'totalActivityScore' } = params;

    // Calculate date range
    const range = calculateDateRange(dateRange);
    
    // Fetch data
    const [teamMembers, dailyData] = await Promise.all([
      getTeamMembers(),
      getDailyUsageData(range.startDate, range.endDate),
    ]);

    // Aggregate metrics
    const allEntries = aggregateUserMetrics(dailyData, teamMembers);

    // Sort by requested metric
    const sorted = [...allEntries].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return bVal - aVal;
    });

    // Take top N
    const entries = sorted.slice(0, limit);

    return {
      entries,
      total: allEntries.length,
      dateRange: {
        start: range.startDate,
        end: range.endDate,
        label: range.label,
      },
    };
  },
});

/**
 * Tool: Get Achievements
 * Fetches achievements and their unlock status for users or team
 */
export const getAchievementsTool = tool({
  description: 'Get achievements earned by users or the team. Shows unlocked badges, progress, and achievement tiers (bronze, silver, gold, legendary). Use this to answer questions about badges, milestones, or achievement progress.',
  inputSchema: z.object({
    userId: z.string().optional(),
    type: z.enum(['individual', 'team', 'all']).optional(),
    tier: z.enum(['bronze', 'silver', 'gold', 'legendary']).optional(),
  }),
  execute: async (params: GetAchievementsParams): Promise<AchievementResult> => {
    const { userId, type = 'all', tier } = params;
    const { env } = await getCloudflareContext();
    const database = createDb(env.DB);

    // Filter achievements by type and tier
    let filteredAchievements = ALL_ACHIEVEMENTS;
    
    if (type !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.type === type);
    }
    
    if (tier) {
      filteredAchievements = filteredAchievements.filter(a => a.tier === tier);
    }

    // Fetch all database data in parallel (eliminates N+1 query problem)
    const [userAchievementRecords, userStatsRecord, teamAchievementRecords, teamStatsRecord] = 
      await Promise.all([
        userId 
          ? database.select().from(userAchievements).where(eq(userAchievements.userEmail, userId)).all()
          : Promise.resolve([]),
        userId
          ? database.select().from(userStats).where(eq(userStats.email, userId)).get()
          : Promise.resolve(null),
        database.select().from(teamAchievements).all(),
        database.select().from(teamStats).orderBy(desc(teamStats.updatedAt)).limit(1).get(),
      ]);

    // Create Maps for O(1) lookups
    const userAchievementMap = new Map(
      userAchievementRecords.map(ua => [ua.achievementId, ua])
    );
    const teamAchievementMap = new Map(
      teamAchievementRecords.map(ta => [ta.achievementId, ta])
    );

    // Process achievements with in-memory data
    const achievements = filteredAchievements.map((achievement) => {
      if (achievement.type === 'individual' && userId) {
        const unlocked = userAchievementMap.get(achievement.id);
        const progress = userStatsRecord ? achievement.progressFn(userStatsRecord) : 0;

        return {
          achievement,
          isUnlocked: !!unlocked,
          progress,
          unlockedAt: unlocked?.achievedAt.getTime(),
        };
      } else if (achievement.type === 'team') {
        const unlocked = teamAchievementMap.get(achievement.id);
        const progress = teamStatsRecord ? achievement.progressFn(teamStatsRecord) : 0;

        return {
          achievement,
          isUnlocked: !!unlocked,
          progress,
          unlockedAt: unlocked?.achievedAt.getTime(),
        };
      } else {
        return {
          achievement,
          isUnlocked: false,
          progress: 0,
        };
      }
    });

    // Calculate summary
    const unlocked = achievements.filter(a => a.isUnlocked).length;
    const avgProgress = achievements.reduce((sum, a) => sum + a.progress, 0) / achievements.length;

    return {
      achievements,
      summary: {
        total: achievements.length,
        unlocked,
        progress: Math.round(avgProgress),
      },
    };
  },
});

/**
 * Tool: Get Team Stats
 * Fetches aggregate team statistics and trends
 */
export const getTeamStatsTool = tool({
  description: 'Get aggregate team statistics including total lines of code, AI requests, active members, and daily trends. Use this to answer questions about overall team productivity, usage patterns, or collective metrics.',
  inputSchema: z.object({
    dateRange: z.enum(['today', 'yesterday', '7days', '14days', '30days']).optional(),
    metric: z.enum(['lines', 'requests', 'tabs', 'all']).optional(),
  }),
  execute: async (params: GetTeamStatsParams): Promise<TeamStatsResult> => {
    const { dateRange = '7days' } = params;
    // Note: metric parameter available for future filtering implementation

    // Calculate date range
    const range = calculateDateRange(dateRange);
    
    // Fetch data
    const [teamMembers, dailyData] = await Promise.all([
      getTeamMembers(),
      getDailyUsageData(range.startDate, range.endDate),
    ]);

    // Calculate totals
    const totals = dailyData.reduce(
      (acc, record) => ({
        totalLinesAdded: acc.totalLinesAdded + record.acceptedLinesAdded,
        totalChatRequests: acc.totalChatRequests + record.chatRequests,
        totalComposerRequests: acc.totalComposerRequests + record.composerRequests,
        totalAgentRequests: acc.totalAgentRequests + record.agentRequests,
        totalTabsAccepted: acc.totalTabsAccepted + record.totalTabsAccepted,
        activeMembers: acc.activeMembers,
      }),
      {
        totalLinesAdded: 0,
        totalChatRequests: 0,
        totalComposerRequests: 0,
        totalAgentRequests: 0,
        totalTabsAccepted: 0,
        activeMembers: 0,
      }
    );

    // Count active members (unique emails with isActive = true)
    const activeMemberEmails = new Set(
      dailyData.filter(r => r.isActive).map(r => r.email)
    );
    totals.activeMembers = activeMemberEmails.size;

    // Get top performers
    const leaderboard = aggregateUserMetrics(dailyData, teamMembers);
    const topPerformers = {
      byLines: leaderboard.slice(0, 5),
      byActivity: [...leaderboard]
        .sort((a, b) => b.totalActivityScore - a.totalActivityScore)
        .slice(0, 5),
    };

    return {
      period: {
        start: range.startDate,
        end: range.endDate,
        label: range.label,
      },
      totals,
      dailyData,
      topPerformers,
    };
  },
});

/**
 * Helper: Normalize string by removing accents and converting to lowercase
 * Cached for per-request deduplication to avoid redundant normalization
 */
const normalizeString = cache((str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
});

/**
 * Helper: Calculate similarity score between query and target strings
 * Cached for per-request deduplication when same names are queried multiple times
 */
const calculateSimilarity = cache((query: string, target: string): number => {
  const normalizedQuery = normalizeString(query);
  const normalizedTarget = normalizeString(target);
  
  // Exact match
  if (normalizedQuery === normalizedTarget) return 100;
  
  // Target contains query
  if (normalizedTarget.includes(normalizedQuery)) {
    const lengthRatio = normalizedQuery.length / normalizedTarget.length;
    return 80 + (lengthRatio * 20);
  }
  
  // Check if query words match target words
  const queryWords = normalizedQuery.split(/\s+/);
  const targetWords = normalizedTarget.split(/[\s.@_-]+/);
  
  const matchingWords = queryWords.filter(qWord => 
    targetWords.some(tWord => 
      tWord.includes(qWord) || qWord.includes(tWord)
    )
  );
  
  if (matchingWords.length > 0) {
    return 50 + (matchingWords.length / queryWords.length) * 30;
  }
  
  return 0;
});

/**
 * Helper: Find best matching user from team members
 */
function findBestMatchingUser(
  teamMembers: Array<{ email: string; name: string }>,
  searchQuery: string
): { email: string; name: string } | null {
  const candidates = teamMembers.map(member => {
    // Calculate scores for name and email parts
    const nameScore = calculateSimilarity(searchQuery, member.name);
    const emailLocalPart = member.email.split('@')[0];
    const emailScore = calculateSimilarity(searchQuery, emailLocalPart);
    const emailFullScore = calculateSimilarity(searchQuery, member.email);
    
    const maxScore = Math.max(nameScore, emailScore, emailFullScore);
    
    return {
      member,
      score: maxScore,
    };
  });
  
  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  
  // Return best match if score is above threshold (50)
  if (candidates[0] && candidates[0].score >= 50) {
    return candidates[0].member;
  }
  
  return null;
}

/**
 * Tool: Get User Profile
 * Fetches detailed profile for a specific user
 */
export const getUserProfileTool = tool({
  description: 'Get detailed profile for a specific user including their stats, achievements, and recent activity. Use this to answer questions about individual user performance, their progress, or specific user metrics. You can search by partial name (e.g., "cselenyi" or "mate") and it will find the best match. Use the "name" parameter for searching by name or partial name.',
  inputSchema: z.object({
    email: z.string().optional(),
    name: z.string().optional(),
  }),
  execute: async (params: GetUserProfileParams): Promise<UserProfileResult> => {
    const { email, name } = params;

    // Validate that at least one search parameter is provided
    if (!email && !name) {
      throw new Error('Either email or name must be provided to look up a user profile');
    }

    // Fetch team members to find user
    const teamMembers = await getTeamMembers();
    
    let user: { email: string; name: string } | undefined;
    
    if (email) {
      // Exact email match (case-insensitive)
      user = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
    }
    
    if (!user && name) {
      // Smart fuzzy matching for name
      const foundUser = findBestMatchingUser(teamMembers, name);
      if (foundUser) {
        user = foundUser;
      }
    }

    if (!user) {
      throw new Error(`User not found: ${email || name}. Please try with a different name or check the spelling.`);
    }

    // Fetch user data for last 30 days
    const range = calculateDateRange('30days');
    const dailyData = await getDailyUsageData(range.startDate, range.endDate);
    
    // Filter to this user's data
    const userData = dailyData.filter(r => r.email === user!.email);
    
    // Aggregate stats
    const leaderboard = aggregateUserMetrics(userData, [user]);
    const stats = leaderboard[0] || {
      email: user.email,
      name: user.name,
      totalActivityScore: 0,
      acceptedLinesAdded: 0,
      chatRequests: 0,
      composerRequests: 0,
      agentRequests: 0,
      totalTabsAccepted: 0,
      activeDaysCount: 0,
      acceptanceRate: 0,
      mostUsedModel: 'N/A',
    };

    // Fetch achievements
    const { env } = await getCloudflareContext();
    const database = createDb(env.DB);
    
    const userAchievementRecords = await database
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userEmail, user.email))
      .all();

    const userStatsRecord = await database
      .select()
      .from(userStats)
      .where(eq(userStats.email, user.email))
      .get();

    const achievements = ALL_ACHIEVEMENTS
      .filter(a => a.type === 'individual')
      .map(achievement => {
        const unlocked = userAchievementRecords.find(
          ua => ua.achievementId === achievement.id
        );
        const progress = userStatsRecord ? achievement.progressFn(userStatsRecord) : 0;

        return {
          achievement,
          isUnlocked: !!unlocked,
          progress,
        };
      });

    // Get recent activity (last 7 days)
    const recentActivity = userData
      .sort((a, b) => b.date - a.date)
      .slice(0, 7);

    return {
      user: {
        name: user.name,
        email: user.email,
      },
      stats: {
        totalActivityScore: stats.totalActivityScore,
        acceptedLinesAdded: stats.acceptedLinesAdded,
        chatRequests: stats.chatRequests,
        composerRequests: stats.composerRequests,
        agentRequests: stats.agentRequests,
        totalTabsAccepted: stats.totalTabsAccepted,
        activeDaysCount: stats.activeDaysCount,
        mostUsedModel: stats.mostUsedModel,
      },
      achievements,
      recentActivity,
    };
  },
});

/**
 * Export all tools for use in the chat API
 */
export const chatTools = {
  getLeaderboard: getLeaderboardTool,
  getAchievements: getAchievementsTool,
  getTeamStats: getTeamStatsTool,
  getUserProfile: getUserProfileTool,
};
