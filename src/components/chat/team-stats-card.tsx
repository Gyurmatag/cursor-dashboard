import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { SparklesIcon } from 'lucide-react';
import type { TeamStatsResult } from '@/types/chat';

interface TeamStatsCardProps {
  data: TeamStatsResult;
}

/**
 * Team stats card component
 * Displays team statistics in a readable format
 */
export const TeamStatsCard = memo<TeamStatsCardProps>(({ data }) => {
  const { totals } = data;

  if (!totals) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <SparklesIcon className="w-4 h-4 text-primary" />
        <span>Team Statistics</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <StatItem 
            label="Total Lines Added" 
            value={totals.totalLinesAdded?.toLocaleString() || '0'} 
          />
          <StatItem 
            label="Active Members" 
            value={totals.activeMembers?.toString() || '0'} 
          />
          <StatItem 
            label="Chat Requests" 
            value={totals.totalChatRequests?.toLocaleString() || '0'} 
          />
          <StatItem 
            label="Composer Requests" 
            value={totals.totalComposerRequests?.toLocaleString() || '0'} 
          />
          <StatItem 
            label="Agent Requests" 
            value={totals.totalAgentRequests?.toLocaleString() || '0'} 
          />
          <StatItem 
            label="Tabs Accepted" 
            value={totals.totalTabsAccepted?.toLocaleString() || '0'} 
          />
        </div>
      </div>
    </Card>
  );
});

TeamStatsCard.displayName = 'TeamStatsCard';

/**
 * Individual stat item component
 */
const StatItem = memo<{ label: string; value: string }>(({ label, value }) => (
  <div>
    <span className="text-muted-foreground">{label}:</span>
    <span className="ml-2 font-medium">{value}</span>
  </div>
));

StatItem.displayName = 'StatItem';
