import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Clock,
  Check,
  X,
  UserMinus,
  QrCode,
  Edit,
  Copy,
  Trash2,
  Ban,
  MessageCircle,
  BarChart3,
  Eye,
  CheckCircle,
  HelpCircle,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { EventAttendee, RSVPStatus } from '@/lib/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ManageEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const events = useDatingStore((s) => s.events);
  const approveAttendee = useDatingStore((s) => s.approveAttendee);
  const declineAttendee = useDatingStore((s) => s.declineAttendee);
  const removeAttendee = useDatingStore((s) => s.removeAttendee);
  const checkInAttendee = useDatingStore((s) => s.checkInAttendee);
  const cancelEvent = useDatingStore((s) => s.cancelEvent);
  const duplicateEvent = useDatingStore((s) => s.duplicateEvent);
  const publishEvent = useDatingStore((s) => s.publishEvent);

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [activeTab, setActiveTab] = useState<
    'going' | 'pending' | 'waitlist' | 'maybe'
  >('going');

  const goingAttendees = useMemo(
    () => event?.attendees.filter((a) => a.rsvp_status === 'going') ?? [],
    [event]
  );
  const pendingAttendees = useMemo(
    () =>
      event?.attendees.filter((a) => a.rsvp_status === 'pending_approval') ?? [],
    [event]
  );
  const waitlistAttendees = useMemo(
    () =>
      event?.attendees
        .filter((a) => a.rsvp_status === 'waitlist')
        .sort(
          (a, b) => (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0)
        ) ?? [],
    [event]
  );
  const maybeAttendees = useMemo(
    () => event?.attendees.filter((a) => a.rsvp_status === 'maybe') ?? [],
    [event]
  );

  const handleApprove = (userId: string) => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    approveAttendee(id, userId);
  };

  const handleDecline = (userId: string) => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    declineAttendee(id, userId);
  };

  const handleRemove = (userId: string, name: string) => {
    Alert.alert('Remove Attendee', `Remove ${name} from this event?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeAttendee(id, userId);
        },
      },
    ]);
  };

  const handleCheckIn = (userId: string) => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkInAttendee(id, userId);
  };

  const handleCancelEvent = () => {
    Alert.prompt(
      'Cancel Event',
      'Provide a reason for cancellation (all attendees will be notified):',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: (reason) => {
            if (!id) return;
            cancelEvent(id, reason ?? 'Event cancelled by host');
            router.back();
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    if (!id) return;
    const newEvent = duplicateEvent(id);
    if (newEvent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/event/${newEvent.id}`);
    }
  };

  const handlePublish = () => {
    if (!id) return;
    publishEvent(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Published!', 'Your event is now visible to others.');
  };

  if (!event) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Event not found</Text>
      </View>
    );
  }

  const tabs = [
    { id: 'going' as const, label: 'Going', count: goingAttendees.length },
    {
      id: 'pending' as const,
      label: 'Pending',
      count: pendingAttendees.length,
      highlight: pendingAttendees.length > 0,
    },
    {
      id: 'waitlist' as const,
      label: 'Waitlist',
      count: waitlistAttendees.length,
    },
    { id: 'maybe' as const, label: 'Maybe', count: maybeAttendees.length },
  ];

  const currentAttendees =
    activeTab === 'going'
      ? goingAttendees
      : activeTab === 'pending'
      ? pendingAttendees
      : activeTab === 'waitlist'
      ? waitlistAttendees
      : maybeAttendees;

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
          className="flex-row items-center px-5 py-4 border-b border-zinc-800/50"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">Manage Event</Text>
            <Text className="text-zinc-500 text-sm" numberOfLines={1}>
              {event.title}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Quick Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="flex-row px-5 py-4"
          >
            <StatCard
              icon={<Users size={20} color="#4ade80" />}
              label="Going"
              value={goingAttendees.length.toString()}
              max={event.max_attendees?.toString()}
              color="#4ade80"
            />
            <StatCard
              icon={<Clock size={20} color="#f59e0b" />}
              label="Pending"
              value={pendingAttendees.length.toString()}
              color="#f59e0b"
            />
            <StatCard
              icon={<Eye size={20} color="#60a5fa" />}
              label="Views"
              value="--"
              color="#60a5fa"
            />
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            className="px-5 mb-4"
          >
            <Text className="text-white font-semibold mb-3">Quick Actions</Text>
            <View className="flex-row flex-wrap">
              {event.status === 'draft' && (
                <ActionButton
                  icon={<Check size={18} color="#4ade80" />}
                  label="Publish"
                  onPress={handlePublish}
                />
              )}
              <ActionButton
                icon={<Edit size={18} color="#a1a1aa" />}
                label="Edit"
                onPress={() => {}}
              />
              <ActionButton
                icon={<Copy size={18} color="#a1a1aa" />}
                label="Duplicate"
                onPress={handleDuplicate}
              />
              <ActionButton
                icon={<MessageCircle size={18} color="#a1a1aa" />}
                label="Message All"
                onPress={() => router.push(`/event/${id}/chat`)}
              />
              <ActionButton
                icon={<QrCode size={18} color="#a1a1aa" />}
                label="Check-in QR"
                onPress={() => {}}
              />
              <ActionButton
                icon={<BarChart3 size={18} color="#a1a1aa" />}
                label="Analytics"
                onPress={() => {}}
              />
            </View>
          </Animated.View>

          {/* Attendees Section */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="px-5"
          >
            <Text className="text-white font-semibold mb-3">Attendees</Text>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                    activeTab === tab.id
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-zinc-900/60 border border-zinc-800/50'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeTab === tab.id ? 'text-purple-400' : 'text-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${
                      tab.highlight
                        ? 'bg-amber-500'
                        : activeTab === tab.id
                        ? 'bg-purple-500/30'
                        : 'bg-zinc-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        tab.highlight
                          ? 'text-white'
                          : activeTab === tab.id
                          ? 'text-purple-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Attendee List */}
            {currentAttendees.length === 0 ? (
              <View className="items-center py-12 bg-zinc-900/50 rounded-2xl">
                <Users size={32} color="#52525b" />
                <Text className="text-zinc-500 mt-2">No attendees yet</Text>
              </View>
            ) : (
              currentAttendees.map((attendee, index) => (
                <AttendeeCard
                  key={attendee.id}
                  attendee={attendee}
                  index={index}
                  showApprovalActions={activeTab === 'pending'}
                  showWaitlistPosition={activeTab === 'waitlist'}
                  onApprove={() => handleApprove(attendee.user_id)}
                  onDecline={() => handleDecline(attendee.user_id)}
                  onRemove={() =>
                    handleRemove(attendee.user_id, attendee.display_name)
                  }
                  onCheckIn={() => handleCheckIn(attendee.user_id)}
                />
              ))
            )}
          </Animated.View>

          {/* Danger Zone */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="px-5 mt-8"
          >
            <Text className="text-red-400 font-semibold mb-3">Danger Zone</Text>
            <Pressable
              onPress={handleCancelEvent}
              className="flex-row items-center bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-4"
            >
              <Trash2 size={20} color="#ef4444" />
              <View className="flex-1 ml-3">
                <Text className="text-red-400 font-medium">Cancel Event</Text>
                <Text className="text-red-400/60 text-xs">
                  All attendees will be notified
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  max,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  max?: string;
  color: string;
}) {
  return (
    <View
      className="flex-1 mr-3 last:mr-0 bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/50"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <View className="flex-row items-center mb-2">{icon}</View>
      <Text className="text-white text-2xl font-bold">
        {value}
        {max && <Text className="text-zinc-500 text-lg">/{max}</Text>}
      </Text>
      <Text className="text-zinc-500 text-sm">{label}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-2.5 mr-2 mb-2"
    >
      {icon}
      <Text className="text-zinc-300 text-sm ml-2">{label}</Text>
    </Pressable>
  );
}

function AttendeeCard({
  attendee,
  index,
  showApprovalActions,
  showWaitlistPosition,
  onApprove,
  onDecline,
  onRemove,
  onCheckIn,
}: {
  attendee: EventAttendee;
  index: number;
  showApprovalActions?: boolean;
  showWaitlistPosition?: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onRemove: () => void;
  onCheckIn: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={animatedStyle}
    >
      <View className="flex-row items-center bg-zinc-900/80 rounded-2xl p-4 mb-3 border border-zinc-800/50">
        {showWaitlistPosition && (
          <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
            <Text className="text-zinc-400 font-semibold">
              {attendee.waitlist_position}
            </Text>
          </View>
        )}

        <Image
          source={{
            uri:
              attendee.photo ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          }}
          className="w-12 h-12 rounded-full"
        />

        <View className="flex-1 ml-3">
          <Text className="text-white font-medium">{attendee.display_name}</Text>
          <Text className="text-zinc-500 text-xs">
            RSVP'd {new Date(attendee.rsvp_at).toLocaleDateString()}
          </Text>
          {attendee.checked_in_at && (
            <View className="flex-row items-center mt-1">
              <CheckCircle size={12} color="#4ade80" />
              <Text className="text-green-400 text-xs ml-1">Checked in</Text>
            </View>
          )}
        </View>

        {showApprovalActions ? (
          <View className="flex-row">
            <Pressable
              onPress={onDecline}
              className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center mr-2"
            >
              <X size={18} color="#ef4444" />
            </Pressable>
            <Pressable
              onPress={onApprove}
              className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center"
            >
              <Check size={18} color="#4ade80" />
            </Pressable>
          </View>
        ) : attendee.rsvp_status === 'going' && !attendee.checked_in_at ? (
          <View className="flex-row">
            <Pressable
              onPress={onCheckIn}
              className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mr-2"
            >
              <Text className="text-green-400 text-sm font-medium">
                Check In
              </Text>
            </Pressable>
            <Pressable
              onPress={onRemove}
              className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
            >
              <UserMinus size={16} color="#ef4444" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onRemove}
            className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
          >
            <UserMinus size={16} color="#ef4444" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
