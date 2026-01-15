-- Content Moderation Schema
-- Run this AFTER schema.sql to add moderation features
-- ============================================================================

-- ============================================================================
-- MODERATOR ROLES TABLE
-- Tracks which users have moderation privileges
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin', 'super_admin')),
  permissions JSONB DEFAULT '{"review_reports": true, "warn_users": true, "suspend_users": false, "ban_users": false, "delete_content": true}'::jsonb,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- Only admins can see/manage moderators
DROP POLICY IF EXISTS "Admins can manage moderators" ON public.moderators;
CREATE POLICY "Admins can manage moderators" ON public.moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- MODERATION QUEUE TABLE
-- Central queue for all items needing moderation review
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What type of item needs review
  item_type TEXT NOT NULL CHECK (item_type IN ('report', 'photo', 'message', 'profile', 'event')),
  item_id UUID NOT NULL,
  
  -- Who reported it (if applicable)
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- The user being reported/reviewed
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Queue status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'escalated', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Report details
  reason TEXT NOT NULL,
  details TEXT,
  evidence JSONB, -- screenshots, message IDs, etc.
  
  -- Auto-detection flags
  auto_flagged BOOLEAN DEFAULT false,
  auto_flag_reason TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Review details
  assigned_to UUID REFERENCES public.moderators(id),
  reviewed_by UUID REFERENCES public.moderators(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  action_taken TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Moderators can view and manage the queue
DROP POLICY IF EXISTS "Moderators can manage queue" ON public.moderation_queue;
CREATE POLICY "Moderators can manage queue" ON public.moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Users can see their own reports
DROP POLICY IF EXISTS "Users can see their reports" ON public.moderation_queue;
CREATE POLICY "Users can see their reports" ON public.moderation_queue
  FOR SELECT USING (reporter_id = auth.uid());

-- ============================================================================
-- MODERATION ACTIONS TABLE
-- Log of all moderation actions taken
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to queue item (optional - some actions may be proactive)
  queue_item_id UUID REFERENCES public.moderation_queue(id) ON DELETE SET NULL,
  
  -- Who was affected
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Who took the action
  moderator_id UUID NOT NULL REFERENCES public.moderators(id) ON DELETE SET NULL,
  
  -- What action was taken
  action_type TEXT NOT NULL CHECK (action_type IN (
    'warning',
    'content_removed',
    'profile_hidden',
    'suspended_24h',
    'suspended_7d',
    'suspended_30d',
    'permanent_ban',
    'unbanned',
    'appeal_approved',
    'appeal_denied',
    'note_added'
  )),
  
  -- Details
  reason TEXT NOT NULL,
  details TEXT,
  
  -- For suspensions/bans
  expires_at TIMESTAMPTZ,
  
  -- For content removals
  content_type TEXT,
  content_id UUID,
  content_snapshot JSONB, -- Store copy of removed content
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Moderators can view/create actions
DROP POLICY IF EXISTS "Moderators can manage actions" ON public.moderation_actions;
CREATE POLICY "Moderators can manage actions" ON public.moderation_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Users can see actions taken against them (except internal notes)
DROP POLICY IF EXISTS "Users can see their actions" ON public.moderation_actions;
CREATE POLICY "Users can see their actions" ON public.moderation_actions
  FOR SELECT USING (target_user_id = auth.uid());

-- ============================================================================
-- USER WARNINGS TABLE
-- Active warnings on user accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.moderation_actions(id) ON DELETE CASCADE,
  warning_level INTEGER NOT NULL DEFAULT 1 CHECK (warning_level BETWEEN 1 AND 3),
  reason TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Users can see their own warnings
DROP POLICY IF EXISTS "Users can see their warnings" ON public.user_warnings;
CREATE POLICY "Users can see their warnings" ON public.user_warnings
  FOR SELECT USING (user_id = auth.uid());

-- Users can acknowledge warnings
DROP POLICY IF EXISTS "Users can acknowledge warnings" ON public.user_warnings;
CREATE POLICY "Users can acknowledge warnings" ON public.user_warnings
  FOR UPDATE USING (user_id = auth.uid());

-- Moderators can manage warnings
DROP POLICY IF EXISTS "Moderators can manage warnings" ON public.user_warnings;
CREATE POLICY "Moderators can manage warnings" ON public.user_warnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- BANNED WORDS TABLE
-- Automated content filtering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('hate', 'harassment', 'explicit', 'spam', 'scam', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  action TEXT NOT NULL DEFAULT 'flag' CHECK (action IN ('flag', 'block', 'shadowban')),
  created_by UUID REFERENCES public.moderators(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Only moderators can manage banned words
DROP POLICY IF EXISTS "Moderators can manage banned words" ON public.banned_words;
CREATE POLICY "Moderators can manage banned words" ON public.banned_words
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- APPEALS TABLE
-- User appeals for moderation decisions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.moderation_actions(id) ON DELETE CASCADE,
  appeal_text TEXT NOT NULL CHECK (length(appeal_text) >= 10 AND length(appeal_text) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'denied')),
  reviewed_by UUID REFERENCES public.moderators(id),
  reviewed_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own appeals
DROP POLICY IF EXISTS "Users can manage their appeals" ON public.moderation_appeals;
CREATE POLICY "Users can manage their appeals" ON public.moderation_appeals
  FOR ALL USING (user_id = auth.uid());

-- Moderators can review appeals
DROP POLICY IF EXISTS "Moderators can review appeals" ON public.moderation_appeals;
CREATE POLICY "Moderators can review appeals" ON public.moderation_appeals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moderators m 
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ADD SUSPENSION FIELDS TO USERS TABLE
-- ============================================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON public.moderation_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON public.moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_target ON public.moderation_queue(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON public.moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON public.user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON public.moderation_appeals(status);

-- ============================================================================
-- FUNCTION: Auto-escalate reports
-- Automatically escalate reports from users with history
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_escalate_report()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
  action_count INTEGER;
BEGIN
  -- Check how many times this user has been reported
  SELECT COUNT(*) INTO report_count
  FROM public.moderation_queue
  WHERE target_user_id = NEW.target_user_id
  AND status IN ('resolved')
  AND action_taken IS NOT NULL;
  
  -- Check past moderation actions
  SELECT COUNT(*) INTO action_count
  FROM public.moderation_actions
  WHERE target_user_id = NEW.target_user_id;
  
  -- Auto-escalate if user has history
  IF report_count >= 3 OR action_count >= 2 THEN
    NEW.priority := 'high';
  END IF;
  
  IF report_count >= 5 OR action_count >= 3 THEN
    NEW.priority := 'urgent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_escalate_report_trigger ON public.moderation_queue;
CREATE TRIGGER auto_escalate_report_trigger
  BEFORE INSERT ON public.moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_escalate_report();

-- ============================================================================
-- FUNCTION: Update user warning count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_warning_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET warning_count = (
    SELECT COUNT(*) FROM public.user_warnings
    WHERE user_id = NEW.user_id
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_warning_count_trigger ON public.user_warnings;
CREATE TRIGGER update_warning_count_trigger
  AFTER INSERT OR DELETE ON public.user_warnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_warning_count();

-- ============================================================================
-- VIEW: Moderation Dashboard Stats
-- ============================================================================
CREATE OR REPLACE VIEW public.moderation_stats AS
SELECT
  (SELECT COUNT(*) FROM public.moderation_queue WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM public.moderation_queue WHERE status = 'pending' AND priority = 'urgent') as urgent_reports,
  (SELECT COUNT(*) FROM public.moderation_queue WHERE status = 'in_review') as in_review,
  (SELECT COUNT(*) FROM public.moderation_appeals WHERE status = 'pending') as pending_appeals,
  (SELECT COUNT(*) FROM public.users WHERE is_suspended = true) as suspended_users,
  (SELECT COUNT(*) FROM public.users WHERE is_banned = true) as banned_users,
  (SELECT COUNT(*) FROM public.moderation_actions WHERE created_at > NOW() - INTERVAL '24 hours') as actions_today,
  (SELECT COUNT(*) FROM public.moderation_queue WHERE created_at > NOW() - INTERVAL '24 hours') as reports_today;
