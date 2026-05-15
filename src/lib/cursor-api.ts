import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type {
  TeamMember,
  DailyUsageRecord,
  DailyUsageResponse,
  LeaderboardEntry,
  AICommitMetric,
  AICommitMetricsResponse,
  AICodeChange,
  AICodeChangesResponse,
  InactiveCoworkerRow,
  InactiveCoworkersSummary,
  LowUsageCoworkerRow,
} from '@/types/cursor';

// Re-export types for convenience
export type {
  TeamMember,
  DailyUsageRecord,
  DailyUsageResponse,
  LeaderboardEntry,
  AICommitMetric,
  AICommitMetricsResponse,
  AICodeChange,
  AICodeChangesResponse,
  InactiveCoworkerRow,
  InactiveCoworkersSummary,
  LowUsageCoworkerRow,
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

    const fromRaw = (raw: unknown): TeamMember | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const m = raw as TeamMember & { is_removed?: boolean };
      if (typeof m.email !== 'string') return null;
      return {
        email: m.email,
        name: typeof m.name === 'string' ? m.name : '',
        role: typeof m.role === 'string' ? m.role : undefined,
        isRemoved: Boolean(m.isRemoved ?? m.is_removed),
      };
    };

    const normalizeList = (list: unknown): TeamMember[] => {
      if (!Array.isArray(list)) return [];
      const out: TeamMember[] = [];
      for (const item of list) {
        const row = fromRaw(item);
        if (row) out.push(row);
      }
      return out;
    };

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      if ('teamMembers' in data && Array.isArray(data.teamMembers)) {
        return normalizeList(data.teamMembers);
      }
      if ('members' in data && Array.isArray(data.members)) {
        return normalizeList(data.members);
      }
    }

    if (Array.isArray(data)) {
      return normalizeList(data);
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
      totalAccepts: userData.totalAccepts,
      totalApplies: userData.totalApplies,
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

// ============================================================================
// AI Code Tracking API (Enterprise)
// ============================================================================

/**
 * Helper to get API key from Cloudflare env
 */
async function getApiKey(): Promise<string> {
  const { env } = await getCloudflareContext();
  const apiKey = env.CURSOR_ADMIN_API_KEY as string;
  if (!apiKey) {
    throw new Error('CURSOR_ADMIN_API_KEY not configured');
  }
  return apiKey;
}

/**
 * Get AI commit metrics with TAB, COMPOSER, and non-AI attribution
 * 
 * @param startDate - Start date (ISO string, "now", or relative like "7d")
 * @param endDate - End date (ISO string, "now", or relative like "0d")
 * @param page - Page number (1-based)
 * @param pageSize - Results per page (max 1000)
 * @param userEmail - Optional filter by user email
 * @returns Paginated commit metrics
 */
export async function getAICommitMetrics(
  startDate: string | number,
  endDate: string | number,
  page: number = 1,
  pageSize: number = 1000,
  userEmail?: string
): Promise<AICommitMetricsResponse> {
  const apiKey = await getApiKey();
  
  // Convert timestamps to ISO strings if needed
  const start = typeof startDate === 'number' 
    ? new Date(startDate).toISOString() 
    : startDate;
  const end = typeof endDate === 'number' 
    ? new Date(endDate).toISOString() 
    : endDate;
  
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (userEmail) {
    params.append('user', userEmail);
  }
  
  const response = await fetch(
    `https://api.cursor.com/analytics/ai-code/commits?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      },
    }
  );
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI commit metrics request failed: ${response.status} ${text}`);
  }
  
  return response.json();
}

/**
 * Get all AI commit metrics for a date range (handles pagination automatically)
 * 
 * @param startDate - Start date (ISO string, timestamp, or relative like "7d")
 * @param endDate - End date (ISO string, timestamp, or relative like "0d")
 * @param userEmail - Optional filter by user email
 * @returns All commit metrics across all pages
 */
