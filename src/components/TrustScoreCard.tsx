import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Award,
  Users,
  Clock,
  Heart,
  MessageCircle,
  Eye,
} from 'lucide-react-native';
import { TrustScore, TrustTier, TrustBadge as TrustBadgeType, TRUST_TIER_INFO } from '@/lib/types';
import TrustBadge, { TrustBadgeIcon } from './TrustBadge';

interface TrustScoreCardProps {
  trustScore: TrustScore;
  onPress?: () => void;
  variant?: 'full' | 'compact' | 'mini';
}

const BADGE_INFO: Record<TrustBadgeType, { label: string; icon: string; color: string }> = {
  verified_photo: { label: 'Verified Photo', icon: '📷', color: '#3b82f6' },
  verified_social: { label: 'Social Verified', icon: '🔗', color: '#8b5cf6' },
  community_vouched: { label: 'Community Vouched', icon: '🤝', color: '#10b981' },
  event_host: { label: 'Event Host', icon: '🎉', color: '#f59e0b' },
  safe_dater: { label: 'Safe Dater', icon: '💚', color: '#22c55e' },
  great_communicator: { label: 'Great Communicator', icon: '💬', color: '#06b6d4' },
  reliable: { label: 'Reliable', icon: '⏰', color: '#6366f1' },
  respectful: { label: 'Respectful', icon: '🙏', color: '#ec4899' },
  sti_transparent: { label: 'STI Transparent', icon: '🩺', color: '#14b8a6' },
  consent_champion: { label: 'Consent Champion', icon: '✅', color: '#84cc16' },
  long_term_member: { label: 'Long Term Member', icon: '⭐', color: '#f97316' },
  community_builder: { label: 'Community Builder', icon: '🏗️', color: '#a855f7' },
};

