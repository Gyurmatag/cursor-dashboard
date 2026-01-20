'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  INDIVIDUAL_ACHIEVEMENTS,
  TEAM_ACHIEVEMENTS,
  getIndividualCategories,
  getTeamCategories,
  CATEGORY_LABELS,
  type Achievement,
  type AchievementCategory,
} from '@/lib/achievements';
import type { UserAchievement, TeamAchievement, UserStats, TeamStats } from '@/db/schema';
import { AchievementCard, AchievementCardSkeleton } from './achievement-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserIcon, UsersIcon } from 'lucide-react';

interface AchievementGridProps {
  userAchievements: UserAchievement[];
  teamAchievements: TeamAchievement[];
  userStats: UserStats | null;
  teamStats: TeamStats | null;
  selectedUser?: string;
}

export function AchievementGrid({
  userAchievements,
  teamAchievements,
  userStats,
  teamStats,
  selectedUser,
}: AchievementGridProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

  // Filter user achievements by selected user
  const filteredUserAchievements = useMemo(() => {
    if (!selectedUser) return userAchievements;
    return userAchievements.filter((a) => a.userEmail === selectedUser);
  }, [userAchievements, selectedUser]);

  // Create lookup sets for earned achievements
  const earnedUserAchievementIds = useMemo(
    () => new Set(filteredUserAchievements.map((a) => a.achievementId)),
    [filteredUserAchievements]
  );

  const earnedTeamAchievementIds = useMemo(
    () => new Set(teamAchievements.map((a) => a.achievementId)),
    [teamAchievements]
  );

  // Create lookup map for achievement dates
  const userAchievementDates = useMemo(() => {
    const map = new Map<string, Date>();
    filteredUserAchievements.forEach((a) => {
      map.set(a.achievementId, a.achievedAt);
    });
    return map;
  }, [filteredUserAchievements]);

  const teamAchievementDates = useMemo(() => {
    const map = new Map<string, Date>();
    teamAchievements.forEach((a) => {
      map.set(a.achievementId, a.achievedAt);
    });
    return map;
  }, [teamAchievements]);

  // Check if achievement was earned recently (last 24 hours)
  const isNewAchievement = (achievedAt: Date | undefined): boolean => {
    if (!achievedAt) return false;
    const now = new Date();
    const diff = now.getTime() - achievedAt.getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  // Calculate progress for achievements
  const calculateProgress = (achievement: Achievement): number => {
    if (activeTab === 'individual' && userStats) {
      return achievement.progressFn(userStats);
    }
    if (activeTab === 'team' && teamStats) {
      return achievement.progressFn(teamStats);
    }
    return 0;
  };

  // Get achievements and categories for current tab
  const achievements = activeTab === 'individual' ? INDIVIDUAL_ACHIEVEMENTS : TEAM_ACHIEVEMENTS;
  const categories = activeTab === 'individual' ? getIndividualCategories() : getTeamCategories();
  const earnedIds = activeTab === 'individual' ? earnedUserAchievementIds : earnedTeamAchievementIds;
  const achievementDates = activeTab === 'individual' ? userAchievementDates : teamAchievementDates;

  // Calculate completion stats
  const totalCount = achievements.length;
  const earnedCount = earnedIds.size;
  const completionPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const grouped = new Map<AchievementCategory, Achievement[]>();
    categories.forEach((cat) => {
      const categoryAchievements = achievements.filter((a) => a.category === cat);
      if (categoryAchievements.length > 0) {
        grouped.set(cat, categoryAchievements);
      }
    });
    return grouped;
  }, [achievements, categories]);

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'individual' ? 'default' : 'outline'}
            onClick={() => setActiveTab('individual')}
            className="gap-2"
          >
            <UserIcon className="size-4" />
            My Achievements
          </Button>
          <Button
            variant={activeTab === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveTab('team')}
            className="gap-2"
          >
            <UsersIcon className="size-4" />
            Team Achievements
          </Button>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{earnedCount}</span>
            <span> / {totalCount}</span>
          </div>
          <div className="w-32">
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
        </div>
      </div>

      {/* Achievement categories */}
      <div className="space-y-8">
        {Array.from(achievementsByCategory.entries()).map(([category, categoryAchievements]) => (
          <div key={category}>
            {/* Category header */}
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', `bg-${category}-500`)} />
              {CATEGORY_LABELS[category]}
              <span className="text-sm font-normal text-muted-foreground">
                ({categoryAchievements.filter((a) => earnedIds.has(a.id)).length}/{categoryAchievements.length})
              </span>
            </h3>

            {/* Achievement grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryAchievements.map((achievement) => {
                const isUnlocked = earnedIds.has(achievement.id);
                const achievedAt = achievementDates.get(achievement.id);
                const progress = isUnlocked ? 100 : calculateProgress(achievement);

                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={isUnlocked}
                    achievedAt={achievedAt}
                    progress={progress}
                    isNew={isNewAchievement(achievedAt)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton loading state for the grid
export function AchievementGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab buttons skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-2 w-32 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Category sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <AchievementCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
