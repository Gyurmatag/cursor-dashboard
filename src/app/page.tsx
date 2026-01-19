'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SummaryStats } from '@/components/summary-stats';
import { DashboardCharts } from '@/components/dashboard-charts';
import { DataLoading } from '@/components/data-loading';
import { DataError } from '@/components/data-error';
import { Button } from '@/components/ui/button';
import { fetchLeaderboardData } from '@/lib/actions';
import { calculateDateRange } from '@/lib/date-range-presets';
import { ArrowRightIcon } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/cursor';

export default function DashboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data on mount with 30-day default
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const dateRange = calculateDateRange('30days');
        const data = await fetchLeaderboardData(dateRange.startDate, dateRange.endDate);
        setLeaderboardData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Last 30 days of AI activity</p>
        </div>
        <Link href="/leaderboard" prefetch={true}>
          <Button variant="outline" className="gap-2">
            View Leaderboard
            <ArrowRightIcon className="size-4" />
          </Button>
        </Link>
      </div>

      {/* Summary Stats Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Team Overview</h2>
        {loading ? (
          <DataLoading message="Loading team statistics..." />
        ) : error ? (
          <DataError error={error} title="Error loading statistics" />
        ) : leaderboardData ? (
          <SummaryStats data={leaderboardData} />
        ) : null}
      </section>

      {/* Charts Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Analytics</h2>
        {loading ? (
          <DataLoading message="Loading charts..." />
        ) : error ? (
          <DataError error={error} title="Error loading charts" />
        ) : leaderboardData ? (
          <DashboardCharts data={leaderboardData} />
        ) : null}
      </section>

      {/* Quick Actions */}
      <section className="py-6 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Want more details?</h3>
            <p className="text-sm text-muted-foreground">
              View the full leaderboard with sorting and date filtering
            </p>
          </div>
          <Link href="/leaderboard" prefetch={true}>
            <Button size="lg" className="gap-2">
              Open Leaderboard
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
