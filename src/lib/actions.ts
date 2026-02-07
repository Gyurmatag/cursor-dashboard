'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin';
import { getTeamMembers, getDailyUsageData, aggregateUserMetrics } from './cursor-api';
import { calculateStreakFromActiveDates } from './achievement-calculator';
import { revalidatePath } from 'next/cache';
import type { LeaderboardEntry, DailyUsageRecord } from '@/types/cursor';
import type { UserStats, UserAchievement, DailySnapshot } from '@/db/schema';

async function enrichLeaderboardEntriesWithTeams(
  db: ReturnType<typeof createDb>,
  entries: LeaderboardEntry[]
): Promise<LeaderboardEntry[]> {
  if (entries.length === 0) return entries;
  const emails = [...new Set(entries.map((e) => e.email))];
  const emailsLower = emails.map((e) => e.toLowerCase());
  const [userRows, overrideRows, teamsList] = await Promise.all([
    db
      .select({ email: schema.user.email, teamId: schema.user.teamId })
      .from(schema.user)
      .where(inArray(schema.user.email, emails)),
    db
      .select({ email: schema.userTeamOverride.email, teamId: schema.userTeamOverride.teamId })
      .from(schema.userTeamOverride)
      .where(inArray(schema.userTeamOverride.email, emailsLower)),
    db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams),
  ]);
  const teamById = new Map(teamsList.map((t) => [t.id, t.name]));
  const userByEmail = new Map(userRows.map((u) => [u.email.toLowerCase(), u]));
  const overrideByEmail = new Map(overrideRows.map((o) => [o.email.toLowerCase(), o]));
  return entries.map((entry) => {
    const key = entry.email.toLowerCase();
    const user = userByEmail.get(key);
    const override = overrideByEmail.get(key);
    const teamId = user?.teamId ?? override?.teamId ?? undefined;
    const teamName = teamId ? teamById.get(teamId) : undefined;
    return { ...entry, teamId, teamName };
  });
}

export async function fetchLeaderboardData(
  startDate: number,
  endDate: number
): Promise<LeaderboardEntry[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Check if date range exceeds 30 days
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    let entries: LeaderboardEntry[];
    if (daysDiff <= 30) {
      const [members, usageData] = await Promise.all([
        getTeamMembers(),
        getDailyUsageData(startDate, endDate),
      ]);
      entries = aggregateUserMetrics(usageData, members);
    } else {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];

      const [members, snapshotsData] = await Promise.all([
        getTeamMembers(),
        db.select()
          .from(schema.dailySnapshots)
          .where(
            and(
              gte(schema.dailySnapshots.date, startDateStr),
              lte(schema.dailySnapshots.date, endDateStr)
            )
          ),
      ]);

      const usageData: DailyUsageRecord[] = snapshotsData.map((snap) => ({
        date: new Date(snap.date).getTime(),
        email: snap.userEmail,
        isActive: snap.isActive,
        acceptedLinesAdded: snap.linesAdded,
        totalTabsAccepted: snap.tabAccepts,
        chatRequests: snap.chatRequests,
        composerRequests: snap.composerRequests,
        agentRequests: snap.agentRequests,
        totalLinesAdded: snap.linesAdded,
        totalLinesDeleted: 0,
        acceptedLinesDeleted: 0,
        totalApplies: snap.totalApplies,
        totalAccepts: snap.totalAccepts,
        totalRejects: 0,
        totalTabsShown: snap.totalTabsShown,
        cmdkUsages: 0,
        subscriptionIncludedReqs: 0,
        apiKeyReqs: 0,
        usageBasedReqs: 0,
        bugbotUsages: 0,
        mostUsedModel: snap.mostUsedModel || '',
        applyMostUsedExtension: '',
        tabMostUsedExtension: '',
        clientVersion: '',
      }));
      entries = aggregateUserMetrics(usageData, members);
    }
    return enrichLeaderboardEntriesWithTeams(db, entries);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}

export interface UserProfileData {
  userStats: UserStats | null;
  userAchievements: UserAchievement[];
  dailySnapshots: DailySnapshot[];
  userRank: number;
  totalUsers: number;
  leaderboardEntry: LeaderboardEntry | null;
}

