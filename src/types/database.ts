// EventFoundry Database Type Definitions
// Generated from supabase/schema.sql

// Base types
export type UserType = 'client' | 'vendor' | 'admin';

export type ForgeStatus =
  | 'BLUEPRINT_READY'
  | 'OPEN_FOR_BIDS'
  | 'CRAFTSMEN_BIDDING'
  | 'SHORTLIST_REVIEW'
  | 'FINAL_BIDDING_OPEN'
  | 'FINAL_BIDDING_CLOSED'
  | 'WINNER_SELECTED'
  | 'COMMISSIONED'
  | 'IN_FORGE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type BidStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SHORTLISTED'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type ContractStatus =
  | 'PENDING'
  | 'SIGNED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentType =
  | 'DEPOSIT'
  | 'MILESTONE'
  | 'FINAL'
  | 'REFUND';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

// Table: public.users (extends auth.users)
export interface User {
  id: string; // UUID, references auth.users(id)
  email: string;
  full_name: string | null;
  user_type: UserType;
  phone: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UserInsert {
  id: string; // Must match auth.users(id)
  email: string;
  user_type: UserType;
  full_name?: string | null;
  phone?: string | null;
}

export interface UserUpdate {
  full_name?: string | null;
  phone?: string | null;
}

// Table: public.vendors
export interface Vendor {
  id: string; // UUID
  user_id: string; // UUID, references users(id)
  company_name: string;
  business_type: string | null;
  specialties: string[]; // Array of service types
  location: string | null;
  city: string | null;
  state: string | null;
  years_experience: number | null;
  certifications: any; // JSONB
  portfolio_urls: string[];
  description: string | null;
  rating: number; // Decimal(3,2), default 0.00
  total_projects: number; // Default 0
  verified: boolean; // Default false
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface VendorInsert {
  user_id: string;
  company_name: string;
  business_type?: string | null;
  specialties?: string[];
  location?: string | null;
  city?: string | null;
  state?: string | null;
  years_experience?: number | null;
  certifications?: any;
  portfolio_urls?: string[];
  description?: string | null;
}

export interface VendorUpdate {
  company_name?: string;
  business_type?: string | null;
  specialties?: string[];
  location?: string | null;
  city?: string | null;
  state?: string | null;
  years_experience?: number | null;
  certifications?: any;
  portfolio_urls?: string[];
  description?: string | null;
  verified?: boolean;
}

// Table: public.events (Forge Projects)
export interface Event {
  id: string; // UUID
  owner_user_id: string; // UUID, references users(id)
  title: string;
  event_type: string;
  date: string | null; // Date
  city: string | null;
  venue_name: string | null;
  venue_status: string | null;
  guest_count: number | null;
  budget_range: string | null;
  client_brief: any; // JSONB
  forge_blueprint: any; // JSONB
  forge_status: ForgeStatus; // Default 'BLUEPRINT_READY'
  bidding_closes_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface EventInsert {
  owner_user_id: string;
  title: string;
  event_type: string;
  client_brief: any; // JSONB
  forge_blueprint: any; // JSONB
  date?: string | null;
  city?: string | null;
  venue_name?: string | null;
  venue_status?: string | null;
  guest_count?: number | null;
  budget_range?: string | null;
  forge_status?: ForgeStatus;
  bidding_closes_at?: string | null;
}

export interface EventUpdate {
  title?: string;
  event_type?: string;
  date?: string | null;
  city?: string | null;
  venue_name?: string | null;
  venue_status?: string | null;
  guest_count?: number | null;
  budget_range?: string | null;
  client_brief?: any;
  forge_blueprint?: any;
  forge_status?: ForgeStatus;
  bidding_closes_at?: string | null;
  shortlist_finalized_at?: string | null;
  final_bidding_closes_at?: string | null;
}

// Table: public.bids (Craft Proposals)
export interface Bid {
  id: string; // UUID
  event_id: string; // UUID, references events(id)
  vendor_id: string; // UUID, references vendors(id)
  craft_specialties: string[];
  forge_items: any; // JSONB
  bid_data?: any; // Legacy JSONB field (for backward compatibility)
  subtotal: number; // Decimal(12,2)
  taxes: number; // Decimal(12,2), default 0.00
  total_forge_cost: number; // Decimal(12,2)
  total_amount?: number; // Alias for total_forge_cost
  craft_attachments: string[];
  vendor_notes: string | null;
  estimated_forge_time: string | null;
  status: BidStatus; // Default 'SUBMITTED'
  bid_round: number; // Default 1
  is_final_bid: boolean; // Default false
  revised_from_bid_id: string | null; // UUID reference to original bid
  competitive_intelligence: any | null; // JSONB
  shortlisted_at: string | null; // ISO timestamp
  rejected_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface BidInsert {
  event_id: string;
  vendor_id: string;
  forge_items: any; // JSONB
  subtotal: number;
  total_forge_cost: number;
  craft_specialties?: string[];
  taxes?: number;
  craft_attachments?: string[];
  vendor_notes?: string | null;
  estimated_forge_time?: string | null;
  status?: BidStatus;
}

export interface BidUpdate {
  competitive_intelligence?: any;
  shortlisted_at?: string | null;
  rejected_at?: string | null;
  forge_items?: any;
  subtotal?: number;
  taxes?: number;
  total_forge_cost?: number;
  craft_specialties?: string[];
  craft_attachments?: string[];
  vendor_notes?: string | null;
  estimated_forge_time?: string | null;
  status?: BidStatus;
}

// Table: public.contracts (Forge Commissions)
export interface Contract {
  id: string; // UUID
  event_id: string; // UUID, references events(id)
  bid_id: string; // UUID, references bids(id)
  vendor_id: string; // UUID, references vendors(id)
  client_id: string; // UUID, references users(id)
  contract_json: any; // JSONB
  pdf_url: string | null;
  signatures_json: any; // JSONB, default {}
  contract_status: ContractStatus; // Default 'PENDING'
  total_amount: number; // Decimal(12,2)
  deposit_amount: number | null; // Decimal(12,2)
  milestones: any; // JSONB, default []
  created_at: string; // ISO timestamp
  signed_at: string | null; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ContractInsert {
  event_id: string;
  bid_id: string;
  vendor_id: string;
  client_id: string;
  contract_json: any;
  total_amount: number;
  pdf_url?: string | null;
  signatures_json?: any;
  contract_status?: ContractStatus;
  deposit_amount?: number | null;
  milestones?: any;
}

export interface ContractUpdate {
  contract_json?: any;
  pdf_url?: string | null;
  signatures_json?: any;
  contract_status?: ContractStatus;
  deposit_amount?: number | null;
  milestones?: any;
  signed_at?: string | null;
  completed_at?: string | null;
}

// Table: public.payments
export interface Payment {
  id: string; // UUID
  contract_id: string; // UUID, references contracts(id)
  amount: number; // Decimal(12,2)
  payment_type: PaymentType;
  payment_status: PaymentStatus; // Default 'PENDING'
  payment_method: string | null;
  transaction_id: string | null;
  payment_gateway_response: any; // JSONB
  created_at: string; // ISO timestamp
  processed_at: string | null; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PaymentInsert {
  contract_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_status?: PaymentStatus;
  payment_method?: string | null;
  transaction_id?: string | null;
  payment_gateway_response?: any;
}

export interface PaymentUpdate {
  payment_status?: PaymentStatus;
  payment_method?: string | null;
  transaction_id?: string | null;
  payment_gateway_response?: any;
  processed_at?: string | null;
}

// Table: public.reviews
export interface Review {
  id: string; // UUID
  contract_id: string; // UUID, references contracts(id)
  vendor_id: string; // UUID, references vendors(id)
  client_id: string; // UUID, references users(id)
  rating: number; // 1-5
  review_text: string | null;
  response_text: string | null;
  images: string[];
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ReviewInsert {
  contract_id: string;
  vendor_id: string;
  client_id: string;
  rating: number; // 1-5
  review_text?: string | null;
  images?: string[];
}

export interface ReviewUpdate {
  rating?: number;
  review_text?: string | null;
  response_text?: string | null;
  images?: string[];
}

// Table: public.messages
export interface Message {
  id: string; // UUID
  event_id: string; // UUID, references events(id)
  sender_id: string; // UUID, references users(id)
  receiver_id: string; // UUID, references users(id)
  message_text: string;
  attachments: string[];
  read_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
}

export interface MessageInsert {
  event_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  attachments?: string[];
}

export interface MessageUpdate {
  read_at?: string | null;
}

// Joined types for common queries
export interface VendorWithUser extends Vendor {
  user: User;
}

export interface EventWithClient extends Event {
  client: User;
}

export interface BidWithVendor extends Bid {
  vendor: VendorWithUser;
}

export interface ContractWithDetails extends Contract {
  vendor: VendorWithUser;
  client: User;
  event: Event;
  bid: Bid;
}
