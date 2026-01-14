import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  Users,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  Heart,
  ThumbsUp,
  Star,
} from 'lucide-react-native';
import {
  useTrustScore,
  useDateReviews,
  useCommunityVouches,
  useCurrentUser,
} from '@/lib/supabase';
import { TrustTier, TRUST_TIER_INFO, TrustBadge as TrustBadgeType } from '@/lib/types';
import TrustBadge from '@/components/TrustBadge';
import TrustScoreCard from '@/components/TrustScoreCard';

const BADGE_INFO: Record<TrustBadgeType, { label: string; icon: string; description: string }> = {
  verified_photo: { label: 'Verified Photo', icon: '📷', description: 'Photo verified as authentic' },
  verified_social: { label: 'Social Verified', icon: '🔗', description: 'Connected social accounts' },
  community_vouched: { label: 'Community Vouched', icon: '🤝', description: 'Vouched by 3+ trusted members' },
  event_host: { label: 'Event Host', icon: '🎉', description: 'Successfully hosted 3+ events' },
  safe_dater: { label: 'Safe Dater', icon: '💚', description: '5+ positive date reviews' },
  great_communicator: { label: 'Great Communicator', icon: '💬', description: '90%+ response rate' },
  reliable: { label: 'Reliable', icon: '⏰', description: 'Shows up consistently' },
  respectful: { label: 'Respectful', icon: '🙏', description: 'No upheld reports' },
  sti_transparent: { label: 'STI Transparent', icon: '🩺', description: 'Regular STI updates' },
  consent_champion: { label: 'Consent Champion', icon: '✅', description: 'Positive consent feedback' },
  long_term_member: { label: 'Long Term Member', icon: '⭐', description: '1+ year on platform' },
  community_builder: { label: 'Community Builder', icon: '🏗️', description: 'Active in community events' },
};

type TabType = 'overview' | 'reviews' | 'vouches';

