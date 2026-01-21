import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Re-export auth schema tables
export * from './auth-schema';

// ============================================================================
// User Statistics Table
// ============================================================================
export const userStats = sqliteTable('user_stats', {
  email: text('email').primaryKey(),
  totalActiveDays: integer('total_active_days').default(0).notNull(),
  maxConsecutiveDays: integer('max_consecutive_days').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  totalLinesAdded: integer('total_lines_added').default(0).notNull(),
  totalAgentRequests: integer('total_agent_requests').default(0).notNull(),
  totalChatRequests: integer('total_chat_requests').default(0).notNull(),
  totalComposerRequests: integer('total_composer_requests').default(0).notNull(),
  totalTabAccepts: integer('total_tab_accepts').default(0).notNull(),
  totalBugbotUsages: integer('total_bugbot_usages').default(0).notNull(),
  bestSingleDayLines: integer('best_single_day_lines').default(0).notNull(),
  bestSingleDayAgent: integer('best_single_day_agent').default(0).notNull(),
  totalAcceptanceRate: real('total_acceptance_rate').default(0).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ============================================================================
// Team Statistics Table (Single row for team-wide stats)
// ============================================================================
export const teamStats = sqliteTable('team_stats', {
  id: text('id').primaryKey().default('team'),
  totalMembers: integer('total_members').default(0).notNull(),
  totalTeamLines: integer('total_team_lines').default(0).notNull(),
  totalTeamAgentRequests: integer('total_team_agent_requests').default(0).notNull(),
  totalTeamChatRequests: integer('total_team_chat_requests').default(0).notNull(),
  totalTeamComposerRequests: integer('total_team_composer_requests').default(0).notNull(),
  totalTeamActiveDays: integer('total_team_active_days').default(0).notNull(),
  membersWithStreaks: integer('members_with_streaks').default(0).notNull(),
  bestTeamDayLines: integer('best_team_day_lines').default(0).notNull(),
  bestTeamDayDate: text('best_team_day_date'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ============================================================================
// User Achievements Table
// ============================================================================
export const userAchievements = sqliteTable('user_achievements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userEmail: text('user_email').notNull(),
  achievementId: text('achievement_id').notNull(),
  achievedAt: integer('achieved_at', { mode: 'timestamp' }).notNull(),
  progress: integer('progress').default(0).notNull(),
}, (table) => [
  // Prevent duplicate achievements per user
  uniqueIndex('user_achievements_unique_idx').on(table.userEmail, table.achievementId),
  // Fast lookup by user email
  index('user_achievements_email_idx').on(table.userEmail),
]);

// ============================================================================
// Team Achievements Table
// ============================================================================
export const teamAchievements = sqliteTable('team_achievements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  achievementId: text('achievement_id').notNull(),
  achievedAt: integer('achieved_at', { mode: 'timestamp' }).notNull(),
  contributingMembers: text('contributing_members'), // JSON array of emails
}, (table) => [
  // Team achievements are unique by achievement ID
  uniqueIndex('team_achievements_unique_idx').on(table.achievementId),
]);

// ============================================================================
// Daily Snapshots Table (Historical daily data for each user)
// ============================================================================
export const dailySnapshots = sqliteTable('daily_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userEmail: text('user_email').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
  linesAdded: integer('lines_added').default(0).notNull(),
  agentRequests: integer('agent_requests').default(0).notNull(),
  chatRequests: integer('chat_requests').default(0).notNull(),
  composerRequests: integer('composer_requests').default(0).notNull(),
  tabAccepts: integer('tab_accepts').default(0).notNull(),
  totalTabsShown: integer('total_tabs_shown').default(0).notNull(),
  totalAccepts: integer('total_accepts').default(0).notNull(),
  totalApplies: integer('total_applies').default(0).notNull(),
  mostUsedModel: text('most_used_model').default(''),
}, (table) => [
  // Unique constraint on user + date combination
  uniqueIndex('daily_snapshots_unique_idx').on(table.userEmail, table.date),
  // Index for querying by user
  index('daily_snapshots_email_idx').on(table.userEmail),
  // Index for querying by date
  index('daily_snapshots_date_idx').on(table.date),
]);

// ============================================================================
// Sync Metadata Table (Track last sync time)
// ============================================================================
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey().default('sync'),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  lastSyncDate: text('last_sync_date'), // YYYY-MM-DD of last processed day
  syncStatus: text('sync_status').default('idle').notNull(), // 'idle' | 'running' | 'error'
  errorMessage: text('error_message'),
  dataCollectionStartDate: text('data_collection_start_date'), // YYYY-MM-DD - Date when tracking first started
  oldestDataDate: text('oldest_data_date'), // YYYY-MM-DD - Oldest available data (30-day rolling window)
});

// ============================================================================
// Type Exports
// ============================================================================
export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;

export type TeamStats = typeof teamStats.$inferSelect;
export type NewTeamStats = typeof teamStats.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export type TeamAchievement = typeof teamAchievements.$inferSelect;
export type NewTeamAchievement = typeof teamAchievements.$inferInsert;

export type DailySnapshot = typeof dailySnapshots.$inferSelect;
export type NewDailySnapshot = typeof dailySnapshots.$inferInsert;

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
