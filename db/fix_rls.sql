-- ============================================================
-- FIX: Infinite Recursion in users table RLS
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop ALL existing policies on the users table
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.users;
DROP POLICY IF EXISTS "Enable read access for own profile or admins" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated to read profiles" ON public.users;

-- Step 2: Drop ALL existing policies on audit_logs table
DROP POLICY IF EXISTS "Anyone can insert audit logs." ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs." ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.audit_logs;

-- Step 3: Drop any helper functions that may cause recursion
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_my_role();

-- Step 4: Create simple, NON-RECURSIVE policies
-- This policy is completely safe — it only checks auth.uid() (no table query)
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- This policy allows any authenticated user to see all profiles.
-- Important: this does NOT query the users table, so there is ZERO recursion.
CREATE POLICY "users_select_all_authenticated"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Audit logs policies
CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true);
