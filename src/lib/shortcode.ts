/**
 * Short Code Generator for Draft Events
 *
 * Generates unique, memorable 8-character codes for draft event access
 * Format: FORGE2X9 (avoiding ambiguous characters like 0, O, I, 1)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Characters to use (excludes ambiguous: 0, O, I, 1, L)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/**
 * Generate a random short code
 * Example: "FORGE2X9", "KOCHI7P4", "DRAFT3M8"
 */
export function generateShortCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    code += CHARS[randomIndex];
  }
  return code;
}

/**
 * Generate a unique short code that doesn't exist in database
 * Retries up to 10 times if collision occurs
 */
export async function generateUniqueShortCode(): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();

    // Check if code already exists in events table
    const { data: eventExists } = await supabase
      .from('events')
      .select('id')
      .eq('short_code', code)
      .single();

    if (!eventExists) {
      // Check if code exists in draft_event_sessions table
      const { data: sessionExists } = await supabase
        .from('draft_event_sessions')
        .select('id')
        .eq('short_code', code)
        .single();

      if (!sessionExists) {
        return code; // Found unique code
      }
    }

    console.log(`[ShortCode] Collision on attempt ${attempt + 1}: ${code}`);
  }

  // Fallback: append timestamp if all attempts failed (very unlikely)
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `FORG${timestamp}`;
}

/**
 * Validate short code format
 */
export function isValidShortCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Must be exactly 8 characters
  if (code.length !== CODE_LENGTH) {
    return false;
  }

  // Must only contain allowed characters
  const codeUpper = code.toUpperCase();
  for (let i = 0; i < codeUpper.length; i++) {
    if (!CHARS.includes(codeUpper[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Format short code for display
 * Example: "forge2x9" → "FORGE-2X9" or "FORGE 2X9"
 */
export function formatShortCode(code: string, separator: '-' | ' ' = '-'): string {
  const upper = code.toUpperCase();
  // Split into two groups of 4 for readability
  return `${upper.slice(0, 4)}${separator}${upper.slice(4)}`;
}

/**
 * Generate a friendly URL slug from short code
 * Example: "FORGE2X9" → "/forge/resume/FORGE2X9"
 */
export function shortCodeToUrl(code: string): string {
  return `/forge/resume/${code.toUpperCase()}`;
}

/**
 * Extract short code from URL
 * Example: "/forge/resume/FORGE2X9" → "FORGE2X9"
 */
export function extractShortCodeFromUrl(url: string): string | null {
  const match = url.match(/\/forge\/resume\/([A-Z0-9]{8})/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Check if short code is expired
 */
export async function isShortCodeExpired(code: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error } = await supabase
    .from('draft_event_sessions')
    .select('expires_at')
    .eq('short_code', code)
    .single();

  if (error || !session) {
    return true; // Treat missing/error as expired
  }

  const expiresAt = new Date(session.expires_at);
  return expiresAt < new Date();
}

/**
 * Get draft event by short code
 */
export async function getDraftEventByShortCode(code: string): Promise<{
  event: any | null;
  session: any | null;
  error: string | null;
}> {
  if (!isValidShortCode(code)) {
    return {
      event: null,
      session: null,
      error: 'Invalid short code format'
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get draft session
  const { data: session, error: sessionError } = await supabase
    .from('draft_event_sessions')
    .select('*')
    .eq('short_code', code)
    .single();

  if (sessionError || !session) {
    return {
      event: null,
      session: null,
      error: 'Short code not found'
    };
  }

  // Check if expired
  const expiresAt = new Date(session.expires_at);
  if (expiresAt < new Date()) {
    return {
      event: null,
      session,
      error: 'Short code has expired'
    };
  }

  // Get associated event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', session.event_id)
    .single();

  if (eventError || !event) {
    return {
      event: null,
      session,
      error: 'Associated event not found'
    };
  }

  // Update access tracking
  await supabase
    .from('draft_event_sessions')
    .update({
      access_count: (session.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', session.id);

  return {
    event,
    session,
    error: null
  };
}

/**
 * Mark draft as completed
 */
export async function markDraftAsCompleted(shortCode: string, userId?: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('draft_event_sessions')
    .update({
      completed_at: new Date().toISOString()
    })
    .eq('short_code', shortCode);

  if (error) {
    console.error('[ShortCode] Failed to mark draft as completed:', error);
    return false;
  }

  // If userId provided, link the event to the user
  if (userId) {
    const { data: session } = await supabase
      .from('draft_event_sessions')
      .select('event_id')
      .eq('short_code', shortCode)
      .single();

    if (session) {
      await supabase
        .from('events')
        .update({ owner_user_id: userId })
        .eq('id', session.event_id);
    }
  }

  return true;
}

/**
 * Get short code statistics
 */
export async function getShortCodeStats(): Promise<{
  total: number;
  completed: number;
  expired: number;
  active: number;
  conversionRate: number;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: sessions, error } = await supabase
    .from('draft_event_sessions')
    .select('expires_at, completed_at');

  if (error || !sessions) {
    return {
      total: 0,
      completed: 0,
      expired: 0,
      active: 0,
      conversionRate: 0
    };
  }

  const now = new Date();
  const completed = sessions.filter(s => s.completed_at !== null).length;
  const expired = sessions.filter(s => new Date(s.expires_at) < now && !s.completed_at).length;
  const active = sessions.filter(s => new Date(s.expires_at) >= now && !s.completed_at).length;
  const total = sessions.length;
  const conversionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    expired,
    active,
    conversionRate: Math.round(conversionRate * 100) / 100
  };
}
