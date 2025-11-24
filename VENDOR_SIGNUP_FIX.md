# Vendor Signup Fix - AUTH-001

## Issue Identified ✅

**Problem**: Vendor signup was failing at profile creation with empty error object `{}`.

**Root Cause**: Missing Row Level Security (RLS) INSERT policy on the `public.users` table. Users could SELECT and UPDATE their profiles, but couldn't INSERT during signup.

**Location**: `src/contexts/AuthContext.tsx` line 287 (now fixed with better error logging)

---

## Fix Applied ✅

### 1. Schema Update
- **File**: `supabase/schema.sql` (line 193-194)
- **Added**: INSERT policy for users table

### 2. Migration Created
- **File**: `supabase/migrations/20250131_fix_users_insert_policy.sql`
- **Purpose**: Apply the RLS policy fix to your Supabase database

### 3. Improved Error Handling
- **File**: `src/contexts/AuthContext.tsx` (lines 276-302)
- **Changes**:
  - Added `.select().single()` to get created profile data
  - Enhanced error logging with code, message, details, and hint
  - Better error messages for users

---

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/ikfawcbcapmfpzwbqccr
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste this SQL:

```sql
-- Fix: Add INSERT policy for users table
-- Allows users to create their own profile during signup

CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see: `Success. No rows returned`

### Option 2: Command Line (Alternative)

If you have Supabase CLI installed:

```bash
cd /Users/jameskilianthara/Documents/la-lilly-event-market
supabase db push
```

---

## Verification Steps

### 1. Check the Policy Exists

Run this in Supabase SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';
```

You should see three policies:
- ✅ "Users can view own profile" (SELECT)
- ✅ "Users can insert own profile" (INSERT) ← **NEW**
- ✅ "Users can update own profile" (UPDATE)

### 2. Test Vendor Signup

1. Navigate to: http://localhost:3000/craftsmen/signup
2. Fill in the signup form:
   - **Email**: test-vendor@example.com
   - **Password**: Test1234!
   - **Company Name**: Test Event Company
   - **Business Type**: Event Planning
   - **Years in Business**: 5
3. Click **Create Account**
4. Check browser console for logs:
   - ✅ Should see: "User profile created successfully: {id, email, user_type, ...}"
   - ✅ Should see: "Signup successful: {userId: ..., userType: 'vendor'}"

### 3. Verify in Database

Check that the user was created in both tables:

```sql
-- Check auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-vendor@example.com';

-- Check public.users
SELECT id, email, user_type, full_name, created_at
FROM public.users
WHERE email = 'test-vendor@example.com';
```

Both queries should return the same user with matching IDs.

---

## What Changed

### Before ❌
```sql
-- Only SELECT and UPDATE policies existed
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

**Result**: User created in `auth.users` but insert to `public.users` silently failed with empty error `{}`.

### After ✅
```sql
-- Added INSERT policy
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**Result**: User can create their profile in `public.users` during signup.

---

## Error Messages

### Before Fix
- Silent failure with empty error object: `{}`
- Generic message: "Failed to create user profile"

### After Fix
- Detailed error logging including:
  - Error code
  - Error message
  - Details and hints
- User-friendly message: "Failed to create user profile: [specific message]. This may be a permissions issue."

---

## Files Modified

1. ✅ `supabase/schema.sql` - Added INSERT policy
2. ✅ `supabase/migrations/20250131_fix_users_insert_policy.sql` - Migration file
3. ✅ `src/contexts/AuthContext.tsx` - Improved error handling
4. ✅ `VENDOR_SIGNUP_FIX.md` - This documentation

---

## Testing Checklist

- [ ] Apply the migration SQL in Supabase Dashboard
- [ ] Verify policy exists using verification query
- [ ] Test vendor signup with new email
- [ ] Check browser console for success logs
- [ ] Verify user exists in both auth.users and public.users
- [ ] Test with intentionally wrong data to see improved error messages
- [ ] Confirm no empty error objects `{}` in console

---

## Next Steps

After applying the fix and verifying it works:

1. ✅ Mark AUTH-001 as **COMPLETED**
2. Document any additional edge cases found during testing
3. Consider adding integration tests for the signup flow
4. Update any related documentation

---

## Support

If you encounter issues:

1. Check the browser console for detailed error logs
2. Check Supabase logs in Dashboard > Logs
3. Verify your `.env.local` has correct Supabase credentials
4. Ensure RLS is enabled on the users table

**Status**: ✅ **READY FOR TESTING**
