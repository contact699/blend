-- ============================================================================
-- MONETIZATION & PREMIUM FEATURES SCHEMA
-- ============================================================================
-- This schema adds subscription tiers, virtual goods, verification system,
-- video profiles, safety features, and all premium functionality

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'premium_plus')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),

  -- Billing
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL, -- cents
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Provider integration (Stripe/RevenueCat)
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'apple', 'google')),
  provider_subscription_id TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,

  -- Dates
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  UNIQUE(user_id, status) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_provider_id ON public.subscriptions(provider_subscription_id);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUPER LIKES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.super_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  message TEXT, -- Optional ice breaker
  seen BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_super_likes_to_user ON public.super_likes(to_user_id, seen);
CREATE INDEX idx_super_likes_from_user ON public.super_likes(from_user_id);

-- RLS
ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create super likes"
  ON public.super_likes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view super likes they sent or received"
  ON public.super_likes FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================================================
-- PROFILE BOOSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profile_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  duration_minutes INTEGER NOT NULL DEFAULT 30,
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Analytics
  impressions INTEGER DEFAULT 0,
  likes_gained INTEGER DEFAULT 0,

  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'canceled')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_boosts_user ON public.profile_boosts(user_id);
CREATE INDEX idx_profile_boosts_status ON public.profile_boosts(status, ends_at);

-- RLS
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own boosts"
  ON public.profile_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create boosts"
  ON public.profile_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DAILY USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  likes_used INTEGER DEFAULT 0,
  super_likes_used INTEGER DEFAULT 0,
  boosts_used INTEGER DEFAULT 0,
  rewinds_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_usage_user_date ON public.daily_usage(user_id, date DESC);

-- RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- VIRTUAL GIFTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.virtual_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  animation_url TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('romantic', 'playful', 'spicy', 'appreciation')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sent_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID NOT NULL REFERENCES public.virtual_gifts(id),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,

  message TEXT,
  viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sent_gifts_to_user ON public.sent_gifts(to_user_id);
CREATE INDEX idx_sent_gifts_thread ON public.sent_gifts(thread_id);

-- RLS
ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gift catalog"
  ON public.virtual_gifts FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can send gifts"
  ON public.sent_gifts FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view gifts they sent or received"
  ON public.sent_gifts FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================================================
-- REFERRAL PROGRAM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER, -- null = unlimited
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code) WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'expired')),

  -- Rewards
  referrer_reward_type TEXT NOT NULL CHECK (referrer_reward_type IN ('premium_days', 'credits', 'super_likes')),
  referrer_reward_amount INTEGER NOT NULL,
  referrer_reward_claimed BOOLEAN DEFAULT FALSE,

  referred_reward_type TEXT NOT NULL CHECK (referred_reward_type IN ('premium_days', 'credits', 'super_likes')),
  referred_reward_amount INTEGER NOT NULL,
  referred_reward_claimed BOOLEAN DEFAULT FALSE,

  -- Conditions
  required_action TEXT NOT NULL CHECK (required_action IN ('signup', 'first_match', 'premium_purchase')),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  UNIQUE(referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);

-- RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view referrals they're involved in"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

-- ============================================================================
-- VERIFICATION SYSTEM (replacing trust scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'id_verified', 'photo_verified', 'video_verified', 'phone_verified',
    'email_verified', 'sti_verified', 'event_host', 'community_vouched'
  )),

  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),

  -- Evidence
  evidence_url TEXT,
  verification_data JSONB,

  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  verified_by UUID REFERENCES public.users(id), -- Admin
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, type) WHERE status = 'approved'
);

CREATE INDEX idx_verifications_user ON public.verifications(user_id);
CREATE INDEX idx_verifications_status ON public.verifications(status);

-- RLS
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved verifications of others"
  ON public.verifications FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can submit verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMUNITY VOUCHES (replacing trust score vouching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_vouches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vouched_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  relationship TEXT NOT NULL CHECK (relationship IN ('friend', 'partner', 'metamour', 'dated', 'event_attendee')),
  message TEXT NOT NULL,

  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  show_voucher_name BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(voucher_id, vouched_user_id)
);

CREATE INDEX idx_community_vouches_vouched ON public.community_vouches(vouched_user_id) WHERE is_public = TRUE;

-- RLS
ALTER TABLE public.community_vouches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create vouches"
  ON public.community_vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id);

CREATE POLICY "Users can view public vouches"
  ON public.community_vouches FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can view vouches they created or received"
  ON public.community_vouches FOR SELECT
  USING (auth.uid() = voucher_id OR auth.uid() = vouched_user_id);

-- ============================================================================
-- VIDEO PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,

  -- Moderation
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,

  -- Stats
  view_count INTEGER DEFAULT 0,

  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_profiles_profile ON public.video_profiles(profile_id);
CREATE INDEX idx_video_profiles_moderation ON public.video_profiles(moderation_status);

-- RLS
ALTER TABLE public.video_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video profiles"
  ON public.video_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved video profiles"
  ON public.video_profiles FOR SELECT
  USING (moderation_status = 'approved');

