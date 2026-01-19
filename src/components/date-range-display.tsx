/**
 * Date Range Display Component
 * Reusable component for displaying selected date range information
 */

import { format } from 'date-fns';
import type { DateRange } from '@/types/cursor';
import { DATE_FORMAT } from '@/lib/date-utils';

interface DateRangeDisplayProps {
  dateRange: DateRange;
  className?: string;
}

export function DateRangeDisplay({ dateRange, className = '' }: DateRangeDisplayProps) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Selected Period:</span>
          <span className="text-sm text-muted-foreground">{dateRange.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>From:</span>
          <time 
            dateTime={new Date(dateRange.startDate).toISOString()}
            className="font-mono"
          >
            {format(new Date(dateRange.startDate), DATE_FORMAT)}
          </time>
          <span aria-hidden="true">•</span>
          <span>To:</span>
          <time 
            dateTime={new Date(dateRange.endDate).toISOString()}
            className="font-mono"
          >
            {format(new Date(dateRange.endDate), DATE_FORMAT)}
          </time>
        </div>
      </div>
    </div>
  );
}
