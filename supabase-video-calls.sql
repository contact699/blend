-- ============================================================================
-- VIDEO CALLS DATABASE SCHEMA
-- Add these tables to your Supabase database for WebRTC video calling
-- ============================================================================

-- VIDEO_CALLS TABLE - Stores call records
CREATE TABLE IF NOT EXISTS public.video_calls (
  id TEXT PRIMARY KEY, -- Custom call ID (e.g., call_1234567890_abc)
  caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Calculated when call ends
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (caller_id != callee_id)
);

-- RLS Policy: Users can only see their own calls
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls" ON public.video_calls
  FOR SELECT USING (
    auth.uid() = caller_id OR auth.uid() = callee_id
  );

CREATE POLICY "Users can create calls they initiate" ON public.video_calls
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update calls" ON public.video_calls
  FOR UPDATE USING (
    auth.uid() = caller_id OR auth.uid() = callee_id
  );

-- ============================================================================
-- CALL_SIGNALS TABLE - WebRTC signaling (offer, answer, ICE candidates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate', 'end-call')),
  payload JSONB, -- Stores SDP, ICE candidate data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Only call participants can access signals
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Call participants can view signals" ON public.call_signals
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Call participants can create signals" ON public.call_signals
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.video_calls
      WHERE id = call_signals.call_id
      AND (caller_id = auth.uid() OR callee_id = auth.uid())
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee ON public.video_calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_started_at ON public.video_calls(started_at);

CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_created_at ON public.call_signals(created_at);

-- ============================================================================
-- FUNCTION: Calculate call duration when call ends
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.ended_at IS NOT NULL AND NEW.answered_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_call_duration
  BEFORE UPDATE ON public.video_calls
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ended')
  EXECUTE FUNCTION public.calculate_call_duration();

-- ============================================================================
-- REALTIME PUBLICATION (Enable realtime for call signals)
-- ============================================================================
-- Run this in Supabase Dashboard > Database > Publications
-- Or via SQL:

-- Enable realtime for call_signals table
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- ============================================================================
-- CLEANUP: Delete old call signals after 24 hours (optional)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_call_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.call_signals
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension - enable in Supabase Dashboard)
-- SELECT cron.schedule('cleanup-call-signals', '0 0 * * *', 'SELECT cleanup_old_call_signals()');

-- ============================================================================
-- NOTES
-- ============================================================================
/*
After running this migration:

1. Enable Realtime in Supabase Dashboard:
   - Go to Database > Replication
   - Find "call_signals" table
   - Enable replication

2. Test realtime subscription:
   - Use Supabase client to subscribe to call_signals changes
   - Send a test signal and verify it's received in realtime

3. ICE Server Configuration (optional):
   - For production, consider using a TURN server for better NAT traversal
   - Free TURN servers: https://www.metered.ca/tools/openrelay/
   - Or use paid services: Twilio TURN, Xirsys, etc.
*/
