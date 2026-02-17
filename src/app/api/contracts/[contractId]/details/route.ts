import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;

    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        event:events(*),
        vendor:vendors(*, users!vendors_user_id_fkey(*))
      `)
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      console.error('Contract fetch error:', error);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Contract details route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
