import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { SparklesIcon } from 'lucide-react';
import { LeaderboardCard } from './leaderboard-card';
import { AchievementDisplay } from './achievement-display';
import { UserProfileCard } from './user-profile-card';
import { TeamStatsCard } from './team-stats-card';
import type { LeaderboardResult, AchievementResult, UserProfileResult, TeamStatsResult } from '@/types/chat';

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
}

/**
 * Type guard for LeaderboardResult
 */
function isLeaderboardResult(result: unknown): result is LeaderboardResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'entries' in result &&
    Array.isArray((result as LeaderboardResult).entries)
  );
}

/**
 * Type guard for AchievementResult
 */
function isAchievementResult(result: unknown): result is AchievementResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'achievements' in result &&
    Array.isArray((result as AchievementResult).achievements)
  );
}

/**
 * Type guard for UserProfileResult
 */
function isUserProfileResult(result: unknown): result is UserProfileResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'user' in result &&
    typeof (result as UserProfileResult).user === 'object'
  );
}

/**
 * Type guard for TeamStatsResult
 */
function isTeamStatsResult(result: unknown): result is TeamStatsResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'totals' in result &&
    typeof (result as TeamStatsResult).totals === 'object'
  );
}

/**
 * Tool result renderer component
 * Renders different UI components based on tool type
 */
export const ToolResultRenderer = memo<ToolResultRendererProps>(({ toolName, result }) => {
  // Render specific components based on tool name and result type
  if (toolName === 'getLeaderboard' && isLeaderboardResult(result)) {
    return <LeaderboardCard data={result} />;
  }

  if (toolName === 'getAchievements' && isAchievementResult(result)) {
    return <AchievementDisplay data={result} />;
  }

  if (toolName === 'getUserProfile' && isUserProfileResult(result)) {
    return <UserProfileCard data={result} />;
  }

  if (toolName === 'getTeamStats' && isTeamStatsResult(result)) {
    return <TeamStatsCard data={result} />;
  }

  // Generic fallback for unknown tools
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <SparklesIcon className="w-4 h-4" />
        <span>{toolName} result</span>
      </div>
      <pre className="text-xs overflow-auto max-h-96 bg-muted p-2 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </Card>
  );
});

ToolResultRenderer.displayName = 'ToolResultRenderer';
