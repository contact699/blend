-- Events Schema for Supabase
-- Run this AFTER the main schema.sql

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
  description TEXT NOT NULL CHECK (length(description) <= 2000),
  cover_image_path TEXT,
  category TEXT NOT NULL CHECK (category IN ('social', 'dating', 'education', 'party', 'outdoor', 'wellness', 'meetup', 'virtual', 'private', 'community')),
  tags TEXT[] DEFAULT '{}',
  -- Location fields
  location_name TEXT NOT NULL,
  location_address TEXT,
  location_city TEXT NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  -- Date/time
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  -- Capacity
  max_attendees INTEGER CHECK (max_attendees IS NULL OR max_attendees > 0),
  current_attendees INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  -- Settings
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'invite_only', 'private')),
  requires_approval BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT CHECK (recurring_pattern IS NULL OR recurring_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
  parent_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public events are visible to all authenticated users
DROP POLICY IF EXISTS "Users can view public events" ON public.events;
CREATE POLICY "Users can view public events" ON public.events
  FOR SELECT USING (
    visibility = 'public' AND status = 'published'
    OR host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.event_rsvps
      WHERE event_id = events.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own events" ON public.events;
CREATE POLICY "Hosts can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own events" ON public.events;
CREATE POLICY "Hosts can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = host_id);

-- ============================================================================
-- EVENT_RSVPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going', 'waitlist', 'pending_approval')),
  message TEXT CHECK (message IS NULL OR length(message) <= 500),
  waitlist_position INTEGER,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view RSVPs for events they can see" ON public.event_rsvps;
CREATE POLICY "Users can view RSVPs for events they can see" ON public.event_rsvps
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_rsvps.event_id
      AND (host_id = auth.uid() OR visibility = 'public')
    )
  );

DROP POLICY IF EXISTS "Users can RSVP to events" ON public.event_rsvps;
CREATE POLICY "Users can RSVP to events" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can update own RSVP" ON public.event_rsvps
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.events WHERE id = event_rsvps.event_id AND host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can delete own RSVP" ON public.event_rsvps
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- EVENT_HOSTS VIEW (for fetching host info with events)
-- ============================================================================
CREATE OR REPLACE VIEW public.event_hosts AS
SELECT 
  u.id as user_id,
  COALESCE(p.display_name, 'Anonymous') as display_name,
  (SELECT storage_path FROM public.photos WHERE profile_id = p.id AND is_primary = true LIMIT 1) as photo_path,
  COALESCE(
    (SELECT COUNT(*)::integer FROM public.events WHERE host_id = u.id AND status = 'completed'),
    0
  ) as events_hosted,
  4 as reputation_stars -- Default, can be calculated from reviews later
FROM public.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_events_host_id ON public.events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON public.event_rsvps;
CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
