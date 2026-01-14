// Hook for listening to incoming video calls via Supabase Realtime

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string | null;
  offerSdp: string;
  threadId?: string;
}

export function useIncomingCall(currentUserId: string | null) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    setIsListening(true);

    // Subscribe to call signals for this user
    const channel = supabase
      .channel(`user_calls_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const signal = payload.new as {
            id: string;
            call_id: string;
            from_user_id: string;
            to_user_id: string;
            type: string;
            payload: any;
            created_at: string;
          };

          // Only handle incoming call offers
          if (signal.type === 'offer') {
            console.log('[IncomingCall] Received offer:', signal.call_id);

            // Fetch caller's profile
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('display_name, photos(storage_path)')
              .eq('user_id', signal.from_user_id)
              .single();

            // Get signed URL for caller's photo
            let callerPhoto: string | null = null;
            if (callerProfile?.photos && callerProfile.photos.length > 0) {
              const { data: signedUrl } = await supabase.storage
                .from('photos')
                .createSignedUrl(callerProfile.photos[0].storage_path, 300); // 5 min expiry

              if (signedUrl) {
                callerPhoto = signedUrl.signedUrl;
              }
            }

            // Fetch call record to get thread_id (if available)
            const { data: callRecord } = await supabase
              .from('video_calls')
              .select('id')
              .eq('id', signal.call_id)
              .single();

            setIncomingCall({
              callId: signal.call_id,
              callerId: signal.from_user_id,
              callerName: callerProfile?.display_name || 'Unknown',
              callerPhoto,
              offerSdp: JSON.stringify(signal.payload),
              threadId: undefined, // Can be enhanced to fetch thread_id from matches
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      setIsListening(false);
    };
  }, [currentUserId]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    // Update call status to active
    await supabase
      .from('video_calls')
      .update({ status: 'active' })
      .eq('id', incomingCall.callId);

    // Clear incoming call state
    setIncomingCall(null);
  }, [incomingCall]);

  const declineCall = useCallback(async () => {
    if (!incomingCall) return;

    // Update call status to declined
    await supabase
      .from('video_calls')
      .update({ status: 'declined', ended_at: new Date().toISOString() })
      .eq('id', incomingCall.callId);

    // Send end-call signal
    await supabase.from('call_signals').insert({
      type: 'end-call',
      from_user_id: incomingCall.callerId,
      to_user_id: currentUserId,
      call_id: incomingCall.callId,
      payload: null,
    });

    // Clear incoming call state
    setIncomingCall(null);
  }, [incomingCall, currentUserId]);

  return {
    incomingCall,
    isListening,
    acceptCall,
    declineCall,
  };
}
