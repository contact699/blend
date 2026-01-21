import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';

// EMERGENCY MODE: Disable ALL logic to prevent crashes
// Just redirect to auth screen - no Supabase, no store access, nothing
// This file loads IMMEDIATELY on app start, so any imports can crash

export default function Index() {
  // Hardcoded redirect to auth - no session checking, no profile loading
  // Re-enable proper logic once app is stable
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-xl mb-4">Loading Blend...</Text>
      <Redirect href="/auth" />
    </View>
  );
}

/* ORIGINAL CODE - DISABLED TO PREVENT CRASHES

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import useDatingStore from '@/lib/state/dating-store';
import type { Session } from '@supabase/supabase-js';

function OriginalIndex() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const isProcessingRef = useRef(false);

  const setCurrentProfile = useDatingStore((s) => s.setCurrentProfile);
  const setOnboarded = useDatingStore((s) => s.setOnboarded);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string): Promise<boolean> => {
      console.log('Loading profile for user:', userId);
      try {
        // Add timeout to prevent hanging forever
        const timeoutPromise = new Promise<{ data: null; error: { code: string; message: string } }>((resolve) => {
          setTimeout(() => {
            resolve({ data: null, error: { code: 'TIMEOUT', message: 'Profile query timed out' } });
          }, 8000);
        });

        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        const { data: profile, error: profileError } = await Promise.race([queryPromise, timeoutPromise]);

        console.log('Profile query completed:', {
          hasProfile: !!profile,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          errorDetails: JSON.stringify(profileError)
        });

        if (!isMounted) return false;

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.log('No profile found - user needs onboarding');
          } else if (profileError.code === 'TIMEOUT') {
            console.log('Profile query timed out - possible RLS issue');
          } else {
            console.log('Profile check error:', profileError.code, profileError.message);
          }
          return false;
        }

        if (profile) {
          console.log('Profile found:', profile.display_name);
          setOnboarded(true);
          setCurrentProfile({
            id: profile.id,
            user_id: profile.user_id,
            display_name: profile.display_name,
            age: profile.age,
            city: profile.city,
            bio: profile.bio || '',
            photos: [],
            intent_ids: [],
            pace_preference: profile.pace_preference || 'medium',
            response_style: profile.response_style || 'relaxed',
            open_to_meet: profile.open_to_meet ?? true,
            virtual_only: profile.virtual_only ?? false,
            no_photos: profile.no_photos ?? false,
            prompt_responses: [],
          });
          return true;
        }
        return false;
      } catch (err) {
        console.log('Profile load exception:', err);
        return false;
      }
    };

    const handleSession = async (currentSession: Session | null) => {
      // Prevent duplicate processing
      if (isProcessingRef.current) {
        console.log('Already processing session, skipping...');
        return;
      }
      isProcessingRef.current = true;

      try {
        if (currentSession?.user) {
          console.log('Processing session for user:', currentSession.user.id);
          setSession(currentSession);
          const profileExists = await loadProfile(currentSession.user.id);
          if (isMounted) {
            setHasProfile(profileExists);
            setLoading(false);
          }
        } else {
          console.log('No session - user not logged in');
          if (isMounted) {
            setSession(null);
            setHasProfile(false);
            setLoading(false);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await handleSession(newSession);
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setSession(null);
            setHasProfile(false);
            setLoading(false);
          }
        }
      }
    );

    // Fallback timeout - if nothing happens in 3 seconds, check manually
    const timeoutId = setTimeout(async () => {
      if (isMounted && loading && !isProcessingRef.current) {
        console.log('Timeout reached - checking session manually');
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          await handleSession(currentSession);
        } catch (err) {
          console.log('Timeout session check error:', err);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    }, 3000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [setCurrentProfile, setOnboarded, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#c084fc" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    );
  }

  // Not logged in -> Auth screen
  if (!session) {
    return <Redirect href="/auth" />;
  }

  // Logged in but no profile -> Onboarding
  if (!hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  // Logged in with profile -> Main app
  return <Redirect href="/(tabs)" />;
}
