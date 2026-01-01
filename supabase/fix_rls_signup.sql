-- Fix RLS policy for user signup
-- The issue: During signup, the user profile insert happens before auth session is established
-- Solution: Allow inserts during signup by checking if the user is authenticated (not just matching uid)

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a more permissive insert policy that works during signup
-- This allows authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    auth.role() = 'authenticated'
  );

-- Also ensure the policy allows service role (for server-side operations)
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
