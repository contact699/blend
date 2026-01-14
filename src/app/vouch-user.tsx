import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  X,
  Users,
  Heart,
  Calendar,
  Clock,
  CheckCircle,
  Send,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { CommunityVouch } from '@/lib/types';

type RelationshipType = CommunityVouch['relationship'];
type DurationKnown = CommunityVouch['duration_known'];

const RELATIONSHIP_OPTIONS: { id: RelationshipType; label: string; icon: string }[] = [
  { id: 'dated', label: 'We Dated', icon: '💕' },
  { id: 'friends', label: 'Friends', icon: '🤝' },
  { id: 'event_met', label: 'Met at Event', icon: '🎉' },
  { id: 'community', label: 'Community Member', icon: '👥' },
];

const DURATION_OPTIONS: { id: DurationKnown; label: string }[] = [
  { id: 'less_than_month', label: 'Less than a month' },
  { id: '1_6_months', label: '1-6 months' },
  { id: '6_12_months', label: '6-12 months' },
  { id: 'over_year', label: 'Over a year' },
];

export default function VouchUserScreen() {
  const router = useRouter();
  const { userId, userName, userPhoto } = useLocalSearchParams<{
    userId: string;
    userName: string;
    userPhoto?: string;
  }>();

  const currentUserId = useDatingStore((s) => s.currentUserId);
  const currentProfile = useDatingStore((s) => s.currentProfile);
  const submitVouch = useDatingStore((s) => s.submitVouch);

  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [duration, setDuration] = useState<DurationKnown | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = relationship && duration;

  const handleSubmit = () => {
    if (!userId || !relationship || !duration) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);

    submitVouch({
      voucher_id: currentUserId,
      voucher_name: currentProfile?.display_name ?? 'Anonymous',
      voucher_photo: currentProfile?.photos[0],
      vouched_user_id: userId,
      relationship,
      duration_known: duration,
      message: message.trim() || undefined,
    });

    setTimeout(() => {
      router.back();
    }, 500);
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#18181b', '#09090b', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center"
          >
            <X size={22} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Vouch for Someone</Text>
          <View className="w-10" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* User Info */}
            <Animated.View
              entering={FadeIn.duration(300)}
              className="items-center mb-6"
            >
              {userPhoto ? (
                <Image
                  source={{ uri: userPhoto }}
                  className="w-20 h-20 rounded-full mb-3"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-zinc-700 items-center justify-center mb-3">
                  <Text className="text-zinc-400 text-2xl">
                    {userName?.charAt(0) ?? '?'}
                  </Text>
                </View>
              )}
              <Text className="text-white text-xl font-semibold">{userName}</Text>
              <Text className="text-zinc-500 text-sm text-center mt-1">
                Vouch for this person to help build their trust score
              </Text>
            </Animated.View>

            {/* Info Box */}
            <Animated.View
              entering={FadeInDown.delay(50).duration(300)}
              className="bg-purple-500/10 rounded-2xl p-4 mb-6 border border-purple-500/20"
            >
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
                  <Users size={20} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">What is a vouch?</Text>
                  <Text className="text-zinc-400 text-sm">
                    A vouch is your personal endorsement of someone. It tells the community
                    that you know this person and can speak to their character. Your vouch
                    carries more weight based on your own trust tier.
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Relationship Type */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <View className="flex-row items-center gap-2 mb-4">
                <Heart size={18} color="#ec4899" />
                <Text className="text-white font-semibold">How do you know them?</Text>
              </View>
              <View className="space-y-2">
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRelationship(option.id);
                    }}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      relationship === option.id
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <Text className="text-xl mr-3">{option.icon}</Text>
                    <Text
                      className={`flex-1 ${
                        relationship === option.id ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {relationship === option.id && (
                      <CheckCircle size={20} color="#a855f7" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Duration Known */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <View className="flex-row items-center gap-2 mb-4">
                <Clock size={18} color="#3b82f6" />
                <Text className="text-white font-semibold">How long have you known them?</Text>
              </View>
              <View className="space-y-2">
                {DURATION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDuration(option.id);
                    }}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      duration === option.id
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <Text
                      className={`flex-1 ${
                        duration === option.id ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {duration === option.id && (
                      <CheckCircle size={20} color="#a855f7" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Optional Message */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-6 border border-zinc-800"
            >
              <Text className="text-white font-semibold mb-3">
                Personal Message (optional)
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Share why you're vouching for this person..."
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={4}
                className="bg-zinc-800/50 rounded-xl p-3 text-white min-h-[100px]"
                textAlignVertical="top"
              />
              <Text className="text-zinc-600 text-xs mt-2">
                This message will be visible on their trust profile
              </Text>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(250).duration(300)}>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                <LinearGradient
                  colors={
                    !canSubmit || isSubmitting
                      ? ['#3f3f46', '#27272a']
                      : ['#a855f7', '#7c3aed']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: canSubmit ? 1 : 0.5,
                  }}
                >
                  {isSubmitting ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <Send size={20} color="white" />
                  )}
                  <Text className="text-white font-semibold text-lg">
                    {isSubmitting ? 'Vouch Submitted!' : 'Submit Vouch'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {!canSubmit && (
              <Text className="text-zinc-500 text-xs text-center mt-3">
                Please select how you know them and for how long
              </Text>
            )}

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
