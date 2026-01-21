'use client';

import React, { useMemo } from 'react';
import { usePrivacy } from '@/components/privacy-provider';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
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
import { formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types/cursor';

interface DashboardChartsProps {
  data: LeaderboardEntry[];
}

// Chart configurations - direct hex values for SVG compatibility
const activityChartConfig: ChartConfig = {
  chat: {
    label: 'Chat',
    color: '#f87171',
  },
  composer: {
    label: 'Composer',
    color: '#fb923c',
  },
  agent: {
    label: 'Agent',
    color: '#4ade80',
  },
  tabs: {
    label: 'Tab Accepts',
    color: '#60a5fa',
  },
};

const modelChartConfig: ChartConfig = {
  usage: {
    label: 'Usage',
    color: '#f87171',
  },
};

// Pie chart colors - direct hex values for SVG compatibility
const PIE_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#4ade80', // green
  '#60a5fa', // blue
  '#c084fc', // purple
];

// Top performers chart config - direct hex for SVG compatibility
const topPerformersConfig: ChartConfig = {
  score: {
    label: 'Activity Score',
    color: '#f87171',
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
      { name: 'Chat', value: totalChat, fill: '#f87171' },
      { name: 'Composer', value: totalComposer, fill: '#fb923c' },
      { name: 'Agent', value: totalAgent, fill: '#4ade80' },
      { name: 'Tab Accepts', value: totalTabs, fill: '#60a5fa' },
    ];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Breakdown</CardTitle>
        <CardDescription>Total requests by type across all team members</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activityChartConfig} className="h-[250px] sm:h-[300px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              horizontal={true} 
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              type="number" 
              tickFormatter={(value) => formatNumber(value)}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} />
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
        <ChartContainer config={modelChartConfig} className="h-[250px] sm:h-[300px] w-full">
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
              paddingAngle={3}
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
  const { isBlurred } = usePrivacy();
  
  const chartData = useMemo(() => {
    // Get top 8 performers
    return data
      .slice(0, 8)
      .map((entry, index) => ({
        name: isBlurred ? `User ${index + 1}` : entry.name.split(' ')[0], // First name only for space, or anonymized
        score: entry.totalActivityScore,
        fill: '#f87171',
      }));
  }, [data, isBlurred]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>Team members with highest activity scores</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topPerformersConfig} className="h-[250px] sm:h-[300px] w-full">
          <BarChart data={chartData} margin={{ bottom: 20 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              tickFormatter={(value) => formatNumber(value)}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="score" 
              radius={[8, 8, 0, 0]} 
              fill="#f87171"
            />
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
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
