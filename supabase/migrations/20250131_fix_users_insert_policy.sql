-- Fix: Add INSERT policy for users table
-- Issue: Vendor signup was failing silently because users couldn't insert their own profile
-- Solution: Add RLS policy to allow users to insert their own row during signup

-- Add INSERT policy for users table
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policy was created
COMMENT ON POLICY "Users can insert own profile" ON public.users IS
  'Allows users to create their own profile row during signup with matching auth.uid()';
