'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaderboardEntry } from '@/types/cursor';

interface DashboardChartsProps {
  data: LeaderboardEntry[];
}

// Chart configurations - hoisted outside component
const activityChartConfig: ChartConfig = {
  chat: {
    label: 'Chat',
    color: 'hsl(var(--chart-1))',
  },
  composer: {
    label: 'Composer',
    color: 'hsl(var(--chart-2))',
  },
  agent: {
    label: 'Agent',
    color: 'hsl(var(--chart-3))',
  },
  tabs: {
    label: 'Tab Accepts',
    color: 'hsl(var(--chart-4))',
  },
};

const modelChartConfig: ChartConfig = {
  usage: {
    label: 'Usage',
    color: 'hsl(var(--chart-1))',
  },
};

// Pie chart colors
const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Top performers chart config - hoisted outside component
const topPerformersConfig: ChartConfig = {
  score: {
    label: 'Activity Score',
    color: 'hsl(var(--chart-1))',
  },
};

// Activity breakdown bar chart
const ActivityBreakdownChart = React.memo(function ActivityBreakdownChart({
  data,
}: {
  data: LeaderboardEntry[];
}) {
  const chartData = useMemo(() => {
    // Aggregate totals
    let totalChat = 0;
    let totalComposer = 0;
    let totalAgent = 0;
    let totalTabs = 0;

    for (const entry of data) {
      totalChat += entry.chatRequests;
      totalComposer += entry.composerRequests;
      totalAgent += entry.agentRequests;
      totalTabs += entry.totalTabsAccepted;
    }

    return [
      { name: 'Chat', value: totalChat, fill: 'var(--color-chat)' },
      { name: 'Composer', value: totalComposer, fill: 'var(--color-composer)' },
      { name: 'Agent', value: totalAgent, fill: 'var(--color-agent)' },
      { name: 'Tab Accepts', value: totalTabs, fill: 'var(--color-tabs)' },
    ];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Breakdown</CardTitle>
        <CardDescription>Total requests by type across all team members</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
            <YAxis type="category" dataKey="name" width={80} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

// Model usage pie chart
const ModelUsageChart = React.memo(function ModelUsageChart({
  data,
}: {
  data: LeaderboardEntry[];
}) {
  const chartData = useMemo(() => {
    // Count model usage
    const modelCounts = new Map<string, number>();

    for (const entry of data) {
      if (entry.mostUsedModel && entry.mostUsedModel !== 'N/A') {
        modelCounts.set(
          entry.mostUsedModel,
          (modelCounts.get(entry.mostUsedModel) || 0) + 1
        );
      }
    }

    // Convert to array and sort by count
    return Array.from(modelCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 models
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Usage</CardTitle>
        <CardDescription>Most frequently used AI models by team</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={modelChartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={2}
              label={({ name, percent }) => 
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PIE_COLORS[index % PIE_COLORS.length]} 
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

// Top performers bar chart
const TopPerformersChart = React.memo(function TopPerformersChart({
  data,
}: {
  data: LeaderboardEntry[];
}) {
  const chartData = useMemo(() => {
    // Get top 8 performers
    return data
      .slice(0, 8)
      .map((entry) => ({
        name: entry.name.split(' ')[0], // First name only for space
        score: entry.totalActivityScore,
        fill: 'hsl(var(--chart-1))',
      }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>Team members with highest activity scores</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topPerformersConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tickFormatter={(value) => value.toLocaleString()} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

// Main dashboard charts component
export const DashboardCharts = React.memo(function DashboardCharts({
  data,
}: DashboardChartsProps) {
  // Early return with ternary
  return data && data.length > 0 ? (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ActivityBreakdownChart data={data} />
      <ModelUsageChart data={data} />
      <TopPerformersChart data={data} />
    </div>
  ) : (
    <div className="text-center py-8 text-muted-foreground">
      No chart data available
    </div>
  );
});
