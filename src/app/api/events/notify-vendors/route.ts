// POST /api/events/notify-vendors - Notify matching vendors about new event
// Part of the Marketplace Bridge implementation
// ✅ Integrated with AiSensy WhatsApp Business API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '../../../../lib/api-handler';
import {
  sendWhatsAppMessage,
  canNotifyVendor,
  updateVendorNotificationTimestamp
} from '../../../../lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface NotifyVendorsRequest {
  eventId: string;
  city?: string;
  eventType?: string;
  sendWhatsApp?: boolean; // Enable/disable WhatsApp notifications (default: true)
}

interface NotificationResult {
  vendorId: string;
  vendorName: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  messageId?: string;
}

/**
 * Notify vendors matching the event location and category
 * This creates the "bridge" between client event creation and vendor bidding
 * Now with WhatsApp notifications via AiSensy!
 */
const handleNotifyVendors = withErrorHandler(async (request: NextRequest) => {
  const body: NotifyVendorsRequest = await request.json();
  const { eventId, city, eventType, sendWhatsApp = true } = body;

  if (!eventId) {
    return NextResponse.json({
      success: false,
      error: 'Event ID is required'
    }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get event details with all fields needed for notification
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*, owner:users!owner_user_id(full_name, email)')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    console.error('[Notify Vendors] Event not found:', eventError);
    return NextResponse.json({
      success: false,
      error: 'Event not found'
    }, { status: 404 });
  }

  // Extract event details
  const eventCity = city || event.city || 'Not specified';
  const eventTypeValue = eventType || event.event_type || 'General Event';
  const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Date TBD';
  const guestCount = event.guest_count || undefined;
  const budget = event.budget_range || event.client_brief?.budget || undefined;

  console.log(`[Notify Vendors] Processing event ${eventId}: ${eventTypeValue} in ${eventCity}`);

  // Query matching vendors with phone numbers
  let vendorQuery = supabase
    .from('vendors')
    .select('id, company_name, user_id, city, specialties, phone, last_notified_at, users(email, full_name)')
    .eq('verified', true);

  // Filter by city (case-insensitive match)
  if (eventCity && eventCity !== 'Not specified') {
    vendorQuery = vendorQuery.ilike('city', eventCity);
  }

  const { data: matchingVendors, error: vendorError } = await vendorQuery;

  if (vendorError) {
    console.error('[Notify Vendors] Error fetching vendors:', vendorError);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch matching vendors'
    }, { status: 500 });
  }

  if (!matchingVendors || matchingVendors.length === 0) {
    console.log(`[Notify Vendors] No verified vendors found in ${eventCity}`);
    return NextResponse.json({
      success: true,
      eventId,
      city: eventCity,
      eventType: eventTypeValue,
      matchedVendorsCount: 0,
      notificationsSent: 0,
      message: `No verified vendors found in ${eventCity}`
    });
  }

  // Filter vendors by specialty match (if event type is specified)
  let eligibleVendors = matchingVendors;
  const eventTypeNormalized = eventTypeValue.toLowerCase();

  if (eventTypeNormalized && eligibleVendors.length > 0) {
    eligibleVendors = eligibleVendors.filter(vendor => {
      if (!vendor.specialties || vendor.specialties.length === 0) {
        return true; // Include vendors with no specialties listed
      }
      // Check if any specialty matches the event type
      return vendor.specialties.some((specialty: string) =>
        specialty.toLowerCase().includes(eventTypeNormalized) ||
        eventTypeNormalized.includes(specialty.toLowerCase())
      );
    });
  }

  console.log(`[Notify Vendors] Found ${eligibleVendors.length} eligible vendors (${matchingVendors.length} total in city)`);

  // Send WhatsApp notifications to eligible vendors
  const notificationResults: NotificationResult[] = [];
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  if (sendWhatsApp) {
    console.log('[Notify Vendors] Starting WhatsApp notification process...');

    for (const vendor of eligibleVendors) {
      const userData = Array.isArray(vendor.users) ? vendor.users[0] : vendor.users;
      const vendorName = vendor.company_name || userData?.full_name || 'Vendor';
      const bidLink = `${APP_URL}/craftsmen/events/${eventId}/bid`;

      // Check if vendor has phone number
      if (!vendor.phone) {
        console.log(`[Notify Vendors] Vendor ${vendor.id} (${vendorName}) - No phone number`);
        notificationResults.push({
          vendorId: vendor.id,
          vendorName,
          status: 'skipped',
          reason: 'No phone number on file'
        });
        skippedCount++;
        continue;
      }

      // Check rate limiting (1 hour cooldown)
      const canNotify = await canNotifyVendor(vendor.id, 60);
      if (!canNotify) {
        console.log(`[Notify Vendors] Vendor ${vendor.id} (${vendorName}) - Rate limited`);
        notificationResults.push({
          vendorId: vendor.id,
          vendorName,
          status: 'skipped',
          reason: 'Notified recently (within 1 hour)'
        });
        skippedCount++;
        continue;
      }

      // Send WhatsApp message
      try {
        const result = await sendWhatsAppMessage({
          vendorId: vendor.id,
          vendorName,
          eventId,
          eventType: eventTypeValue,
          city: eventCity,
          budget,
          guestCount,
          eventDate,
          phoneNumber: vendor.phone,
          bidLink
        });

        if (result.success) {
          console.log(`[Notify Vendors] ✅ Sent to ${vendorName} (${vendor.phone})`);

          // Update last_notified_at timestamp
          await updateVendorNotificationTimestamp(vendor.id);

          notificationResults.push({
            vendorId: vendor.id,
            vendorName,
            status: 'sent',
            messageId: result.messageId
          });
          sentCount++;
        } else {
          console.error(`[Notify Vendors] ❌ Failed to send to ${vendorName}: ${result.error}`);
          notificationResults.push({
            vendorId: vendor.id,
            vendorName,
            status: 'failed',
            reason: result.error
          });
          failedCount++;
        }
      } catch (error) {
        console.error(`[Notify Vendors] ❌ Exception sending to ${vendorName}:`, error);
        notificationResults.push({
          vendorId: vendor.id,
          vendorName,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
        failedCount++;
      }

      // Small delay between messages to avoid rate limits (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Notify Vendors] Complete: ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed`);
  } else {
    console.log('[Notify Vendors] WhatsApp notifications disabled');
  }

  // Return comprehensive results
  return NextResponse.json({
    success: true,
    eventId,
    city: eventCity,
    eventType: eventTypeValue,
    eventDate,
    guestCount,
    budget,
    matchedVendorsCount: matchingVendors.length,
    eligibleVendorsCount: eligibleVendors.length,
    notifications: {
      sent: sentCount,
      skipped: skippedCount,
      failed: failedCount,
      total: eligibleVendors.length
    },
    results: notificationResults,
    message: sendWhatsApp
      ? `WhatsApp notifications sent to ${sentCount} vendors`
      : 'Vendors matched successfully. WhatsApp notifications disabled.',
    bidLink: `${APP_URL}/craftsmen/events/${eventId}/bid`
  });
});

export const POST = handleNotifyVendors;
