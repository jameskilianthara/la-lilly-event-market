-- Temporary fix: Disable RLS on users table to allow signup
-- This is a quick fix for development. For production, you should use proper RLS policies.

-- Option 1: Completely disable RLS on users table (easiest for development)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled but make it permissive, use Option 2 instead:
-- Option 2: Drop all policies and create a permissive one
/*
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Allow all authenticated users to insert
CREATE POLICY "Allow authenticated inserts" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
*/
