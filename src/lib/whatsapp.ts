/**
 * WhatsApp Notification Service
 * Integration with AiSensy for WhatsApp Business API
 *
 * AiSensy API Documentation: https://docs.aisensy.com/
 * Popular in India for WhatsApp marketing and transactional messages
 */

import { createClient } from '@supabase/supabase-js';
import type { VendorNotificationInsert, VendorNotification } from '../types/database';

// AiSensy Configuration
const AISENSY_API_KEY = process.env.AISENSY_API_KEY || '';
const AISENSY_API_URL = process.env.AISENSY_API_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';
const AISENSY_ENABLED = process.env.AISENSY_ENABLED === 'true';
const AISENSY_PARTNER_ID = process.env.AISENSY_PARTNER_ID || '';

// Supabase for notification logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface WhatsAppMessageParams {
  vendorId: string;
  vendorName: string;
  eventId: string;
  eventType: string;
  city: string;
  budget?: string;
  guestCount?: number;
  eventDate?: string;
  phoneNumber: string;
  bidLink: string;
}

interface AiSensyResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
  status?: string;
}

/**
 * Format phone number for WhatsApp (Indian format)
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
 * Returns: 91XXXXXXXXXX (AiSensy format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Add 91 prefix if not present (Indian country code)
  if (!cleaned.startsWith('91')) {
    cleaned = '91' + cleaned;
  }

  // Validate format (should be 91 + 10 digits)
  if (cleaned.length !== 12 || !cleaned.startsWith('91')) {
    throw new Error(`Invalid phone number format: ${phone}. Expected format: +91XXXXXXXXXX`);
  }

  return cleaned;
}

/**
 * Generate WhatsApp message content from template
 */
export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    vendorName,
    eventType,
    city,
    budget,
    guestCount,
    eventDate,
    bidLink
  } = params;

  let message = `🎉 *New Event Alert!*\n\n`;
  message += `Hi ${vendorName},\n\n`;
  message += `A new *${eventType}* event has just been posted in *${city}*!\n\n`;
  message += `📋 *Event Details:*\n`;

  if (eventDate) {
    message += `📅 Date: ${eventDate}\n`;
  }

  if (guestCount) {
    message += `👥 Guests: ${guestCount}\n`;
  }

  if (budget) {
    message += `💰 Budget: ${budget}\n`;
  }

  message += `\n🔥 *Don't miss this opportunity!*\n`;
  message += `Click the link below to view details and submit your bid:\n\n`;
  message += `${bidLink}\n\n`;
  message += `_Powered by EventFoundry - Your Event Marketplace_`;

  return message;
}

/**
 * Send WhatsApp message via AiSensy API
 */
