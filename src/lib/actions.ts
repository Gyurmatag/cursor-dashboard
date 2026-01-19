'use server';

import { getTeamMembers, getDailyUsageData, aggregateUserMetrics } from './cursor-api';
import type { LeaderboardEntry } from '@/types/cursor';

export async function fetchLeaderboardData(
  startDate: number,
  endDate: number
): Promise<LeaderboardEntry[]> {
  try {
    // Fetch both team members and usage data in parallel
    const [members, usageData] = await Promise.all([
      getTeamMembers(),
      getDailyUsageData(startDate, endDate),
    ]);

    // Aggregate the data into leaderboard entries
    return aggregateUserMetrics(usageData, members);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}
