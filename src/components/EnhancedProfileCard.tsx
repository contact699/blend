import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  MapPin,
  Shield,
  Users,
  Check,
  Sparkles,
  Clock,
  MessageCircle,
  Wifi,
} from 'lucide-react-native';
import { Profile, ENMBadge, RelationshipStructure, STITestRecord, TrustTier, TrustBadge as TrustBadgeType } from '@/lib/types';
import { ENM_BADGES, RELATIONSHIP_STRUCTURES } from '@/lib/mock-data';
import { TrustBadgeIcon } from './TrustBadge';
import { TrustScorePreview } from './TrustScoreCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedProfileCardProps {
  profile: Profile;
  badges?: ENMBadge[];
  relationshipStructure?: RelationshipStructure;
  stiRecord?: STITestRecord | null;
  partnerCount?: number;
  trustTier?: TrustTier;
  trustScore?: number;
  trustBadges?: TrustBadgeType[];
  onPress?: () => void;
  isCompact?: boolean;
}

function BadgeDisplay({ badges }: { badges: ENMBadge[] }) {
  const displayBadges = badges.slice(0, 4);
  const badgeData = displayBadges.map((id) => ENM_BADGES.find((b) => b.id === id)).filter(Boolean);

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {badgeData.map((badge) => (
        <View
          key={badge?.id}
          className="flex-row items-center px-2 py-1 rounded-full"
          style={{ backgroundColor: badge?.color + '30' }}
        >
          <Text className="text-xs">{badge?.icon}</Text>
          <Text className="text-xs ml-1" style={{ color: badge?.color }}>
            {badge?.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RelationshipStructureBadge({ structure }: { structure: RelationshipStructure }) {
  const structureData = RELATIONSHIP_STRUCTURES.find((s) => s.id === structure);
  if (!structureData) return null;

  return (
    <View className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-500/20">
      <Text className="text-sm mr-1">{structureData.emoji}</Text>
      <Text className="text-purple-400 text-sm font-medium">{structureData.label}</Text>
    </View>
  );
}

function STIStatusIndicator({ record }: { record: STITestRecord }) {
  const daysSince = Math.floor(
    (Date.now() - new Date(record.test_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isRecent = daysSince <= 90;

  return (
    <View
      className="flex-row items-center px-2.5 py-1 rounded-full"
      style={{ backgroundColor: isRecent ? '#22c55e30' : '#eab30830' }}
    >
      <Shield size={12} color={isRecent ? '#22c55e' : '#eab308'} />
      <Text
        className="text-xs ml-1 font-medium"
        style={{ color: isRecent ? '#22c55e' : '#eab308' }}
      >
        {record.all_negative ? 'Tested' : 'See status'} {daysSince}d ago
      </Text>
    </View>
  );
}

export default function EnhancedProfileCard({
  profile,
  badges = [],
  relationshipStructure,
  stiRecord,
  partnerCount = 0,
  trustTier,
  trustScore,
  trustBadges = [],
  onPress,
  isCompact = false,
}: EnhancedProfileCardProps) {
  const hasPhoto = profile.photos && profile.photos.length > 0;

  if (isCompact) {
    return (
      <Pressable onPress={onPress}>
        <Animated.View
          entering={FadeIn}
          className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
        >
          <View className="flex-row">
            {hasPhoto ? (
              <Image
                source={{ uri: profile.photos[0] }}
                className="w-24 h-24"
                resizeMode="cover"
              />
            ) : (
              <View className="w-24 h-24 bg-zinc-800 items-center justify-center">
                <Users size={32} color="#6b7280" />
              </View>
            )}

            <View className="flex-1 p-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold">{profile.display_name}</Text>
                  <Text className="text-zinc-500 ml-1">, {profile.age}</Text>
                </View>
                {trustTier && trustScore !== undefined && (
                  <TrustScorePreview tier={trustTier} score={trustScore} badges={trustBadges} />
                )}
              </View>

              <View className="flex-row items-center mt-1">
                <MapPin size={12} color="#9ca3af" />
                <Text className="text-zinc-400 text-sm ml-1">{profile.city}</Text>
              </View>

              {relationshipStructure && (
                <View className="mt-2">
                  <RelationshipStructureBadge structure={relationshipStructure} />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="flex-1">
      <Animated.View
        entering={FadeInDown.springify()}
        className="flex-1 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800"
      >
        {/* Photo with gradient overlay */}
        <View className="relative">
          {hasPhoto ? (
            <Image
              source={{ uri: profile.photos[0] }}
              className="w-full aspect-[3/4]"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full aspect-[3/4] bg-zinc-800 items-center justify-center">
              <Users size={64} color="#4b5563" />
              <Text className="text-zinc-500 mt-2">No photo</Text>
            </View>
          )}

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
            }}
          />

          {/* Top badges row */}
          <View className="absolute top-4 left-4 right-4 flex-row justify-between items-start">
            <View className="flex-row gap-2">
              {/* Virtual only indicator */}
              {profile.virtual_only && (
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/60">
                  <Wifi size={14} color="#c084fc" />
                  <Text className="text-purple-400 text-sm ml-1.5 font-medium">Virtual Only</Text>
                </View>
              )}

              {/* Trust Score indicator */}
              {trustTier && trustScore !== undefined && (
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/60">
                  <TrustBadgeIcon tier={trustTier} size={20} />
                  <Text className="text-white text-sm ml-1.5 font-bold">{trustScore}</Text>
                </View>
              )}
            </View>

            {/* Partner count indicator */}
            {partnerCount > 0 && (
              <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/60">
                <Users size={14} color="#ec4899" />
                <Text className="text-pink-400 text-sm ml-1.5 font-medium">
                  +{partnerCount} partner{partnerCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom info overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-4">
            {/* Name and basic info */}
            <View className="flex-row items-end justify-between mb-2">
              <View>
                <Text className="text-white font-bold text-2xl">{profile.display_name}</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-zinc-300 text-base">{profile.age}</Text>
                  <View className="w-1 h-1 bg-zinc-500 rounded-full mx-2" />
                  <MapPin size={14} color="#9ca3af" />
                  <Text className="text-zinc-400 ml-1">{profile.city}</Text>
                </View>
              </View>
            </View>

            {/* Relationship structure */}
            {relationshipStructure && (
              <View className="mb-3">
                <RelationshipStructureBadge structure={relationshipStructure} />
              </View>
            )}

            {/* ENM Badges */}
            {badges.length > 0 && (
              <View className="mb-3">
                <BadgeDisplay badges={badges} />
              </View>
            )}

            {/* Safety status row */}
            {stiRecord && (
              <View className="flex-row items-center">
                <STIStatusIndicator record={stiRecord} />
              </View>
            )}
          </View>
        </View>

        {/* Bottom section with more details */}
        <View className="p-4 bg-zinc-900">
          {/* Bio */}
          {profile.bio && (
            <Text className="text-zinc-300 text-sm leading-relaxed mb-3" numberOfLines={2}>
              {profile.bio}
            </Text>
          )}

          {/* Pace and response indicators */}
          <View className="flex-row gap-2 mb-3">
            <View className="flex-row items-center px-3 py-1.5 rounded-full bg-zinc-800">
              <Clock size={14} color="#9ca3af" />
              <Text className="text-zinc-400 text-sm ml-1.5 capitalize">
                {profile.pace_preference} pace
              </Text>
            </View>
            <View className="flex-row items-center px-3 py-1.5 rounded-full bg-zinc-800">
              <MessageCircle size={14} color="#9ca3af" />
              <Text className="text-zinc-400 text-sm ml-1.5 capitalize">
                {profile.response_style} replies
              </Text>
            </View>
            {profile.open_to_meet && (
              <View className="flex-row items-center px-3 py-1.5 rounded-full bg-green-500/20">
                <Check size={14} color="#22c55e" />
                <Text className="text-green-400 text-sm ml-1">Open to meet</Text>
              </View>
            )}
          </View>

          {/* Linked partner preview */}
          {profile.linked_partner && (
            <View className="flex-row items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <View className="flex-row items-center flex-1">
                {profile.linked_partner.photo ? (
                  <Image
                    source={{ uri: profile.linked_partner.photo }}
                    className="w-10 h-10 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center">
                    <Heart size={16} color="#ec4899" />
                  </View>
                )}
                <View className="ml-3">
                  <Text className="text-white font-medium">{profile.linked_partner.name}</Text>
                  <Text className="text-zinc-500 text-sm">{profile.linked_partner.age}</Text>
                </View>
              </View>
              <View className="px-2 py-1 bg-pink-500/20 rounded-full">
                <Text className="text-pink-400 text-xs">Partner</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
