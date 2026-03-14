-- Migration: Add is_deleted to appointments for soft deletion
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update existing records to false just in case
UPDATE appointments SET is_deleted = false WHERE is_deleted IS NULL;
