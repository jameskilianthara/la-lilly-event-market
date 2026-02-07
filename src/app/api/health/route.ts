import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    api: 'ok',
    database: 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    checks.database = error ? 'error' : 'connected';
  } catch (err) {
    checks.database = 'error';
    console.error('Health check database error:', err);
  }

  const allHealthy = checks.api === 'ok' && checks.database === 'connected';

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
