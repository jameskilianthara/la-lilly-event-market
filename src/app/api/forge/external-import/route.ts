/**
 * POST /api/forge/external-import
 *
 * Create draft event from external sources (WhatsApp bot, integrations)
 * Returns short_code for user to resume event creation on website
 *
 * Use Case:
 * 1. WhatsApp bot collects: city, date, guest_count, event_type
 * 2. Bot calls this API to create draft
 * 3. Bot sends link to user: eventfoundry.com/forge/resume/FORGE2X9
 * 4. User clicks link, skips chat questions, goes straight to checklist
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '../../../../lib/api-handler';
import { generateUniqueShortCode } from '../../../../lib/shortcode';
import type { DraftSource, DraftEventSessionInsert } from '../../../../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// API key for external integrations (optional but recommended)
const FORGE_API_KEY = process.env.FORGE_API_KEY;

interface ExternalImportRequest {
  // Event details (from WhatsApp bot or other source)
  event_type: string;
  city: string;
  date?: string;              // ISO date or natural language
  guest_count?: number | string;
  venue_status?: string;
  budget_range?: string;

  // Source tracking
  source: DraftSource;        // 'whatsapp_bot', 'api', etc.
  external_reference_id?: string; // e.g., WhatsApp conversation ID

  // Optional metadata
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  additional_notes?: string;

  // API authentication (optional)
  api_key?: string;
}

interface ExternalImportResponse {
  success: boolean;
  short_code: string;
  resume_url: string;
  event_id: string;
  expires_at: string;
  message: string;
}

/**
 * Create draft event from external source
 * No authentication required - public API for integrations
 */
const handleExternalImport = withErrorHandler(async (request: NextRequest) => {
  const body: ExternalImportRequest = await request.json();

  // Validate API key if configured
  if (FORGE_API_KEY && body.api_key !== FORGE_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Invalid API key'
    }, { status: 401 });
  }

  // Validate required fields
  if (!body.event_type || !body.city) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: event_type and city are required'
    }, { status: 400 });
  }

  if (!body.source) {
    return NextResponse.json({
      success: false,
      error: 'Missing source field (e.g., "whatsapp_bot", "api")'
    }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Generate unique short code
  const shortCode = await generateUniqueShortCode();
  console.log(`[External Import] Generated short code: ${shortCode}`);

  // Parse guest count if provided as string
  let guestCount: number | null = null;
  if (body.guest_count) {
    if (typeof body.guest_count === 'number') {
      guestCount = body.guest_count;
    } else {
      const parsed = parseInt(body.guest_count, 10);
      if (!isNaN(parsed)) {
        guestCount = parsed;
      }
    }
  }

  // Build client brief with provided data
  const clientBrief = {
    event_type: body.event_type,
    city: body.city,
    date: body.date || null,
    guest_count: guestCount?.toString() || body.guest_count || null,
    venue_status: body.venue_status || 'not_specified',
    budget_range: body.budget_range || null,
    client_name: body.client_name || null,
    client_phone: body.client_phone || null,
    client_email: body.client_email || null,
    notes: body.additional_notes || null,
    source: body.source,
    imported_at: new Date().toISOString()
  };

  // Create draft event (no owner yet)
  const eventTitle = `${body.event_type} Draft - ${body.city}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      owner_user_id: null,  // Will be set when user completes
      title: eventTitle,
      event_type: body.event_type,
      city: body.city,
      date: body.date || null,
      guest_count: guestCount,
      venue_status: body.venue_status || 'not_specified',
      budget_range: body.budget_range || null,
      client_brief: clientBrief,
      forge_blueprint: {}, // Will be selected during completion
      forge_status: 'DRAFT',
      short_code: shortCode,
      draft_source: body.source,
      draft_expires_at: expiresAt.toISOString(),
      external_reference_id: body.external_reference_id || null
    })
    .select()
    .single();

  if (eventError || !event) {
    console.error('[External Import] Failed to create event:', eventError);
    return NextResponse.json({
      success: false,
      error: 'Failed to create draft event'
    }, { status: 500 });
  }

  console.log(`[External Import] Created draft event: ${event.id}`);

  // Create draft session for tracking
  const clientIp = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const sessionData: DraftEventSessionInsert = {
    short_code: shortCode,
    event_id: event.id,
    source: body.source,
    external_reference_id: body.external_reference_id || null,
    client_data: {
      client_name: body.client_name,
      client_phone: body.client_phone,
      client_email: body.client_email,
      additional_notes: body.additional_notes
    },
    ip_address: clientIp,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString()
  };

  const { error: sessionError } = await supabase
    .from('draft_event_sessions')
    .insert(sessionData);

  if (sessionError) {
    console.error('[External Import] Failed to create session:', sessionError);
    // Non-fatal - event still created
  }

  // Generate resume URL
  const resumeUrl = `${APP_URL}/forge/resume/${shortCode}`;

  console.log(`[External Import] Success! Resume URL: ${resumeUrl}`);

  // Return response
  const response: ExternalImportResponse = {
    success: true,
    short_code: shortCode,
    resume_url: resumeUrl,
    event_id: event.id,
    expires_at: expiresAt.toISOString(),
    message: `Draft event created successfully. Valid for 7 days.`
  };

  return NextResponse.json(response, { status: 201 });
});

export const POST = handleExternalImport;

/**
 * GET /api/forge/external-import?short_code=FORGE2X9
 *
 * Retrieve draft event by short code
 * Useful for WhatsApp bot to check if draft still exists
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const shortCode = searchParams.get('short_code');

  if (!shortCode) {
    return NextResponse.json({
      success: false,
      error: 'Missing short_code parameter'
    }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get draft session and event
  const { data: session, error: sessionError } = await supabase
    .from('draft_event_sessions')
    .select('*, events(*)')
    .eq('short_code', shortCode)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({
      success: false,
      error: 'Short code not found'
    }, { status: 404 });
  }

  // Check if expired
  const expiresAt = new Date(session.expires_at);
  const isExpired = expiresAt < new Date();

  return NextResponse.json({
    success: true,
    short_code: shortCode,
    event_id: session.event_id,
    expires_at: session.expires_at,
    is_expired: isExpired,
    is_completed: session.completed_at !== null,
    access_count: session.access_count,
    source: session.source,
    event: session.events
  });
});
