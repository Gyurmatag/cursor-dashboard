import { Suspense } from 'react';
import Link from 'next/link';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb, userAchievements, teamAchievements, userStats, teamStats, syncMetadata } from '@/db';
import { AchievementGrid, AchievementGridSkeleton } from '@/components/achievement-grid';
import { RefreshButton } from './refresh-button';
import { NotInPlanBanner } from '@/components/not-in-plan-banner';
import { SignInPrompt } from './sign-in-prompt';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, TrophyIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth-server';

// Force dynamic rendering since we need to access D1 database
export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
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
              Track your Cursor AI mastery and unlock achievements by using different features
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />}>
              <LastSyncInfo />
            </Suspense>
            <RefreshButton />
          </div>
        </div>

        {/* Achievement Grid */}
        <Suspense fallback={<AchievementGridSkeleton />}>
          <AchievementsContent />
        </Suspense>
      </div>
    </div>
  );
}

async function AchievementsContent() {
  // Start session fetch immediately (async-parallel best practice)
  const sessionPromise = getSession();
  
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  // Fetch all data in parallel including session
  const [session, userAchievementsData, teamAchievementsData, userStatsData, teamStatsData] = await Promise.all([
    sessionPromise,
    db.select().from(userAchievements),
    db.select().from(teamAchievements),
    db.select().from(userStats),
    db.select().from(teamStats),
  ]);

  // Get logged-in user's email
  const userEmail = session?.user?.email;
  
  // Check if user is authenticated
  if (!userEmail) {
    return <SignInPrompt />;
  }

  // Check if user exists in Cursor Business plan data
  const currentUserStats = userStatsData.find((u) => u.email === userEmail);
  const userNotInPlan = !currentUserStats;

  // Filter achievements for the logged-in user
  const filteredUserAchievements = userAchievementsData.filter((a) => a.userEmail === userEmail);

  // Get first team stats or null
  const firstTeamStats = teamStatsData.length > 0 ? teamStatsData[0] : null;

  return (
    <>
      {/* Show banner if user is not in Cursor Business plan */}
      {userNotInPlan && <NotInPlanBanner />}
      
      <AchievementGrid
        userAchievements={filteredUserAchievements}
        teamAchievements={teamAchievementsData}
        userStats={currentUserStats ?? null}
        teamStats={firstTeamStats}
        selectedUser={userEmail}
      />
    </>
  );
}

async function LastSyncInfo() {
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  const meta = await db.select().from(syncMetadata).limit(1);
  const syncData = meta.length > 0 ? meta[0] : null;

  if (!syncData?.lastSyncAt) {
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
      <span>Last sync: {format(syncData.lastSyncAt, 'MMM d, HH:mm')}</span>
    </div>
  );
}
