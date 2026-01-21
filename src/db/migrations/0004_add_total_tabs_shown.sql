-- Add total_tabs_shown field to daily_snapshots for tab acceptance rate calculation
-- Migration: 0004_add_total_tabs_shown

ALTER TABLE daily_snapshots ADD COLUMN total_tabs_shown INTEGER NOT NULL DEFAULT 0;
