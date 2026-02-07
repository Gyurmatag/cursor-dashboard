import { eq } from 'drizzle-orm';
import type { Database } from '@/db';
import {
  userStats,
  userAchievements,
  teamAchievements,
  dailySnapshots,
  type UserStats,
  type TeamStats,
  type DailySnapshot,
} from '@/db/schema';
import {
  INDIVIDUAL_ACHIEVEMENTS,
  TEAM_ACHIEVEMENTS,
} from './achievements';

// ============================================================================
// Types
// ============================================================================

export interface ProcessedUserData {
  email: string;
  stats: Partial<UserStats>;
  newAchievements: string[];
}

export interface ProcessedTeamData {
  stats: Partial<TeamStats>;
  newAchievements: string[];
}

// ============================================================================
// User Stats Calculation
// ============================================================================

/**
 * Calculate user statistics from daily snapshots
 */
export async function calculateUserStats(
  db: Database,
  userEmail: string
): Promise<Partial<UserStats>> {
  // Get all daily snapshots for this user, ordered by date
  const snapshots = await db
    .select()
    .from(dailySnapshots)
    .where(eq(dailySnapshots.userEmail, userEmail))
    .orderBy(dailySnapshots.date);

  if (snapshots.length === 0) {
    return {
      email: userEmail,
      totalActiveDays: 0,
      maxConsecutiveDays: 0,
      currentStreak: 0,
      totalLinesAdded: 0,
      totalAgentRequests: 0,
      totalChatRequests: 0,
      totalComposerRequests: 0,
      totalTabAccepts: 0,
      bestSingleDayLines: 0,
      bestSingleDayAgent: 0,
    };
  }

  // Calculate totals
  let totalActiveDays = 0;
  let totalLinesAdded = 0;
  let totalAgentRequests = 0;
  let totalChatRequests = 0;
  let totalComposerRequests = 0;
  let totalTabAccepts = 0;
  let bestSingleDayLines = 0;
  let bestSingleDayAgent = 0;

  for (const snapshot of snapshots) {
    if (snapshot.isActive) {
      totalActiveDays++;
    }
    totalLinesAdded += snapshot.linesAdded;
    totalAgentRequests += snapshot.agentRequests;
    totalChatRequests += snapshot.chatRequests;
    totalComposerRequests += snapshot.composerRequests;
    totalTabAccepts += snapshot.tabAccepts;

    if (snapshot.linesAdded > bestSingleDayLines) {
      bestSingleDayLines = snapshot.linesAdded;
    }
    if (snapshot.agentRequests > bestSingleDayAgent) {
      bestSingleDayAgent = snapshot.agentRequests;
    }
  }

  // Calculate streak
  const { maxConsecutiveDays, currentStreak } = calculateStreak(snapshots);

  return {
    email: userEmail,
    totalActiveDays,
    maxConsecutiveDays,
    currentStreak,
    totalLinesAdded,
    totalAgentRequests,
    totalChatRequests,
    totalComposerRequests,
    totalTabAccepts,
    bestSingleDayLines,
    bestSingleDayAgent,
    updatedAt: new Date(),
  };
}

/**
 * Calculate streak from a list of active date strings (YYYY-MM-DD).
 * Exported for use in profile/fetch so /me page can show correct streaks
 * without relying on user_stats table.
 */
export function calculateStreakFromActiveDates(activeDateStrings: string[]): {
  maxConsecutiveDays: number;
  currentStreak: number;
} {
  if (activeDateStrings.length === 0) {
    return { maxConsecutiveDays: 0, currentStreak: 0 };
  }

  const activeDates = [...new Set(activeDateStrings)].sort().reverse();

  let maxConsecutive = 1;
  let currentConsecutive = 1;
  let currentStreak = 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const mostRecentActive = activeDates[0];

  // Streak is "current" if most recent active day is within last 3 days (handles timezone/sync)
  if (
    mostRecentActive === today ||
    mostRecentActive === yesterday ||
    mostRecentActive === twoDaysAgo
  ) {
    currentStreak = 1;
  }

  for (let i = 1; i < activeDates.length; i++) {
    const currentDate = new Date(activeDates[i - 1] + 'T12:00:00Z');
    const prevDate = new Date(activeDates[i] + 'T12:00:00Z');
    const diffDays = Math.round(
      (currentDate.getTime() - prevDate.getTime()) / 86400000
    );

    if (diffDays === 1) {
      currentConsecutive++;
      if (currentStreak > 0) currentStreak++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
      if (currentStreak > 0) currentStreak = 0;
    }
  }

  maxConsecutive = Math.max(maxConsecutive, currentConsecutive);

  return {
    maxConsecutiveDays: maxConsecutive,
    currentStreak: currentStreak > 0 ? currentStreak : 0,
  };
}

