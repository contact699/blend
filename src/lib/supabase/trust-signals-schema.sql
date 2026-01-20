-- ============================================================================
-- Trust Signals System Database Schema
-- Replaces old verification/trust score system
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Community Vouching
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vouches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  relationship TEXT NOT NULL CHECK (relationship IN ('met_irl', 'partner', 'friend', 'event_cohost', 'community_member')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Prevent self-vouching
  CONSTRAINT no_self_vouch CHECK (from_user_id != to_user_id),

  -- One vouch per user pair
  UNIQUE(from_user_id, to_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vouches_to_user ON public.vouches(to_user_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_vouches_from_user ON public.vouches(from_user_id);
CREATE INDEX IF NOT EXISTS idx_vouches_status ON public.vouches(status);

-- Row Level Security
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;

-- Users can view vouches they're involved in
CREATE POLICY "Users can view their vouches"
  ON public.vouches FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can view approved vouches for any profile
CREATE POLICY "Anyone can view approved vouches"
  ON public.vouches FOR SELECT
  USING (status = 'approved');

-- Users can create vouch requests
CREATE POLICY "Users can create vouch requests"
  ON public.vouches FOR INSERT
  WITH CHECK (auth.uid() = from_user_id AND status = 'pending');

-- Users can approve/reject vouches directed to them
CREATE POLICY "Users can respond to vouch requests"
  ON public.vouches FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Users can revoke vouches they gave
CREATE POLICY "Users can revoke their vouches"
  ON public.vouches FOR UPDATE
  USING (auth.uid() = from_user_id AND status = 'approved')
  WITH CHECK (auth.uid() = from_user_id);

-- ============================================================================
-- Activity Metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_metrics (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  average_response_time_hours NUMERIC(10,2),
  response_rate NUMERIC(5,2) DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  event_attendance_count INTEGER DEFAULT 0,
  profile_views_received INTEGER DEFAULT 0,
  profile_completeness NUMERIC(5,2) DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_activity_last_active ON public.activity_metrics(last_active_at DESC);

-- Row Level Security
ALTER TABLE public.activity_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view their own metrics
CREATE POLICY "Users can view their own activity metrics"
  ON public.activity_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public metrics of others (limited fields)
CREATE POLICY "Anyone can view public activity metrics"
  ON public.activity_metrics FOR SELECT
  USING (true);

-- System can update metrics
CREATE POLICY "System can update activity metrics"
  ON public.activity_metrics FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- System can insert metrics
CREATE POLICY "System can insert activity metrics"
  ON public.activity_metrics FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- AI Verification Results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('photo_consistency', 'message_pattern', 'profile_text')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'review_needed')),
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  details JSONB DEFAULT '{}'::JSONB,
  flagged_reasons TEXT[] DEFAULT '{}',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_verifications_user ON public.ai_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_verifications_status ON public.ai_verifications(status);
CREATE INDEX IF NOT EXISTS idx_ai_verifications_type ON public.ai_verifications(verification_type);

-- Row Level Security
ALTER TABLE public.ai_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI verification results
CREATE POLICY "Users can view their own AI verifications"
  ON public.ai_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Moderators can view all (TODO: add moderator role check)
CREATE POLICY "System can manage AI verifications"
  ON public.ai_verifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Suspicious Account Reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suspicious_account_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('ai_flagged', 'user_reported', 'pattern_detected')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  assigned_to UUID REFERENCES public.users(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.suspicious_account_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.suspicious_account_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.suspicious_account_reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_assigned ON public.suspicious_account_reports(assigned_to);

-- Row Level Security
ALTER TABLE public.suspicious_account_reports ENABLE ROW LEVEL SECURITY;

-- Users can view reports they created
CREATE POLICY "Users can view their own reports"
  ON public.suspicious_account_reports FOR SELECT
  USING (auth.uid() = reported_by_user_id);

-- Moderators can view all (TODO: add moderator role check)
CREATE POLICY "System can manage reports"
  ON public.suspicious_account_reports FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update vouch counts (for caching)
CREATE OR REPLACE FUNCTION update_vouch_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache or update count in profiles table
  -- This can be expanded based on your caching strategy
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on vouches table
CREATE TRIGGER trigger_update_vouch_count
  AFTER INSERT OR UPDATE OR DELETE ON public.vouches
  FOR EACH ROW
  EXECUTE FUNCTION update_vouch_count();

-- Function to update last_active_at
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.activity_metrics
  SET last_active_at = NOW(), updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Create record if doesn't exist
  INSERT INTO public.activity_metrics (user_id, last_active_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on messages table (update last active)
CREATE TRIGGER trigger_update_last_active_messages
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  completeness NUMERIC := 0;
  photo_count INTEGER;
  bio_length INTEGER;
  has_video BOOLEAN;
  partner_count INTEGER;
BEGIN
  -- Get profile data
  SELECT
    COALESCE(array_length(photos, 1), 0),
    COALESCE(length(bio), 0)
  INTO photo_count, bio_length
  FROM profiles WHERE id = profile_id;

  -- Basic info (name, age, location) - 20%
  completeness := completeness + 20;

  -- Photos (at least 3) - 20%
  IF photo_count >= 3 THEN
    completeness := completeness + 20;
  ELSIF photo_count > 0 THEN
    completeness := completeness + (photo_count * 6.66);
  END IF;

  -- Bio (at least 100 chars) - 15%
  IF bio_length >= 100 THEN
    completeness := completeness + 15;
  ELSIF bio_length > 0 THEN
    completeness := completeness + (bio_length * 0.15);
  END IF;

  -- Relationship style - 10%
  -- TODO: Check if relationship_style is set

  -- Interests (at least 3) - 10%
  -- TODO: Check interests count

  -- Consent checklist - 10%
  -- TODO: Check if consent checklist is filled

  -- Partner links - 10%
  SELECT COUNT(*)
  INTO partner_count
  FROM partner_links
  WHERE user_id = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND status = 'confirmed';

  IF partner_count >= 1 THEN
    completeness := completeness + 10;
  END IF;

  -- Video profile - 5%
  SELECT EXISTS(
    SELECT 1 FROM video_profiles
    WHERE profile_id = profile_id
      AND moderation_status = 'approved'
  ) INTO has_video;

  IF has_video THEN
    completeness := completeness + 5;
  END IF;

  RETURN LEAST(completeness, 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- View: User trust signals summary
CREATE OR REPLACE VIEW user_trust_signals AS
SELECT
  u.id as user_id,
  p.id as profile_id,

  -- Community vouches
  COALESCE(v.vouch_count, 0) as community_vouches,

  -- Account age
  EXTRACT(DAY FROM (NOW() - u.created_at))::INTEGER as account_age_days,

  -- Activity metrics
  am.last_active_at,
  am.response_rate,
  am.profile_completeness,
  am.event_attendance_count,

  -- Partner links
  COALESCE(pl.partner_count, 0) as partner_count,

  -- Verifications
  EXISTS(
    SELECT 1 FROM video_profiles vp
    WHERE vp.profile_id = p.id
      AND vp.moderation_status = 'approved'
  ) as has_video_profile,

  EXISTS(
    SELECT 1 FROM ai_verifications av
    WHERE av.user_id = u.id
      AND av.verification_type = 'photo_consistency'
      AND av.status = 'pass'
  ) as is_ai_verified

FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN activity_metrics am ON am.user_id = u.id
LEFT JOIN (
  SELECT to_user_id, COUNT(*) as vouch_count
  FROM vouches
  WHERE status = 'approved'
  GROUP BY to_user_id
) v ON v.to_user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as partner_count
  FROM partner_links
  WHERE status = 'confirmed'
  GROUP BY user_id
) pl ON pl.user_id = u.id;

-- ============================================================================
-- Initial Data / Seed
-- ============================================================================

-- Create activity metrics for all existing users
INSERT INTO public.activity_metrics (user_id, last_active_at)
SELECT id, created_at FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON user_trust_signals TO authenticated;
