CREATE TABLE `daily_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`date` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`lines_added` integer DEFAULT 0 NOT NULL,
	`agent_requests` integer DEFAULT 0 NOT NULL,
	`chat_requests` integer DEFAULT 0 NOT NULL,
	`composer_requests` integer DEFAULT 0 NOT NULL,
	`tab_accepts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_snapshots_unique_idx` ON `daily_snapshots` (`user_email`,`date`);--> statement-breakpoint
CREATE INDEX `daily_snapshots_email_idx` ON `daily_snapshots` (`user_email`);--> statement-breakpoint
CREATE INDEX `daily_snapshots_date_idx` ON `daily_snapshots` (`date`);--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`id` text PRIMARY KEY DEFAULT 'sync' NOT NULL,
	`last_sync_at` integer,
	`last_sync_date` text,
	`sync_status` text DEFAULT 'idle' NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `team_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`achieved_at` integer NOT NULL,
	`contributing_members` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_achievements_unique_idx` ON `team_achievements` (`achievement_id`);--> statement-breakpoint
CREATE TABLE `team_stats` (
	`id` text PRIMARY KEY DEFAULT 'team' NOT NULL,
	`total_members` integer DEFAULT 0 NOT NULL,
	`total_team_lines` integer DEFAULT 0 NOT NULL,
	`total_team_agent_requests` integer DEFAULT 0 NOT NULL,
	`total_team_chat_requests` integer DEFAULT 0 NOT NULL,
	`total_team_composer_requests` integer DEFAULT 0 NOT NULL,
	`total_team_active_days` integer DEFAULT 0 NOT NULL,
	`members_with_streaks` integer DEFAULT 0 NOT NULL,
	`best_team_day_lines` integer DEFAULT 0 NOT NULL,
	`best_team_day_date` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`achievement_id` text NOT NULL,
	`achieved_at` integer NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievements_unique_idx` ON `user_achievements` (`user_email`,`achievement_id`);--> statement-breakpoint
CREATE INDEX `user_achievements_email_idx` ON `user_achievements` (`user_email`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`email` text PRIMARY KEY NOT NULL,
	`total_active_days` integer DEFAULT 0 NOT NULL,
	`max_consecutive_days` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`total_lines_added` integer DEFAULT 0 NOT NULL,
	`total_agent_requests` integer DEFAULT 0 NOT NULL,
	`total_chat_requests` integer DEFAULT 0 NOT NULL,
	`total_composer_requests` integer DEFAULT 0 NOT NULL,
	`total_tab_accepts` integer DEFAULT 0 NOT NULL,
	`total_bugbot_usages` integer DEFAULT 0 NOT NULL,
	`best_single_day_lines` integer DEFAULT 0 NOT NULL,
	`best_single_day_agent` integer DEFAULT 0 NOT NULL,
	`total_acceptance_rate` real DEFAULT 0 NOT NULL,
	`updated_at` integer
);
