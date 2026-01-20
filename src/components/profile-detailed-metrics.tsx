import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserStats } from '@/db/schema';
import type { LeaderboardEntry } from '@/types/cursor';

interface ProfileDetailedMetricsProps {
  userStats: UserStats | null;
  leaderboardEntry: LeaderboardEntry | null;
}

/**
 * Detailed metrics component for profile page
 * Shows comprehensive breakdown of user statistics
 */
export function ProfileDetailedMetrics({ 
  userStats, 
  leaderboardEntry 
}: ProfileDetailedMetricsProps) {
  // Memoize metrics computation (best practice: avoid recreating array on every render)
  const metrics = useMemo(() => [
    {
      title: 'Best Single Day (Lines)',
      value: userStats?.bestSingleDayLines.toLocaleString() || '0',
      description: 'Most lines added in one day',
      badge: 'Personal Best',
      badgeVariant: 'default' as const,
    },
    {
      title: 'Best Single Day (Agent)',
      value: userStats?.bestSingleDayAgent.toLocaleString() || '0',
      description: 'Most agent requests in one day',
      badge: 'Peak Performance',
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Max Consecutive Days',
      value: `${userStats?.maxConsecutiveDays || 0} days`,
      description: 'Longest activity streak',
      badge: 'Consistency',
      badgeVariant: 'default' as const,
    },
    {
      title: 'Acceptance Rate',
      value: `${userStats?.totalAcceptanceRate.toFixed(1) || '0.0'}%`,
      description: 'Code suggestion acceptance',
      badge: leaderboardEntry?.acceptanceRate && leaderboardEntry.acceptanceRate > 70 ? 'High Quality' : 'Keep Going',
      badgeVariant: leaderboardEntry?.acceptanceRate && leaderboardEntry.acceptanceRate > 70 ? 'default' as const : 'outline' as const,
    },
    {
      title: 'Most Used Model',
      value: leaderboardEntry?.mostUsedModel || 'N/A',
      description: 'Preferred AI model',
      badge: 'Favorite',
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Total Tab Accepts',
      value: userStats?.totalTabAccepts.toLocaleString() || '0',
      description: 'Tab completions accepted',
      badge: 'Productivity',
      badgeVariant: 'default' as const,
    },
    {
      title: 'Active Days',
      value: userStats?.totalActiveDays.toLocaleString() || '0',
      description: 'Days with activity',
      badge: 'Engagement',
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Total Activity (30d)',
      value: leaderboardEntry?.activeDaysCount.toLocaleString() || '0',
      description: 'Active days last month',
      badge: 'Recent',
      badgeVariant: 'outline' as const,
    },
  ], [userStats, leaderboardEntry]);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Badge variant={metric.badgeVariant} className="text-xs">
                {metric.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