export default function TrustScoreCard({
  trustScore,
  onPress,
  variant = 'full',
}: TrustScoreCardProps) {
  const tierInfo = TRUST_TIER_INFO[trustScore.tier];
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(trustScore.overall_score / 100, { duration: 1000 });
  }, [trustScore.overall_score]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Check recent score changes
  const recentChange = trustScore.history.length > 0
    ? trustScore.history[trustScore.history.length - 1]
    : null;
  const scoreChange = recentChange
    ? recentChange.new_score - recentChange.previous_score
    : 0;

  if (variant === 'mini') {
    return (
      <Pressable onPress={handlePress}>
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center gap-2 bg-zinc-800/50 rounded-full px-3 py-1.5"
        >
          <TrustBadgeIcon tier={trustScore.tier} size={20} />
          <Text className="text-white font-semibold">{trustScore.overall_score}</Text>
          {scoreChange !== 0 && (
            <View className="flex-row items-center">
              {scoreChange > 0 ? (
                <TrendingUp size={12} color="#22c55e" />
              ) : (
                <TrendingDown size={12} color="#ef4444" />
              )}
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'compact') {
    return (
      <Pressable onPress={handlePress}>
        <Animated.View
          entering={FadeIn.duration(300)}
          className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <TrustBadgeIcon tier={trustScore.tier} size={32} />
              <View>
                <Text className="text-white font-semibold">{tierInfo.label}</Text>
                <Text className="text-zinc-500 text-xs">{tierInfo.description}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-white">{trustScore.overall_score}</Text>
              {scoreChange !== 0 && (
                <View className="flex-row items-center gap-1">
                  {scoreChange > 0 ? (
                    <>
                      <TrendingUp size={12} color="#22c55e" />
                      <Text className="text-green-500 text-xs">+{scoreChange}</Text>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={12} color="#ef4444" />
                      <Text className="text-red-500 text-xs">{scoreChange}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <Animated.View style={progressStyle}>
              <LinearGradient
                colors={[tierInfo.color, tierInfo.color + '80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 8, borderRadius: 4 }}
              />
            </Animated.View>
          </View>

          {/* Badges preview */}
          {trustScore.badges.length > 0 && (
            <View className="flex-row items-center mt-3 gap-1">
              {trustScore.badges.slice(0, 4).map((badge) => (
                <Text key={badge} className="text-base">
                  {BADGE_INFO[badge]?.icon}
                </Text>
              ))}
              {trustScore.badges.length > 4 && (
                <Text className="text-zinc-500 text-xs ml-1">
                  +{trustScore.badges.length - 4}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  // Full variant
  return (
    <Pressable onPress={handlePress}>
      <Animated.View entering={FadeInDown.duration(400)} className="mb-4">
        <BlurView intensity={40} tint="dark" className="rounded-3xl overflow-hidden">
          <LinearGradient
            colors={['rgba(39, 39, 42, 0.8)', 'rgba(24, 24, 27, 0.9)']}
            style={{ padding: 20 }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: tierInfo.color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={28} color={tierInfo.color} />
                </View>
                <View>
                  <Text className="text-white text-lg font-bold">Trust Score</Text>
                  <TrustBadge tier={trustScore.tier} size="small" animated={false} />
                </View>
              </View>

              <View className="items-end">
                <Text className="text-4xl font-bold text-white">{trustScore.overall_score}</Text>
                {scoreChange !== 0 && (
                  <View className="flex-row items-center gap-1 mt-1">
                    {scoreChange > 0 ? (
                      <>
                        <TrendingUp size={14} color="#22c55e" />
                        <Text className="text-green-500 text-sm font-medium">+{scoreChange}</Text>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={14} color="#ef4444" />
                        <Text className="text-red-500 text-sm font-medium">{scoreChange}</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <Animated.View style={progressStyle}>
                <LinearGradient
                  colors={[tierInfo.color, tierInfo.color + '80']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 12, borderRadius: 6 }}
                />
              </Animated.View>
            </View>

            {/* Tier Progress Markers */}
            <View className="flex-row justify-between mb-6 px-1">
              {(['newcomer', 'member', 'trusted', 'verified', 'ambassador'] as TrustTier[]).map(
                (t) => (
                  <View key={t} className="items-center">
                    <Text
                      className={`text-xs ${
                        trustScore.tier === t ? 'text-white font-semibold' : 'text-zinc-600'
                      }`}
                    >
                      {TRUST_TIER_INFO[t].icon}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Dimensions Grid */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {Object.entries(trustScore.dimensions).map(([key, dim]) => (
                <View
                  key={key}
                  className="bg-zinc-800/50 rounded-xl p-3 flex-1 min-w-[30%]"
                >
                  <Text className="text-zinc-400 text-xs capitalize mb-1">{key}</Text>
                  <Text className="text-white font-bold">{Math.round(dim.score)}</Text>
                </View>
              ))}
            </View>

            {/* Badges */}
            {trustScore.badges.length > 0 && (
              <View className="mb-4">
                <Text className="text-zinc-400 text-xs mb-2 uppercase tracking-wide">
                  Earned Badges
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {trustScore.badges.map((badge) => (
                    <View
                      key={badge}
                      className="flex-row items-center gap-1.5 bg-zinc-800/50 rounded-full px-3 py-1.5"
                    >
                      <Text>{BADGE_INFO[badge]?.icon}</Text>
                      <Text className="text-white text-xs">{BADGE_INFO[badge]?.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stats Row */}
            <View className="flex-row justify-around pt-4 border-t border-zinc-800">
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <Heart size={14} color="#ec4899" />
                  <Text className="text-white font-semibold">{trustScore.stats.dates_completed}</Text>
                </View>
                <Text className="text-zinc-500 text-xs">Dates</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <Award size={14} color="#f59e0b" />
                  <Text className="text-white font-semibold">
                    {trustScore.stats.average_rating.toFixed(1)}
                  </Text>
                </View>
                <Text className="text-zinc-500 text-xs">Rating</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <Users size={14} color="#22c55e" />
                  <Text className="text-white font-semibold">{trustScore.stats.vouches_received}</Text>
                </View>
                <Text className="text-zinc-500 text-xs">Vouches</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <MessageCircle size={14} color="#3b82f6" />
                  <Text className="text-white font-semibold">
                    {Math.round(trustScore.stats.response_rate * 100)}%
                  </Text>
                </View>
                <Text className="text-zinc-500 text-xs">Response</Text>
              </View>
            </View>

            {onPress && (
              <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-zinc-800">
                <Text className="text-purple-400 text-sm font-medium mr-1">View Full Profile</Text>
                <ChevronRight size={16} color="#a855f7" />
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

// Simple score display for profile cards
interface TrustScorePreviewProps {
  tier: TrustTier;
  score: number;
  badges?: TrustBadgeType[];
}

export function TrustScorePreview({ tier, score, badges = [] }: TrustScorePreviewProps) {
  const tierInfo = TRUST_TIER_INFO[tier];

  return (
    <View className="flex-row items-center gap-2">
      <TrustBadgeIcon tier={tier} size={24} />
      <Text className="text-white font-bold">{score}</Text>
      {badges.length > 0 && (
        <View className="flex-row items-center gap-0.5">
          {badges.slice(0, 3).map((badge) => (
            <Text key={badge} className="text-sm">
              {BADGE_INFO[badge]?.icon}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
