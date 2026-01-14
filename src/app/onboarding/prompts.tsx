import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Check, ChevronRight, LogOut } from 'lucide-react-native';
import { PROFILE_PROMPTS } from '@/lib/mock-data';
import useDatingStore from '@/lib/state/dating-store';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PROFILE_KEY = 'onboarding_profile_data';

interface OnboardingProfileData {
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
}

export default function PromptsSetup() {
  const router = useRouter();
  const currentProfile = useDatingStore((s) => s.currentProfile);
  const setOnboarded = useDatingStore((s) => s.setOnboarded);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedProfileData, setSavedProfileData] = useState<OnboardingProfileData | null>(null);

  // Load profile data from AsyncStorage on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const data = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
        if (data) {
          const parsed = JSON.parse(data) as OnboardingProfileData;
          console.log('[Prompts] Loaded profile from AsyncStorage:', parsed.display_name);
          setSavedProfileData(parsed);
        } else {
          console.log('[Prompts] No profile data in AsyncStorage');
        }
      } catch (e) {
        console.log('[Prompts] Failed to load from AsyncStorage:', e);
      }
    };
    loadProfileData();
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear all local storage
      await AsyncStorage.clear();
      // Sign out from Supabase
      await supabase.auth.signOut();
      // Force navigation to auth
      router.replace('/auth');
    } catch (e) {
      console.log('Sign out error:', e);
      // Force navigate anyway
      router.replace('/auth');
    }
  };

  const handleResponseChange = (promptId: string, text: string) => {
    setResponses((prev) => ({ ...prev, [promptId]: text }));
  };

  const completedPrompts = Object.entries(responses).filter(
    ([, value]) => value.trim().length > 0
  );

  const handleFinish = async () => {
    console.log('[Prompts] handleFinish called');
    console.log('[Prompts] currentProfile from Zustand:', currentProfile?.display_name || 'null');
    console.log('[Prompts] savedProfileData from AsyncStorage:', savedProfileData?.display_name || 'null');

    // Get the user from Supabase to use their ID even if store profile is missing
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'Not authenticated. Please sign out and sign in again.');
      return;
    }

    // Use savedProfileData from AsyncStorage as primary source (more reliable on web)
    // Fall back to currentProfile from Zustand store
    const profileSource = savedProfileData || currentProfile;

    // If currentProfile is missing required fields, we can still proceed with defaults
    const profileToUse = {
      display_name: profileSource?.display_name || 'Anonymous',
      age: profileSource?.age || 18,
      city: profileSource?.city || 'Unknown',
      bio: profileSource?.bio || '',
      pace_preference: currentProfile?.pace_preference || 'medium',
      no_photos: currentProfile?.no_photos ?? false,
      open_to_meet: currentProfile?.open_to_meet ?? true,
      virtual_only: currentProfile?.virtual_only ?? false,
      response_style: currentProfile?.response_style || 'relaxed',
      photos: profileSource?.photos || [],
    };

    console.log('[Prompts] profileToUse:', profileToUse.display_name);

    // Check if we have minimum required data
    if (!profileToUse.display_name || profileToUse.display_name === 'Anonymous') {
      Alert.alert('Error', 'Profile data not found. Please go back and fill in your profile.');
      return;
    }

    setLoading(true);

    // Add timeout for profile creation
    const timeoutId = setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Taking too long',
        'Profile creation is taking longer than expected. Please try again or check your internet connection.',
        [
          { text: 'Try Again', onPress: () => handleFinish() },
          { text: 'Sign Out', onPress: handleSignOut },
        ]
      );
    }, 15000); // 15 second timeout

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        clearTimeout(timeoutId);
        throw new Error('Not authenticated. Please sign out and sign in again.');
      }

      console.log('Creating profile for user:', user.id);

      // First check if a profile already exists (in case of partial signup)
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Profile already exists, just mark onboarding complete and continue
        console.log('Profile already exists, skipping creation');
        clearTimeout(timeoutId);
        setOnboarded(true);
        router.replace('/(tabs)');
        return;
      }

      // First ensure the user record exists in public.users
      // This is CRITICAL because RLS policies require user to exist in public.users
      // for profiles to be visible to other users
      console.log('Ensuring user exists in public.users table...');

      // Try insert first
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          is_active: true,
        });

      // If insert failed due to duplicate, that's fine - user exists
      // But if it failed for another reason, try upsert
      if (userInsertError) {
        console.log('User insert result:', userInsertError.code, userInsertError.message);

        if (!userInsertError.message?.includes('duplicate') && userInsertError.code !== '23505') {
          // Try upsert as fallback
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              is_active: true,
            });

          if (upsertError) {
            console.log('User upsert also failed:', upsertError.message);
            // Continue anyway - RLS might still work if user exists
          }
        }
      } else {
        console.log('User record created successfully');
      }

      // Verify user exists before creating profile
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('id', user.id)
        .single();

      console.log('User check result:', userCheck ? 'exists' : 'not found', userCheckError?.message);

      if (!userCheck) {
        console.warn('WARNING: User record not found in public.users - profile may not be visible to others!');
      }

      // Create profile in Supabase
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: profileToUse.display_name,
          age: profileToUse.age,
          city: profileToUse.city,
          bio: profileToUse.bio,
          pace_preference: profileToUse.pace_preference,
          no_photos: profileToUse.no_photos,
          open_to_meet: profileToUse.open_to_meet,
          virtual_only: profileToUse.virtual_only,
          response_style: profileToUse.response_style,
        })
        .select()
        .single();

      if (profileError) {
        console.log('Profile error:', profileError);
        clearTimeout(timeoutId);

        // Check if it's a duplicate key error (profile exists)
        if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
          console.log('Profile already exists via duplicate error, continuing');
          setOnboarded(true);
          router.replace('/(tabs)');
          return;
        }
        throw profileError;
      }

      console.log('Profile created:', profile.id);

      // Save prompt responses (non-blocking)
      if (completedPrompts.length > 0) {
        const promptInserts = completedPrompts.map(([promptId, responseText]) => {
          const prompt = PROFILE_PROMPTS.find((p) => p.id === promptId);
          return {
            profile_id: profile.id,
            prompt_id: promptId,
            prompt_text: prompt?.prompt_text || '',
            response_text: responseText,
          };
        });

        supabase.from('prompt_responses').insert(promptInserts).then(({ error }) => {
          if (error) console.log('Prompt insert error:', error);
        });
      }

      // Upload photos if available (non-blocking)
      if (profileToUse.photos && profileToUse.photos.length > 0) {
        // Do photo upload in background
        (async () => {
          for (let i = 0; i < profileToUse.photos.length; i++) {
            const photoUri = profileToUse.photos[i];
            if (!photoUri) continue;

            try {
              const response = await fetch(photoUri);
              const blob = await response.blob();
              const fileExt = photoUri.split('.').pop()?.split('?')[0] || 'jpg';
              const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(fileName, blob, {
                  contentType: `image/${fileExt}`,
                  upsert: false,
                });

              if (!uploadError) {
                await supabase.from('photos').insert({
                  profile_id: profile.id,
                  storage_path: fileName,
                  order_index: i,
                  is_primary: i === 0,
                });
              }
            } catch (photoError) {
              console.log('Photo upload error:', photoError);
            }
          }
        })();
      }

      clearTimeout(timeoutId);

      // Mark onboarding as complete locally
      setOnboarded(true);

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('Onboarding error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      Alert.alert(
        'Error',
        message,
        [
          { text: 'Try Again', onPress: () => handleFinish() },
          { text: 'Sign Out', onPress: handleSignOut },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const canFinish = completedPrompts.length >= 1 && !loading;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Sign Out Button */}
          <Pressable
            onPress={handleSignOut}
            className="absolute top-4 right-4 z-10 flex-row items-center px-3 py-2 rounded-lg bg-zinc-800/80"
          >
            <LogOut size={16} color="#9ca3af" />
            <Text className="text-gray-400 text-sm ml-2">Sign Out</Text>
          </Pressable>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-1 px-6 pt-8">
              {/* Header */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="mb-6"
              >
                <Text className="text-2xl font-bold text-white mb-2">
                  Answer some prompts
                </Text>
                <Text className="text-gray-400 text-base">
                  Share what makes you unique. Pick at least one.
                </Text>
              </Animated.View>

              {/* Prompts List */}
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {PROFILE_PROMPTS.map((prompt, index) => {
                  const isActive = activePromptId === prompt.id;
                  const hasResponse = responses[prompt.id]?.trim().length > 0;

                  return (
                    <Animated.View
                      key={prompt.id}
                      entering={FadeInDown.delay(150 + index * 50).springify()}
                    >
                      <Pressable
                        onPress={() =>
                          setActivePromptId(isActive ? null : prompt.id)
                        }
                        className={cn(
                          'mb-3 rounded-2xl border overflow-hidden',
                          isActive
                            ? 'bg-purple-500/20 border-purple-500'
                            : hasResponse
                            ? 'bg-purple-500/10 border-purple-500/50'
                            : 'bg-zinc-900/80 border-zinc-800'
                        )}
                      >
                        <View className="p-4 flex-row items-center justify-between">
                          <Text className="text-white font-medium flex-1 mr-2">
                            {prompt.prompt_text}
                          </Text>
                          {hasResponse && !isActive && (
                            <Check size={20} color="#c084fc" />
                          )}
                        </View>

                        {isActive && (
                          <View className="px-4 pb-4">
                            <TextInput
                              value={responses[prompt.id] || ''}
                              onChangeText={(text) =>
                                handleResponseChange(prompt.id, text)
                              }
                              placeholder="Type your answer..."
                              placeholderTextColor="#6b7280"
                              className="bg-zinc-800 rounded-xl text-white p-4 text-base"
                              multiline
                              numberOfLines={3}
                              maxLength={200}
                              style={{ minHeight: 80, textAlignVertical: 'top' }}
                              autoFocus
                            />
                            <View className="flex-row justify-between items-center mt-2">
                              <Text className="text-gray-500 text-sm">
                                {(responses[prompt.id] || '').length}/200
                              </Text>
                              <Pressable
                                onPress={() => setActivePromptId(null)}
                                className="bg-purple-500/20 px-4 py-2 rounded-lg"
                              >
                                <Text className="text-purple-400 font-medium">
                                  Done
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {hasResponse && !isActive && (
                          <View className="px-4 pb-4">
                            <Text className="text-gray-300 text-sm">
                              {responses[prompt.id]}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </ScrollView>

              {/* CTA */}
              <Animated.View
                entering={FadeInUp.delay(500).springify()}
                className="pb-8 pt-4"
              >
                <Pressable
                  onPress={handleFinish}
                  disabled={!canFinish}
                  className="rounded-2xl overflow-hidden"
                >
                  {(canFinish || loading) ? (
                    <LinearGradient
                      colors={loading ? ['#6b7280', '#6b7280'] : ['#9333ea', '#db2777']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                    >
                      {loading ? (
                        <Text className="text-white text-lg font-semibold">
                          Creating profile...
                        </Text>
                      ) : (
                        <>
                          <Text className="text-white text-lg font-semibold mr-2">
                            Finish Setup
                          </Text>
                          <ChevronRight size={20} color="white" />
                        </>
                      )}
                    </LinearGradient>
                  ) : (
                    <View className="bg-zinc-800 py-4 flex-row items-center justify-center">
                      <Text className="text-gray-400 text-lg font-semibold mr-2">
                        Finish Setup
                      </Text>
                      <ChevronRight size={20} color="#9ca3af" />
                    </View>
                  )}
                </Pressable>
                <Text className="text-gray-500 text-center text-sm mt-3">
                  {completedPrompts.length} prompt{completedPrompts.length !== 1 ? 's' : ''} answered
                </Text>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