CREATE POLICY "Users can create video profiles"
  ON public.video_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SAFETY CHECK-INS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.safety_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Date details
  date_with_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  date_with_name TEXT NOT NULL,
  location TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,

  -- Trusted contact
  trusted_contact_name TEXT NOT NULL,
  trusted_contact_phone TEXT NOT NULL,
  trusted_contact_email TEXT NOT NULL,

  -- Check-ins
  check_ins JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Emergency
  emergency_triggered BOOLEAN DEFAULT FALSE,
  emergency_triggered_at TIMESTAMPTZ,
  emergency_resolved_at TIMESTAMPTZ,

  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'emergency', 'canceled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_checkins_user ON public.safety_checkins(user_id);
CREATE INDEX idx_safety_checkins_status ON public.safety_checkins(status, scheduled_time);

-- RLS
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own safety check-ins"
  ON public.safety_checkins FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- GROUP PROFILES (Couple Mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT NOT NULL,

  member_profile_ids UUID[] NOT NULL,
  primary_profile_id UUID NOT NULL REFERENCES public.profiles(id),

  photos JSONB DEFAULT '[]'::JSONB,

  -- Discovery settings
  seeking TEXT[] DEFAULT '{}',
  intent_ids UUID[] DEFAULT '{}',

  -- Stats
  like_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,

  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_profiles_primary ON public.group_profiles(primary_profile_id);
CREATE INDEX idx_group_profiles_active ON public.group_profiles(active);

CREATE TABLE IF NOT EXISTS public.group_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_group_id UUID REFERENCES public.group_profiles(id) ON DELETE CASCADE,
  from_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_group_id UUID REFERENCES public.group_profiles(id) ON DELETE CASCADE,
  to_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (from_group_id IS NOT NULL AND from_profile_id IS NULL) OR
    (from_group_id IS NULL AND from_profile_id IS NOT NULL)
  ),
  CHECK (
    (to_group_id IS NOT NULL AND to_profile_id IS NULL) OR
    (to_group_id IS NULL AND to_profile_id IS NOT NULL)
  ),
  UNIQUE(from_group_id, from_profile_id, to_group_id, to_profile_id)
);

-- RLS
ALTER TABLE public.group_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active group profiles"
  ON public.group_profiles FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Users can manage group profiles they're in"
  ON public.group_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = ANY(member_profile_ids) AND p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RELATIONSHIP DASHBOARD
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.relationship_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('preferences', 'boundaries', 'health', 'dates', 'general')),

  is_shared BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relationship_notes_user ON public.relationship_notes(user_id);

CREATE TABLE IF NOT EXISTS public.relationship_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  partner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  partner_name TEXT NOT NULL,

  event_type TEXT NOT NULL CHECK (event_type IN ('date', 'anniversary', 'check_in', 'sti_test', 'other')),
  title TEXT NOT NULL,
  description TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,

  reminder_minutes INTEGER[] DEFAULT '{60, 1440}', -- 1 hour, 1 day

  recurring TEXT NOT NULL DEFAULT 'none' CHECK (recurring IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relationship_calendar_user ON public.relationship_calendar(user_id, start_time);

-- RLS
ALTER TABLE public.relationship_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own relationship notes"
  ON public.relationship_notes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can view shared notes"
  ON public.relationship_notes FOR SELECT
  USING (is_shared = TRUE AND auth.uid() = partner_user_id);

CREATE POLICY "Users can manage their own calendar"
  ON public.relationship_calendar FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- EDUCATIONAL CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.educational_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  author_bio TEXT,

  thumbnail_url TEXT NOT NULL,

  category TEXT NOT NULL CHECK (category IN ('communication', 'jealousy', 'boundaries', 'safety', 'sti', 'relationships')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  duration_minutes INTEGER NOT NULL,
  lesson_count INTEGER DEFAULT 0,

  -- Pricing
  is_free BOOLEAN DEFAULT FALSE,
  price_cents INTEGER DEFAULT 0,
  included_in_premium BOOLEAN DEFAULT FALSE,

  -- Stats
  enrollment_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_educational_courses_published ON public.educational_courses(published, category);
CREATE INDEX idx_educational_courses_slug ON public.educational_courses(slug);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown
  video_url TEXT,

  display_order INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,

  quiz_questions JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_lessons_course ON public.course_lessons(course_id, display_order);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,

  progress INTEGER DEFAULT 0, -- 0-100
  completed_lessons UUID[] DEFAULT '{}',

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);

-- RLS
ALTER TABLE public.educational_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON public.educational_courses FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Anyone can view lessons of published courses"
  ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.educational_courses c
      WHERE c.id = course_id AND c.published = TRUE
    )
  );

CREATE POLICY "Users can manage their own enrollments"
  ON public.course_enrollments FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_profiles_updated_at BEFORE UPDATE ON public.video_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_checkins_updated_at BEFORE UPDATE ON public.safety_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_profiles_updated_at BEFORE UPDATE ON public.group_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationship_notes_updated_at BEFORE UPDATE ON public.relationship_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationship_calendar_updated_at BEFORE UPDATE ON public.relationship_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educational_courses_updated_at BEFORE UPDATE ON public.educational_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
