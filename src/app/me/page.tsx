import { Suspense } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth-server';
import { fetchUserProfile } from '@/lib/actions';
import { ProfileHeader } from '@/components/profile-header';
import { ProfileStatsSummary } from '@/components/profile-stats-summary';
import { ProfileActivityChart } from '@/components/profile-activity-chart';
import { ProfileAchievementsSummary } from '@/components/profile-achievements-summary';
import { ProfileDetailedMetrics } from '@/components/profile-detailed-metrics';
import { ProfileSkeleton } from '@/components/profile-skeleton';
import { NotInPlanBanner } from '@/components/not-in-plan-banner';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { SignInPrompt } from './sign-in-prompt';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getSession();

  // Check if user is authenticated
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/" prefetch={true}>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeftIcon className="size-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <SignInPrompt />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div>
        <Link href="/" prefetch={true}>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeftIcon className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Header - Always visible */}
      <ProfileHeader user={session.user} />

      {/* Profile Content - Streams in */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent userEmail={session.user.email} />
      </Suspense>
    </div>
  );
}

/**
 * Server component that fetches and displays profile data
 */
async function ProfileContent({ userEmail }: { userEmail: string }) {
  const profileData = await fetchUserProfile(userEmail);

  // Check if user is in the Business plan
  const userNotInPlan = !profileData.userStats;

  return (
    <div className="space-y-6">
      {/* Show banner if user is not in Cursor Business plan */}
      {userNotInPlan && <NotInPlanBanner />}

      {/* Summary Stats Grid */}
      <ProfileStatsSummary
        userStats={profileData.userStats}
        leaderboardEntry={profileData.leaderboardEntry}
        achievementsCount={profileData.userAchievements.length}
        userRank={profileData.userRank}
        totalUsers={profileData.totalUsers}
      />

      {/* Activity Chart */}
      <ProfileActivityChart dailySnapshots={profileData.dailySnapshots} />

      {/* Achievements Summary */}
      <ProfileAchievementsSummary userAchievements={profileData.userAchievements} />

      {/* Detailed Metrics */}
      <ProfileDetailedMetrics
        userStats={profileData.userStats}
        leaderboardEntry={profileData.leaderboardEntry}
      />
    </div>
  );
}
