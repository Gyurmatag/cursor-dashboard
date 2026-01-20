import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type {
  TeamMember,
  DailyUsageRecord,
  DailyUsageResponse,
  LeaderboardEntry,
} from '@/types/cursor';

// Re-export types for convenience
export type {
  TeamMember,
  DailyUsageRecord,
  DailyUsageResponse,
  LeaderboardEntry,
} from '@/types/cursor';

/**
 * Fetches team members from Cursor API
 * Uses React.cache() for per-request deduplication
 */
export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  try {
    const { env } = await getCloudflareContext();
    const apiKey = env.CURSOR_ADMIN_API_KEY as string;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch('https://api.cursor.com/teams/members', {
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      },
      // Next.js automatically deduplicates fetch requests, but we can add caching
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();

    // Handle different possible response formats with proper type guards
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      if ('teamMembers' in data && Array.isArray(data.teamMembers)) {
        return data.teamMembers as TeamMember[];
      }
      if ('members' in data && Array.isArray(data.members)) {
        return data.members as TeamMember[];
      }
    }
    
    if (Array.isArray(data)) {
      return data as TeamMember[];
    }

    // If we got here, the response format is unexpected
    console.warn('Unexpected API response format:', data);
    return [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
});

/**
 * Fetches daily usage data from Cursor API
 * Uses React.cache() for per-request deduplication
 * @param startDate - Start date in epoch milliseconds
 * @param endDate - End date in epoch milliseconds
 */
export const getDailyUsageData = cache(async (startDate: number, endDate: number): Promise<DailyUsageRecord[]> => {
  try {
    const { env } = await getCloudflareContext();
    const apiKey = env.CURSOR_ADMIN_API_KEY as string;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Note: API limit is 30 days per request
    // For ranges > 30 days, caller should use sequential requests
    // See runCompleteHistoricalBackfill() in achievement-sync.ts
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      console.warn('Date range exceeds 30 days - API request may fail. Consider using sequential requests.');
    }

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
      next: { revalidate: 300 }, // Cache for 5 minutes (usage data updates less frequently)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();

    // Type guard for response format
    if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray(data.data)) {
      return (data as DailyUsageResponse).data;
    }

    console.warn('Unexpected API response format:', data);
    return [];
  } catch (error) {
    console.error('Error fetching daily usage data:', error);
    throw error;
  }
});

/**
 * Aggregates daily usage records into user-level leaderboard entries
 * Calculates total activity score based on weighted metrics
 * @param dailyData - Array of daily usage records
 * @param teamMembers - Array of team members to match names
 */
export function aggregateUserMetrics(
  dailyData: DailyUsageRecord[],
  teamMembers: TeamMember[]
): LeaderboardEntry[] {
  // Group data by email
  const userMap = new Map<string, {
    acceptedLinesAdded: number;
    chatRequests: number;
    composerRequests: number;
    agentRequests: number;
    totalTabsAccepted: number;
    totalAccepts: number;
    totalApplies: number;
    activeDays: Set<string>;
    modelUsage: Map<string, number>;
  }>();

  // Aggregate metrics for each user
  for (const record of dailyData) {
    if (!userMap.has(record.email)) {
      userMap.set(record.email, {
        acceptedLinesAdded: 0,
        chatRequests: 0,
        composerRequests: 0,
        agentRequests: 0,
        totalTabsAccepted: 0,
        totalAccepts: 0,
        totalApplies: 0,
        activeDays: new Set(),
        modelUsage: new Map(),
      });
    }

    const userData = userMap.get(record.email)!;
    
    userData.acceptedLinesAdded += record.acceptedLinesAdded;
    userData.chatRequests += record.chatRequests;
    userData.composerRequests += record.composerRequests;
    userData.agentRequests += record.agentRequests;
    userData.totalTabsAccepted += record.totalTabsAccepted;
    userData.totalAccepts += record.totalAccepts;
    userData.totalApplies += record.totalApplies;

    if (record.isActive) {
      userData.activeDays.add(new Date(record.date).toISOString().split('T')[0]);
    }

    // Track model usage
    if (record.mostUsedModel) {
      userData.modelUsage.set(
        record.mostUsedModel,
        (userData.modelUsage.get(record.mostUsedModel) || 0) + 1
      );
    }
  }

  // Convert to leaderboard entries with calculated metrics
  const entries: LeaderboardEntry[] = [];

  for (const [email, userData] of userMap) {
    // Find matching team member for name
    const member = teamMembers.find(m => m.email === email);
    
    // Calculate activity score (weighted)
    const activityScore = 
      (userData.acceptedLinesAdded * 2) + // 2 points per accepted line
      (userData.totalTabsAccepted * 1) + // 1 point per tab accept
      (userData.chatRequests * 3) + // 3 points per chat request
      (userData.composerRequests * 3) + // 3 points per composer request
      (userData.agentRequests * 3); // 3 points per agent request

    // Calculate acceptance rate
    const acceptanceRate = userData.totalApplies > 0
      ? (userData.totalAccepts / userData.totalApplies) * 100
      : 0;

    // Find most used model
    let mostUsedModel = 'N/A';
    let maxUsage = 0;
    for (const [model, count] of userData.modelUsage) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedModel = model;
      }
    }

    entries.push({
      email,
      name: member?.name || email.split('@')[0],
      totalActivityScore: activityScore,
      acceptedLinesAdded: userData.acceptedLinesAdded,
      chatRequests: userData.chatRequests,
      composerRequests: userData.composerRequests,
      agentRequests: userData.agentRequests,
      totalTabsAccepted: userData.totalTabsAccepted,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10, // Round to 1 decimal
      activeDaysCount: userData.activeDays.size,
      mostUsedModel,
    });
  }

  // Sort by activity score (descending)
  return entries.sort((a, b) => b.totalActivityScore - a.totalActivityScore);
}
