import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { AchievementBadgeDisplay } from './profile-achievement-badge-display';
import { INDIVIDUAL_ACHIEVEMENTS } from '@/lib/achievements';
import type { UserAchievement } from '@/db/schema';

interface ProfileAchievementsSummaryProps {
  userAchievements: UserAchievement[];
}

/**
 * Achievements summary component for profile page
 * Shows top 6 unlocked achievements with link to full page
 */
export function ProfileAchievementsSummary({ userAchievements }: ProfileAchievementsSummaryProps) {
  // Get the unlocked achievement IDs
  const unlockedIds = new Set(userAchievements.map((a) => a.achievementId));

  // Get the achievement definitions and extract only serializable data
  const unlockedAchievements = INDIVIDUAL_ACHIEVEMENTS
    .filter((achievement) => unlockedIds.has(achievement.id))
    .slice(0, 6) // Show top 6
    .map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      tier: achievement.tier,
      shape: achievement.shape,
    }));

  const totalUnlocked = userAchievements.length;
  const totalAchievements = INDIVIDUAL_ACHIEVEMENTS.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>
              {totalUnlocked} of {totalAchievements} achievements unlocked
            </CardDescription>
          </div>
          <Link href="/achievements" prefetch={true}>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {unlockedAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No achievements unlocked yet. Keep using Cursor to earn your first badge!
            </p>
            <Link href="/achievements" prefetch={true}>
              <Button variant="outline">
                View All Achievements
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <AchievementBadgeDisplay
                  tier={achievement.tier}
                  shape={achievement.shape}
                  icon={achievement.icon}
                />
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{achievement.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