/**
 * Calculate streak information from snapshots
 */
function calculateStreak(snapshots: DailySnapshot[]): {
  maxConsecutiveDays: number;
  currentStreak: number;
} {
  const activeDates = snapshots
    .filter((s) => s.isActive)
    .map((s) => s.date);
  return calculateStreakFromActiveDates(activeDates);
}

// ============================================================================
// Team Stats Calculation
// ============================================================================

/**
 * Calculate team statistics from daily snapshots (source of truth)
 * 
 * Previously this aggregated from user_stats, but that table can be stale
 * when incremental syncs only update a subset of users. Computing directly
 * from daily_snapshots ensures accuracy.
 */
export async function calculateTeamStats(
  db: Database
): Promise<Partial<TeamStats>> {
  // Get all user stats (still needed for streaks and member count)
  const allUserStats = await db.select().from(userStats);

  // Compute totals directly from daily_snapshots (source of truth)
  const allSnapshots = await db.select().from(dailySnapshots);

  if (allSnapshots.length === 0 && allUserStats.length === 0) {
    return {
      id: 'team',
      totalMembers: 0,
      totalTeamLines: 0,
      totalTeamAgentRequests: 0,
      totalTeamChatRequests: 0,
      totalTeamComposerRequests: 0,
      totalTeamActiveDays: 0,
      membersWithStreaks: 0,
      bestTeamDayLines: 0,
    };
  }

  // Aggregate totals from daily_snapshots directly
  let totalTeamLines = 0;
  let totalTeamAgentRequests = 0;
  let totalTeamChatRequests = 0;
  let totalTeamComposerRequests = 0;
  const activeUserDays = new Set<string>(); // "email|date" pairs

  for (const snapshot of allSnapshots) {
    totalTeamLines += snapshot.linesAdded;
    totalTeamAgentRequests += snapshot.agentRequests;
    totalTeamChatRequests += snapshot.chatRequests;
    totalTeamComposerRequests += snapshot.composerRequests;

    if (snapshot.isActive) {
      activeUserDays.add(`${snapshot.userEmail}|${snapshot.date}`);
    }
  }

  // Count members with active streaks from user_stats (streak logic is complex)
  let membersWithStreaks = 0;
  for (const user of allUserStats) {
    if (user.currentStreak >= 7) {
      membersWithStreaks++;
    }
  }

  // Unique members from snapshots
  const uniqueMembers = new Set(allSnapshots.map(s => s.userEmail));

  // Calculate best team day from the same snapshot data
  const linesByDate = new Map<string, number>();
  for (const snapshot of allSnapshots) {
    const current = linesByDate.get(snapshot.date) || 0;
    linesByDate.set(snapshot.date, current + snapshot.linesAdded);
  }

  let bestTeamDayLines = 0;
  let bestTeamDayDate: string | null = null;
  for (const [date, lines] of linesByDate) {
    if (lines > bestTeamDayLines) {
      bestTeamDayLines = lines;
      bestTeamDayDate = date;
    }
  }

  return {
    id: 'team',
    totalMembers: Math.max(uniqueMembers.size, allUserStats.length),
    totalTeamLines,
    totalTeamAgentRequests,
    totalTeamChatRequests,
    totalTeamComposerRequests,
    totalTeamActiveDays: activeUserDays.size,
    membersWithStreaks,
    bestTeamDayLines,
    bestTeamDayDate,
    updatedAt: new Date(),
  };
}

// ============================================================================
// Achievement Checking
// ============================================================================

/**
 * Check and award individual achievements for a user
 */
export async function checkAndAwardUserAchievements(
  db: Database,
  userEmail: string,
  stats: UserStats
): Promise<string[]> {
  // Get existing achievements for this user
  const existingAchievements = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userEmail, userEmail));

  const existingIds = new Set(existingAchievements.map((a) => a.achievementId));
  const newAchievements: string[] = [];

  // Check each individual achievement
  for (const achievement of INDIVIDUAL_ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) {
      continue; // Already has this achievement
    }

    // Skip special achievements that need daily data
    if (achievement.id === 'all-rounder') {
      const hasAllRounder = await checkAllRounderAchievement(db, userEmail);
      if (hasAllRounder) {
        await db.insert(userAchievements).values({
          userEmail,
          achievementId: achievement.id,
          achievedAt: new Date(),
          progress: 100,
        });
        newAchievements.push(achievement.id);
      }
      continue;
    }

    // Check if achievement is earned
    if (achievement.checkFn(stats)) {
      await db.insert(userAchievements).values({
        userEmail,
        achievementId: achievement.id,
        achievedAt: new Date(),
        progress: 100,
      });
      newAchievements.push(achievement.id);
    }
  }

  return newAchievements;
}

