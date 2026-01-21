'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import type { DailySnapshot } from '@/db/schema';

interface ProfileActivityChartProps {
  dailySnapshots: DailySnapshot[];
}

type MetricKey = 'linesAdded' | 'chatRequests' | 'composerRequests' | 'agentRequests';

// Hoist static config to module level (best practice: avoid recreation on render)
const chartConfig: ChartConfig = {
  linesAdded: {
    label: 'Lines Added',
    color: 'hsl(200, 100%, 50%)', // Vibrant cyan blue
  },
  chatRequests: {
    label: 'Chat Requests',
    color: 'hsl(280, 100%, 60%)', // Vibrant purple/magenta
  },
  composerRequests: {
    label: 'Composer Requests',
    color: 'hsl(25, 100%, 55%)', // Vibrant orange/coral
  },
  agentRequests: {
    label: 'Agent Requests',
    color: 'hsl(140, 85%, 45%)', // Vivid green
  },
};

// Hoist metrics array to module level (best practice: avoid recreation on render)
const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'linesAdded', label: 'Lines Added' },
  { key: 'chatRequests', label: 'Chat' },
  { key: 'composerRequests', label: 'Composer' },
  { key: 'agentRequests', label: 'Agent' },
];

/**
 * Activity chart component showing user's daily activity over time
 * Allows toggling between different metrics
 */
export function ProfileActivityChart({ dailySnapshots }: ProfileActivityChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('linesAdded');

  // Memoize chart data transformation (best practice: avoid array operations on every render)
  const chartData = useMemo(() => {
    return dailySnapshots
      .slice()
      .reverse()
      .map((snapshot) => ({
        date: snapshot.date,
        linesAdded: snapshot.linesAdded,
        chatRequests: snapshot.chatRequests,
        composerRequests: snapshot.composerRequests,
        agentRequests: snapshot.agentRequests,
      }));
  }, [dailySnapshots]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          <CardTitle>Activity Over Time</CardTitle>
          <CardDescription>Your daily activity (all time since inception)</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            {METRICS.map((metric) => (
              <Button
                key={metric.key}
                variant={selectedMetric === metric.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(metric.key)}
              >
                {metric.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig[selectedMetric].color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[selectedMetric].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={chartConfig[selectedMetric].color}
                fill="url(#colorMetric)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No activity data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
