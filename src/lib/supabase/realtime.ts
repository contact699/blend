/**
 * Supabase Realtime Subscriptions
 * 
 * Replaces polling with real-time subscriptions for:
 * - Messages (new messages in threads)
 * - Matches (new matches)
 * - Likes (new likes received)
 * - Pinds (new pinds received)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import { useCurrentUser } from './hooks';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface RealtimeMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface RealtimeMatch {
  id: string;
  user_1_id: string;
  user_2_id: string;
  status: string;
  matched_at: string;
}

interface RealtimeLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

interface RealtimePind {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  created_at: string;
}

// ============================================================================
// HOOK: useRealtimeMessages
// Subscribe to new messages in a specific thread
// ============================================================================

export function useRealtimeMessages(threadId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!threadId || !user) return;

    // Create a unique channel for this thread
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          // Invalidate the messages query to refetch
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
          
          // Also invalidate matches to update last_message_at
          queryClient.invalidateQueries({ queryKey: ['matches'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          // Refetch on updates (e.g., read receipts)
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [threadId, user, queryClient]);
}

// ============================================================================
// HOOK: useRealtimeMatches
// Subscribe to new matches for the current user
// ============================================================================

export function useRealtimeMatches() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`matches:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMatch>) => {
          const match = payload.new as RealtimeMatch;
          // Only invalidate if this user is part of the match
          if (match.user_1_id === user.id || match.user_2_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMatch>) => {
          const match = payload.new as RealtimeMatch;
          if (match.user_1_id === user.id || match.user_2_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);
}

// ============================================================================
// HOOK: useRealtimeLikes
// Subscribe to new likes received
// ============================================================================

export function useRealtimeLikes() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`likes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['likes-received'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'likes',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['likes-received'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);
}

// ============================================================================
// HOOK: useRealtimePinds
// Subscribe to new pinds received
// ============================================================================

export function useRealtimePinds() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`pinds:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pinds',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pinds-received'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pinds',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pinds-received'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);
}

// ============================================================================
// HOOK: useRealtimeEvents
// Subscribe to event updates (RSVPs, changes)
// ============================================================================

export function useRealtimeEvents() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_rsvps',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);
}

// ============================================================================
// HOOK: useRealtimeAll
// Combined hook to subscribe to all relevant real-time updates
// Use this at the app level (e.g., in _layout.tsx)
// ============================================================================

export function useRealtimeAll() {
  useRealtimeMatches();
  useRealtimeLikes();
  useRealtimePinds();
  useRealtimeEvents();
}

// ============================================================================
// UTILITY: Enable realtime on tables (run once via SQL)
// ============================================================================
/*
To enable realtime on these tables, run in Supabase SQL Editor:

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Enable realtime for likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;

-- Enable realtime for pinds
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinds;

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Enable realtime for event_rsvps
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;

-- Enable realtime for chat_threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
*/
