import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    // Fetch vendor/craftsman profile
    const { data: vendor, error: vendorError } = await supabase
      .from('craftsmen')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name
        )
      `)
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const userData = Array.isArray(vendor.users) ? vendor.users[0] : vendor.users;

    // Fetch reviews/ratings
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('craftsman_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Transform vendor profile
    const profile = {
      vendorId: vendor.id,
      businessName: vendor.business_name || 'Professional Vendor',
      ownerName: userData?.name || 'Vendor',
      email: userData?.email || '',
      phone: vendor.phone || '',
      city: vendor.city || 'Mumbai',
      state: vendor.state || 'Maharashtra',
      specialties: vendor.specialties || [],
      rating: vendor.rating || 0,
      totalReviews: vendor.total_reviews || 0,
      completedEvents: vendor.completed_events || 0,
      yearsInBusiness: vendor.years_in_business || 1,
      description: vendor.description || 'Professional event services provider',
      certifications: vendor.certifications || [],
      services: vendor.services || [],
      verified: vendor.verified || false
    };

    // Transform reviews
    const transformedReviews = (reviews || []).map((review: any) => ({
      id: review.id,
      clientName: review.client_name || 'Anonymous',
      eventType: review.event_type || 'Event',
      rating: review.rating || 0,
      comment: review.comment || '',
      date: review.created_at
    }));

    return NextResponse.json({
      profile,
      reviews: transformedReviews
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
