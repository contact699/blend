import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Heart,
  Clock,
  MessageSquare,
  Sparkles,
  Users,
  TrendingUp,
  Eye,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Info,
} from 'lucide-react-native';
import {
  useTasteProfile,
  useProfileViews,
  useRefreshTasteProfile,
} from '@/lib/supabase';

export default function TasteProfileScreen() {
  const router = useRouter();

  // Use Supabase hooks
  const { data: tasteProfile, isLoading: profileLoading } = useTasteProfile();
  const { data: profileViews, isLoading: viewsLoading } = useProfileViews();
  const refreshMutation = useRefreshTasteProfile();

  const isLoading = profileLoading || viewsLoading;

  // Calculate stats from profile views
  const totalViews = profileViews?.length ?? 0;
  const likes = profileViews?.filter(
    (v) => v.action === 'like' || v.action === 'super_like'
  ).length ?? 0;
  const passes = profileViews?.filter((v) => v.action === 'pass').length ?? 0;
  const likeRate = totalViews > 0 ? Math.round((likes / totalViews) * 100) : 0;

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refreshMutation.mutate();
  };

  // Check if we have enough data for a meaningful profile
  const hasEnoughData = tasteProfile && tasteProfile.confidence_score > 0;

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text className="text-gray-400 mt-4">Loading taste profile...</Text>
          </SafeAreaView>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-zinc-900"
            >
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white font-semibold text-lg">
              Your Taste Profile
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Hero Section */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="mx-5 mt-4"
            >
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <Sparkles size={24} color="white" />
                  <Text className="text-white font-bold text-xl ml-3">
                    AI Learning Your Type
                  </Text>
                </View>
                <Text className="text-white/80 leading-relaxed">
                  As you browse profiles, our AI learns what attracts you. This
                  helps us surface better matches tailored to your unique
                  preferences.
                </Text>

                {/* Stats Row */}
                <View className="flex-row mt-5 gap-4">
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/60 text-xs uppercase mb-1">
                      Profiles Seen
                    </Text>
                    <Text className="text-white font-bold text-2xl">
                      {totalViews}
                    </Text>
                  </View>
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/60 text-xs uppercase mb-1">
                      Like Rate
                    </Text>
                    <Text className="text-white font-bold text-2xl">
                      {likeRate}%
                    </Text>
                  </View>
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/60 text-xs uppercase mb-1">
                      Confidence
                    </Text>
                    <Text className="text-white font-bold text-2xl">
                      {tasteProfile
                        ? Math.round(tasteProfile.confidence_score * 100)
                        : 0}
                      %
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Not Enough Data State */}
            {!hasEnoughData && (
              <Animated.View
                entering={FadeInDown.delay(200)}
                className="mx-5 mt-6 bg-zinc-900 rounded-2xl p-6 items-center"
              >
                <View className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
                  <Eye size={28} color="#6b7280" />
                </View>
                <Text className="text-white font-semibold text-lg mb-2">
                  Still Learning...
                </Text>
                <Text className="text-gray-400 text-center mb-4">
                  Browse at least 5 profiles so our AI can start understanding
                  your preferences.
                </Text>
                <View className="flex-row items-center bg-zinc-800 px-4 py-2 rounded-full">
                  <BarChart3 size={16} color="#a855f7" />
                  <Text className="text-purple-400 ml-2">
                    {totalViews}/5 profiles viewed
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Attraction Patterns */}
            {hasEnoughData && tasteProfile && (
              <>
                <Animated.View
                  entering={FadeInDown.delay(200)}
                  className="mx-5 mt-6"
                >
                  <View className="flex-row items-center mb-4">
                    <Heart size={20} color="#ec4899" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Attraction Patterns
                    </Text>
                  </View>

                  <View className="bg-zinc-900 rounded-2xl p-4">
                    {/* Age Preference */}
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">Preferred Age Range</Text>
                      <Text className="text-white font-medium">
                        {tasteProfile.attraction_patterns.preferred_age_range[0]}{' '}
                        -{' '}
                        {tasteProfile.attraction_patterns.preferred_age_range[1]}
                      </Text>
                    </View>

                    {/* Average Liked Age */}
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">Average Liked Age</Text>
                      <Text className="text-white font-medium">
                        {Math.round(
                          tasteProfile.attraction_patterns.avg_liked_age
                        )}
                      </Text>
                    </View>

                    {/* Bio Length Preference */}
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">Bio Length Preference</Text>
                      <Text className="text-white font-medium capitalize">
                        {tasteProfile.attraction_patterns.bio_length_preference}
                      </Text>
                    </View>

                    {/* Photo Count Preference */}
                    <View className="flex-row items-center justify-between py-3">
                      <Text className="text-gray-400">Photo Preference</Text>
                      <Text className="text-white font-medium">
                        {Math.round(
                          tasteProfile.attraction_patterns.preferred_photo_count
                        )}
                        + photos
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Relationship Structure Preferences */}
                {tasteProfile.attraction_patterns
                  .preferred_relationship_structures &&
                  tasteProfile.attraction_patterns.preferred_relationship_structures
                    .length > 0 && (
                    <Animated.View
                      entering={FadeInDown.delay(300)}
                      className="mx-5 mt-6"
                    >
                      <View className="flex-row items-center mb-4">
                        <Users size={20} color="#a855f7" />
                        <Text className="text-white font-semibold text-lg ml-2">
                          Preferred Structures
                        </Text>
                      </View>

                      <View className="flex-row flex-wrap gap-2">
                        {tasteProfile.attraction_patterns.preferred_relationship_structures.map(
                          (structure, idx) => (
                            <Animated.View
                              key={structure}
                              entering={FadeIn.delay(300 + idx * 50)}
                              className="bg-purple-500/20 px-4 py-2 rounded-full"
                            >
                              <Text className="text-purple-300 capitalize">
                                {structure.replace(/_/g, ' ')}
                              </Text>
                            </Animated.View>
                          )
                        )}
                      </View>
                    </Animated.View>
                  )}

                {/* Behavioral Patterns */}
                <Animated.View
                  entering={FadeInDown.delay(400)}
                  className="mx-5 mt-6"
                >
                  <View className="flex-row items-center mb-4">
                    <Clock size={20} color="#3b82f6" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Your Browsing Style
                    </Text>
                  </View>

                  <View className="bg-zinc-900 rounded-2xl p-4">
                    {/* Average Session Duration */}
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">
                        Avg Session Duration
                      </Text>
                      <Text className="text-white font-medium">
                        {Math.round(
                          tasteProfile.behavioral_patterns
                            .avg_session_duration_mins
                        )}
                        min
                      </Text>
                    </View>

                    {/* Profiles Per Session */}
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">Profiles Per Session</Text>
                      <Text className="text-white font-medium">
                        {Math.round(
                          tasteProfile.behavioral_patterns.avg_profiles_viewed_per_session
                        )}
                      </Text>
                    </View>

                    {/* Active Times */}
                    <View className="flex-row items-center justify-between py-3">
                      <Text className="text-gray-400">Most Active</Text>
                      <Text className="text-white font-medium">
                        {formatActiveHours(
                          tasteProfile.behavioral_patterns.typical_active_hours
                        )}
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Message Style */}
                <Animated.View
                  entering={FadeInDown.delay(500)}
                  className="mx-5 mt-6"
                >
                  <View className="flex-row items-center mb-4">
                    <MessageSquare size={20} color="#10b981" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Communication Style
                    </Text>
                  </View>

                  <View className="bg-zinc-900 rounded-2xl p-4">
                    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
                      <Text className="text-gray-400">Message Style</Text>
                      <Text className="text-white font-medium capitalize">
                        {tasteProfile.behavioral_patterns.message_style}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-3">
                      <Text className="text-gray-400">Response Speed</Text>
                      <Text className="text-white font-medium capitalize">
                        {tasteProfile.behavioral_patterns.response_speed}
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Activity Stats */}
                <Animated.View
                  entering={FadeInDown.delay(600)}
                  className="mx-5 mt-6"
                >
                  <View className="flex-row items-center mb-4">
                    <TrendingUp size={20} color="#f59e0b" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Activity Stats
                    </Text>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-emerald-500/10 rounded-2xl p-4 items-center">
                      <ThumbsUp size={24} color="#10b981" />
                      <Text className="text-emerald-400 font-bold text-2xl mt-2">
                        {likes}
                      </Text>
                      <Text className="text-gray-400 text-sm">Likes</Text>
                    </View>

                    <View className="flex-1 bg-red-500/10 rounded-2xl p-4 items-center">
                      <ThumbsDown size={24} color="#ef4444" />
                      <Text className="text-red-400 font-bold text-2xl mt-2">
                        {passes}
                      </Text>
                      <Text className="text-gray-400 text-sm">Passes</Text>
                    </View>

                    <View className="flex-1 bg-blue-500/10 rounded-2xl p-4 items-center">
                      <Eye size={24} color="#3b82f6" />
                      <Text className="text-blue-400 font-bold text-2xl mt-2">
                        {totalViews}
                      </Text>
                      <Text className="text-gray-400 text-sm">Total</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Refresh Button */}
                <Animated.View
                  entering={FadeInDown.delay(700)}
                  className="mx-5 mt-6"
                >
                  <Pressable
                    onPress={handleRefresh}
                    disabled={refreshMutation.isPending}
                    className="bg-zinc-900 rounded-2xl p-4 flex-row items-center justify-center"
                  >
                    {refreshMutation.isPending ? (
                      <ActivityIndicator color="#a855f7" />
                    ) : (
                      <>
                        <BarChart3 size={20} color="#a855f7" />
                        <Text className="text-purple-400 font-medium ml-2">
                          Refresh Analysis
                        </Text>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Info Note */}
                <Animated.View
                  entering={FadeIn.delay(800)}
                  className="mx-5 mt-6 flex-row items-start bg-zinc-900/50 rounded-xl p-4"
                >
                  <Info size={16} color="#6b7280" className="mt-0.5" />
                  <Text className="text-gray-500 text-sm ml-3 flex-1">
                    Your taste profile updates as you browse more profiles. The
                    more you use Blend, the better our AI understands your
                    preferences.
                  </Text>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

function formatActiveHours(hours: number[]): string {
  if (!hours || hours.length === 0) return 'Varies';

  // Group consecutive hours
  const avgHour = Math.round(
    hours.reduce((a, b) => a + b, 0) / hours.length
  );

  if (avgHour >= 6 && avgHour < 12) return 'Morning';
  if (avgHour >= 12 && avgHour < 17) return 'Afternoon';
  if (avgHour >= 17 && avgHour < 21) return 'Evening';
  return 'Night';
}
