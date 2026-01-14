import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  Wifi,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AnySearchResult, ProfileSearchResult, EventSearchResult } from '@/lib/types';
import { TrustBadgeIcon } from '../TrustBadge';

interface MapPreviewCardProps {
  result: AnySearchResult;
  onViewProfile: () => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MapPreviewCard({ result, onViewProfile, onClose }: MapPreviewCardProps) {
  if (result.type === 'profile') {
    return <ProfilePreview result={result} onViewProfile={onViewProfile} onClose={onClose} />;
  } else if (result.type === 'event') {
    return <EventPreview result={result} onViewProfile={onViewProfile} onClose={onClose} />;
  }
  return null;
}

function ProfilePreview({
  result,
  onViewProfile,
  onClose,
}: {
  result: ProfileSearchResult;
  onViewProfile: () => void;
  onClose: () => void;
}) {
  const { profile, distance, trustTier, trustScore } = result;
  const hasPhoto = profile.photos && profile.photos.length > 0;

  return (
    <AnimatedPressable
      entering={FadeInUp.springify()}
      exiting={FadeOutDown}
      onPress={onViewProfile}
      className="absolute bottom-20 left-4 right-4 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Close button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
      >
        <X size={18} color="#ffffff" />
      </Pressable>

      <View className="flex-row">
        {/* Photo */}
        <View className="relative w-24 h-32">
          {hasPhoto ? (
            <Image
              source={{ uri: profile.photos[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-zinc-800 items-center justify-center">
              <Users size={32} color="#4b5563" />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
            }}
          />
        </View>

        {/* Info */}
        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                {profile.display_name}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-zinc-400">{profile.age}</Text>
                <View className="w-1 h-1 bg-zinc-500 rounded-full mx-2" />
                <MapPin size={12} color="#9ca3af" />
                <Text className="text-zinc-400 ml-1" numberOfLines={1}>
                  {profile.city}
                </Text>
              </View>
              {distance !== undefined && (
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color="#a855f7" />
                  <Text className="text-purple-400 text-sm ml-1">
                    {distance.toFixed(1)} mi away
                  </Text>
                </View>
              )}
            </View>

            {/* Trust Badge */}
            {trustTier && trustScore !== undefined && (
              <View className="flex-row items-center px-2 py-1 rounded-full bg-black/40">
                <TrustBadgeIcon tier={trustTier} size={14} />
                <Text className="text-white text-sm ml-1 font-bold">{trustScore}</Text>
              </View>
            )}
          </View>

          {/* Bio snippet */}
          {profile.bio && (
            <Text className="text-zinc-300 text-xs mb-2" numberOfLines={2}>
              {profile.bio}
            </Text>
          )}

          {/* Tags */}
          <View className="flex-row flex-wrap gap-1.5">
            {profile.virtual_only && (
              <View className="flex-row items-center px-2 py-1 rounded-full bg-purple-500/20">
                <Wifi size={10} color="#c084fc" />
                <Text className="text-purple-400 text-xs ml-1">Virtual</Text>
              </View>
            )}
            {profile.open_to_meet && (
              <View className="flex-row items-center px-2 py-1 rounded-full bg-green-500/20">
                <Check size={10} color="#22c55e" />
                <Text className="text-green-400 text-xs ml-1">Open to meet</Text>
              </View>
            )}
            <View className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800">
              <Clock size={10} color="#9ca3af" />
              <Text className="text-zinc-400 text-xs ml-1 capitalize">
                {profile.pace_preference} pace
              </Text>
            </View>
          </View>

          {/* View Profile Button */}
          <View className="flex-row items-center justify-end mt-2">
            <Text className="text-purple-400 text-sm font-medium">View Profile</Text>
            <ChevronRight size={16} color="#a855f7" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function EventPreview({
  result,
  onViewProfile,
  onClose,
}: {
  result: EventSearchResult;
  onViewProfile: () => void;
  onClose: () => void;
}) {
  const { event } = result;

  return (
    <AnimatedPressable
      entering={FadeInUp.springify()}
      exiting={FadeOutDown}
      onPress={onViewProfile}
      className="absolute bottom-20 left-4 right-4 bg-zinc-900 rounded-3xl overflow-hidden border border-amber-500/50"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Close button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
      >
        <X size={18} color="#ffffff" />
      </Pressable>

      <View className="flex-row">
        {/* Cover Image */}
        <View className="relative w-24 h-32 bg-amber-500/20 items-center justify-center">
          {event.cover_image ? (
            <Image
              source={{ uri: event.cover_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Calendar size={32} color="#f59e0b" />
          )}
        </View>

        {/* Info */}
        <View className="flex-1 p-3">
          <View className="mb-2">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {event.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Calendar size={12} color="#f59e0b" />
              <Text className="text-amber-400 text-sm ml-1">
                {new Date(event.start_date).toLocaleDateString()}
              </Text>
            </View>
            {event.location && (
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color="#9ca3af" />
                <Text className="text-zinc-400 text-sm ml-1" numberOfLines={1}>
                  {event.location.name || event.location.city}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <Text className="text-zinc-300 text-xs mb-2" numberOfLines={2}>
              {event.description}
            </Text>
          )}

          {/* Attendee count */}
          <View className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800 self-start mb-2">
            <Users size={10} color="#9ca3af" />
            <Text className="text-zinc-400 text-xs ml-1">
              {event.current_attendees} attending
            </Text>
          </View>

          {/* View Event Button */}
          <View className="flex-row items-center justify-end">
            <Text className="text-amber-400 text-sm font-medium">View Event</Text>
            <ChevronRight size={16} color="#f59e0b" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
