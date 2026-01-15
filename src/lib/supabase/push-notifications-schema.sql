-- Push Notifications Schema
-- Run this AFTER schema.sql to add push notification support
-- ============================================================================

-- Add push token columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
WHERE push_token IS NOT NULL;

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- Allows users to control which notifications they receive
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Message notifications
  new_message BOOLEAN DEFAULT true,
  message_sound BOOLEAN DEFAULT true,
  
  -- Match notifications  
  new_match BOOLEAN DEFAULT true,
  new_like BOOLEAN DEFAULT true,
  new_ping BOOLEAN DEFAULT true,
  
  -- Event notifications
  event_reminder BOOLEAN DEFAULT true,
  event_updates BOOLEAN DEFAULT true,
  event_chat BOOLEAN DEFAULT true,
  
  -- Social notifications
  partner_link_request BOOLEAN DEFAULT true,
  vouch_received BOOLEAN DEFAULT true,
  trust_score_update BOOLEAN DEFAULT true,
  
  -- Timing preferences
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own preferences
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATION LOG TABLE
-- Track sent notifications for debugging and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users can see their notifications" ON public.notification_log;
CREATE POLICY "Users can see their notifications" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their notifications as read
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notification_log;
CREATE POLICY "Users can update their notifications" ON public.notification_log
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON public.notification_log(sent_at DESC);

-- ============================================================================
-- TRIGGER: Auto-create notification preferences for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_notification_prefs ON public.users;
CREATE TRIGGER on_user_created_notification_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_preferences();
