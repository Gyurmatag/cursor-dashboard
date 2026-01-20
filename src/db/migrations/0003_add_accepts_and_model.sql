-- Add accepted diffs and model tracking to daily_snapshots
-- Migration: 0003_add_accepts_and_model

ALTER TABLE daily_snapshots ADD COLUMN total_accepts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_snapshots ADD COLUMN total_applies INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_snapshots ADD COLUMN most_used_model TEXT DEFAULT '';
