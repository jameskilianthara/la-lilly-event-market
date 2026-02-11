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
      const businessName = vendor.company_name || 'Professional Vendor';
      const slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      return {
        id: vendor.id,
        businessName,
        serviceType: (vendor.specialties && vendor.specialties[0]) || 'Event Services',
        profile: {
          slug,
          logo: vendor.logo || '',
          tagline: vendor.location || 'Professional event services',
          bio: vendor.description || '',
          serviceTypes: vendor.business_type ? [vendor.business_type] : [],
          specializations: vendor.specialties || [],
          primaryCity: vendor.city || 'Mumbai',
          serviceAreas: [vendor.city || 'Mumbai', vendor.state || 'Maharashtra'],
          portfolioImages: vendor.portfolio_urls ? vendor.portfolio_urls.map((url: string, idx: number) => ({
            id: `img-${idx}`,
            url,
            title: `${businessName} Portfolio ${idx + 1}`,
            eventType: 'Event'
          })) : [],
          pricingDisplay: {
            showPricing: false,
            startingPrice: 0
          },
          stats: {
            eventsCompleted: vendor.total_projects || 0,
            avgRating: vendor.rating || 0,
            totalReviews: 0
          },
          isPublic: true,
          isVerified: vendor.verified || false,
          isPremium: false,
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
