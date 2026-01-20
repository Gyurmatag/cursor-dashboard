import { Suspense } from 'react';
import Link from 'next/link';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb, userAchievements, teamAchievements, userStats, teamStats, syncMetadata } from '@/db';
import { AchievementGrid } from '@/components/achievement-grid';
import { AchievementSectionBadge } from '@/components/achievement-section-badge';
import { NotInPlanBanner } from '@/components/not-in-plan-banner';
import { SignInPrompt } from './sign-in-prompt';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, TrophyIcon, UserIcon } from 'lucide-react';
import { getSession } from '@/lib/auth-server';
import { INDIVIDUAL_ACHIEVEMENTS } from '@/lib/achievements';
import { getSyncMetadata } from '@/lib/sync-metadata-kv';
import { eq } from 'drizzle-orm';
import { AchievementsTabs } from './achievements-tabs';
import { LastSyncInfo } from '@/components/last-sync-info';

// Force dynamic rendering since we need to access D1 database
export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Breadcrumb / Back Navigation */}
        <div>
          <Link href="/" prefetch={true}>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeftIcon className="size-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <TrophyIcon className="size-8 text-yellow-500" />
              <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Track team progress and your personal Cursor AI mastery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Suspense fallback={<Skeleton className="h-10 w-32 rounded-lg" />}>
              <LastSyncInfoServer />
            </Suspense>
          </div>
        </div>

        {/* Achievements Tabs */}
        <AchievementsTabs
          teamContent={<TeamAchievementsContent />}
          personalContent={<PersonalAchievementsContent />}
        />
      </div>
    </div>
  );
}

// Team achievements - always visible, no auth required
async function TeamAchievementsContent() {
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  // Fetch only team data (parallel-fetching best practice)
  const [teamAchievementsData, teamStatsData] = await Promise.all([
    db.select().from(teamAchievements),
    db.select().from(teamStats),
  ]);

  const firstTeamStats = teamStatsData.length > 0 ? teamStatsData[0] : null;

  return (
    <AchievementGrid
      type="team"
      teamAchievements={teamAchievementsData}
      teamStats={firstTeamStats}
    />
  );
}

// Personal achievements - requires authentication
async function PersonalAchievementsContent() {
  // Start session fetch immediately (async-parallel best practice)
  const sessionPromise = getSession();
  
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  // Fetch user data in parallel with session
  const [session, userAchievementsData, userStatsData] = await Promise.all([
    sessionPromise,
    db.select().from(userAchievements),
    db.select().from(userStats),
  ]);

  // Get logged-in user's email
  const userEmail = session?.user?.email;
  
  // Show sign-in prompt if not authenticated
  if (!userEmail) {
    return (
      <>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <UserIcon className="size-6 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Personal Achievements</h2>
            </div>
            <AchievementSectionBadge accessLevel="private-locked" />
          </div>
        </div>
        <SignInPrompt variant="inline" achievementCount={INDIVIDUAL_ACHIEVEMENTS.length} />
      </>
    );
  }

  // User is authenticated - show their achievements
  const currentUserStats = userStatsData.find((u) => u.email === userEmail);
  const userNotInPlan = !currentUserStats;
  const filteredUserAchievements = userAchievementsData.filter((a) => a.userEmail === userEmail);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <UserIcon className="size-6 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Personal Achievements</h2>
          </div>
          <AchievementSectionBadge accessLevel="private-unlocked" />
        </div>
      </div>
      
      {/* Show banner if user is not in Cursor Business plan */}
      {userNotInPlan && <NotInPlanBanner />}
      
      <AchievementGrid
        type="individual"
        userAchievements={filteredUserAchievements}
        userStats={currentUserStats ?? null}
        selectedUser={userEmail}
      />
    </>
  );
}

async function LastSyncInfoServer() {
  const { env } = await getCloudflareContext();
  const kv = env.SYNC_KV;
  const db = createDb(env.DB);

  // Parallel fetching (React best practice - async-parallel)
  let lastSyncAt: Date | null = null;
  let dataCollectionStartDate: string | null = null;
  
  if (kv) {
    const kvMeta = await getSyncMetadata(kv);
    if (kvMeta?.lastSyncAt) {
      lastSyncAt = new Date(kvMeta.lastSyncAt);
    }
    dataCollectionStartDate = kvMeta?.dataCollectionStartDate ?? null;
  }
  
  // Fallback to D1 if KV didn't have data
  if (!lastSyncAt) {
    const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync')).limit(1);
    const syncData = meta.length > 0 ? meta[0] : null;
    lastSyncAt = syncData?.lastSyncAt ?? null;
  }

  // Calculate next sync time based on cron schedule: "0 * * * *" (minute 0 of every hour)
  // Cron runs in UTC, but we display it in user's local timezone (handled by client component)
  // Next sync is always at the top of the next hour (XX:00:00)
  const nextSyncTime = (() => {
    const now = new Date();
    const next = new Date(now);
    
    // Set to top of current hour
    next.setMinutes(0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    
    // If we're past minute 0 of current hour, move to next hour
    if (next <= now) {
      next.setHours(next.getHours() + 1);
    }
    
    return next;
  })();

  // Pass ISO string dates to client component for timezone-aware formatting
  return (
    <LastSyncInfo
      lastSyncAt={lastSyncAt?.toISOString() ?? null}
      nextSyncTime={nextSyncTime?.toISOString() ?? null}
      dataCollectionStartDate={dataCollectionStartDate}
    />
  );
}
