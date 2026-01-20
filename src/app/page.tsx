import { Suspense } from 'react';
import Link from 'next/link';
import { SummaryStats } from '@/components/summary-stats';
import { DashboardCharts } from '@/components/dashboard-charts';
import { SummaryStatsSkeleton } from '@/components/summary-stats-skeleton';
import { DashboardChartsSkeleton } from '@/components/dashboard-charts-skeleton';
import { Button } from '@/components/ui/button';
import { fetchLeaderboardData } from '@/lib/actions';
import { calculateDateRange } from '@/lib/date-range-presets';
import { ArrowRightIcon } from 'lucide-react';

// Async server component for summary stats
async function SummaryStatsAsync() {
  const dateRange = calculateDateRange('30days');
  const data = await fetchLeaderboardData(dateRange.startDate, dateRange.endDate);
  return <SummaryStats data={data} />;
}

// Async server component for dashboard charts
async function DashboardChartsAsync() {
  const dateRange = calculateDateRange('30days');
  const data = await fetchLeaderboardData(dateRange.startDate, dateRange.endDate);
  return <DashboardCharts data={data} />;
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header - shows immediately */}
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

      {/* Summary Stats Section - streams in independently */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Team Overview</h2>
        <Suspense fallback={<SummaryStatsSkeleton />}>
          <SummaryStatsAsync />
        </Suspense>
      </section>

      {/* Charts Section - streams in independently */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Analytics</h2>
        <Suspense fallback={<DashboardChartsSkeleton />}>
          <DashboardChartsAsync />
        </Suspense>
      </section>

      {/* Quick Actions - shows immediately */}
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
