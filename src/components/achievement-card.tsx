'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/achievements';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/achievements';
import { AchievementBadge, getTierBgClass } from './achievements';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  achievedAt?: Date | null;
  progress?: number;
  isNew?: boolean;
  className?: string;
}

export function AchievementCard({
  achievement,
  isUnlocked,
  achievedAt,
  progress = 0,
  isNew = false,
  className,
}: AchievementCardProps) {
  const categoryColor = CATEGORY_COLORS[achievement.category];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200',
              getTierBgClass(achievement.tier, isUnlocked),
              isUnlocked
                ? 'border-border/50 hover:border-border hover:scale-[1.02] cursor-pointer'
                : 'border-border/30 opacity-75',
              className
            )}
          >
            {/* NEW badge for recently unlocked */}
            {isNew && isUnlocked && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge
                  variant="default"
                  className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 animate-pulse"
                >
                  NEW
                </Badge>
              </div>
            )}

            {/* Badge */}
            <AchievementBadge
              achievement={achievement}
              isUnlocked={isUnlocked}
              progress={progress}
              size="md"
              showAnimation={isNew}
            />

            {/* Achievement name */}
            <h3
              className={cn(
                'mt-3 text-sm font-semibold text-center line-clamp-1',
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {achievement.name}
            </h3>

            {/* Progress bar for locked achievements */}
            {!isUnlocked && progress > 0 && (
              <div className="w-full mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      `bg-${categoryColor}-500`
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Achieved date for unlocked */}
            {isUnlocked && achievedAt && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {format(achievedAt, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  `border-${categoryColor}-500/50 text-${categoryColor}-600 dark:text-${categoryColor}-400`
                )}
              >
                {CATEGORY_LABELS[achievement.category]}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {achievement.tier}
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Skeleton loading state
export function AchievementCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl border border-border/30 bg-muted/30 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-muted" />
      <div className="h-4 w-16 bg-muted rounded mt-3" />
      <div className="h-1.5 w-full bg-muted rounded mt-2" />
    </div>
  );
}
