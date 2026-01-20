import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUpIcon, 
  FlameIcon, 
  CodeIcon, 
  MessageSquareIcon,
  WandIcon,
  BotIcon,
  TrophyIcon,
  MedalIcon,
} from 'lucide-react';
import type { UserStats } from '@/db/schema';
import type { LeaderboardEntry } from '@/types/cursor';

interface ProfileStatsSummaryProps {
  userStats: UserStats | null;
  leaderboardEntry: LeaderboardEntry | null;
  achievementsCount: number;
  userRank: number;
  totalUsers: number;
}

/**
 * Summary statistics cards for the profile page
 * Displays key metrics in a responsive grid layout
 */
export function ProfileStatsSummary({ 
  userStats, 
  leaderboardEntry,
  achievementsCount,
  userRank,
  totalUsers,
}: ProfileStatsSummaryProps) {
  // Memoize stats computation (best practice: avoid recreating array on every render)
  const stats = useMemo(() => [
    {
      title: 'Activity Score',
      value: leaderboardEntry?.totalActivityScore.toLocaleString() || '0',
      description: 'Last 30 days',
      icon: TrendingUpIcon,
      color: 'text-blue-500',
    },
    {
      title: 'Current Streak',
      value: userStats?.currentStreak || 0,
      description: `Max: ${userStats?.maxConsecutiveDays || 0} days`,
      icon: FlameIcon,
      color: 'text-orange-500',
    },
    {
      title: 'Lines Added',
      value: userStats?.totalLinesAdded.toLocaleString() || '0',
      description: 'Last 30 days (real-time)',
      icon: CodeIcon,
      color: 'text-green-500',
    },
    {
      title: 'Chat Requests',
      value: userStats?.totalChatRequests.toLocaleString() || '0',
      description: 'Last 30 days (real-time)',
      icon: MessageSquareIcon,
      color: 'text-purple-500',
    },
    {
      title: 'Composer Uses',
      value: userStats?.totalComposerRequests.toLocaleString() || '0',
      description: 'Last 30 days (real-time)',
      icon: WandIcon,
      color: 'text-pink-500',
    },
    {
      title: 'Agent Requests',
      value: userStats?.totalAgentRequests.toLocaleString() || '0',
      description: 'Last 30 days (real-time)',
      icon: BotIcon,
      color: 'text-cyan-500',
    },
    {
      title: 'Achievements',
      value: achievementsCount,
      description: 'Unlocked badges',
      icon: TrophyIcon,
      color: 'text-yellow-500',
    },
    {
      title: 'Leaderboard Rank',
      value: userRank > 0 ? `#${userRank}` : 'N/A',
      description: `of ${totalUsers} members`,
      icon: MedalIcon,
      color: 'text-amber-500',
    },
  ], [userStats, leaderboardEntry, achievementsCount, userRank, totalUsers]);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`size-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