export default function TrustProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: currentUser } = useCurrentUser();
  const targetUserId = userId ?? currentUser?.id;
  const isOwnProfile = targetUserId === currentUser?.id;

  // Fetch data from Supabase
  const { data: trustScore, isLoading: trustScoreLoading } = useTrustScore(targetUserId);
  const { data: reviews, isLoading: reviewsLoading } = useDateReviews(targetUserId);
  const { data: vouches, isLoading: vouchesLoading } = useCommunityVouches(targetUserId);

  const isLoading = trustScoreLoading || reviewsLoading || vouchesLoading;

  if (isLoading || !trustScore) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text className="text-gray-400 mt-4">Loading trust profile...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const tierInfo = TRUST_TIER_INFO[trustScore.tier as TrustTier];

  // Convert Supabase trust score to component format
  const trustScoreForCard = {
    user_id: trustScore.user_id,
    overall_score: trustScore.overall_score,
    tier: trustScore.tier as TrustTier,
    badges: trustScore.badges as TrustBadgeType[],
    dimensions: {
      behavior: { id: 'behavior', name: 'Behavior', score: trustScore.dimensions.behavior.score, weight: 0.15, description: trustScore.dimensions.behavior.description, factors: [] },
      community: { id: 'community', name: 'Community', score: trustScore.dimensions.community.score, weight: 0.2, description: trustScore.dimensions.community.description, factors: [] },
      reliability: { id: 'reliability', name: 'Reliability', score: trustScore.dimensions.reliability.score, weight: 0.2, description: trustScore.dimensions.reliability.description, factors: [] },
      safety: { id: 'safety', name: 'Safety', score: trustScore.dimensions.safety.score, weight: 0.2, description: trustScore.dimensions.safety.description, factors: [] },
      engagement: { id: 'engagement', name: 'Engagement', score: trustScore.dimensions.engagement.score, weight: 0.1, description: trustScore.dimensions.engagement.description, factors: [] },
      transparency: { id: 'transparency', name: 'Transparency', score: trustScore.dimensions.transparency.score, weight: 0.15, description: trustScore.dimensions.transparency.description, factors: [] },
    },
    stats: {
      dates_completed: trustScore.stats.dates_completed,
      events_attended: trustScore.stats.events_attended,
      events_hosted: trustScore.stats.events_hosted,
      reviews_received: trustScore.stats.reviews_received,
      average_rating: trustScore.stats.average_rating,
      vouches_received: trustScore.stats.vouches_received,
      vouches_given: 0,
      reports_received: 0,
      reports_upheld: 0,
      response_rate: trustScore.stats.response_rate,
      message_quality_score: 0,
      profile_completeness: 0,
      days_on_platform: trustScore.stats.days_on_platform,
      last_active: new Date().toISOString(),
    },
    history: [],
    created_at: trustScore.created_at,
    updated_at: trustScore.updated_at,
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'reviews', label: 'Reviews', count: reviews?.length ?? 0 },
    { key: 'vouches', label: 'Vouches', count: vouches?.length ?? 0 },
  ];

  const renderOverview = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* Dimensions */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-3">Trust Dimensions</Text>
        <View className="space-y-3">
          {Object.entries(trustScore.dimensions).map(([key, dim], index) => (
            <Animated.View
              key={key}
              entering={FadeInDown.delay(index * 50).duration(300)}
              className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-medium capitalize">{key}</Text>
                <Text className="text-white font-bold">{Math.round(dim.score)}/100</Text>
              </View>
              <View className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <View
                  style={{
                    width: `${dim.score}%`,
                    height: 8,
                    backgroundColor: tierInfo.color,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text className="text-zinc-500 text-xs">{dim.description}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Badges */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-3">
          Earned Badges ({trustScore.badges.length})
        </Text>
        {trustScore.badges.length > 0 ? (
          <View className="space-y-2">
            {trustScore.badges.map((badge, index) => (
              <Animated.View
                key={badge}
                entering={SlideInRight.delay(index * 50).duration(300)}
                className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 flex-row items-center"
              >
                <Text className="text-2xl mr-3">{BADGE_INFO[badge as TrustBadgeType]?.icon}</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">{BADGE_INFO[badge as TrustBadgeType]?.label}</Text>
                  <Text className="text-zinc-500 text-xs">{BADGE_INFO[badge as TrustBadgeType]?.description}</Text>
                </View>
                <CheckCircle size={20} color="#22c55e" />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View className="bg-zinc-900/50 rounded-xl p-6 items-center border border-zinc-800">
            <Award size={32} color="#71717a" />
            <Text className="text-zinc-500 mt-2">No badges earned yet</Text>
            <Text className="text-zinc-600 text-xs text-center mt-1">
              Complete dates and get positive reviews to earn badges
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-3">Activity Stats</Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            { label: 'Dates Completed', value: trustScore.stats.dates_completed, icon: Heart },
            { label: 'Events Attended', value: trustScore.stats.events_attended, icon: Calendar },
            { label: 'Events Hosted', value: trustScore.stats.events_hosted, icon: Users },
            { label: 'Reviews Received', value: trustScore.stats.reviews_received, icon: Star },
            { label: 'Average Rating', value: trustScore.stats.average_rating.toFixed(1), icon: Award },
            { label: 'Vouches Received', value: trustScore.stats.vouches_received, icon: ThumbsUp },
            { label: 'Response Rate', value: `${Math.round(trustScore.stats.response_rate * 100)}%`, icon: MessageCircle },
            { label: 'Days on Platform', value: trustScore.stats.days_on_platform, icon: Clock },
          ].map((stat, index) => (
            <Animated.View
              key={stat.label}
              entering={FadeInDown.delay(index * 30).duration(300)}
              className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 w-[48%]"
            >
              <View className="flex-row items-center gap-2 mb-1">
                <stat.icon size={14} color="#71717a" />
                <Text className="text-zinc-500 text-xs">{stat.label}</Text>
              </View>
              <Text className="text-white text-lg font-bold">{stat.value}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderReviews = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {reviews && reviews.length > 0 ? (
        <View className="space-y-3">
          {reviews.map((review, index) => (
            <Animated.View
              key={review.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
              className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800"
            >
              <View className="flex-row items-center mb-3">
                {review.reviewer_profile?.photos?.[0]?.signedUrl ? (
                  <Image
                    source={{ uri: review.reviewer_profile.photos[0].signedUrl }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-3">
                    <Text className="text-zinc-400">?</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-white font-medium">
                    {review.is_anonymous ? 'Anonymous' : review.reviewer_profile?.display_name ?? 'Unknown'}
                  </Text>
                  <Text className="text-zinc-500 text-xs">
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color={i < review.rating ? '#fbbf24' : '#3f3f46'}
                      fill={i < review.rating ? '#fbbf24' : 'transparent'}
                    />
                  ))}
                </View>
              </View>

              {/* Category Ratings */}
              <View className="flex-row flex-wrap gap-2 mb-3">
                {Object.entries(review.categories).map(([cat, rating]) => (
                  <View key={cat} className="bg-zinc-800/50 rounded-full px-2 py-1">
                    <Text className="text-zinc-400 text-xs capitalize">
                      {cat}: {rating}/5
                    </Text>
                  </View>
                ))}
              </View>

              {/* Positives */}
              {review.positives && review.positives.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-2">
                  {review.positives.map((pos) => (
                    <View key={pos} className="bg-green-500/20 rounded-full px-2 py-0.5">
                      <Text className="text-green-400 text-xs">
                        {pos.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Concerns */}
              {review.concerns && review.concerns.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-2">
                  {review.concerns.map((concern) => (
                    <View key={concern} className="bg-red-500/20 rounded-full px-2 py-0.5">
                      <Text className="text-red-400 text-xs">
                        {concern.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {review.comment && (
                <Text className="text-zinc-300 text-sm mt-2">"{review.comment}"</Text>
              )}

              {review.verified && (
                <View className="flex-row items-center mt-2">
                  <CheckCircle size={12} color="#22c55e" />
                  <Text className="text-green-500 text-xs ml-1">Verified meetup</Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      ) : (
        <View className="bg-zinc-900/50 rounded-xl p-8 items-center border border-zinc-800">
          <Star size={40} color="#71717a" />
          <Text className="text-zinc-400 mt-3 font-medium">No reviews yet</Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Reviews appear after completing dates with other members
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderVouches = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {vouches && vouches.length > 0 ? (
        <View className="space-y-3">
          {vouches.map((vouch, index) => (
            <Animated.View
              key={vouch.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
              className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800"
            >
              <View className="flex-row items-center mb-3">
                {vouch.voucher_profile?.photos?.[0]?.signedUrl ? (
                  <Image
                    source={{ uri: vouch.voucher_profile.photos[0].signedUrl }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-3">
                    <Users size={18} color="#71717a" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-medium">
                      {vouch.voucher_profile?.display_name ?? 'Unknown'}
                    </Text>
                    {vouch.voucher_trust_score?.tier && (
                      <TrustBadge tier={vouch.voucher_trust_score.tier as TrustTier} size="small" animated={false} />
                    )}
                  </View>
                  <Text className="text-zinc-500 text-xs capitalize">
                    {vouch.relationship.replace(/_/g, ' ')} • {vouch.duration_known.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              {vouch.message && (
                <Text className="text-zinc-300 text-sm">"{vouch.message}"</Text>
              )}

              <Text className="text-zinc-600 text-xs mt-2">
                {new Date(vouch.created_at).toLocaleDateString()}
              </Text>
            </Animated.View>
          ))}
        </View>
      ) : (
        <View className="bg-zinc-900/50 rounded-xl p-8 items-center border border-zinc-800">
          <ThumbsUp size={40} color="#71717a" />
          <Text className="text-zinc-400 mt-3 font-medium">No vouches yet</Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Ask trusted community members to vouch for you
          </Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#18181b', '#09090b', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="border-b border-zinc-800/50"
        >
          <BlurView intensity={60} tint="dark">
            <View className="flex-row items-center px-4 py-3">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center mr-3"
              >
                <ArrowLeft size={22} color="white" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">
                  {isOwnProfile ? 'My Trust Score' : 'Trust Score'}
                </Text>
                <Text className="text-zinc-500 text-xs">{tierInfo.description}</Text>
              </View>
              <TrustBadge tier={trustScore.tier as TrustTier} score={trustScore.overall_score} showScore />
            </View>
          </BlurView>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {/* Trust Score Card */}
          <TrustScoreCard trustScore={trustScoreForCard} variant="compact" />

          {/* Tabs */}
          <View className="flex-row bg-zinc-900/50 rounded-xl p-1 mb-4">
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  activeTab === tab.key ? 'bg-zinc-800' : ''
                }`}
              >
                <Text
                  className={`text-center text-sm ${
                    activeTab === tab.key ? 'text-white font-medium' : 'text-zinc-500'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reviews' && renderReviews()}
          {activeTab === 'vouches' && renderVouches()}

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
