'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUpIcon, 
  CodeIcon, 
  MessageSquareIcon, 
  PencilIcon,
  BotIcon,
  CheckCircleIcon,
  TrophyIcon,
  UsersIcon
} from 'lucide-react';
import type { LeaderboardEntry } from '@/types/cursor';

interface SummaryStatsProps {
  data: LeaderboardEntry[];
}

// Hoist static icon mapping outside component
const statIcons = {
  score: TrendingUpIcon,
  lines: CodeIcon,
  chat: MessageSquareIcon,
  composer: PencilIcon,
  agent: BotIcon,
  tabs: CheckCircleIcon,
  topUser: TrophyIcon,
  activeUsers: UsersIcon,
} as const;

// Hoist static card classes
const cardClasses = "transition-all hover:shadow-md";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: keyof typeof statIcons;
  highlight?: boolean;
}

// Memoized stat card component
const StatCard = React.memo(function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  highlight = false
}: StatCardProps) {
  const Icon = statIcons[icon];
  
  return (
    <Card className={`${cardClasses} ${highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`size-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description ? (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
});

export const SummaryStats = React.memo(function SummaryStats({ 
  data 
}: SummaryStatsProps) {
  // useMemo for derived calculations - compute all totals in one pass
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    let totalScore = 0;
    let totalLines = 0;
    let totalChat = 0;
    let totalComposer = 0;
    let totalAgent = 0;
    let totalTabs = 0;
    let topUser = data[0];

    for (const entry of data) {
      totalScore += entry.totalActivityScore;
      totalLines += entry.acceptedLinesAdded;
      totalChat += entry.chatRequests;
      totalComposer += entry.composerRequests;
      totalAgent += entry.agentRequests;
      totalTabs += entry.totalTabsAccepted;
      
      if (entry.totalActivityScore > topUser.totalActivityScore) {
        topUser = entry;
      }
    }

    return {
      totalScore,
      totalLines,
      totalChat,
      totalComposer,
      totalAgent,
      totalTabs,
      totalRequests: totalChat + totalComposer + totalAgent,
      topUser,
      activeUsers: data.length,
    };
  }, [data]);

  // Use ternary for conditional rendering (not &&)
  return stats ? (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Activity Score"
        value={stats.totalScore.toLocaleString()}
        description="Combined team score"
        icon="score"
        highlight
      />
      <StatCard
        title="Accepted Lines"
        value={stats.totalLines.toLocaleString()}
        description="AI-generated code kept"
        icon="lines"
      />
      <StatCard
        title="Total Requests"
        value={stats.totalRequests.toLocaleString()}
        description={`Chat: ${stats.totalChat.toLocaleString()} | Composer: ${stats.totalComposer.toLocaleString()} | Agent: ${stats.totalAgent.toLocaleString()}`}
        icon="chat"
      />
      <StatCard
        title="Tab Accepts"
        value={stats.totalTabs.toLocaleString()}
        description="Inline completions accepted"
        icon="tabs"
      />
      <StatCard
        title="Top Performer"
        value={stats.topUser.name}
        description={`Score: ${stats.topUser.totalActivityScore.toLocaleString()}`}
        icon="topUser"
        highlight
      />
      <StatCard
        title="Active Users"
        value={stats.activeUsers}
        description="Team members with activity"
        icon="activeUsers"
      />
      <StatCard
        title="Chat Requests"
        value={stats.totalChat.toLocaleString()}
        description="AI chat interactions"
        icon="chat"
      />
      <StatCard
        title="Agent Requests"
        value={stats.totalAgent.toLocaleString()}
        description="Autonomous task requests"
        icon="agent"
      />
    </div>
  ) : (
    <div className="text-center py-8 text-muted-foreground">
      No data available
    </div>
  );
});
