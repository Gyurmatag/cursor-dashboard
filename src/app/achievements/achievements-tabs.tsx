'use client';

import { Suspense } from 'react';
import { UsersIcon, UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementGridSkeleton } from '@/components/achievement-grid';
import { AchievementSectionBadge } from '@/components/achievement-section-badge';

interface AchievementsTabsProps {
  teamContent: React.ReactNode;
  personalContent: React.ReactNode;
}

export function AchievementsTabs({ teamContent, personalContent }: AchievementsTabsProps) {
  return (
    <Tabs defaultValue="team" className="w-full">
      <TabsList className="grid w-fit grid-cols-2">
        <TabsTrigger value="team" className="gap-2">
          <UsersIcon className="size-4" />
          Team
        </TabsTrigger>
        <TabsTrigger value="personal" className="gap-2">
          <UserIcon className="size-4" />
          Personal
        </TabsTrigger>
      </TabsList>

      <TabsContent value="team" className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <UsersIcon className="size-6 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Team Achievements</h2>
            </div>
            <AchievementSectionBadge accessLevel="public" />
          </div>
        </div>
        <Suspense fallback={<AchievementGridSkeleton />}>
          {teamContent}
        </Suspense>
      </TabsContent>

      <TabsContent value="personal" className="mt-6 space-y-4">
        <Suspense fallback={<AchievementGridSkeleton />}>
          {personalContent}
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
