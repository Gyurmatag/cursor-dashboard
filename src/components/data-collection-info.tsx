'use client';

import { useState } from 'react';
import { InfoIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DataCollectionInfoProps {
  startDate: string | null;
  oldestDataDate: string | null;
}

/**
 * Informational banner explaining data collection period and limitations
 * Uses lazy state initialization for localStorage (React best practice)
 */
export function DataCollectionInfo({ startDate, oldestDataDate }: DataCollectionInfoProps) {
  // Lazy state initialization - reads localStorage only once on mount
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem('data-collection-info-expanded') === 'true';
    } catch {
      return false;
    }
  });

  // Functional setState for stable callback (React best practice)
  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem('data-collection-info-expanded', String(newValue));
      } catch {
        // Fails in incognito/private browsing - ignore
      }
      return newValue;
    });
  };

  const formattedStartDate = startDate
    ? format(new Date(startDate), 'MMM d, yyyy')
    : 'Unknown';
  
  const formattedOldestDate = oldestDataDate
    ? format(new Date(oldestDataDate), 'MMM d, yyyy')
    : 'Unknown';

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
        aria-expanded={isExpanded ? 'true' : 'false'}
        aria-label={isExpanded ? 'Collapse data collection info' : 'Expand data collection info'}
      >
        <InfoIcon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Data Collection Information
            </h3>
            {isExpanded ? (
              <ChevronUpIcon className="size-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDownIcon className="size-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          
          {!isExpanded ? (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Tracking since {formattedStartDate} • Click to learn more
            </p>
          ) : null}
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-3 ml-8 space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[140px]">Tracking since:</span>
            <span>{formattedStartDate}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[140px]">Oldest data:</span>
            <span>{formattedOldestDate}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[140px]">API limitation:</span>
            <span>Last 30 days maximum (Cursor API)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[140px]">Auto-updates:</span>
            <span>Every hour via scheduled sync</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[140px]">User action:</span>
            <span>Data refreshes automatically - no action needed</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
