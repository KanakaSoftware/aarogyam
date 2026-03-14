-- ============================================================
-- Admin Module Migration: Add department & status to users
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Add department column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add status column for user activation/deactivation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add INSERT/UPDATE/DELETE policies for admin management
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON users;
    CREATE POLICY "Allow authenticated users to update their own profile"
        ON users FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Allow admins to insert users" ON users;
    CREATE POLICY "Allow admins to insert users"
        ON users FOR INSERT
        TO authenticated
        WITH CHECK (true);
END
$$;

-- ============================================================
-- Seed Sample Doctors (run after the user table exists)
-- NOTE: These inserts only work if you have already created
-- matching auth.users accounts in Supabase Auth via the 
-- create-user script or the Admin UI.
-- 
-- For a quick POC seed, run this after using
-- the Admin UI in Supabase to create these users.
-- ============================================================

-- Update roles table to ensure all needed roles exist
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access'),
('receptionist', 'Handles front-desk operations and appointment scheduling'),
('nurse', 'Provides patient care and assists with procedures'),
('doctor', 'Provides medical consultations and prescribes treatments'),
('lab_technician', 'Conducts medical tests and processes lab results'),
('billing_officer', 'Manages patient billing and financial records'),
('specialist', 'Provides specialized medical consultations'),
('compliance_officer', 'Ensures practice adheres to healthcare regulations'),
('patient', 'The patient receiving care')
ON CONFLICT (name) DO NOTHING;
