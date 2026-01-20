import { AchievementGridSkeleton } from '@/components/achievement-grid';

export default function AchievementsLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-9 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-5 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>

        <AchievementGridSkeleton />
      </div>
    </div>
  );
}
