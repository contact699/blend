import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Sparkles,
  Video,
} from 'lucide-react-native';
import { Event } from '@/lib/types';
import { EVENT_CATEGORIES } from '@/lib/mock-events';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EventCardProps {
  event: Event;
  onPress: () => void;
  variant?: 'featured' | 'compact' | 'default';
}

export default function EventCard({
  event,
  onPress,
  variant = 'default',
}: EventCardProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const category = EVENT_CATEGORIES.find((c) => c.id === event.category);
  const spotsLeft = event.max_attendees
    ? event.max_attendees - event.current_attendees
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isAlmostFull = spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours ?? '0', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [0, 0.08]),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    pressed.value = withSpring(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    pressed.value = withSpring(0);
  };

  if (variant === 'featured') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="w-80 mr-4"
      >
        <View className="rounded-3xl overflow-hidden bg-zinc-900">
          {/* Cover Image */}
          <View className="h-44 relative">
            <Image
              source={{ uri: event.cover_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
              }}
            />

            {/* Featured Badge */}
            {event.is_featured && (
              <View className="absolute top-3 left-3">
                <BlurView intensity={80} tint="dark" className="rounded-full overflow-hidden">
                  <View className="flex-row items-center px-3 py-1.5 bg-amber-500/20">
                    <Sparkles size={12} color="#fbbf24" />
                    <Text className="text-amber-400 text-xs font-semibold ml-1">
                      Featured
                    </Text>
                  </View>
                </BlurView>
              </View>
            )}

            {/* Category Badge */}
            <View className="absolute top-3 right-3">
              <BlurView intensity={80} tint="dark" className="rounded-full overflow-hidden">
                <View
                  className="px-3 py-1.5"
                  style={{ backgroundColor: `${category?.color}20` }}
                >
                  <Text style={{ color: category?.color }} className="text-xs font-semibold">
                    {category?.emoji} {category?.label}
                  </Text>
                </View>
              </BlurView>
            </View>

            {/* Virtual Badge */}
            {event.location.is_virtual && (
              <View className="absolute bottom-3 left-3">
                <BlurView intensity={80} tint="dark" className="rounded-full overflow-hidden">
                  <View className="flex-row items-center px-3 py-1.5 bg-purple-500/20">
                    <Video size={12} color="#a855f7" />
                    <Text className="text-purple-400 text-xs font-semibold ml-1">
                      Virtual
                    </Text>
                  </View>
                </BlurView>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="p-4">
            <Text className="text-white text-lg font-bold mb-2" numberOfLines={2}>
              {event.title}
            </Text>

            {/* Date & Time */}
            <View className="flex-row items-center mb-2">
              <Calendar size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-2">
                {formatDate(event.start_date)}
              </Text>
              <View className="w-1 h-1 bg-zinc-600 rounded-full mx-2" />
              <Clock size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-1">
                {formatTime(event.start_time)}
              </Text>
            </View>

            {/* Location */}
            <View className="flex-row items-center mb-3">
              <MapPin size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-2" numberOfLines={1}>
                {event.location.name}, {event.location.city}
              </Text>
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-between">
              {/* Host */}
              <View className="flex-row items-center">
                <Image
                  source={{ uri: event.host.photo }}
                  className="w-6 h-6 rounded-full"
                />
                <Text className="text-zinc-400 text-xs ml-2">
                  by {event.host.display_name}
                </Text>
                {event.host.reputation_stars >= 4 && (
                  <View className="flex-row items-center ml-1">
                    <Star size={10} color="#fbbf24" fill="#fbbf24" />
                  </View>
                )}
              </View>

              {/* Attendees */}
              <View className="flex-row items-center">
                <Users size={14} color="#a1a1aa" />
                <Text
                  className={`text-sm ml-1 ${
                    isFull
                      ? 'text-red-400'
                      : isAlmostFull
                      ? 'text-amber-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {event.current_attendees}
                  {event.max_attendees && ` / ${event.max_attendees}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Press overlay */}
          <Animated.View
            style={[
              overlayStyle,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'white',
              },
            ]}
            pointerEvents="none"
          />
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === 'compact') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="mb-3"
      >
        <View className="flex-row bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800/50">
          {/* Thumbnail */}
          <View className="w-24 h-24 relative">
            <Image
              source={{ uri: event.cover_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {event.location.is_virtual && (
              <View className="absolute bottom-1 left-1 bg-purple-500/80 rounded-full p-1">
                <Video size={10} color="white" />
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 p-3 justify-center">
            <Text className="text-white font-semibold mb-1" numberOfLines={1}>
              {event.title}
            </Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-zinc-400 text-xs">
                {formatDate(event.start_date)} • {formatTime(event.start_time)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={12} color="#71717a" />
              <Text className="text-zinc-500 text-xs ml-1" numberOfLines={1}>
                {event.location.city}
              </Text>
              <View className="flex-row items-center ml-auto">
                <Users size={12} color="#71717a" />
                <Text
                  className={`text-xs ml-1 ${
                    isFull ? 'text-red-400' : 'text-zinc-400'
                  }`}
                >
                  {event.current_attendees}
                  {event.max_attendees && `/${event.max_attendees}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Category indicator */}
          <View
            className="w-1 h-full"
            style={{ backgroundColor: category?.color }}
          />
        </View>
      </AnimatedPressable>
    );
  }

  // Default variant
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="mb-4"
    >
      <View className="rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/50">
        {/* Cover Image */}
        <View className="h-40 relative">
          <Image
            source={{ uri: event.cover_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
            }}
          />

          {/* Category Badge */}
          <View className="absolute top-3 left-3">
            <BlurView intensity={60} tint="dark" className="rounded-full overflow-hidden">
              <View
                className="px-3 py-1.5"
                style={{ backgroundColor: `${category?.color}25` }}
              >
                <Text style={{ color: category?.color }} className="text-xs font-semibold">
                  {category?.emoji} {category?.label}
                </Text>
              </View>
            </BlurView>
          </View>

          {/* Spots Badge */}
          {(isFull || isAlmostFull) && (
            <View className="absolute top-3 right-3">
              <BlurView intensity={60} tint="dark" className="rounded-full overflow-hidden">
                <View
                  className={`px-3 py-1.5 ${
                    isFull ? 'bg-red-500/20' : 'bg-amber-500/20'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isFull ? 'text-red-400' : 'text-amber-400'
                    }`}
                  >
                    {isFull ? 'Full' : `${spotsLeft} spots left`}
                  </Text>
                </View>
              </BlurView>
            </View>
          )}

          {/* Virtual Badge */}
          {event.location.is_virtual && (
            <View className="absolute bottom-3 left-3">
              <View className="flex-row items-center bg-purple-500/90 px-2.5 py-1 rounded-full">
                <Video size={12} color="white" />
                <Text className="text-white text-xs font-medium ml-1">Virtual</Text>
              </View>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
          <Text className="text-white text-lg font-bold mb-2" numberOfLines={2}>
            {event.title}
          </Text>

          {/* Date, Time & Location */}
          <View className="flex-row items-center flex-wrap mb-3">
            <View className="flex-row items-center mr-4 mb-1">
              <Calendar size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-1.5">
                {formatDate(event.start_date)}
              </Text>
            </View>
            <View className="flex-row items-center mr-4 mb-1">
              <Clock size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-1.5">
                {formatTime(event.start_time)}
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <MapPin size={14} color="#a1a1aa" />
              <Text className="text-zinc-400 text-sm ml-1.5" numberOfLines={1}>
                {event.location.city}
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap mb-3">
            {event.tags.slice(0, 3).map((tag) => (
              <View
                key={tag}
                className="bg-zinc-800/60 rounded-full px-2.5 py-1 mr-2 mb-1"
              >
                <Text className="text-zinc-400 text-xs">{tag}</Text>
              </View>
            ))}
            {event.tags.length > 3 && (
              <View className="bg-zinc-800/60 rounded-full px-2.5 py-1 mb-1">
                <Text className="text-zinc-500 text-xs">+{event.tags.length - 3}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between pt-2 border-t border-zinc-800/50">
            {/* Host */}
            <View className="flex-row items-center">
              <Image
                source={{ uri: event.host.photo }}
                className="w-7 h-7 rounded-full border border-zinc-700"
              />
              <View className="ml-2">
                <Text className="text-zinc-300 text-xs font-medium">
                  {event.host.display_name}
                </Text>
                <View className="flex-row items-center">
                  {Array.from({ length: event.host.reputation_stars }).map((_, i) => (
                    <Star key={i} size={8} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </View>
              </View>
            </View>

            {/* Attendees */}
            <View className="flex-row items-center bg-zinc-800/60 px-3 py-1.5 rounded-full">
              <Users size={14} color="#a1a1aa" />
              <Text className="text-zinc-300 text-sm font-medium ml-1.5">
                {event.current_attendees}
                {event.max_attendees && (
                  <Text className="text-zinc-500"> / {event.max_attendees}</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Press overlay */}
        <Animated.View
          style={[
            overlayStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
            },
          ]}
          pointerEvents="none"
        />
      </View>
    </AnimatedPressable>
  );
}
