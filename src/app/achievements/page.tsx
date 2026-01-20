import { Suspense } from 'react';
import Link from 'next/link';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb, userAchievements, teamAchievements, userStats, teamStats, syncMetadata } from '@/db';
import { AchievementGrid, AchievementGridSkeleton } from '@/components/achievement-grid';
import { AchievementSectionBadge } from '@/components/achievement-section-badge';
import { RefreshButton } from './refresh-button';
import { NotInPlanBanner } from '@/components/not-in-plan-banner';
import { SignInPrompt } from './sign-in-prompt';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, TrophyIcon, ClockIcon, UsersIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth-server';
import { INDIVIDUAL_ACHIEVEMENTS } from '@/lib/achievements';
import { getSyncMetadata } from '@/lib/sync-metadata-kv';
import { eq } from 'drizzle-orm';

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
              <LastSyncInfo />
            </Suspense>
            <RefreshButton />
          </div>
        </div>

        {/* Team Achievements Section - Always visible */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <UsersIcon className="size-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Team Achievements</h2>
              </div>
              <AchievementSectionBadge accessLevel="public" />
            </div>
          </div>
          <Suspense fallback={<AchievementGridSkeleton />}>
            <TeamAchievementsContent />
          </Suspense>
        </section>

        {/* Personal Achievements Section - Requires authentication */}
        <section className="space-y-4 pt-4 border-t">
          <Suspense fallback={<AchievementGridSkeleton />}>
            <PersonalAchievementsContent />
          </Suspense>
        </section>
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
      <div className="space-y-4">
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
      </div>
    );
  }

  // User is authenticated - show their achievements
  const currentUserStats = userStatsData.find((u) => u.email === userEmail);
  const userNotInPlan = !currentUserStats;
  const filteredUserAchievements = userAchievementsData.filter((a) => a.userEmail === userEmail);

  return (
    <div className="space-y-4">
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
    </div>
  );
}

async function LastSyncInfo() {
  const { env } = await getCloudflareContext();
  const kv = env.SYNC_KV;
  const db = createDb(env.DB);

  // Try to get sync metadata from KV first, fallback to D1
  let lastSyncAt: Date | null = null;
  
  if (kv) {
    const kvMeta = await getSyncMetadata(kv);
    if (kvMeta?.lastSyncAt) {
      lastSyncAt = new Date(kvMeta.lastSyncAt);
    }
  }
  
  // Fallback to D1 if KV didn't have data
  if (!lastSyncAt) {
    const meta = await db.select().from(syncMetadata).where(eq(syncMetadata.id, 'sync')).limit(1);
    const syncData = meta.length > 0 ? meta[0] : null;
    lastSyncAt = syncData?.lastSyncAt ?? null;
  }

  if (!lastSyncAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ClockIcon className="size-4" />
        <span>Never synced</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <ClockIcon className="size-4" />
      <span>Last sync: {format(lastSyncAt, 'MMM d, HH:mm')}</span>
    </div>
  );
}
