// API Route: Close Expired Bidding Windows
// POST /api/bidding/close-expired
//
// Closes all expired bidding windows and triggers automatic shortlisting
// Should be called periodically (e.g., via cron job)

import { NextRequest, NextResponse } from 'next/server';
import { checkExpiredBiddingWindows } from '@/lib/bidding';

export async function POST(request: NextRequest) {
  try {
    const result = await checkExpiredBiddingWindows();
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to close expired bidding windows' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Closed ${result.closedCount} expired bidding window(s)`,
      closedCount: result.closedCount,
      totalFound: result.totalFound || 0,
      results: result.results || []
    });
  } catch (error) {
    console.error('API error closing expired bidding windows:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}




