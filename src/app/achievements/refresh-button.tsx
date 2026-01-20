'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, Loader2Icon } from 'lucide-react';

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/achievements/refresh', {
        method: 'POST',
      });

      if (res.ok) {
        router.refresh(); // Revalidate server components
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Failed to refresh');
      }
    } catch (err) {
      setError('Network error');
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-sm text-destructive">{error}</span>}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        {isRefreshing ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <RefreshCwIcon className="size-4" />
        )}
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
}
