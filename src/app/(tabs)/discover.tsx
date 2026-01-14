import { View, Text, Pressable, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInRight, SlideOutLeft, FadeIn, FadeInDown } from 'react-native-reanimated';
import { Heart, X, MapPin, Sparkles, Globe, Video, ChevronDown, Check, Users, EyeOff, User, Brain, ChevronRight, Search } from 'lucide-react-native';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDiscoverProfiles, useCurrentUser } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import useDatingStore from '@/lib/state/dating-store';
import { CompatibilityPill } from '@/components/CompatibilityBadge';
import { MatchHighlights } from '@/components/MatchInsights';
import { quickCompatibilityScore } from '@/lib/matching/compatibility-engine';
import { Profile, CompatibilityScore } from '@/lib/types';

type LocationFilter = 'nearby' | 'all' | 'virtual' | string;

interface DiscoverProfile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  virtual_only: boolean;
  photos?: Array<{ id: string; storage_path: string; signedUrl?: string | null }>;
  prompt_responses?: Array<{ id: string; prompt_text: string; response_text: string }>;
  linked_partners?: Array<{ id: string; name: string; age: number }>;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: profiles, isLoading, error, refetch } = useDiscoverProfiles();
  const queryClient = useQueryClient();

  const [skippedProfiles, setSkippedProfiles] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Smart matching state from store
  const smartMatchingEnabled = useDatingStore((s) => s.smartMatchingEnabled);
  const setSmartMatchingEnabled = useDatingStore((s) => s.setSmartMatchingEnabled);
  const currentProfile = useDatingStore((s) => s.currentProfile);
  const trackProfileView = useDatingStore((s) => s.trackProfileView);
  const cacheCompatibilityScore = useDatingStore((s) => s.cacheCompatibilityScore);
  const getCachedCompatibilityScore = useDatingStore((s) => s.getCachedCompatibilityScore);

  // Track view start time
  const viewStartTime = useRef<number>(Date.now());

  // Mutation for liking a profile
  const likeMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await supabase.from('likes').insert({
        from_user_id: currentUser.id,
        to_user_id: toUserId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  // Get unique cities from profiles
  const cities = useMemo(() => {
    if (!profiles) return [];
    return [...new Set(profiles.map((p: DiscoverProfile) => p.city))].filter(c => c !== 'Virtual Only');
  }, [profiles]);

  // Filter profiles
  const profilesToShow = useMemo(() => {
    if (!profiles) return [];

    const filtered = profiles.filter((p: DiscoverProfile) => {
      if (skippedProfiles.includes(p.user_id)) return false;

      // Apply location filter
      if (locationFilter === 'nearby') {
        const bayAreaCities = ['San Francisco', 'Oakland', 'Berkeley', 'Palo Alto'];
        return bayAreaCities.includes(p.city);
      } else if (locationFilter === 'virtual') {
        return p.virtual_only === true;
      } else if (locationFilter !== 'all') {
        return p.city === locationFilter;
      }

      return true;
    });

    // If smart matching is enabled and we have a current profile, sort by compatibility
    if (smartMatchingEnabled && currentProfile) {
      // Calculate compatibility scores and sort
      const withScores = filtered.map((p: DiscoverProfile) => {
        // Convert DiscoverProfile to partial Profile for scoring
        const profileForScoring: Partial<Profile> = {
          user_id: p.user_id,
          display_name: p.display_name,
          age: p.age,
          city: p.city,
          bio: p.bio,
          intent_ids: [], // We'd need this from the API
        };

        const score = quickCompatibilityScore(
          currentProfile,
          profileForScoring as Profile
        );

        return { profile: p, compatibilityScore: score };
      });

      // Sort by score descending
      withScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Return profiles with scores attached
      return withScores.map((item) => ({
        ...item.profile,
        compatibilityScore: item.compatibilityScore,
      }));
    }

    return filtered.map((p: DiscoverProfile) => ({ ...p, compatibilityScore: undefined }));
  }, [profiles, skippedProfiles, locationFilter, smartMatchingEnabled, currentProfile]);

  const currentProfileToShow = profilesToShow[0] as (DiscoverProfile & { compatibilityScore?: number }) | undefined;

  // Reset view timer when profile changes
  useEffect(() => {
    viewStartTime.current = Date.now();
  }, [currentProfileToShow?.user_id]);

  const handleLike = () => {
    if (!currentProfileToShow) return;

    // Track the view with action
    const dwellTime = Date.now() - viewStartTime.current;
    trackProfileView(currentProfileToShow.user_id, dwellTime, 'like', {
      age: currentProfileToShow.age,
      intent_ids: [],
      bio_length: currentProfileToShow.bio?.length ?? 0,
      photo_count: currentProfileToShow.photos?.length ?? 0,
      has_voice_intro: false,
      pace_preference: 'medium',
      response_style: 'relaxed',
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeMutation.mutate(currentProfileToShow.user_id);
    setSkippedProfiles((prev) => [...prev, currentProfileToShow.user_id]);
  };

  const handlePass = () => {
    if (!currentProfileToShow) return;

    // Track the view with action
    const dwellTime = Date.now() - viewStartTime.current;
    trackProfileView(currentProfileToShow.user_id, dwellTime, 'pass', {
      age: currentProfileToShow.age,
      intent_ids: [],
      bio_length: currentProfileToShow.bio?.length ?? 0,
      photo_count: currentProfileToShow.photos?.length ?? 0,
      has_voice_intro: false,
      pace_preference: 'medium',
      response_style: 'relaxed',
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkippedProfiles((prev) => [...prev, currentProfileToShow.user_id]);
  };

  const toggleSmartMatching = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSmartMatchingEnabled(!smartMatchingEnabled);
  };

  const getFilterLabel = () => {
    switch (locationFilter) {
      case 'nearby':
        return 'Nearby';
      case 'all':
        return 'Everywhere';
      case 'virtual':
        return 'Virtual Only';
      default:
        return locationFilter;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text className="text-gray-400 mt-4">Loading profiles...</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Error or no profiles state
  if (error || !currentProfileToShow) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1" edges={['top']}>
            {/* Header with Filter */}
            <View className="px-5 py-3 flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold">Discover</Text>
              <Pressable
                onPress={() => setShowFilterModal(true)}
                className="flex-row items-center bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/30"
              >
                <MapPin size={14} color="#c084fc" />
                <Text className="text-purple-300 text-sm font-medium ml-1">
                  {getFilterLabel()}
                </Text>
                <ChevronDown size={14} color="#c084fc" className="ml-1" />
              </Pressable>
            </View>

            <View className="flex-1 items-center justify-center px-6">
              <View className="w-24 h-24 bg-purple-500/20 rounded-full items-center justify-center mb-6 border border-purple-500/30">
                <Sparkles size={48} color="#c084fc" />
              </View>
              <Text className="text-white text-xl font-bold text-center mb-2">
                {error ? 'Unable to load profiles' : 'No profiles found'}
              </Text>
              <Text className="text-gray-400 text-center mb-6">
                {error
                  ? 'Please check your connection and try again.'
                  : 'Try expanding your search or check back later for new profiles.'}
              </Text>
              <Pressable
                onPress={() => {
                  setSkippedProfiles([]);
                  refetch();
                }}
                className="rounded-xl overflow-hidden"
              >
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 12, paddingHorizontal: 24 }}
                >
                  <Text className="text-white font-semibold">Refresh</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Filter Modal */}
          <FilterModal
            visible={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            cities={cities}
          />
        </LinearGradient>
      </View>
    );
  }

  // Get photo URL
  const photoUrl = currentProfileToShow.photos?.[0]?.signedUrl || null;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-2xl font-bold">Discover</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => router.push('/search')}
                  className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700"
                >
                  <Search size={18} color="#c084fc" />
                </Pressable>
                <Pressable
                  onPress={() => setShowFilterModal(true)}
                  className="flex-row items-center bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/30"
                >
                  <MapPin size={14} color="#c084fc" />
                  <Text className="text-purple-300 text-sm font-medium ml-1">
                    {getFilterLabel()}
                  </Text>
                  <ChevronDown size={14} color="#c084fc" className="ml-1" />
                </Pressable>
              </View>
            </View>

            {/* Smart Matching Toggle */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="flex-row items-center justify-between bg-zinc-900/80 rounded-xl p-3"
            >
              <Pressable
                onPress={toggleSmartMatching}
                className="flex-row items-center flex-1"
              >
                <View className={cn(
                  'w-10 h-10 rounded-full items-center justify-center',
                  smartMatchingEnabled ? 'bg-purple-500/30' : 'bg-zinc-800'
                )}>
                  <Brain size={20} color={smartMatchingEnabled ? '#c084fc' : '#6b7280'} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Smart Matching</Text>
                  <Text className="text-gray-500 text-xs">
                    {smartMatchingEnabled ? 'Showing best matches first' : 'Showing all profiles'}
                  </Text>
                </View>
                <View className={cn(
                  'w-12 h-7 rounded-full p-1',
                  smartMatchingEnabled ? 'bg-purple-500' : 'bg-zinc-700'
                )}>
                  <Animated.View
                    className={cn(
                      'w-5 h-5 rounded-full bg-white',
                      smartMatchingEnabled ? 'ml-auto' : 'ml-0'
                    )}
                  />
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/taste-profile')}
                className="ml-3 p-2"
              >
                <ChevronRight size={20} color="#6b7280" />
              </Pressable>
            </Animated.View>
          </View>

          {/* Profile Card */}
          <Animated.View
            key={currentProfileToShow.id}
            entering={SlideInRight.springify()}
            exiting={SlideOutLeft.springify()}
            className="flex-1 mx-4 mb-4"
          >
            <View className="flex-1 bg-zinc-900/80 rounded-3xl overflow-hidden border border-zinc-800">
              {/* Photo */}
              <View className="h-[55%] relative">
                {!photoUrl ? (
                  <View className="w-full h-full bg-zinc-800 items-center justify-center">
                    <LinearGradient
                      colors={['#9333ea20', '#db277720']}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    />
                    <View className="w-24 h-24 bg-purple-500/20 rounded-full items-center justify-center mb-3 border border-purple-500/30">
                      <User size={48} color="#c084fc" />
                    </View>
                    <View className="flex-row items-center bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
                      <EyeOff size={16} color="#c084fc" />
                      <Text className="text-purple-300 text-sm font-medium ml-2">
                        No photos yet
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: photoUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 140,
                  }}
                />
                {/* Virtual badge */}
                {currentProfileToShow.virtual_only && (
                  <View className="absolute top-3 right-3 bg-blue-500/90 px-3 py-1.5 rounded-full flex-row items-center">
                    <Video size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Virtual</Text>
                  </View>
                )}
                {/* Compatibility badge - show below virtual badge if both present */}
                {smartMatchingEnabled && currentProfileToShow.compatibilityScore !== undefined && (
                  <View className={cn(
                    'absolute right-3',
                    currentProfileToShow.virtual_only ? 'top-12' : 'top-3'
                  )}>
                    <CompatibilityPill score={currentProfileToShow.compatibilityScore} />
                  </View>
                )}
                {/* Linked partner badge */}
                {currentProfileToShow.linked_partners && currentProfileToShow.linked_partners.length > 0 && (
                  <View className="absolute top-3 left-3 bg-pink-500/90 px-3 py-1.5 rounded-full flex-row items-center">
                    <Users size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Has Partner</Text>
                  </View>
                )}
                <View className="absolute bottom-4 left-4 right-4">
                  <View className="flex-row items-center">
                    <Text className="text-white text-2xl font-bold">
                      {currentProfileToShow.display_name}
                    </Text>
                    <Text className="text-white/70 text-xl ml-2">
                      {currentProfileToShow.age}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color="#a855f7" />
                    <Text className="text-purple-300 text-sm ml-1">
                      {currentProfileToShow.city}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info */}
              <ScrollView
                className="flex-1 p-4"
                showsVerticalScrollIndicator={false}
              >
                {/* Linked Partner Section */}
                {currentProfileToShow.linked_partners && currentProfileToShow.linked_partners.length > 0 && (
                  <View className="mb-4 bg-pink-500/10 rounded-xl p-3 border border-pink-500/30">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-pink-500/20 rounded-full items-center justify-center">
                        <Heart size={20} color="#ec4899" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-400 text-xs uppercase">Linked Partner</Text>
                        <Text className="text-white font-medium">
                          {currentProfileToShow.linked_partners[0].name}, {currentProfileToShow.linked_partners[0].age}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Bio */}
                {currentProfileToShow.bio && (
                  <View className="mb-4">
                    <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                      About
                    </Text>
                    <Text className="text-white text-base leading-relaxed">
                      {currentProfileToShow.bio}
                    </Text>
                  </View>
                )}

                {/* Prompts */}
                {currentProfileToShow.prompt_responses?.map((pr) => (
                  <View
                    key={pr.id}
                    className="bg-zinc-800/60 rounded-xl p-4 mb-3 border border-zinc-700/50"
                  >
                    <Text className="text-purple-300 text-sm mb-1">
                      {pr.prompt_text}
                    </Text>
                    <Text className="text-white text-base">
                      {pr.response_text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View className="flex-row justify-center items-center px-8 pb-6">
            <Pressable
              onPress={handlePass}
              className="w-16 h-16 bg-zinc-800/80 rounded-full items-center justify-center active:bg-zinc-700 border border-zinc-700/50"
            >
              <X size={28} color="#9ca3af" />
            </Pressable>

            <Pressable
              onPress={handleLike}
              disabled={likeMutation.isPending}
              className="w-20 h-20 rounded-full items-center justify-center ml-6 overflow-hidden"
            >
              <LinearGradient
                colors={['#9333ea', '#db2777']}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={36} color="white" fill="white" />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          cities={cities}
        />
      </LinearGradient>
    </View>
  );
}

// Filter Modal Component
function FilterModal({
  visible,
  onClose,
  locationFilter,
  setLocationFilter,
  cities,
}: {
  visible: boolean;
  onClose: () => void;
  locationFilter: LocationFilter;
  setLocationFilter: (filter: LocationFilter) => void;
  cities: string[];
}) {
  const handleSelect = (filter: LocationFilter) => {
    setLocationFilter(filter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/70 justify-end"
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-zinc-900 rounded-t-3xl"
          >
            <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mt-3" />

            <View className="px-5 pt-5 pb-2">
              <Text className="text-white text-xl font-bold">Location</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Find people nearby or explore other cities
              </Text>
            </View>

            <ScrollView className="max-h-96 px-5 pb-8">
              {/* Quick filters */}
              <View className="mb-4">
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                  Quick Filters
                </Text>

                <Pressable
                  onPress={() => handleSelect('nearby')}
                  className={cn(
                    'flex-row items-center p-4 rounded-xl mb-2 border',
                    locationFilter === 'nearby'
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800/60 border-zinc-700/50'
                  )}
                >
                  <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                    <MapPin size={20} color="#c084fc" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Nearby</Text>
                    <Text className="text-gray-400 text-sm">Bay Area (SF, Oakland, Berkeley...)</Text>
                  </View>
                  {locationFilter === 'nearby' && <Check size={20} color="#c084fc" />}
                </Pressable>

                <Pressable
                  onPress={() => handleSelect('all')}
                  className={cn(
                    'flex-row items-center p-4 rounded-xl mb-2 border',
                    locationFilter === 'all'
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800/60 border-zinc-700/50'
                  )}
                >
                  <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                    <Globe size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Everywhere</Text>
                    <Text className="text-gray-400 text-sm">See all profiles worldwide</Text>
                  </View>
                  {locationFilter === 'all' && <Check size={20} color="#c084fc" />}
                </Pressable>

                <Pressable
                  onPress={() => handleSelect('virtual')}
                  className={cn(
                    'flex-row items-center p-4 rounded-xl border',
                    locationFilter === 'virtual'
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800/60 border-zinc-700/50'
                  )}
                >
                  <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center">
                    <Video size={20} color="#ec4899" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Virtual Only</Text>
                    <Text className="text-gray-400 text-sm">Long distance / video connections</Text>
                  </View>
                  {locationFilter === 'virtual' && <Check size={20} color="#c084fc" />}
                </Pressable>
              </View>

              {/* Specific cities */}
              {cities.length > 0 && (
                <View>
                  <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                    Browse by City
                  </Text>

                  {cities.map((city) => (
                    <Pressable
                      key={city}
                      onPress={() => handleSelect(city)}
                      className={cn(
                        'flex-row items-center p-4 rounded-xl mb-2 border',
                        locationFilter === city
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-zinc-800/60 border-zinc-700/50'
                      )}
                    >
                      <Text className="text-white flex-1">{city}</Text>
                      {locationFilter === city && <Check size={20} color="#c084fc" />}
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
