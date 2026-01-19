'use client';

import { useState, useEffect, useCallback } from "react";
import { AiUsageLeaderboard } from "@/components/ai-usage-leaderboard";
import { DateRangeFilter } from "@/components/date-range-filter";
import { DataLoading } from "@/components/data-loading";
import { DataError } from "@/components/data-error";
import { fetchLeaderboardData } from "@/lib/actions";
import type { DateRange, LeaderboardEntry } from "@/types/cursor";

export default function Page() {
  // Use lazy initialization to avoid recalculating on every render
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime(),
    endDate: Date.now(),
    label: 'Last 30 days',
  }));
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchLeaderboardData(dateRange.startDate, dateRange.endDate);
        setLeaderboardData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange.startDate, dateRange.endDate]);

  // Stable callback reference to prevent unnecessary re-renders
  const handleRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Usage Leaderboard</h1>
            <p className="text-muted-foreground mt-2">
              Team members ranked by their AI activity score across all Cursor features
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Score calculation: Accepted Lines (2pts) + Tab Accepts (1pt) + Chat/Composer/Agent Requests (3pts each)
            </p>
          </div>
          <DateRangeFilter 
            onRangeChange={handleRangeChange} 
            defaultPreset="30days"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Selected period:</span>
          <span>{dateRange.label}</span>
          <span className="text-xs">
            ({new Date(dateRange.startDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} - {new Date(dateRange.endDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })})
          </span>
        </div>

        {loading && <DataLoading message="Loading leaderboard data..." />}
        {error && <DataError error={error} title="Error loading leaderboard" />}
        {!loading && !error && leaderboardData && (
          <AiUsageLeaderboard entries={leaderboardData} />
        )}
      </div>
    </div>
  );
}