-- Confirm all existing users and disable email confirmation requirement
-- This will allow all users to login immediately without email confirmation

-- Option 1: Confirm all existing users in auth.users table
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Option 2: If you want to confirm a specific user, use this instead:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email = 'demo123@gmail.com';  -- Replace with your email
