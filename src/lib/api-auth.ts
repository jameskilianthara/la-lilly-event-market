// src/lib/api-auth.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationError } from './errors';

// Use service role key for server-side auth verification (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  user_type: 'client' | 'vendor';
  full_name?: string;
}

/**
 * Extract and validate JWT token from Authorization header
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new AuthenticationError('Missing token');
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_type, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new AuthenticationError('User profile not found');
    }

    return {
      id: user.id,
      email: user.email!,
      user_type: profile.user_type,
      full_name: profile.full_name || undefined,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    console.error('Authentication error:', error);
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Require specific user type
 */
export function requireUserType(user: AuthenticatedUser, allowedTypes: ('client' | 'vendor')[]) {
  if (!allowedTypes.includes(user.user_type)) {
    throw new AuthenticationError(
      `Access denied. Required user type: ${allowedTypes.join(' or ')}, got: ${user.user_type}`
    );
  }
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>,
  options: {
    requiredUserType?: ('client' | 'vendor')[];
  } = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const user = await authenticateRequest(request);

    if (options.requiredUserType) {
      requireUserType(user, options.requiredUserType);
    }

    return handler(request, user, ...args);
  };
}

/**
 * Middleware-style auth check for routes that need user context
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest, user?: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await authenticateRequest(request);
      return handler(request, user, ...args);
    } catch (error) {
      // If auth fails, call handler with undefined user
      if (error instanceof AuthenticationError) {
        return handler(request, undefined, ...args);
      }
      throw error;
    }
  };
}









