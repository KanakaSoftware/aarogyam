-- ==============================================================================
-- ADD NOTES COLUMN TO EXISTING LAB ORDERS TABLE
-- ==============================================================================

ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS notes TEXT;
