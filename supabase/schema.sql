-- EventFoundry Database Schema
-- Production-ready schema for all business data persistence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'vendor', 'admin')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors/Craftsmen table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_type TEXT,
  specialties TEXT[] DEFAULT '{}',
  location TEXT,
  city TEXT,
  state TEXT,
  years_experience INTEGER,
  certifications JSONB DEFAULT '[]',
  portfolio_urls TEXT[] DEFAULT '{}',
  description TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_projects INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events/Forge Projects table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  date DATE,
  city TEXT,
  venue_name TEXT,
  venue_status TEXT,
  guest_count INTEGER,
  budget_range TEXT,
  client_brief JSONB NOT NULL,
  forge_blueprint JSONB NOT NULL,
  forge_status TEXT NOT NULL DEFAULT 'BLUEPRINT_READY' CHECK (
    forge_status IN (
      'BLUEPRINT_READY',
      'OPEN_FOR_BIDS',
      'CRAFTSMEN_BIDDING',
      'SHORTLIST_REVIEW',
      'COMMISSIONED',
      'IN_FORGE',
      'COMPLETED',
      'ARCHIVED'
    )
  ),
  bidding_closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids/Craft Proposals table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  craft_specialties TEXT[] DEFAULT '{}',
  forge_items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  taxes DECIMAL(12,2) DEFAULT 0.00,
  total_forge_cost DECIMAL(12,2) NOT NULL,
  craft_attachments TEXT[] DEFAULT '{}',
  vendor_notes TEXT,
  estimated_forge_time TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, vendor_id)
);

-- Contracts/Forge Commissions table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contract_json JSONB NOT NULL,
  pdf_url TEXT,
  signatures_json JSONB DEFAULT '{}',
  contract_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    contract_status IN ('PENDING', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')
  ),
  total_amount DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2),
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (
    payment_type IN ('DEPOSIT', 'MILESTONE', 'FINAL', 'REFUND')
  ),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')
  ),
  payment_method TEXT,
  transaction_id TEXT,
  payment_gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  response_text TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for client-vendor communication)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_specialties ON public.vendors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_events_owner_user_id ON public.events(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_events_forge_status ON public.events(forge_status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_bids_event_id ON public.bids(event_id);
CREATE INDEX IF NOT EXISTS idx_bids_vendor_id ON public.bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_contracts_event_id ON public.contracts(event_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON public.contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Vendors policies
CREATE POLICY "Anyone can view verified vendors" ON public.vendors
  FOR SELECT USING (verified = true);

CREATE POLICY "Vendors can view own profile" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own profile" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert own profile" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Clients can view own events" ON public.events
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Vendors can view open events" ON public.events
  FOR SELECT USING (forge_status IN ('OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING'));

CREATE POLICY "Clients can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Clients can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- Bids policies
CREATE POLICY "Vendors can view own bids" ON public.bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = bids.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view bids on own events" ON public.bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = bids.event_id
      AND events.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create bids" ON public.bids
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = bids.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own bids" ON public.bids
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = bids.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Contracts policies
CREATE POLICY "Parties can view own contracts" ON public.contracts
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = contracts.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Parties can view payments on own contracts" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = payments.contract_id
      AND (
        contracts.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.vendors
          WHERE vendors.id = contracts.vendor_id
          AND vendors.user_id = auth.uid()
        )
      )
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Clients can create reviews for completed contracts" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Vendors can respond to reviews" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = reviews.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
