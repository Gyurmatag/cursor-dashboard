'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AiUsageLeaderboard } from '@/components/ai-usage-leaderboard';
import { DateRangeFilter } from '@/components/date-range-filter';
import { DateRangeDisplay } from '@/components/date-range-display';
import { LeaderboardTableSkeleton } from '@/components/leaderboard-skeleton';
import { DataError } from '@/components/data-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { fetchLeaderboardData, getTeams } from '@/lib/actions';
import { calculateDateRange } from '@/lib/date-range-presets';
import { ArrowLeftIcon, UsersIcon } from 'lucide-react';
import type { DateRange, LeaderboardEntry } from '@/types/cursor';
import type { TeamOption } from '@/lib/actions';

export default function LeaderboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    calculateDateRange('30days')
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

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

  const handleRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const filteredEntries = useMemo(() => {
    if (!leaderboardData) return null;
    if (!selectedTeamId) return leaderboardData;
    return leaderboardData.filter((e) => e.teamId === selectedTeamId);
  }, [leaderboardData, selectedTeamId]);

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="space-y-4 sm:space-y-6">
        {/* Breadcrumb / Back Navigation */}
        <div>
          <Link href="/" prefetch={true}>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Usage Leaderboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Team members ranked by their AI activity score across all Cursor features
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Score calculation: Accepted Lines (2pts) + Tab Accepts (1pt) + Chat/Composer/Agent Requests (3pts each)
            </p>
          </div>
          <div className="w-full lg:w-[400px]">
            <DateRangeFilter
              onRangeChange={handleRangeChange}
              defaultPreset="30days"
            />
          </div>
        </div>

        {/* Team filter - highlighted */}
        <Card className="border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UsersIcon className="size-4" />
              Filter by team
            </Label>
          </CardHeader>
          <CardContent className="pt-0">
            <Select
              value={selectedTeamId ?? '__all__'}
              onValueChange={(v) => setSelectedTeamId(v === '__all__' ? null : v)}
            >
              <SelectTrigger className="w-full max-w-xs font-medium bg-background border-primary/30">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date Range Display */}
        <DateRangeDisplay dateRange={dateRange} />

        {/* Leaderboard Table */}
        {loading ? (
          <LeaderboardTableSkeleton />
        ) : error ? (
          <DataError error={error} title="Error loading leaderboard" />
        ) : filteredEntries ? (
          <AiUsageLeaderboard entries={filteredEntries} />
        ) : null}
      </div>
    </div>
  );
}
