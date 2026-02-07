-- Add role column to user table (default 'user')
ALTER TABLE `user` ADD COLUMN `role` text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
-- Set admin role for designated admin user
UPDATE `user` SET `role` = 'admin' WHERE lower(`email`) = 'gyorgy.varga@shiwaforce.com';