/**
 * Fetch comprehensive user profile data with real-time Cursor API data
 * @param userEmail - The email of the user to fetch data for
 */
export async function fetchUserProfile(userEmail: string): Promise<UserProfileData> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Calculate ALL TIME date range from account inception
    // Smart fetching: Database for complete historical activity
    const ACCOUNT_INCEPTION = new Date('2025-06-16T00:00:00Z').getTime();
    const dateRange = {
      startDate: ACCOUNT_INCEPTION,
      endDate: Date.now(),
      label: 'All Time (Since Inception)',
    };

    // React best practice: Parallel fetching with Promise.all()
    // Fetch data from appropriate source (API or Database) and achievements in parallel
    const daysDiff = (dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24);
    
    const [teamMembers, dailyUsageData, userAchievementsData] = 
      await Promise.all([
        // Real-time: Get team members from Cursor API (uses React.cache())
        getTeamMembers(),
        // Smart fetching: API for ≤30 days, Database for >30 days
        daysDiff <= 30
          ? getDailyUsageData(dateRange.startDate, dateRange.endDate)
          : (async () => {
              const startDateStr = new Date(dateRange.startDate).toISOString().split('T')[0];
              const endDateStr = new Date(dateRange.endDate).toISOString().split('T')[0];
              const snapshotsData = await db.select()
                .from(schema.dailySnapshots)
                .where(
                  and(
                    gte(schema.dailySnapshots.date, startDateStr),
                    lte(schema.dailySnapshots.date, endDateStr)
                  )
                );
              // Convert snapshots to DailyUsageRecord format
              return snapshotsData.map(snap => ({
                date: new Date(snap.date).getTime(),
                email: snap.userEmail,
                isActive: snap.isActive,
                acceptedLinesAdded: snap.linesAdded,
                totalTabsAccepted: snap.tabAccepts,
                chatRequests: snap.chatRequests,
                composerRequests: snap.composerRequests,
                agentRequests: snap.agentRequests,
                // Use actual database values instead of hardcoded zeros
                totalLinesAdded: snap.linesAdded,
                totalLinesDeleted: 0, // Not stored in database
                acceptedLinesDeleted: 0, // Not stored in database
                totalApplies: snap.totalApplies,
                totalAccepts: snap.totalAccepts,
                totalRejects: 0, // Not stored in database
                totalTabsShown: snap.totalTabsShown,
                cmdkUsages: 0, // Not stored in database
                subscriptionIncludedReqs: 0, // Not stored in database
                apiKeyReqs: 0, // Not stored in database
                usageBasedReqs: 0, // Not stored in database
                bugbotUsages: 0, // Not stored in database
                mostUsedModel: snap.mostUsedModel || '',
                applyMostUsedExtension: '', // Not stored in database
                tabMostUsedExtension: '', // Not stored in database
                clientVersion: '', // Not stored in database
              }));
            })(),
        // Database: Get user achievements (calculated from ALL historical data)
        db.select().from(schema.userAchievements).where(eq(schema.userAchievements.userEmail, userEmail)),
      ]);

    // Filter daily usage data for this specific user
    const userDailyData = dailyUsageData.filter(record => record.email === userEmail);

    // Aggregate user's all-time stats from daily data
    let totalLinesAdded = 0;
    let totalChatRequests = 0;
    let totalComposerRequests = 0;
    let totalAgentRequests = 0;
    let totalTabAccepts = 0;
    let totalAccepts = 0;
    let totalApplies = 0;
    const activeDays = new Set<string>();

    for (const record of userDailyData) {
      totalLinesAdded += record.acceptedLinesAdded;
      totalChatRequests += record.chatRequests;
      totalComposerRequests += record.composerRequests;
      totalAgentRequests += record.agentRequests;
      totalTabAccepts += record.totalTabsAccepted;
      totalAccepts += record.totalAccepts;
      totalApplies += record.totalApplies;
      
      // Count day as active for streaks if API says isActive OR there was any usage
      const hasActivity =
        record.isActive ||
        record.acceptedLinesAdded > 0 ||
        record.chatRequests > 0 ||
        record.composerRequests > 0 ||
        record.agentRequests > 0;
      if (hasActivity) {
        activeDays.add(new Date(record.date).toISOString().split('T')[0]);
      }
    }

    // Calculate acceptance rate
    const acceptanceRate = totalApplies > 0 
      ? (totalAccepts / totalApplies) * 100 
      : 0;

    // Get leaderboard data for ranking
    const leaderboardData = aggregateUserMetrics(dailyUsageData, teamMembers);
    const leaderboardEntry = leaderboardData.find(entry => entry.email === userEmail) || null;
    const userRank = leaderboardEntry 
      ? leaderboardData.findIndex(entry => entry.email === userEmail) + 1 
      : 0;

    const activeDateStrings = Array.from(activeDays);
    const { maxConsecutiveDays, currentStreak } = calculateStreakFromActiveDates(activeDateStrings);

    // Create real-time user stats object
    const realtimeUserStats: UserStats = {
      email: userEmail,
      totalActiveDays: activeDays.size,
      maxConsecutiveDays,
      currentStreak,
      totalLinesAdded,
      totalAgentRequests,
      totalChatRequests,
      totalComposerRequests,
      totalTabAccepts,
      totalBugbotUsages: 0, // Not available in API response
      bestSingleDayLines: Math.max(...userDailyData.map(d => d.acceptedLinesAdded), 0),
      bestSingleDayAgent: Math.max(...userDailyData.map(d => d.agentRequests), 0),
      totalAcceptanceRate: acceptanceRate,
      updatedAt: new Date(),
    };

    // Transform daily data to snapshot format (most recent first, all time)
    const dailySnapshotsData = userDailyData
      .sort((a, b) => b.date - a.date)
      .map(record => ({
        id: `${userEmail}-${record.date}`,
        userEmail,
        date: new Date(record.date).toISOString().split('T')[0],
        isActive: record.isActive,
        linesAdded: record.acceptedLinesAdded,
        agentRequests: record.agentRequests,
        chatRequests: record.chatRequests,
        composerRequests: record.composerRequests,
        tabAccepts: record.totalTabsAccepted,
        totalTabsShown: record.totalTabsShown || 0,
        totalAccepts: record.totalAccepts || 0,
        totalApplies: record.totalApplies || 0,
        mostUsedModel: record.mostUsedModel || null,
      }));

    return {
      userStats: realtimeUserStats,
      userAchievements: userAchievementsData,
      dailySnapshots: dailySnapshotsData,
      userRank,
      totalUsers: leaderboardData.length,
      leaderboardEntry,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// ============================================================================
// Team actions (profile team selector)
// ============================================================================

export type TeamOption = { id: string; name: string };

export type ProfileTeamData = {
  currentTeamId: string | null;
  currentTeamName: string | null;
  teams: TeamOption[];
};

export async function getProfileTeamData(userId: string): Promise<ProfileTeamData> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const [userRow, teamsList] = await Promise.all([
      db.select({ teamId: schema.user.teamId }).from(schema.user).where(eq(schema.user.id, userId)).limit(1),
      db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams),
    ]);
    const currentTeamId = userRow[0]?.teamId ?? null;
    const currentTeamName =
      (currentTeamId && teamsList.find((t) => t.id === currentTeamId)?.name) || null;
    return { currentTeamId, currentTeamName, teams: teamsList };
  } catch (error) {
    console.error('Error fetching profile team data:', error);
    return { currentTeamId: null, currentTeamName: null, teams: [] };
  }
}

