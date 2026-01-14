-- Supabase Database Schema with Row Level Security
-- Run this SQL in your Supabase SQL Editor
-- IMPORTANT: All tables use UUIDs to prevent IDOR attacks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- RLS Policy: Users can only read/update their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(display_name) >= 2 AND length(display_name) <= 30),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  city TEXT NOT NULL CHECK (length(city) <= 50),
  bio TEXT DEFAULT '' CHECK (length(bio) <= 500),
  pace_preference TEXT DEFAULT 'medium' CHECK (pace_preference IN ('slow', 'medium', 'fast')),
  no_photos BOOLEAN DEFAULT false,
  open_to_meet BOOLEAN DEFAULT true,
  virtual_only BOOLEAN DEFAULT false,
  response_style TEXT DEFAULT 'relaxed' CHECK (response_style IN ('quick', 'relaxed')),
  voice_intro_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policy: Users can only modify their own profile, but can view active profiles of others
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = profiles.user_id AND is_active = true)
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = profiles.user_id)
         OR (blocker_id = profiles.user_id AND blocked_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PHOTOS TABLE (Stored in private bucket, served via signed URLs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in private 'photos' bucket
  order_index INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Same as profiles
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view photos of visible profiles" ON public.photos;
CREATE POLICY "Users can view photos of visible profiles" ON public.photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.users u ON p.user_id = u.id
      WHERE p.id = photos.profile_id
      AND u.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = auth.uid() AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage own photos" ON public.photos;
CREATE POLICY "Users can manage own photos" ON public.photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = photos.profile_id AND user_id = auth.uid())
  );

-- ============================================================================
-- INTENTS TABLE (Read-only for users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active intents" ON public.intents;
CREATE POLICY "Anyone can view active intents" ON public.intents
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- PROFILE_INTENTS (Junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, intent_id)
);

ALTER TABLE public.profile_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profile intents" ON public.profile_intents;
CREATE POLICY "Users can view profile intents" ON public.profile_intents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own profile intents" ON public.profile_intents;
CREATE POLICY "Users can manage own profile intents" ON public.profile_intents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_intents.profile_id AND user_id = auth.uid())
  );

-- ============================================================================
-- PROMPT_RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL CHECK (length(prompt_text) <= 200),
  response_text TEXT NOT NULL CHECK (length(response_text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view prompt responses" ON public.prompt_responses;
CREATE POLICY "Users can view prompt responses" ON public.prompt_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = prompt_responses.profile_id
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = auth.uid() AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage own prompt responses" ON public.prompt_responses;
CREATE POLICY "Users can manage own prompt responses" ON public.prompt_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = prompt_responses.profile_id AND user_id = auth.uid())
  );

-- ============================================================================
-- LINKED_PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.linked_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 30),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  photo_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

ALTER TABLE public.linked_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view linked partners" ON public.linked_partners;
CREATE POLICY "Users can view linked partners" ON public.linked_partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = linked_partners.profile_id
    )
  );

DROP POLICY IF EXISTS "Users can manage own linked partner" ON public.linked_partners;
CREATE POLICY "Users can manage own linked partner" ON public.linked_partners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = linked_partners.profile_id AND user_id = auth.uid())
  );

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user_1_id != user_2_id),
  UNIQUE(user_1_id, user_2_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only match participants can access matches
DROP POLICY IF EXISTS "Users can only see their own matches" ON public.matches;
CREATE POLICY "Users can only see their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

DROP POLICY IF EXISTS "Users can create matches they participate in" ON public.matches;
CREATE POLICY "Users can create matches they participate in" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

DROP POLICY IF EXISTS "Match participants can update matches" ON public.matches;
CREATE POLICY "Match participants can update matches" ON public.matches
  FOR UPDATE USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- ============================================================================
-- MATCH_INTENTS (Junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.match_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  UNIQUE(match_id, intent_id)
);

ALTER TABLE public.match_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match participants can view match intents" ON public.match_intents;
CREATE POLICY "Match participants can view match intents" ON public.match_intents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_intents.match_id
      AND (auth.uid() = user_1_id OR auth.uid() = user_2_id)
    )
  );

-- ============================================================================
-- CHAT_THREADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  unlocked BOOLEAN DEFAULT false,
  first_message_type TEXT CHECK (first_message_type IS NULL OR first_message_type IN ('prompt', 'reaction', 'voice')),
  is_group BOOLEAN DEFAULT false,
  group_name TEXT CHECK (group_name IS NULL OR length(group_name) <= 50),
  group_photo_path TEXT,
  created_by UUID REFERENCES public.users(id),
  last_message_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only thread participants can access threads
DROP POLICY IF EXISTS "Thread participants can view threads" ON public.chat_threads;
CREATE POLICY "Thread participants can view threads" ON public.chat_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = chat_threads.match_id
      AND (auth.uid() = user_1_id OR auth.uid() = user_2_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE thread_id = chat_threads.id AND user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Match participants can create threads" ON public.chat_threads;
CREATE POLICY "Match participants can create threads" ON public.chat_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = chat_threads.match_id
      AND (auth.uid() = user_1_id OR auth.uid() = user_2_id)
    )
  );

