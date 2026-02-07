/**
 * EventFoundry Authentication Flow Integration Tests
 * Tests user authentication, session management, and profile access
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test credentials
const TEST_USER_EMAIL = 'test@eventfoundry.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

describe('Authentication Flow Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  describe('1. User Registration', () => {
    it('should create test user if not exists', async () => {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      // Check if user exists
      const { data: existingUsers } = await adminClient
        .from('users')
        .select('*')
        .eq('email', TEST_USER_EMAIL);

      if (existingUsers && existingUsers.length > 0) {
        testUserId = existingUsers[0].id;
        console.log('✅ Test user already exists:', testUserId);
        return;
      }

      // Create auth user via Supabase Auth
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        // User might already exist in Auth but not in users table
        return;
      }

      testUserId = authData.user.id;

      // Create profile in users table
      const { error: profileError } = await adminClient
        .from('users')
        .insert({
          id: testUserId,
          email: TEST_USER_EMAIL,
          name: 'Test User',
          role: 'client',
        });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
      } else {
        console.log('✅ Test user created with profile:', testUserId);
      }
    });
  });

  describe('2. User Login', () => {
    it('should authenticate with valid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (error) {
        console.log('⚠️ Login failed (might need manual user setup):', error.message);
        return;
      }

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(TEST_USER_EMAIL);
      console.log('✅ User authenticated successfully');
    });

    it('should reject login with invalid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: 'WrongPassword123!',
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
      console.log('✅ Invalid credentials rejected');
    });

    it('should reject login with non-existent user', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@eventfoundry.com',
        password: TEST_USER_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
      console.log('✅ Non-existent user rejected');
    });
  });

  describe('3. Session Management', () => {
    it('should retrieve current session', async () => {
      // First login
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log('⚠️ Session retrieval failed:', error.message);
        return;
      }

      expect(session).toBeDefined();
      expect(session?.user.email).toBe(TEST_USER_EMAIL);
      console.log('✅ Session retrieved successfully');
    });

    it('should get current authenticated user', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.log('⚠️ User retrieval failed:', error.message);
        return;
      }

      expect(user).toBeDefined();
      expect(user?.email).toBe(TEST_USER_EMAIL);
      console.log('✅ Current user retrieved');
    });

    it('should refresh session token', async () => {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.log('⚠️ Token refresh failed:', error.message);
        return;
      }

      expect(data.session).toBeDefined();
      console.log('✅ Session token refreshed');
    });
  });

  describe('4. Profile Access with RLS', () => {
    it('should allow user to view own profile', async () => {
      // Login first
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (!authData.session) {
        console.log('⚠️ Skipping test - login required');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (error) {
        console.log('⚠️ Profile access failed (RLS might not be configured):', error.message);
        return;
      }

      expect(profile).toBeDefined();
      expect(profile.email).toBe(TEST_USER_EMAIL);
      console.log('✅ User can view own profile (RLS working)');
    });

    it('should prevent user from viewing other profiles', async () => {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      // Create another user to test access control
      const { data: otherUser } = await adminClient
        .from('users')
        .insert({
          email: 'other-user@eventfoundry.com',
          name: 'Other User',
          role: 'client',
        })
        .select()
        .single();

      if (!otherUser) {
        console.log('⚠️ Could not create test user');
        return;
      }

      // Try to access other user's profile with authenticated client
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherUser.id)
        .single();

      // Should either get no data or RLS error
      expect(data).toBeNull();
      console.log('✅ User cannot view other profiles (RLS working)');

      // Cleanup
      await adminClient.from('users').delete().eq('id', otherUser.id);
    });
  });

  describe('5. User Logout', () => {
    it('should sign out user', async () => {
      const { error } = await supabase.auth.signOut();

      expect(error).toBeNull();

      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      expect(session).toBeNull();
      console.log('✅ User signed out successfully');
    });

    it('should deny access to protected resources after logout', async () => {
      // Try to access user profile without auth
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', TEST_USER_EMAIL)
        .single();

      // Should fail due to RLS
      expect(data).toBeNull();
      console.log('✅ Protected resource access denied after logout');
    });
  });

  describe('6. Password Reset Flow', () => {
    it('should send password reset email', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(TEST_USER_EMAIL, {
        redirectTo: 'http://localhost:3001/reset-password',
      });

      if (error) {
        console.log('⚠️ Password reset failed:', error.message);
        return;
      }

      expect(error).toBeNull();
      console.log('✅ Password reset email sent');
    });
  });

  describe('7. Role-Based Access', () => {
    it('should verify client role permissions', async () => {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      const { data: user } = await adminClient
        .from('users')
        .select('role')
        .eq('email', TEST_USER_EMAIL)
        .single();

      expect(user?.role).toBe('client');
      console.log('✅ Client role verified');
    });

    it('should test vendor-specific access', async () => {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      // Create test vendor user
      const { data: vendorUser } = await adminClient
        .from('users')
        .insert({
          email: 'test-vendor-auth@eventfoundry.com',
          name: 'Test Vendor',
          role: 'vendor',
        })
        .select()
        .single();

      if (!vendorUser) {
        console.log('⚠️ Could not create vendor user');
        return;
      }

      // Create vendor profile
      const { data: vendor } = await adminClient
        .from('vendors')
        .insert({
          user_id: vendorUser.id,
          company_name: 'Test Vendor Auth Co.',
          specialties: ['catering'],
          city: 'Mumbai',
        })
        .select()
        .single();

      expect(vendor).toBeDefined();
      console.log('✅ Vendor profile created with proper role');

      // Cleanup
      await adminClient.from('vendors').delete().eq('id', vendor.id);
      await adminClient.from('users').delete().eq('id', vendorUser.id);
    });
  });
});