export async function getTeams(): Promise<TeamOption[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const rows = await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams);
    return rows;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

export async function updateUserTeam(userId: string, teamId: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id || session.user.id !== userId) {
      return { ok: false, error: 'Unauthorized' };
    }
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    await db.update(schema.user).set({ teamId, updatedAt: new Date() }).where(eq(schema.user.id, userId));
    revalidatePath('/me');
    return { ok: true };
  } catch (error) {
    console.error('Error updating user team:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update team' };
  }
}

export async function createTeam(name: string): Promise<{ id: string; name: string } | { error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Team name is required' };
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const existing = await db.select().from(schema.teams).where(eq(schema.teams.name, trimmed)).limit(1);
    if (existing.length > 0) return { id: existing[0].id, name: existing[0].name };
    const id = crypto.randomUUID();
    await db.insert(schema.teams).values({ id, name: trimmed });
    return { id, name: trimmed };
  } catch (error) {
    console.error('Error creating team:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create team' };
  }
}

export async function setUserTeam(userId: string, teamIdOrNewName: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id || session.user.id !== userId) {
    return { ok: false, error: 'Unauthorized' };
  }
  const trimmed = teamIdOrNewName.trim();
  if (!trimmed) return { ok: false, error: 'Team is required' };

  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);
  const teamsList = await db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams);
  const byId = teamsList.find((t) => t.id === trimmed);
  const byName = teamsList.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());

  if (byId) {
    return updateUserTeam(userId, byId.id);
  }
  if (byName) {
    return updateUserTeam(userId, byName.id);
  }
  const created = await createTeam(trimmed);
  if ('error' in created) return { ok: false, error: created.error };
  return updateUserTeam(userId, created.id);
}

