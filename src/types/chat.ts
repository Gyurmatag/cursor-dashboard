import type { LeaderboardEntry, DailyUsageRecord } from './cursor';
import type { Achievement } from '@/lib/achievements';

/**
 * Tool parameter types for Pulse chat tools
 */

export interface GetLeaderboardParams {
  limit?: number;
  dateRange?: 'today' | 'yesterday' | '7days' | '14days' | '30days' | '60days' | '90days' | 'mtd' | 'ytd' | 'qtd' | 'alltime';
  sortBy?: 'totalActivityScore' | 'acceptedLinesAdded' | 'chatRequests' | 'composerRequests' | 'agentRequests';
}

export interface GetAchievementsParams {
  userId?: string;
  type?: 'individual' | 'team' | 'all';
  tier?: 'bronze' | 'silver' | 'gold' | 'legendary';
}

export interface GetTeamStatsParams {
  dateRange?: 'today' | 'yesterday' | '7days' | '14days' | '30days' | '60days' | '90days' | 'mtd' | 'ytd' | 'qtd' | 'alltime';
  metric?: 'lines' | 'requests' | 'tabs' | 'all';
}

export interface GetUserProfileParams {
  email?: string;
  name?: string;
  dateRange?: 'today' | 'yesterday' | '7days' | '14days' | '30days' | '60days' | '90days' | 'mtd' | 'ytd' | 'qtd' | 'alltime';
}

/**
 * Tool result types
 */

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  dateRange: {
    start: number;
    end: number;
    label: string;
  };
}

export interface AchievementResult {
  achievements: Array<{
    achievement: Achievement;
    isUnlocked: boolean;
    progress: number;
    unlockedAt?: number;
  }>;
  summary: {
    total: number;
    unlocked: number;
    progress: number;
  };
}

export interface TeamStatsResult {
  period: {
    start: number;
    end: number;
    label: string;
  };
  totals: {
    totalLinesAdded: number;
    totalChatRequests: number;
    totalComposerRequests: number;
    totalAgentRequests: number;
    totalTabsAccepted: number;
    activeMembers: number;
  };
  dailyData: DailyUsageRecord[];
  topPerformers: {
    byLines: LeaderboardEntry[];
    byActivity: LeaderboardEntry[];
  };
}

export interface UserProfileResult {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalActivityScore: number;
    acceptedLinesAdded: number;
    chatRequests: number;
    composerRequests: number;
    agentRequests: number;
    totalTabsAccepted: number;
    activeDaysCount: number;
    mostUsedModel: string;
  };
  achievements: Array<{
    achievement: Achievement;
    isUnlocked: boolean;
    progress: number;
  }>;
  recentActivity: DailyUsageRecord[];
}

/**
 * Generative UI component props
 */

export interface LeaderboardCardProps {
  data: LeaderboardResult;
}

export interface StatChartProps {
  data: {
    date: string;
    value: number;
    label?: string;
  }[];
  metric: string;
  color?: string;
}

export interface AchievementDisplayProps {
  data: AchievementResult;
}

export interface UserComparisonTableProps {
  users: LeaderboardEntry[];
  metrics: string[];
}

/**
 * Tool execution context
 */

export interface ToolExecutionContext {
  startDate: number;
  endDate: number;
  timezone: string;
}

/**
 * Message metadata for tool calls
 */

export interface ToolCallMetadata {
  toolName: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}
