import { Suspense } from 'react';
import Link from 'next/link';
import { SummaryStats } from '@/components/summary-stats';
import { DashboardCharts } from '@/components/dashboard-charts';
import { SummaryStatsSkeleton } from '@/components/summary-stats-skeleton';
import { DashboardChartsSkeleton } from '@/components/dashboard-charts-skeleton';
import { Button } from '@/components/ui/button';
import { fetchLeaderboardData } from '@/lib/actions';
import { ArrowRightIcon, MessageSquareIcon } from 'lucide-react';

// Calculate date range once at module level
// Use ALL TIME data from account inception (June 16, 2025)
// Smart fetching handles this: Database query for complete history
const ACCOUNT_INCEPTION = new Date('2025-06-16T00:00:00Z').getTime();
const DASHBOARD_DATE_RANGE = {
  startDate: ACCOUNT_INCEPTION,
  endDate: Date.now(),
  label: 'All Time (Since Inception)',
};

// Async server component for summary stats
// Uses React.cache() internally via fetchLeaderboardData
async function SummaryStatsAsync() {
  const data = await fetchLeaderboardData(DASHBOARD_DATE_RANGE.startDate, DASHBOARD_DATE_RANGE.endDate);
  return <SummaryStats data={data} />;
}

// Async server component for dashboard charts
// Uses React.cache() internally via fetchLeaderboardData
async function DashboardChartsAsync() {
  const data = await fetchLeaderboardData(DASHBOARD_DATE_RANGE.startDate, DASHBOARD_DATE_RANGE.endDate);
  return <DashboardCharts data={data} />;
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 space-y-6 sm:space-y-8">
      {/* Header - shows immediately */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Complete AI activity history</p>
        </div>
        <Link href="/leaderboard" prefetch={true}>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
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

      {/* Pulze Chat Section */}
      <section className="py-6 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Ask Pulze AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Get instant insights about your team&apos;s AI usage with our intelligent chatbot
            </p>
          </div>
          <Link href="/chat" prefetch={true}>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <MessageSquareIcon className="size-4" />
              Open Chat
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
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
