-- Admin-assigned team for users not yet in auth user table (by email)
CREATE TABLE `user_team_override` (
	`email` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL
);
