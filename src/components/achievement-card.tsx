'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementTier } from '@/lib/achievements';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/achievements';
import { AchievementBadge, getTierBgClass } from './achievements/achievement-badge';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
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
  className?: string;
}

// Hoisted helper function for tier-specific border styling
function getTierBorderClass(tier: AchievementTier, isUnlocked: boolean): string {
  if (!isUnlocked) return 'border-border/30';
  
  switch (tier) {
    case 'legendary':
      return 'border-violet-500/50 shadow-lg shadow-violet-500/20';
    case 'gold':
      return 'border-yellow-500/50 shadow-md shadow-yellow-500/10';
    case 'silver':
      return 'border-gray-400/50 shadow-md shadow-gray-400/10';
    case 'bronze':
      return 'border-amber-700/50 shadow-sm shadow-amber-700/10';
    default:
      return 'border-border/50';
  }
}

export function AchievementCard({
  achievement,
  isUnlocked,
  achievedAt,
  progress = 0,
  className,
}: AchievementCardProps) {
  const categoryColor = CATEGORY_COLORS[achievement.category];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
              getTierBgClass(achievement.tier, isUnlocked),
              getTierBorderClass(achievement.tier, isUnlocked),
              isUnlocked
                ? 'hover:scale-[1.02] cursor-pointer ring-1 ring-black/5 dark:ring-white/5'
                : 'opacity-75 grayscale-[20%]',
              className
            )}
          >
            {/* Checkmark for completed achievements */}
            {isUnlocked && (
              <div className="absolute -top-2 -left-2 z-10">
                <div className={cn(
                  'rounded-full p-1 shadow-lg',
                  achievement.tier === 'legendary' && 'bg-gradient-to-br from-violet-500 to-purple-600',
                  achievement.tier === 'gold' && 'bg-gradient-to-br from-yellow-500 to-amber-500',
                  achievement.tier === 'silver' && 'bg-gradient-to-br from-gray-300 to-gray-400',
                  achievement.tier === 'bronze' && 'bg-gradient-to-br from-amber-700 to-amber-800'
                )}>
                  <CheckCircle2 className="size-5 text-white" strokeWidth={3} />
                </div>
              </div>
            )}

            {/* Badge */}
            <AchievementBadge
              achievement={achievement}
              isUnlocked={isUnlocked}
              progress={progress}
              size="md"
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

            {/* Achievement description */}
            <p
              className={cn(
                'mt-2 text-xs text-center line-clamp-2 px-1',
                isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
              )}
            >
              {achievement.description}
            </p>

            {/* Progress bar and locked badge for locked achievements */}
            {!isUnlocked && (
              <div className="w-full mt-3 flex flex-col items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-[10px] font-semibold border-2 border-muted-foreground/30 text-muted-foreground"
                >
                  🔒 LOCKED
                </Badge>
                {progress > 0 && (
                  <div className="w-full">
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
                      {Math.round(progress)}% progress
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Completed status and date for unlocked */}
            {isUnlocked && (
              <div className="mt-3 flex flex-col items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-[10px] font-semibold border-2',
                    achievement.tier === 'legendary' && 'border-violet-500 text-violet-600 dark:text-violet-400',
                    achievement.tier === 'gold' && 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
                    achievement.tier === 'silver' && 'border-gray-400 text-gray-600 dark:text-gray-300',
                    achievement.tier === 'bronze' && 'border-amber-700 text-amber-700 dark:text-amber-500'
                  )}
                >
                  ✓ COMPLETED
                </Badge>
                {achievedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(achievedAt, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
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