export async function getAllAICommitMetrics(
  startDate: string | number,
  endDate: string | number,
  userEmail?: string
): Promise<AICommitMetric[]> {
  const allCommits: AICommitMetric[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await getAICommitMetrics(startDate, endDate, page, 1000, userEmail);
    allCommits.push(...response.items);
    
    hasMore = page * response.pageSize < response.totalCount;
    page++;
    
    // Rate limiting: wait 100ms between requests
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allCommits;
}

/**
 * Get AI code change metrics with granular accepted AI changes
 * 
 * @param startDate - Start date (ISO string, "now", or relative like "7d")
 * @param endDate - End date (ISO string, "now", or relative like "0d")
 * @param page - Page number (1-based)
 * @param pageSize - Results per page (max 1000)
 * @param userEmail - Optional filter by user email
 * @returns Paginated code changes
 */
export async function getAICodeChanges(
  startDate: string | number,
  endDate: string | number,
  page: number = 1,
  pageSize: number = 1000,
  userEmail?: string
): Promise<AICodeChangesResponse> {
  const apiKey = await getApiKey();
  
  // Convert timestamps to ISO strings if needed
  const start = typeof startDate === 'number' 
    ? new Date(startDate).toISOString() 
    : startDate;
  const end = typeof endDate === 'number' 
    ? new Date(endDate).toISOString() 
    : endDate;
  
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (userEmail) {
    params.append('user', userEmail);
  }
  
  const response = await fetch(
    `https://api.cursor.com/analytics/ai-code/changes?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      },
    }
  );
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI code changes request failed: ${response.status} ${text}`);
  }
  
  return response.json();
}

/**
 * Get all AI code changes for a date range (handles pagination automatically)
 * 
 * @param startDate - Start date (ISO string, timestamp, or relative like "7d")
 * @param endDate - End date (ISO string, timestamp, or relative like "0d")
 * @param userEmail - Optional filter by user email
 * @returns All code changes across all pages
 */
export async function getAllAICodeChanges(
  startDate: string | number,
  endDate: string | number,
  userEmail?: string
): Promise<AICodeChange[]> {
  const allChanges: AICodeChange[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await getAICodeChanges(startDate, endDate, page, 1000, userEmail);
    allChanges.push(...response.items);
    
    hasMore = page * response.pageSize < response.totalCount;
    page++;
    
    // Rate limiting: wait 100ms between requests
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allChanges;
}

// ============================================================================
// Inactive coworkers (usage + audit login context)
// ============================================================================

/**
 * Cursor "Unpaid Admin" / free-owner: not a billable seat (IT/finance admin only).
 * @see https://cursor.com/docs/account/teams/members — excluded from seat-churn suggestions.
 */
function isUnpaidAdminTeamRole(role: string | undefined): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase().replace(/_/g, '-');
  return r === 'free-owner' || r === 'unpaid-admin';
}

type UsageAggFull = {
  activeDays: Set<string>;
  lastActiveDay: string | null;
  hadRows: boolean;
  acceptedLinesAdded: number;
  chatRequests: number;
  composerRequests: number;
  agentRequests: number;
  totalTabsAccepted: number;
};

function emptyUsageAgg(): UsageAggFull {
  return {
    activeDays: new Set(),
    lastActiveDay: null,
    hadRows: false,
    acceptedLinesAdded: 0,
    chatRequests: 0,
    composerRequests: 0,
    agentRequests: 0,
    totalTabsAccepted: 0,
  };
}

function addDailyRowMetrics(agg: UsageAggFull, row: DailyUsageRecord): void {
  agg.acceptedLinesAdded += Number(row.acceptedLinesAdded) || 0;
  agg.chatRequests += Number(row.chatRequests) || 0;
  agg.composerRequests += Number(row.composerRequests) || 0;
  agg.agentRequests += Number(row.agentRequests) || 0;
  agg.totalTabsAccepted += Number(row.totalTabsAccepted) || 0;
}

/** Match `aggregateUserMetrics` leaderboard weights, summed over the period */
function activityScoreFromTotals(agg: UsageAggFull): number {
  return (
    agg.acceptedLinesAdded * 2 +
    agg.totalTabsAccepted * 1 +
    agg.chatRequests * 3 +
    agg.composerRequests * 3 +
    agg.agentRequests * 3
  );
}

