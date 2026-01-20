import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AchievementBadge } from '@/components/achievements/achievement-badge';
import { TrophyIcon, LockIcon } from 'lucide-react';
import type { AchievementDisplayProps } from '@/types/chat';
import { cn } from '@/lib/utils';

// Hoist tier colors outside component
const TIER_COLORS = {
  bronze: 'text-amber-700 bg-amber-50 dark:bg-amber-950',
  silver: 'text-gray-400 bg-gray-50 dark:bg-gray-900',
  gold: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  legendary: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
} as const;

export const AchievementDisplay = memo(function AchievementDisplay({ data }: AchievementDisplayProps) {
  const { achievements, summary } = data;

  if (achievements.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No achievements found</p>
      </Card>
    );
  }

  // Separate unlocked and locked achievements
  const unlocked = achievements.filter(a => a.isUnlocked);
  const locked = achievements.filter(a => !a.isUnlocked);

  return (
    <Card className="p-6 space-y-6">
      {/* Header with Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Achievements</h3>
          </div>
          <Badge variant="secondary">
            {summary.unlocked}/{summary.total} Unlocked
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{summary.progress}%</span>
          </div>
          <Progress value={summary.progress} className="h-2" />
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlocked.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Unlocked</h4>
          <div className="grid gap-3">
            {unlocked.map(({ achievement, unlockedAt }) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <AchievementBadge
                  achievement={achievement}
                  isUnlocked={true}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{achievement.name}</p>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', TIER_COLORS[achievement.tier])}
                    >
                      {achievement.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {unlockedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocked {new Date(unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress / Locked Achievements */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">In Progress</h4>
          <div className="grid gap-3">
            {locked.slice(0, 5).map(({ achievement, progress }) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                <div className="relative">
                  <AchievementBadge
                    achievement={achievement}
                    isUnlocked={false}
                    size="md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LockIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground">{achievement.name}</p>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {achievement.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
            {locked.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                +{locked.length - 5} more locked achievements
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
});
