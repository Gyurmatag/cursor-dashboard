/**
 * Cursor Admin API Type Definitions
 * Centralized type definitions for the Cursor dashboard
 */

// Team Member Types
export interface TeamMember {
  name: string;
  email: string;
}

// Daily Usage API Types
export interface DailyUsageRecord {
  date: number;
  isActive: boolean;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  acceptedLinesAdded: number;
  acceptedLinesDeleted: number;
  totalApplies: number;
  totalAccepts: number;
  totalRejects: number;
  totalTabsShown: number;
  totalTabsAccepted: number;
  composerRequests: number;
  chatRequests: number;
  agentRequests: number;
  cmdkUsages: number;
  subscriptionIncludedReqs: number;
  apiKeyReqs: number;
  usageBasedReqs: number;
  bugbotUsages: number;
  mostUsedModel: string;
  applyMostUsedExtension: string;
  tabMostUsedExtension: string;
  clientVersion: string;
  email: string;
}

export interface DailyUsageResponse {
  data: DailyUsageRecord[];
  period: {
    startDate: number;
    endDate: number;
  };
}

// Leaderboard Types
export interface LeaderboardEntry {
  email: string;
  name: string;
  totalActivityScore: number;
  acceptedLinesAdded: number;
  totalAccepts: number; // Accepted diffs count
  totalApplies: number; // Total apply attempts
  chatRequests: number;
  composerRequests: number;
  agentRequests: number;
  totalTabsAccepted: number;
  acceptanceRate: number;
  activeDaysCount: number;
  mostUsedModel: string;
}

// Date Range Types
export interface DateRange {
  startDate: number;
  endDate: number;
  label: string;
}

export interface CustomDateRange {
  from: Date;
  to: Date;
}

// Date Range Preset Keys - supports unlimited historical data
export type PresetKey =
  | 'today'
  | 'yesterday'
  | '7days'
  | '14days'
  | '30days'
  | '60days'
  | '90days'
  | 'mtd'
  | 'lastMonth'
  | 'qtd'
  | 'ytd'
  | 'alltime'
  | 'custom';

// ============================================================================
// AI Code Tracking API Types (Enterprise)
// ============================================================================

/**
 * AI Commit Metrics from /analytics/ai-code/commits
 * Per-commit attribution of TAB, COMPOSER, and non-AI code
 */
export interface AICommitMetric {
  commitHash: string;
  userId: string;
  userEmail: string;
  repoName: string | null;
  branchName: string | null;
  isPrimaryBranch: boolean | null;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  tabLinesAdded: number;
  tabLinesDeleted: number;
  composerLinesAdded: number;
  composerLinesDeleted: number;
  nonAiLinesAdded: number | null;
  nonAiLinesDeleted: number | null;
  message: string | null;
  commitTs: string | null;
  createdAt: string;
}

/**
 * AI Code Change Metrics from /analytics/ai-code/changes
 * Granular accepted AI changes, independent of commits
 */
export interface AICodeChange {
  changeId: string;
  userId: string;
  userEmail: string;
  source: 'TAB' | 'COMPOSER';
  model: string | null;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  createdAt: string;
  metadata: Array<{
    fileName?: string;
    fileExtension: string;
    linesAdded: number;
    linesDeleted: number;
  }>;
}

/**
 * Paginated response for AI commit metrics
 */
export interface AICommitMetricsResponse {
  items: AICommitMetric[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated response for AI code changes
 */
export interface AICodeChangesResponse {
  items: AICodeChange[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Sort Types
export type SortDirection = 'asc' | 'desc';
export type LeaderboardSortKey = keyof LeaderboardEntry;
