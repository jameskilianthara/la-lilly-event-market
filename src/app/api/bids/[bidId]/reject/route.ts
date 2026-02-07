import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params;

    // Update bid status to REJECTED
    const { data: updatedBid, error: updateError } = await supabase
      .from('bids')
      .update({
        status: 'REJECTED',
        rejected_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting bid:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject bid' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bid: updatedBid,
      message: 'Bid rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