/**
 * Check the All-Rounder achievement (uses all 3 features in one day)
 */
async function checkAllRounderAchievement(
  db: Database,
  userEmail: string
): Promise<boolean> {
  const snapshots = await db
    .select()
    .from(dailySnapshots)
    .where(eq(dailySnapshots.userEmail, userEmail));

  for (const snapshot of snapshots) {
    if (
      snapshot.chatRequests > 0 &&
      snapshot.composerRequests > 0 &&
      snapshot.agentRequests > 0
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check and award team achievements
 */
export async function checkAndAwardTeamAchievements(
  db: Database,
  stats: TeamStats
): Promise<string[]> {
  // Get existing team achievements
  const existingAchievements = await db.select().from(teamAchievements);
  const existingIds = new Set(existingAchievements.map((a) => a.achievementId));
  const newAchievements: string[] = [];

  // Check each team achievement
  for (const achievement of TEAM_ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) {
      continue; // Already has this achievement
    }

    let earned = false;

    // Handle special achievements
    if (achievement.id === 'full-squad') {
      earned = await checkFullSquadAchievement(db, stats.totalMembers);
    } else if (achievement.id === 'adoption-complete') {
      earned = await checkAdoptionCompleteAchievement(db, stats.totalMembers);
    } else {
      earned = achievement.checkFn(stats);
    }

    if (earned) {
      // Get contributing members (all team members)
      const allUsers = await db.select({ email: userStats.email }).from(userStats);
      const contributingMembers = allUsers.map((u) => u.email);

      await db.insert(teamAchievements).values({
        achievementId: achievement.id,
        achievedAt: new Date(),
        contributingMembers: JSON.stringify(contributingMembers),
      });
      newAchievements.push(achievement.id);
    }
  }

  return newAchievements;
}

/**
 * Check Full Squad achievement (all team members active in one day)
 */
async function checkFullSquadAchievement(
  db: Database,
  totalMembers: number
): Promise<boolean> {
  if (totalMembers === 0) return false;

  // Get all snapshots grouped by date
  const allSnapshots = await db.select().from(dailySnapshots);

  const activeUsersByDate = new Map<string, Set<string>>();
  for (const snapshot of allSnapshots) {
    if (snapshot.isActive) {
      const users = activeUsersByDate.get(snapshot.date) || new Set();
      users.add(snapshot.userEmail);
      activeUsersByDate.set(snapshot.date, users);
    }
  }

  // Check if any date has all members active
  for (const [, users] of activeUsersByDate) {
    if (users.size >= totalMembers) {
      return true;
    }
  }

  return false;
}

/**
 * Check Adoption Complete achievement (all members have First Steps)
 */
async function checkAdoptionCompleteAchievement(
  db: Database,
  totalMembers: number
): Promise<boolean> {
  if (totalMembers === 0) return false;

  // Count users with First Steps achievement
  const firstStepsCount = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.achievementId, 'first-steps'));

  return firstStepsCount.length >= totalMembers;
}

// ============================================================================
// Progress Calculation
// ============================================================================

/**
 * Get progress for all achievements for a user
 */
export function calculateUserAchievementProgress(
  stats: UserStats,
  earnedAchievementIds: Set<string>
): Map<string, number> {
  const progress = new Map<string, number>();

  for (const achievement of INDIVIDUAL_ACHIEVEMENTS) {
    if (earnedAchievementIds.has(achievement.id)) {
      progress.set(achievement.id, 100);
    } else {
      progress.set(achievement.id, achievement.progressFn(stats));
    }
  }

  return progress;
}

/**
 * Get progress for all team achievements
 */
export function calculateTeamAchievementProgress(
  stats: TeamStats,
  earnedAchievementIds: Set<string>
): Map<string, number> {
  const progress = new Map<string, number>();

  for (const achievement of TEAM_ACHIEVEMENTS) {
    if (earnedAchievementIds.has(achievement.id)) {
      progress.set(achievement.id, 100);
    } else {
      progress.set(achievement.id, achievement.progressFn(stats));
    }
  }

  return progress;
}
