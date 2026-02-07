import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    // Fetch vendor name
    const { data: vendor, error: vendorError } = await supabase
      .from('craftsmen')
      .select('business_name')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Fetch portfolio images
    const { data: images, error: imagesError } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('craftsman_id', vendorId)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Error fetching portfolio images:', imagesError);
    }

    // Fetch testimonials
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('craftsman_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
    }

    // Transform portfolio images
    const transformedImages = (images || []).map((img: any) => ({
      id: img.id,
      url: img.image_url,
      title: img.title || 'Untitled',
      eventType: img.event_type || 'Event',
      description: img.description || '',
      date: img.created_at
    }));

    // Transform testimonials
    const transformedTestimonials = (testimonials || []).map((t: any) => ({
      id: t.id,
      clientName: t.client_name || 'Anonymous',
      eventType: t.event_type || 'Event',
      quote: t.quote || t.comment || '',
      date: t.created_at,
      rating: t.rating || 5
    }));

    // Get unique event types from images
    const eventTypes = [...new Set(transformedImages.map(img => img.eventType))].filter(Boolean);

    return NextResponse.json({
      vendorName: vendor.business_name || 'Vendor',
      images: transformedImages,
      testimonials: transformedTestimonials,
      eventTypes
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
