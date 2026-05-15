/**
 * Cursor Admin API Type Definitions
 * Centralized type definitions for the Cursor dashboard
 */

// Team Member Types
export interface TeamMember {
  name: string;
  email: string;
  /** When true, member should be excluded from admin lists */
  isRemoved?: boolean;
}

// Daily Usage API Types
export interface DailyUsageRecord {
  /** Present on paginated responses */
  userId?: number;
  /** ISO date string, e.g. 2024-03-18 */
  day?: string;
  date: number;
  /** Whether the user had activity that day (paginated all-members mode) */
  isActive?: boolean;
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
  clientVersion: string | null;
  email: string;
}

export interface DailyUsagePaginationMeta {
  page: number;
  pageSize: number;
  totalUsers?: number;
  totalPages?: number;
  totalCount?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DailyUsageResponse {
  data: DailyUsageRecord[];
  period: {
    startDate: number;
    endDate: number;
  };
  pagination?: DailyUsagePaginationMeta;
}

/** Audit log entry from GET /teams/audit-logs */
export interface AuditLogEvent {
  event_id: string;
  timestamp: string;
  user_email: string;
  event_type: string;
  ip_address?: string;
  event_data?: Record<string, unknown>;
}

export interface AuditLogsResponse {
  events: AuditLogEvent[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages?: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/** Row for inactive-coworkers admin view */
export interface InactiveCoworkerRow {
  email: string;
  name: string;
  activeDaysInPeriod: number;
  /** ISO date (YYYY-MM-DD) of last active day in the inactivity window, if any */
  lastActiveDay: string | null;
  /** Most recent login event in the login lookback window */
  lastLoginAt: string | null;
  /** False if the user had no daily-usage rows in the period (e.g. joined after range) */
  hadUsageRowsInPeriod: boolean;
}

/** Server-computed bundle for the inactive coworkers admin page */
export interface InactiveCoworkersSummary {
  inactive: InactiveCoworkerRow[];
  periodDays: number;
  periodStartMs: number;
  periodEndMs: number;
  loginLookbackDays: number;
  /** Members after excluding `isRemoved` */
  totalTeamMembersConsidered: number;
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
  teamId?: string;
  teamName?: string;
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
