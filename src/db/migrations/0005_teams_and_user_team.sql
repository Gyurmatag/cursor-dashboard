-- Teams table and user.team_id for profile team selection
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `team_id` text;
--> statement-breakpoint
-- Seed default teams (deterministic IDs for local/prod consistency)
INSERT OR IGNORE INTO `teams` (`id`, `name`) VALUES ('00000000-0000-0000-0000-000000000001', 'Labor team');
INSERT OR IGNORE INTO `teams` (`id`, `name`) VALUES ('00000000-0000-0000-0000-000000000002', 'AI team');
