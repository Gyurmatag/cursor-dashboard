import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrophyIcon, TrendingUpIcon, CodeIcon, MessageSquareIcon, SparklesIcon } from 'lucide-react';
import type { LeaderboardCardProps } from '@/types/chat';
import { cn } from '@/lib/utils';

// Hoist trophy colors outside component
const TROPHY_COLORS = {
  0: 'text-yellow-500',
  1: 'text-gray-400',
  2: 'text-amber-700',
} as const;

export const LeaderboardCard = memo(function LeaderboardCard({ data }: LeaderboardCardProps) {
  const { entries, dateRange } = data;

  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No leaderboard data available for this period.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Top Performers</h3>
        </div>
        <Badge variant="secondary">{dateRange.label}</Badge>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const showTrophy = rank <= 3;

          return (
            <div
              key={entry.email}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                rank === 1 && 'bg-primary/5 border-primary/20',
                rank === 2 && 'bg-muted/50',
                rank === 3 && 'bg-muted/30'
              )}
            >
              {/* Rank / Trophy */}
              <div className="flex-shrink-0 w-8 text-center">
                {showTrophy ? (
                  <TrophyIcon className={cn('w-6 h-6', TROPHY_COLORS[index as keyof typeof TROPHY_COLORS])} />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.name}</p>
                <p className="text-sm text-muted-foreground truncate">{entry.email}</p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUpIcon className="w-3 h-3 text-primary" />
                    <span className="font-semibold">{entry.totalActivityScore.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Activity</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <CodeIcon className="w-3 h-3 text-green-500" />
                    <span className="font-medium">{entry.acceptedLinesAdded.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Lines</p>
                </div>

                {(entry.chatRequests > 0 || entry.composerRequests > 0 || entry.agentRequests > 0) && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <MessageSquareIcon className="w-3 h-3 text-blue-500" />
                      <span className="font-medium">
                        {(entry.chatRequests + entry.composerRequests + entry.agentRequests).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Requests</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing top {entries.length} of {data.total} team members</span>
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-4 h-4" />
          <span>{dateRange.label}</span>
        </div>
      </div>
    </Card>
  );
});
