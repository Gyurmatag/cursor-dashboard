import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-4 border-b">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Input area skeleton */}
        <div className="border-t pt-4">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
