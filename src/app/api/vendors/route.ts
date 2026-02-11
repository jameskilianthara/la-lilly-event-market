import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Query vendors table
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching vendors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors', details: error.message },
        { status: 500 }
      );
    }

    // Transform the vendors schema to match the frontend vendor interface
    const transformedVendors = (vendors || []).map((vendor: any) => {
      const businessName = vendor.business_name || 'Professional Vendor';
      const slug = vendor.slug || businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      return {
        id: vendor.id,
        businessName,
        serviceType: vendor.service_type || 'Event Services',
        profile: {
          slug,
          logo: vendor.logo || '',
          tagline: vendor.tagline || 'Professional event services',
          bio: vendor.bio || '',
          serviceTypes: vendor.service_types || [],
          specializations: vendor.specializations || [],
          primaryCity: vendor.primary_city || 'Mumbai',
          serviceAreas: vendor.service_areas || [vendor.primary_city || 'Mumbai'],
          portfolioImages: vendor.portfolio_images || [],
          pricingDisplay: {
            showPricing: vendor.show_pricing || false,
            startingPrice: vendor.starting_price || 0
          },
          stats: {
            eventsCompleted: vendor.events_completed || 0,
            avgRating: vendor.avg_rating || 0,
            totalReviews: vendor.total_reviews || 0
          },
          isPublic: vendor.is_public !== false, // default to true
          isVerified: vendor.is_verified || false,
          isPremium: vendor.is_premium || false,
        },
        createdAt: vendor.created_at,
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