// ============================================================================
// Admin-only actions
// ============================================================================

export type AdminUserRow = {
  id: string | null;
  name: string;
  email: string;
  teamId: string | null;
  teamName: string | null;
  role: string;
};

export async function getAdminUsers(): Promise<AdminUserRow[] | null> {
  if (!(await isAdmin())) return null;
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const [statsRows, authUsers, overrides, teamsList] = await Promise.all([
      db.select({ email: schema.userStats.email }).from(schema.userStats),
      db.select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        teamId: schema.user.teamId,
        role: schema.user.role,
      }).from(schema.user),
      db.select({ email: schema.userTeamOverride.email, teamId: schema.userTeamOverride.teamId }).from(schema.userTeamOverride),
      db.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams),
    ]);
    const teamById = new Map(teamsList.map((t) => [t.id, t.name]));
    const userByEmail = new Map(authUsers.map((u) => [u.email.toLowerCase(), u]));
    const overrideByEmail = new Map(overrides.map((o) => [o.email.toLowerCase(), o]));
    const statsEmails = new Set(statsRows.map((r) => r.email.toLowerCase()));
    const authOnlyEmails = authUsers.filter((u) => !statsEmails.has(u.email.toLowerCase())).map((u) => u.email);
    const allEmails = [...statsRows.map((r) => r.email), ...authOnlyEmails];
    return allEmails.map((email) => {
      const key = email.toLowerCase();
      const user = userByEmail.get(key);
      const override = overrideByEmail.get(key);
      const teamId = user?.teamId ?? override?.teamId ?? null;
      return {
        id: user?.id ?? null,
        name: user?.name ?? email,
        email,
        teamId,
        teamName: teamId ? teamById.get(teamId) ?? null : null,
        role: user?.role ?? 'user',
      };
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return null;
  }
}

export async function updateUserTeamAdmin(
  userId: string | null,
  email: string | null,
  teamId: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    if (userId) {
      await db.update(schema.user).set({ teamId, updatedAt: new Date() }).where(eq(schema.user.id, userId));
    } else if (email) {
      const key = email.trim().toLowerCase();
      if (!key) return { ok: false, error: 'Email required' };
      if (teamId === null) {
        await db.delete(schema.userTeamOverride).where(eq(schema.userTeamOverride.email, key));
      } else {
        await db
          .insert(schema.userTeamOverride)
          .values({ email: key, teamId })
          .onConflictDoUpdate({
            target: schema.userTeamOverride.email,
            set: { teamId },
          });
      }
    } else {
      return { ok: false, error: 'UserId or email required' };
    }
    revalidatePath('/admin');
    revalidatePath('/me');
    return { ok: true };
  } catch (error) {
    console.error('Error updating user team (admin):', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update team' };
  }
}