export async function sendWhatsAppMessage(params: WhatsAppMessageParams): Promise<AiSensyResponse> {
  const { phoneNumber, vendorId, eventId } = params;

  // Format phone number
  let formattedPhone: string;
  try {
    formattedPhone = formatPhoneNumber(phoneNumber);
  } catch (error) {
    console.error('[WhatsApp] Phone number formatting failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid phone number format'
    };
  }

  // Generate message content
  const messageContent = generateWhatsAppMessage(params);

  // Create notification record in database (status: pending)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const notificationData: VendorNotificationInsert = {
    vendor_id: vendorId,
    event_id: eventId,
    notification_type: 'whatsapp',
    phone_number: formattedPhone,
    message_content: messageContent,
    status: 'pending'
  };

  const { data: notification, error: dbError } = await supabase
    .from('vendor_notifications')
    .insert(notificationData)
    .select()
    .single();

  if (dbError || !notification) {
    console.error('[WhatsApp] Failed to create notification record:', dbError);
    return {
      success: false,
      error: 'Failed to log notification in database'
    };
  }

  // Check if AiSensy is enabled
  if (!AISENSY_ENABLED) {
    console.log('[WhatsApp] AiSensy disabled - simulation mode');
    console.log(`[WhatsApp] Would send to ${formattedPhone}:`);
    console.log(messageContent);

    // Update notification status to sent (simulation)
    await supabase
      .from('vendor_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_response: { simulation: true, message: 'AiSensy disabled in environment' }
      })
      .eq('id', notification.id);

    return {
      success: true,
      message: 'Simulation mode - message not actually sent',
      messageId: `sim_${notification.id}`
    };
  }

  // Validate API credentials
  if (!AISENSY_API_KEY || !AISENSY_PARTNER_ID) {
    console.error('[WhatsApp] AiSensy credentials missing');
    await supabase
      .from('vendor_notifications')
      .update({
        status: 'failed',
        provider_response: { error: 'Missing API credentials' }
      })
      .eq('id', notification.id);

    return {
      success: false,
      error: 'WhatsApp service not configured - missing API credentials'
    };
  }

  try {
    // Send via AiSensy API
    console.log(`[WhatsApp] Sending to ${formattedPhone} via AiSensy...`);

    const aiSensyPayload = {
      apiKey: AISENSY_API_KEY,
      campaignName: `event_notification_${eventId}`,
      destination: formattedPhone,
      userName: params.vendorName,
      templateParams: [
        params.vendorName,
        params.eventType,
        params.city,
        params.budget || 'Not specified',
        params.bidLink
      ],
      source: 'EventFoundry',
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      paramsFallbackValue: {
        FirstName: params.vendorName
      }
    };

    const response = await fetch(`${AISENSY_API_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(aiSensyPayload)
    });

    const responseData = await response.json();

    if (response.ok && responseData.success) {
      console.log('[WhatsApp] Message sent successfully:', responseData);

      // Update notification status to sent
      await supabase
        .from('vendor_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_response: responseData
        })
        .eq('id', notification.id);

      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: responseData.messageId || responseData.id
      };
    } else {
      console.error('[WhatsApp] AiSensy API error:', responseData);

      // Update notification status to failed
      await supabase
        .from('vendor_notifications')
        .update({
          status: 'failed',
          provider_response: responseData
        })
        .eq('id', notification.id);

      return {
        success: false,
        error: responseData.message || responseData.error || 'Failed to send WhatsApp message'
      };
    }
  } catch (error) {
    console.error('[WhatsApp] Network error:', error);

    // Update notification status to failed
    await supabase
      .from('vendor_notifications')
      .update({
        status: 'failed',
        provider_response: {
          error: error instanceof Error ? error.message : 'Network error'
        }
      })
      .eq('id', notification.id);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error sending WhatsApp message'
    };
  }
}

/**
 * Check if vendor was recently notified (rate limiting)
 * Returns true if vendor can be notified, false if too soon
 */
export async function canNotifyVendor(vendorId: string, cooldownMinutes: number = 60): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('last_notified_at')
    .eq('id', vendorId)
    .single();

  if (error || !vendor) {
    console.error('[WhatsApp] Failed to check vendor notification status:', error);
    return true; // Allow notification if we can't check (fail open)
  }

  if (!vendor.last_notified_at) {
    return true; // Never notified before
  }

  const lastNotified = new Date(vendor.last_notified_at);
  const now = new Date();
  const minutesSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60);

  return minutesSinceLastNotification >= cooldownMinutes;
}

/**
 * Update vendor's last_notified_at timestamp
 */
export async function updateVendorNotificationTimestamp(vendorId: string): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('vendors')
    .update({ last_notified_at: new Date().toISOString() })
    .eq('id', vendorId);

  if (error) {
    console.error('[WhatsApp] Failed to update vendor notification timestamp:', error);
  }
}

/**
 * Get notification statistics for a vendor
 */
export async function getVendorNotificationStats(vendorId: string): Promise<{
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  lastNotification: VendorNotification | null;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: notifications, error } = await supabase
    .from('vendor_notifications')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error || !notifications) {
    console.error('[WhatsApp] Failed to fetch notification stats:', error);
    return { total: 0, sent: 0, delivered: 0, failed: 0, lastNotification: null };
  }

  return {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    delivered: notifications.filter(n => n.status === 'delivered').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    lastNotification: notifications[0] || null
  };
}
