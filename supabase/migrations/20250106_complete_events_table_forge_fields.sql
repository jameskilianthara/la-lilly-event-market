-- Migration: Complete Events Table for ForgeChat
-- Date: 2025-01-06
-- Description: Ensures all required columns exist for ForgeChat event creation flow
-- This migration is idempotent and safe to run multiple times

-- STEP 1: Ensure events table exists with basic structure
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Add owner_user_id column (critical for RLS and ownership)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'owner_user_id'
  ) THEN
    -- Add column without NOT NULL first
    ALTER TABLE public.events ADD COLUMN owner_user_id UUID;

    -- Add foreign key constraint to users table (not auth.users)
    ALTER TABLE public.events
      ADD CONSTRAINT events_owner_user_id_fkey
      FOREIGN KEY (owner_user_id)
      REFERENCES public.users(id)
      ON DELETE CASCADE;

    RAISE NOTICE 'Added owner_user_id column to events table';
  ELSE
    RAISE NOTICE 'owner_user_id column already exists';
  END IF;
END $$;

-- STEP 3: Add title column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.events ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Event';
    -- Remove default after adding
    ALTER TABLE public.events ALTER COLUMN title DROP DEFAULT;
    RAISE NOTICE 'Added title column to events table';
  ELSE
    RAISE NOTICE 'title column already exists';
  END IF;
END $$;

-- STEP 4: Add event_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'event_type'
  ) THEN
    ALTER TABLE public.events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'General Event';
    ALTER TABLE public.events ALTER COLUMN event_type DROP DEFAULT;
    RAISE NOTICE 'Added event_type column to events table';
  ELSE
    RAISE NOTICE 'event_type column already exists';
  END IF;
END $$;

-- STEP 5: Add date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'date'
  ) THEN
    ALTER TABLE public.events ADD COLUMN date DATE;
    RAISE NOTICE 'Added date column to events table';
  ELSE
    RAISE NOTICE 'date column already exists';
  END IF;
END $$;

-- STEP 6: Add city column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.events ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column to events table';
  ELSE
    RAISE NOTICE 'city column already exists';
  END IF;
END $$;

-- STEP 7: Add venue_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'venue_name'
  ) THEN
    ALTER TABLE public.events ADD COLUMN venue_name TEXT;
    RAISE NOTICE 'Added venue_name column to events table';
  ELSE
    RAISE NOTICE 'venue_name column already exists';
  END IF;
END $$;

-- STEP 8: Add venue_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'venue_status'
  ) THEN
    ALTER TABLE public.events ADD COLUMN venue_status TEXT;
    RAISE NOTICE 'Added venue_status column to events table';
  ELSE
    RAISE NOTICE 'venue_status column already exists';
  END IF;
END $$;

-- STEP 9: Add guest_count column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'guest_count'
  ) THEN
    ALTER TABLE public.events ADD COLUMN guest_count INTEGER;
    RAISE NOTICE 'Added guest_count column to events table';
  ELSE
    RAISE NOTICE 'guest_count column already exists';
  END IF;
END $$;

-- STEP 10: Add budget_range column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE public.events ADD COLUMN budget_range TEXT;
    RAISE NOTICE 'Added budget_range column to events table';
  ELSE
    RAISE NOTICE 'budget_range column already exists';
  END IF;
END $$;

-- STEP 11: Add client_brief JSONB column (stores ForgeChat conversation data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'client_brief'
  ) THEN
    ALTER TABLE public.events ADD COLUMN client_brief JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added client_brief column to events table';
  ELSE
    RAISE NOTICE 'client_brief column already exists';
  END IF;
END $$;

-- STEP 12: Add forge_blueprint JSONB column (stores selected blueprint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'forge_blueprint'
  ) THEN
    ALTER TABLE public.events ADD COLUMN forge_blueprint JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added forge_blueprint column to events table';
  ELSE
    RAISE NOTICE 'forge_blueprint column already exists';
  END IF;
END $$;

-- STEP 13: Add forge_status column with proper constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'forge_status'
  ) THEN
    ALTER TABLE public.events ADD COLUMN forge_status TEXT NOT NULL DEFAULT 'BLUEPRINT_READY';

    -- Add constraint for valid statuses
    ALTER TABLE public.events
      ADD CONSTRAINT events_forge_status_check
      CHECK (
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
      );

    RAISE NOTICE 'Added forge_status column to events table';
  ELSE
    RAISE NOTICE 'forge_status column already exists';
  END IF;
END $$;

-- STEP 14: Add bidding_closes_at column (for vendor bidding phase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'bidding_closes_at'
  ) THEN
    ALTER TABLE public.events ADD COLUMN bidding_closes_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added bidding_closes_at column to events table';
  ELSE
    RAISE NOTICE 'bidding_closes_at column already exists';
  END IF;
END $$;

-- STEP 15: Create indexes for performance
CREATE INDEX IF NOT EXISTS events_owner_user_id_idx ON public.events(owner_user_id);
CREATE INDEX IF NOT EXISTS events_forge_status_idx ON public.events(forge_status);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON public.events(event_type);
CREATE INDEX IF NOT EXISTS events_city_idx ON public.events(city);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(date);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON public.events(created_at DESC);

-- STEP 16: Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- STEP 17: Create RLS policies if they don't exist

-- Policy: Clients can view their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events'
    AND policyname = 'Clients can view own events'
  ) THEN
    CREATE POLICY "Clients can view own events" ON public.events
      FOR SELECT USING (auth.uid() = owner_user_id);
    RAISE NOTICE 'Created SELECT policy for events';
  END IF;
END $$;

-- Policy: Clients can create events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events'
    AND policyname = 'Clients can create events'
  ) THEN
    CREATE POLICY "Clients can create events" ON public.events
      FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
    RAISE NOTICE 'Created INSERT policy for events';
  END IF;
END $$;

-- Policy: Clients can update their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events'
    AND policyname = 'Clients can update own events'
  ) THEN
    CREATE POLICY "Clients can update own events" ON public.events
      FOR UPDATE USING (auth.uid() = owner_user_id);
    RAISE NOTICE 'Created UPDATE policy for events';
  END IF;
END $$;

-- Policy: Vendors can view open events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events'
    AND policyname = 'Vendors can view open events'
  ) THEN
    CREATE POLICY "Vendors can view open events" ON public.events
      FOR SELECT USING (forge_status IN ('OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING'));
    RAISE NOTICE 'Created vendor SELECT policy for events';
  END IF;
END $$;

-- STEP 18: Verify all required columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events'
AND column_name IN (
  'id',
  'owner_user_id',
  'title',
  'event_type',
  'date',
  'city',
  'venue_name',
  'venue_status',
  'guest_count',
  'budget_range',
  'client_brief',
  'forge_blueprint',
  'forge_status',
  'bidding_closes_at',
  'created_at',
  'updated_at'
)
ORDER BY
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'owner_user_id' THEN 2
    WHEN 'title' THEN 3
    WHEN 'event_type' THEN 4
    WHEN 'date' THEN 5
    WHEN 'city' THEN 6
    WHEN 'guest_count' THEN 7
    WHEN 'client_brief' THEN 8
    WHEN 'forge_blueprint' THEN 9
    WHEN 'forge_status' THEN 10
    ELSE 99
  END;
