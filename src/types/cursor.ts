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

// Sort Types
export type SortDirection = 'asc' | 'desc';
export type LeaderboardSortKey = keyof LeaderboardEntry;
