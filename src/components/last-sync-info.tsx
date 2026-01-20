'use client';

import { ClockIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';

interface LastSyncInfoProps {
  lastSyncAt: string | null;
  nextSyncTime: string | null;
  dataCollectionStartDate: string | null;
}

export function LastSyncInfo({ lastSyncAt, nextSyncTime, dataCollectionStartDate }: LastSyncInfoProps) {
  // Format dates on client side in user's local timezone
  if (!lastSyncAt) {
    return (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-4" />
          <span>Never synced</span>
        </div>
      </div>
    );
  }

  const lastSyncDate = new Date(lastSyncAt);
  const nextSyncDate = nextSyncTime ? new Date(nextSyncTime) : null;
  const trackingSinceDate = dataCollectionStartDate ? new Date(dataCollectionStartDate) : null;
  
  // Check if sync is overdue (last sync was before the previous scheduled time)
  const now = new Date();
  const lastScheduledSync = new Date(now);
  lastScheduledSync.setMinutes(0);
  lastScheduledSync.setSeconds(0);
  lastScheduledSync.setMilliseconds(0);
  
  // If we're past minute 5 of current hour and last sync is before this hour's scheduled time
  const isOverdue = now.getMinutes() > 5 && lastSyncDate < lastScheduledSync;

  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <ClockIcon className="size-4" />
        <span>Last sync: {format(lastSyncDate, 'MMM d, HH:mm')}</span>
        {isOverdue && (
          <span className="text-yellow-600 dark:text-yellow-500 flex items-center gap-1 text-xs" title="Sync may be delayed or failed">
            <AlertCircleIcon className="size-3" />
            overdue
          </span>
        )}
      </div>
      {nextSyncDate ? (
        <div className="flex items-center gap-2 pl-6">
          <span>Scheduled: {format(nextSyncDate, 'MMM d, HH:mm')}</span>
        </div>
      ) : null}
      {trackingSinceDate ? (
        <div className="flex items-center gap-2 pl-6">
          <span>Tracking since: {format(trackingSinceDate, 'MMM d, yyyy')}</span>
        </div>
      ) : null}
    </div>
  );
}
