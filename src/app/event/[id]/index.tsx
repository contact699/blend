import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  MessageCircle,
  Video,
  Flag,
  MoreHorizontal,
  Check,
  HelpCircle,
  X,
  ChevronRight,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { EVENT_CATEGORIES } from '@/lib/static-data';
import { RSVPStatus } from '@/lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 320;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const events = useDatingStore((s) => s.events);
  const currentUserId = useDatingStore((s) => s.currentUserId);
  const rsvpToEvent = useDatingStore((s) => s.rsvpToEvent);
  const cancelRSVP = useDatingStore((s) => s.cancelRSVP);
  const getUserRSVPStatus = useDatingStore((s) => s.getUserRSVPStatus);

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  const userRSVP = id ? getUserRSVPStatus(id) : null;
  const isHost = event?.host_id === currentUserId;

  const scrollY = useSharedValue(0);
  const [showRSVPOptions, setShowRSVPOptions] = useState(false);

  const category = EVENT_CATEGORIES.find((c) => c.id === event?.category);
  const spotsLeft = event?.max_attendees
    ? event.max_attendees - event.current_attendees
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HEADER_HEIGHT],
          [-50, 0, HEADER_HEIGHT / 2],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.3, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const headerOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT - 100],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours ?? '0', 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleRSVP = (status: RSVPStatus) => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    rsvpToEvent(id, status);
    setShowRSVPOptions(false);
  };

  const handleCancelRSVP = () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelRSVP(id);
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n${formatDate(event.start_date)} at ${formatTime(event.start_time)}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Event',
      'Are you sure you want to report this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('Reported', 'Thank you for your report. We will review this event.');
          },
        },
      ]
    );
  };

  if (!event) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Event not found</Text>
      </View>
    );
  }

  const goingAttendees = event.attendees.filter((a) => a.rsvp_status === 'going');

  return (
    <View className="flex-1 bg-black">
      {/* Fixed Header */}
      <Animated.View
        style={[
          headerOverlayStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          },
        ]}
      >
        <BlurView intensity={80} tint="dark">
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                {event.title}
              </Text>
            </View>
          </SafeAreaView>
        </BlurView>
      </Animated.View>

      {/* Back Button */}
      <SafeAreaView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 101 }}
      >
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full overflow-hidden"
          >
            <BlurView intensity={60} tint="dark" className="flex-1 items-center justify-center">
              <ArrowLeft size={22} color="white" />
            </BlurView>
          </Pressable>
          <View className="flex-row">
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full overflow-hidden mr-2"
            >
              <BlurView intensity={60} tint="dark" className="flex-1 items-center justify-center">
                <Share2 size={20} color="white" />
              </BlurView>
            </Pressable>
            <Pressable
              onPress={handleReport}
              className="w-10 h-10 rounded-full overflow-hidden"
            >
              <BlurView intensity={60} tint="dark" className="flex-1 items-center justify-center">
                <MoreHorizontal size={20} color="white" />
              </BlurView>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Cover Image */}
        <Animated.View style={[headerImageStyle, { height: HEADER_HEIGHT }]}>
          <Image
            source={{ uri: event.cover_image }}
            style={{ width: SCREEN_WIDTH, height: HEADER_HEIGHT }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 150,
            }}
          />

          {/* Badges */}
          <View className="absolute bottom-4 left-5 right-5">
            <View className="flex-row flex-wrap">
              {event.is_featured && (
                <View className="flex-row items-center bg-amber-500/20 px-3 py-1.5 rounded-full mr-2 mb-2 border border-amber-500/30">
                  <Sparkles size={12} color="#fbbf24" />
                  <Text className="text-amber-400 text-xs font-semibold ml-1">
                    Featured
                  </Text>
                </View>
              )}
              {event.location.is_virtual && (
                <View className="flex-row items-center bg-purple-500/20 px-3 py-1.5 rounded-full mr-2 mb-2 border border-purple-500/30">
                  <Video size={12} color="#a855f7" />
                  <Text className="text-purple-400 text-xs font-semibold ml-1">
                    Virtual Event
                  </Text>
                </View>
              )}
              <View
                className="px-3 py-1.5 rounded-full mb-2 border"
                style={{
                  backgroundColor: `${category?.color}20`,
                  borderColor: `${category?.color}30`,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: category?.color }}
                >
                  {category?.emoji} {category?.label}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <View className="px-5 -mt-4">
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text className="text-white text-2xl font-bold mb-4">
              {event.title}
            </Text>
          </Animated.View>

          {/* Host Card */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Pressable className="flex-row items-center bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800/50">
              <Image
                source={{ uri: event.host.photo }}
                className="w-14 h-14 rounded-full border-2 border-zinc-700"
              />
              <View className="flex-1 ml-3">
                <Text className="text-zinc-400 text-xs mb-0.5">Hosted by</Text>
                <Text className="text-white font-semibold text-base">
                  {event.host.display_name}
                </Text>
                <View className="flex-row items-center mt-1">
                  {Array.from({ length: event.host.reputation_stars }).map((_, i) => (
                    <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />
                  ))}
                  <Text className="text-zinc-500 text-xs ml-2">
                    {event.host.events_hosted} events hosted
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#71717a" />
            </Pressable>
          </Animated.View>

          {/* Date, Time, Location */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800/50"
          >
            <View className="flex-row items-start mb-4">
              <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center">
                <Calendar size={20} color="#a855f7" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-zinc-400 text-xs mb-0.5">Date</Text>
                <Text className="text-white font-medium">
                  {formatDate(event.start_date)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center">
                <Clock size={20} color="#60a5fa" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-zinc-400 text-xs mb-0.5">Time</Text>
                <Text className="text-white font-medium">
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center">
                <MapPin size={20} color="#4ade80" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-zinc-400 text-xs mb-0.5">Location</Text>
                <Text className="text-white font-medium">{event.location.name}</Text>
                <Text className="text-zinc-500 text-sm">
                  {event.location.address}, {event.location.city}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Attendees */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800/50"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Users size={18} color="#a1a1aa" />
                <Text className="text-white font-semibold ml-2">Attendees</Text>
              </View>
              <Text className="text-zinc-400">
                {event.current_attendees}
                {event.max_attendees && ` / ${event.max_attendees}`}
              </Text>
            </View>

            {/* Attendee Avatars */}
            <View className="flex-row items-center">
              {goingAttendees.slice(0, 5).map((attendee, index) => (
                <View
                  key={attendee.id}
                  style={{ marginLeft: index > 0 ? -12 : 0, zIndex: 5 - index }}
                >
                  <Image
                    source={{
                      uri:
                        attendee.photo ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                    }}
                    className="w-10 h-10 rounded-full border-2 border-zinc-900"
                  />
                </View>
              ))}
              {goingAttendees.length > 5 && (
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center border-2 border-zinc-900 -ml-3">
                  <Text className="text-zinc-400 text-xs font-medium">
                    +{goingAttendees.length - 5}
                  </Text>
                </View>
              )}
              {goingAttendees.length === 0 && (
                <Text className="text-zinc-500 text-sm">
                  Be the first to join!
                </Text>
              )}
            </View>

            {/* Spots indicator */}
            {event.max_attendees && (
              <View className="mt-3">
                <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(event.current_attendees / event.max_attendees) * 100}%`,
                      backgroundColor: isFull
                        ? '#ef4444'
                        : spotsLeft && spotsLeft <= 5
                        ? '#f59e0b'
                        : '#a855f7',
                    }}
                  />
                </View>
                <Text
                  className={`text-xs mt-1 ${
                    isFull
                      ? 'text-red-400'
                      : spotsLeft && spotsLeft <= 5
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {isFull
                    ? `Full - ${event.waitlist_count} on waitlist`
                    : `${spotsLeft} spots remaining`}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Description */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="mb-4"
          >
            <Text className="text-white font-semibold text-lg mb-3">About</Text>
            <Text className="text-zinc-300 leading-6">{event.description}</Text>
          </Animated.View>

          {/* Tags */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)} className="mb-4">
            <Text className="text-white font-semibold text-lg mb-3">Tags</Text>
            <View className="flex-row flex-wrap">
              {event.tags.map((tag) => (
                <View
                  key={tag}
                  className="bg-zinc-800/60 rounded-full px-3 py-1.5 mr-2 mb-2"
                >
                  <Text className="text-zinc-400 text-sm">{tag}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Safety Info */}
          {event.requires_approval && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              className="flex-row items-center bg-amber-500/10 rounded-2xl p-4 mb-4 border border-amber-500/20"
            >
              <Shield size={20} color="#f59e0b" />
              <View className="flex-1 ml-3">
                <Text className="text-amber-400 font-medium">Approval Required</Text>
                <Text className="text-amber-400/70 text-sm">
                  The host will review your request before confirming your spot.
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom RSVP Bar */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <BlurView intensity={80} tint="dark">
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center px-5 py-4">
              {isHost ? (
                <>
                  <Pressable
                    onPress={() => router.push(`/event/${id}/manage`)}
                    className="flex-1 mr-3"
                  >
                    <LinearGradient
                      colors={['#c084fc', '#a855f7']}
                      style={{
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: 'center',
                      }}
                    >
                      <Text className="text-white font-bold text-base">
                        Manage Event
                      </Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/event/${id}/chat`)}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center"
                  >
                    <MessageCircle size={24} color="white" />
                  </Pressable>
                </>
              ) : userRSVP ? (
                <>
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center justify-center bg-green-500/20 py-4 rounded-2xl border border-green-500/30">
                      {userRSVP === 'going' && <Check size={20} color="#4ade80" />}
                      {userRSVP === 'maybe' && <HelpCircle size={20} color="#fbbf24" />}
                      {userRSVP === 'waitlist' && <Clock size={20} color="#60a5fa" />}
                      {userRSVP === 'pending_approval' && <Clock size={20} color="#f59e0b" />}
                      <Text
                        className={`font-bold text-base ml-2 ${
                          userRSVP === 'going'
                            ? 'text-green-400'
                            : userRSVP === 'maybe'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {userRSVP === 'going'
                          ? "You're Going!"
                          : userRSVP === 'maybe'
                          ? 'Maybe'
                          : userRSVP === 'waitlist'
                          ? 'On Waitlist'
                          : 'Pending Approval'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={handleCancelRSVP}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center"
                  >
                    <X size={24} color="#ef4444" />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/event/${id}/chat`)}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center ml-2"
                  >
                    <MessageCircle size={24} color="white" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (isFull) {
                        handleRSVP('waitlist');
                      } else {
                        handleRSVP('going');
                      }
                    }}
                    className="flex-1 mr-3"
                  >
                    <LinearGradient
                      colors={isFull ? ['#3b82f6', '#2563eb'] : ['#22c55e', '#16a34a']}
                      style={{
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: 'center',
                      }}
                    >
                      <Text className="text-white font-bold text-base">
                        {isFull ? 'Join Waitlist' : "I'm Going"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRSVP('maybe')}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center"
                  >
                    <HelpCircle size={24} color="#fbbf24" />
                  </Pressable>
                </>
              )}
            </View>
          </SafeAreaView>
        </BlurView>
      </Animated.View>
    </View>
  );
}
