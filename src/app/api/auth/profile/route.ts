import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS when fetching user profile
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/auth/profile?userId=xxx
// Fetches user profile using service role key (bypasses RLS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('user_type, full_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth Profile API] Error fetching profile:', error);
      return NextResponse.json({ error: 'Profile not found', details: error.message }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[Auth Profile API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
