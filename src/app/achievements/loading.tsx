import { AchievementGridSkeleton } from '@/components/achievement-grid';
import { Skeleton } from '@/components/ui/skeleton';

export default function AchievementsLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-10 w-32 rounded-lg" />
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-5 w-96 rounded" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <AchievementGridSkeleton />
      </div>
    </div>
  );
}
