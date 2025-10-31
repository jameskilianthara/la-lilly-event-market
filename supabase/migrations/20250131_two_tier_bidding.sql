-- Two-Tier Competitive Bidding System Migration
-- Adds support for shortlisting and final bidding rounds

-- Add new fields to bids table for competitive bidding
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS bid_round INTEGER DEFAULT 1;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS is_final_bid BOOLEAN DEFAULT false;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS revised_from_bid_id UUID REFERENCES public.bids(id);
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS competitive_intelligence JSONB DEFAULT NULL;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Add new fields to events table for shortlisting workflow
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS shortlist_finalized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS final_bidding_closes_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster bid round queries
CREATE INDEX IF NOT EXISTS idx_bids_bid_round ON public.bids(bid_round);
CREATE INDEX IF NOT EXISTS idx_bids_revised_from ON public.bids(revised_from_bid_id);
CREATE INDEX IF NOT EXISTS idx_bids_shortlisted_at ON public.bids(shortlisted_at);

-- Add comments for documentation
COMMENT ON COLUMN public.bids.bid_round IS 'Bidding round: 1 = initial, 2 = final';
COMMENT ON COLUMN public.bids.is_final_bid IS 'True if this is the final revised bid';
COMMENT ON COLUMN public.bids.revised_from_bid_id IS 'Reference to original bid if this is a revision';
COMMENT ON COLUMN public.bids.competitive_intelligence IS 'JSON with position, premium %, deadline for shortlisted vendors';
COMMENT ON COLUMN public.events.shortlist_finalized_at IS 'Timestamp when shortlisting was processed';
COMMENT ON COLUMN public.events.final_bidding_closes_at IS 'Deadline for final bids (48 hours after shortlisting)';

-- Add RLS policy for accessing revised bids
-- Vendors can view their own revised bids
CREATE POLICY "Vendors can view own revised bids" ON public.bids
  FOR SELECT USING (
    revised_from_bid_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = bids.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.bids TO authenticated;
GRANT ALL ON public.events TO authenticated;
