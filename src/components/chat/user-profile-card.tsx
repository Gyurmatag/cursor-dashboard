import React from 'react';
import { PrivacyBlur } from '@/components/privacy-blur';
import { Card } from '@/components/ui/card';
import { UserIcon, TrendingUpIcon, CodeIcon, MessageSquareIcon, SparklesIcon, ZapIcon } from 'lucide-react';
import type { UserProfileResult } from '@/types/chat';

interface UserProfileCardProps {
  data: UserProfileResult;
}

export const UserProfileCard = React.memo(({ data }: UserProfileCardProps) => {
  const { user, stats, achievements, recentActivity } = data;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">
              <PrivacyBlur>{user.name}</PrivacyBlur>
            </h3>
            <p className="text-sm text-muted-foreground">
              <PrivacyBlur>{user.email}</PrivacyBlur>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <TrendingUpIcon className="w-4 h-4" />
          Performance Metrics
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ZapIcon className="w-4 h-4" />
              Activity Score
            </div>
            <div className="text-2xl font-bold">{stats.totalActivityScore.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CodeIcon className="w-4 h-4" />
              Lines Added
            </div>
            <div className="text-2xl font-bold">{stats.acceptedLinesAdded.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SparklesIcon className="w-4 h-4" />
              Agent Requests
            </div>
            <div className="text-2xl font-bold">{stats.agentRequests.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareIcon className="w-4 h-4" />
              Chat Requests
            </div>
            <div className="text-2xl font-bold">{stats.chatRequests.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Composer</div>
            <div className="text-2xl font-bold">{stats.composerRequests.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Active Days</div>
            <div className="text-2xl font-bold">{stats.activeDaysCount}</div>
          </div>
        </div>

        {/* Most Used Model */}
        {stats.mostUsedModel && (
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <div className="text-sm text-muted-foreground mb-1">Most Used Model</div>
            <div className="font-medium">{stats.mostUsedModel}</div>
          </div>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20"
                >
                  {item.achievement.icon} {item.achievement.name}
                </div>
              ))}
              {achievements.length > 6 && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{achievements.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity Summary */}
        {recentActivity && recentActivity.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Active in the last 7 days with {recentActivity.length} activity{recentActivity.length !== 1 ? ' records' : ' record'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

UserProfileCard.displayName = 'UserProfileCard';
