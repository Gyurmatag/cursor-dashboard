'use client';

import { useState, useEffect, useCallback } from "react";
import { AiUsageLeaderboard } from "@/components/ai-usage-leaderboard";
import { DateRangeFilter } from "@/components/date-range-filter";
import { DateRangeDisplay } from "@/components/date-range-display";
import { DataLoading } from "@/components/data-loading";
import { DataError } from "@/components/data-error";
import { fetchLeaderboardData } from "@/lib/actions";
import { calculateDateRange } from "@/lib/date-range-presets";
import type { DateRange, LeaderboardEntry } from "@/types/cursor";

export default function Page() {
  // Use lazy initialization with proper date calculation
  const [dateRange, setDateRange] = useState<DateRange>(() => 
    calculateDateRange('30days')
  );
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">AI Usage Leaderboard</h1>
            <p className="text-muted-foreground mt-2">
              Team members ranked by their AI activity score across all Cursor features
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Score calculation: Accepted Lines (2pts) + Tab Accepts (1pt) + Chat/Composer/Agent Requests (3pts each)
            </p>
          </div>
          <div className="lg:w-[400px]">
            <DateRangeFilter 
              onRangeChange={handleRangeChange} 
              defaultPreset="30days"
            />
          </div>
        </div>

        <DateRangeDisplay dateRange={dateRange} />

        {loading && <DataLoading message="Loading leaderboard data..." />}
        {error && <DataError error={error} title="Error loading leaderboard" />}
        {!loading && !error && leaderboardData && (
          <AiUsageLeaderboard entries={leaderboardData} />
        )}
      </div>
    </div>
  );
}