const MS_DAY = 86400000;
const INACTIVE_USAGE_PAGE_SIZE = 1000;
const DEFAULT_INACTIVITY_PERIOD_DAYS = 30;
/** Inclusive: 1..N active days in the period counts as “low usage” for seat review */
const DEFAULT_LOW_USAGE_MAX_ACTIVE_DAYS = 5;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDailyUsagePage(
  apiKey: string,
  startDate: number,
  endDate: number,
  page: number,
  pageSize: number
): Promise<DailyUsageResponse> {
  const response = await fetch('https://api.cursor.com/teams/daily-usage-data', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate, page, pageSize }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Daily usage request failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<DailyUsageResponse>;
}

/**
 * All daily usage rows for every team member in range (paginated mode).
 */
async function fetchAllDailyUsageForAllMembers(
  startDate: number,
  endDate: number
): Promise<DailyUsageRecord[]> {
  const apiKey = await getApiKey();
  const all: DailyUsageRecord[] = [];
  let page = 1;

  for (;;) {
    const payload = await fetchDailyUsagePage(
      apiKey,
      startDate,
      endDate,
      page,
      INACTIVE_USAGE_PAGE_SIZE
    );
    all.push(...payload.data);
    const p = payload.pagination;
    if (!p?.hasNextPage) break;
    page++;
    await delay(150);
  }

  return all;
}

/**
 * Team members with no / low Cursor usage activity in the lookback window (daily usage only).
 */
export const getInactiveCoworkersSummary = cache(async (): Promise<InactiveCoworkersSummary> => {
  const periodDays = DEFAULT_INACTIVITY_PERIOD_DAYS;
  const periodEndMs = Date.now();
  const periodStartMs = periodEndMs - periodDays * MS_DAY;

  const members = await getTeamMembers();
  const usageRows = await fetchAllDailyUsageForAllMembers(periodStartMs, periodEndMs);

  const activeMembers = members.filter(
    (m) => !m.isRemoved && !isUnpaidAdminTeamRole(m.role)
  );

  const lowUsageMaxActiveDays = DEFAULT_LOW_USAGE_MAX_ACTIVE_DAYS;
  const usageByEmail = new Map<string, UsageAggFull>();

  for (const row of usageRows) {
    const email = row.email?.toLowerCase();
    if (!email) continue;

    let agg = usageByEmail.get(email);
    if (!agg) {
      agg = emptyUsageAgg();
      usageByEmail.set(email, agg);
    }

    agg.hadRows = true;
    addDailyRowMetrics(agg, row);
    const dayKey =
      row.day ?? new Date(row.date).toISOString().slice(0, 10);

    if (row.isActive === true) {
      agg.activeDays.add(dayKey);
      if (!agg.lastActiveDay || dayKey > agg.lastActiveDay) {
        agg.lastActiveDay = dayKey;
      }
    }
  }

  const inactive: InactiveCoworkerRow[] = [];
  const lowUsage: LowUsageCoworkerRow[] = [];

  for (const m of activeMembers) {
    const key = m.email.toLowerCase();
    const agg = usageByEmail.get(key);
    const activeDaysInPeriod = agg?.activeDays.size ?? 0;
    const displayName = m.name || m.email.split('@')[0] || m.email;

    if (activeDaysInPeriod === 0) {
      inactive.push({
        email: m.email,
        name: displayName,
        activeDaysInPeriod,
        lastActiveDay: agg?.lastActiveDay ?? null,
        hadUsageRowsInPeriod: agg?.hadRows ?? false,
      });
      continue;
    }

    if (activeDaysInPeriod >= 1 && activeDaysInPeriod <= lowUsageMaxActiveDays) {
      const a = agg ?? emptyUsageAgg();
      lowUsage.push({
        email: m.email,
        name: displayName,
        activeDaysInPeriod,
        activityScore: activityScoreFromTotals(a),
        acceptedLinesAdded: a.acceptedLinesAdded,
        chatRequests: a.chatRequests,
        composerRequests: a.composerRequests,
        agentRequests: a.agentRequests,
        totalTabsAccepted: a.totalTabsAccepted,
        lastActiveDay: agg?.lastActiveDay ?? null,
      });
    }
  }

  inactive.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  lowUsage.sort(
    (a, b) =>
      a.activeDaysInPeriod - b.activeDaysInPeriod ||
      a.activityScore - b.activityScore ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return {
    inactive,
    lowUsage,
    periodDays,
    periodStartMs,
    periodEndMs,
    lowUsageMaxActiveDays,
    totalTeamMembersConsidered: activeMembers.length,
  };
});
