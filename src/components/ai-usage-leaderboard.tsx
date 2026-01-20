'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, TrophyIcon, HelpCircleIcon } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardSortKey, SortDirection } from '@/types/cursor';

type SortKey = LeaderboardSortKey;

interface AiUsageLeaderboardProps {
  entries: LeaderboardEntry[];
}

// Hoist static components outside to avoid recreation on every render
const SortIcon = ({ columnKey, sortKey, sortDirection }: { 
  columnKey: SortKey; 
  sortKey: SortKey; 
  sortDirection: SortDirection;
}) => {
  if (sortKey !== columnKey) return null;
  return sortDirection === 'asc' ? (
    <ArrowUpIcon className="inline size-4 ml-1" />
  ) : (
    <ArrowDownIcon className="inline size-4 ml-1" />
  );
};

const TooltipHeader = ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => (
  <div className="flex items-center gap-1">
    {children}
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircleIcon className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

// Hoist badge rendering function to avoid recreation
const getRankBadge = (rank: number) => {
  if (rank === 1) {
    return (
      <Badge 
        variant="default" 
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-1.5"
      >
        <TrophyIcon className="size-3.5" />
        {rank}
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold shadow-sm gap-1.5"
      >
        <TrophyIcon className="size-3.5" />
        {rank}
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-accent hover:bg-accent/80 text-accent-foreground font-semibold shadow-sm gap-1.5"
      >
        <TrophyIcon className="size-3.5" />
        {rank}
      </Badge>
    );
  }
  return <span className="text-muted-foreground font-mono text-sm">{rank}</span>;
};

export function AiUsageLeaderboard({ entries }: AiUsageLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalActivityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [entries, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 rounded-md border">
        <p className="text-muted-foreground">No usage data found for the selected time period</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">
                <TooltipHeader tooltip="User ranking based on total activity score">
                  Rank
                </TooltipHeader>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors min-w-[180px]"
                onClick={() => handleSort('name')}
              >
                User <SortIcon columnKey="name" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('totalActivityScore')}
              >
                <TooltipHeader tooltip="Weighted score: Accepted Lines (2pts) + Tab Accepts (1pt) + Chat/Composer/Agent (3pts each)">
                  Activity Score
                </TooltipHeader>
                <SortIcon columnKey="totalActivityScore" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('acceptedLinesAdded')}
              >
                <TooltipHeader tooltip="Total lines of AI-generated code that were accepted and kept">
                  Accepted Lines
                </TooltipHeader>
                <SortIcon columnKey="acceptedLinesAdded" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('chatRequests')}
              >
                <TooltipHeader tooltip="Number of chat requests made to Cursor AI">
                  Chat
                </TooltipHeader>
                <SortIcon columnKey="chatRequests" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('composerRequests')}
              >
                <TooltipHeader tooltip="Number of composer mode requests for multi-file edits">
                  Composer
                </TooltipHeader>
                <SortIcon columnKey="composerRequests" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('agentRequests')}
              >
                <TooltipHeader tooltip="Number of agent mode requests for autonomous tasks">
                  Agent
                </TooltipHeader>
                <SortIcon columnKey="agentRequests" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('totalTabsAccepted')}
              >
                <TooltipHeader tooltip="Number of tab completions accepted while typing">
                  Tab Accepts
                </TooltipHeader>
                <SortIcon columnKey="totalTabsAccepted" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('acceptanceRate')}
              >
                <TooltipHeader tooltip="Percentage of AI suggestions that were accepted vs rejected">
                  Accept Rate
                </TooltipHeader>
                <SortIcon columnKey="acceptanceRate" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors text-right"
                onClick={() => handleSort('activeDaysCount')}
              >
                <TooltipHeader tooltip="Number of days with recorded AI usage activity">
                  Active Days
                </TooltipHeader>
                <SortIcon columnKey="activeDaysCount" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors min-w-[140px]"
                onClick={() => handleSort('mostUsedModel')}
              >
                <TooltipHeader tooltip="AI model used most frequently by this user">
                  Most Used Model
                </TooltipHeader>
                <SortIcon columnKey="mostUsedModel" sortKey={sortKey} sortDirection={sortDirection} />
              </TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {sortedEntries.map((entry, index) => {
            const rank = index + 1;
            return (
              <TableRow key={entry.email}>
                <TableCell className="font-medium">
                  {getRankBadge(rank)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.email}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono font-semibold">
                  {formatNumber(entry.totalActivityScore)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono">
                  {formatNumber(entry.acceptedLinesAdded)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono">
                  {formatNumber(entry.chatRequests)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono">
                  {formatNumber(entry.composerRequests)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono">
                  {formatNumber(entry.agentRequests)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono">
                  {formatNumber(entry.totalTabsAccepted)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right font-mono">
                  {entry.acceptanceRate.toFixed(1)}%
                </TableCell>
                <TableCell className="hidden md:table-cell text-right font-mono">
                  {entry.activeDaysCount}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="font-mono text-xs">
                    {entry.mostUsedModel}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
