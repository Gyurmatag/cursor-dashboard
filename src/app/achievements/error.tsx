'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AchievementsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Achievements error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div>
          <Link href="/" prefetch={true}>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeftIcon className="size-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Error message */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircleIcon className="size-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load achievements</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {error.message || 'An unexpected error occurred while loading the achievements page.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="gap-2">
              <RefreshCwIcon className="size-4" />
              Try again
            </Button>
            <Link href="/">
              <Button variant="default">Go to Dashboard</Button>
            </Link>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
          )}
        </div>
      </div>
    </div>
  );
}
