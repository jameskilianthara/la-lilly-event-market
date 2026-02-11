import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Query craftsmen table (vendors are stored as craftsmen in the schema)
    const { data: vendors, error } = await supabase
      .from('craftsmen')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching vendors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors', details: error.message },
        { status: 500 }
      );
    }

    // Transform the craftsmen schema to match the frontend vendor interface
    const transformedVendors = (vendors || []).map((craftsman: any) => {
      const userData = Array.isArray(craftsman.users) ? craftsman.users[0] : craftsman.users;
      const businessName = craftsman.business_name || userData?.name || 'Professional Craftsman';
      const slug = craftsman.slug || businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      return {
        id: craftsman.id,
        businessName,
        serviceType: (craftsman.specialties && craftsman.specialties[0]) || 'Event Services',
        profile: {
          slug,
          logo: craftsman.logo || '',
          tagline: craftsman.tagline || 'Professional event craftsman',
          bio: craftsman.description || '',
          serviceTypes: craftsman.services || [],
          specializations: craftsman.specialties || [],
          primaryCity: craftsman.city || 'Mumbai',
          serviceAreas: [craftsman.city || 'Mumbai', craftsman.state || 'Maharashtra'],
          portfolioImages: craftsman.portfolio_images || [],
          pricingDisplay: {
            showPricing: craftsman.show_pricing || false,
            startingPrice: craftsman.starting_price || 0
          },
          stats: {
            eventsCompleted: craftsman.completed_events || 0,
            avgRating: craftsman.rating || 0,
            totalReviews: craftsman.total_reviews || 0
          },
          isPublic: true,
          isVerified: craftsman.verified || false,
          isPremium: craftsman.is_premium || false,
        },
        createdAt: craftsman.created_at,
      };
    });

    return NextResponse.json({
      vendors: transformedVendors,
      count: transformedVendors.length,
    });
  } catch (error: any) {
    console.error('Unexpected error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