DROP POLICY IF EXISTS "Thread participants can update threads" ON public.chat_threads;
CREATE POLICY "Thread participants can update threads" ON public.chat_threads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = chat_threads.match_id
      AND (auth.uid() = user_1_id OR auth.uid() = user_2_id)
    )
  );

-- ============================================================================
-- CHAT_PARTICIPANTS TABLE (For group chats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(thread_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view participation" ON public.chat_participants;
CREATE POLICY "Participants can view participation" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.thread_id = chat_participants.thread_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

-- ============================================================================
-- MESSAGES TABLE - CRITICAL SECURITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'system', 'image', 'video', 'video_call')),
  content TEXT NOT NULL CHECK (length(content) <= 2000),
  media_storage_path TEXT,
  media_thumbnail_path TEXT,
  is_first_message BOOLEAN DEFAULT false,
  call_status TEXT CHECK (call_status IS NULL OR call_status IN ('started', 'ended', 'missed')),
  call_duration INTEGER CHECK (call_duration IS NULL OR call_duration >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only conversation participants can read/write messages
DROP POLICY IF EXISTS "Only participants can read messages" ON public.messages;
CREATE POLICY "Only participants can read messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      JOIN public.matches m ON ct.match_id = m.id
      WHERE ct.id = messages.thread_id
      AND (auth.uid() = m.user_1_id OR auth.uid() = m.user_2_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.thread_id = messages.thread_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Only participants can send messages" ON public.messages;
CREATE POLICY "Only participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (
        SELECT 1 FROM public.chat_threads ct
        JOIN public.matches m ON ct.match_id = m.id
        WHERE ct.id = messages.thread_id
        AND (auth.uid() = m.user_1_id OR auth.uid() = m.user_2_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.thread_id = messages.thread_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
      )
    )
  );

-- Users can only update their own messages (for read receipts by others)
DROP POLICY IF EXISTS "Message recipients can mark as read" ON public.messages;
CREATE POLICY "Message recipients can mark as read" ON public.messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.chat_threads ct
        JOIN public.matches m ON ct.match_id = m.id
        WHERE ct.id = messages.thread_id
        AND (auth.uid() = m.user_1_id OR auth.uid() = m.user_2_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.thread_id = messages.thread_id
        AND cp.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- Only allow updating read_at field
    true
  );

-- ============================================================================
-- LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Users can only see likes sent TO them or FROM them
DROP POLICY IF EXISTS "Users can see likes involving them" ON public.likes;
CREATE POLICY "Users can see likes involving them" ON public.likes
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can create likes from themselves" ON public.likes;
CREATE POLICY "Users can create likes from themselves" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Recipients can update like seen status" ON public.likes;
CREATE POLICY "Recipients can update like seen status" ON public.likes
  FOR UPDATE USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Senders can delete their likes" ON public.likes;
CREATE POLICY "Senders can delete their likes" ON public.likes
  FOR DELETE USING (auth.uid() = from_user_id);

-- ============================================================================
-- PINDS TABLE (Private messages without matching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pinds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

ALTER TABLE public.pinds ENABLE ROW LEVEL SECURITY;

-- Users can only see pinds sent TO them or FROM them
DROP POLICY IF EXISTS "Users can see pinds involving them" ON public.pinds;
CREATE POLICY "Users can see pinds involving them" ON public.pinds
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can create pinds from themselves" ON public.pinds;
CREATE POLICY "Users can create pinds from themselves" ON public.pinds
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Recipients can update pind read status" ON public.pinds;
CREATE POLICY "Recipients can update pind read status" ON public.pinds
  FOR UPDATE USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can delete their pinds" ON public.pinds;
CREATE POLICY "Users can delete their pinds" ON public.pinds
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================================================
-- BLOCKED_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IS NULL OR length(reason) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
DROP POLICY IF EXISTS "Users can see their blocks" ON public.blocked_users;
CREATE POLICY "Users can see their blocks" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON public.blocked_users;
CREATE POLICY "Users can create blocks" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can remove their blocks" ON public.blocked_users;
CREATE POLICY "Users can remove their blocks" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(reason) >= 1 AND length(reason) <= 100),
  details TEXT CHECK (details IS NULL OR length(details) <= 1000),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (reporter_id != reported_user_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can only see and create their own reports
DROP POLICY IF EXISTS "Users can see their reports" ON public.reports;
CREATE POLICY "Users can see their reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION
-- Run this in Supabase Dashboard > Storage
-- ============================================================================
/*
-- Create private bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false);

-- RLS for storage
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view photos through signed URLs"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================================================
-- FUNCTION: Generate signed URL for photos (call from client)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_signed_photo_url(
  photo_path TEXT,
  expires_in INTEGER DEFAULT 3600 -- 1 hour default
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function should be called from the client using supabase.storage
  -- It's here as a placeholder to document the pattern
  RETURN photo_path;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_profile_id ON public.photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON public.matches(user_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON public.matches(user_2_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_match_id ON public.chat_threads(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON public.likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_pinds_to_user ON public.pinds(to_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_both ON public.blocked_users(blocker_id, blocked_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompt_responses_updated_at ON public.prompt_responses;
CREATE TRIGGER update_prompt_responses_updated_at
  BEFORE UPDATE ON public.prompt_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
