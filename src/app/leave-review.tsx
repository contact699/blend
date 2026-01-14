import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Switch,
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
  Star,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  Send,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { DateReviewTag, DateReviewConcern } from '@/lib/types';

const POSITIVE_TAGS: { id: DateReviewTag; label: string; icon: string }[] = [
  { id: 'great_conversation', label: 'Great Conversation', icon: '💬' },
  { id: 'respectful_boundaries', label: 'Respectful Boundaries', icon: '🙏' },
  { id: 'photos_accurate', label: 'Photos Accurate', icon: '📷' },
  { id: 'on_time', label: 'On Time', icon: '⏰' },
  { id: 'good_communication', label: 'Good Communication', icon: '✨' },
  { id: 'felt_safe', label: 'Felt Safe', icon: '🛡️' },
  { id: 'genuine_person', label: 'Genuine Person', icon: '💚' },
  { id: 'fun_to_be_around', label: 'Fun To Be Around', icon: '🎉' },
  { id: 'honest_about_intentions', label: 'Honest About Intentions', icon: '🎯' },
  { id: 'considerate_of_partners', label: 'Considerate of Partners', icon: '💕' },
];

const CONCERN_TAGS: { id: DateReviewConcern; label: string; icon: string }[] = [
  { id: 'photos_misleading', label: 'Photos Misleading', icon: '📸' },
  { id: 'pushy_behavior', label: 'Pushy Behavior', icon: '⚠️' },
  { id: 'poor_communication', label: 'Poor Communication', icon: '📵' },
  { id: 'showed_up_late', label: 'Showed Up Late', icon: '🕐' },
  { id: 'different_intentions', label: 'Different Intentions', icon: '🎭' },
  { id: 'boundary_issues', label: 'Boundary Issues', icon: '🚫' },
  { id: 'ghosted_after', label: 'Ghosted After', icon: '👻' },
  { id: 'uncomfortable_vibes', label: 'Uncomfortable Vibes', icon: '😬' },
];

type CategoryRating = 1 | 2 | 3 | 4 | 5;

export default function LeaveReviewScreen() {
  const router = useRouter();
  const { userId, userName, userPhoto } = useLocalSearchParams<{
    userId: string;
    userName: string;
    userPhoto?: string;
  }>();

  const currentUserId = useDatingStore((s) => s.currentUserId);
  const currentProfile = useDatingStore((s) => s.currentProfile);
  const submitDateReview = useDatingStore((s) => s.submitDateReview);

  const [overallRating, setOverallRating] = useState<CategoryRating>(5);
  const [categories, setCategories] = useState<{
    communication: CategoryRating;
    respect: CategoryRating;
    authenticity: CategoryRating;
    safety: CategoryRating;
  }>({
    communication: 5,
    respect: 5,
    authenticity: 5,
    safety: 5,
  });
  const [positives, setPositives] = useState<DateReviewTag[]>([]);
  const [concerns, setConcerns] = useState<DateReviewConcern[]>([]);
  const [comment, setComment] = useState('');
  const [metInPerson, setMetInPerson] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePositive = (tag: DateReviewTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (positives.includes(tag)) {
      setPositives(positives.filter((t) => t !== tag));
    } else {
      setPositives([...positives, tag]);
    }
  };

  const toggleConcern = (tag: DateReviewConcern) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (concerns.includes(tag)) {
      setConcerns(concerns.filter((t) => t !== tag));
    } else {
      setConcerns([...concerns, tag]);
    }
  };

  const handleSubmit = () => {
    if (!userId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);

    submitDateReview({
      reviewer_id: currentUserId,
      reviewer_name: currentProfile?.display_name ?? 'Anonymous',
      reviewer_photo: currentProfile?.photos[0],
      reviewed_user_id: userId,
      met_in_person: metInPerson,
      rating: overallRating,
      categories,
      positives,
      concerns,
      comment: comment.trim() || undefined,
      is_anonymous: isAnonymous,
    });

    setTimeout(() => {
      router.back();
    }, 500);
  };

  const renderStars = (
    value: CategoryRating,
    onChange: (val: CategoryRating) => void,
    size: number = 24
  ) => (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(star as CategoryRating);
          }}
        >
          <Star
            size={size}
            color={star <= value ? '#fbbf24' : '#3f3f46'}
            fill={star <= value ? '#fbbf24' : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );

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
          <Text className="text-white text-lg font-semibold">Leave a Review</Text>
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
              <Text className="text-zinc-500 text-sm">Share your experience</Text>
            </Animated.View>

            {/* Overall Rating */}
            <Animated.View
              entering={FadeInDown.delay(50).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800 items-center"
            >
              <Text className="text-zinc-400 text-sm mb-3">Overall Experience</Text>
              {renderStars(overallRating, setOverallRating, 36)}
              <Text className="text-zinc-500 text-xs mt-2">
                {overallRating === 5 && 'Excellent!'}
                {overallRating === 4 && 'Great experience'}
                {overallRating === 3 && 'It was okay'}
                {overallRating === 2 && 'Not great'}
                {overallRating === 1 && 'Poor experience'}
              </Text>
            </Animated.View>

            {/* Category Ratings */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <Text className="text-white font-semibold mb-4">Rate by Category</Text>
              {Object.entries(categories).map(([cat, value]) => (
                <View
                  key={cat}
                  className="flex-row items-center justify-between mb-3"
                >
                  <Text className="text-zinc-300 capitalize">{cat}</Text>
                  {renderStars(value, (val) =>
                    setCategories((prev) => ({ ...prev, [cat]: val }))
                  , 20)}
                </View>
              ))}
            </Animated.View>

            {/* Positives */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <ThumbsUp size={18} color="#22c55e" />
                <Text className="text-white font-semibold">What went well?</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {POSITIVE_TAGS.map((tag) => (
                  <Pressable
                    key={tag.id}
                    onPress={() => togglePositive(tag.id)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                      positives.includes(tag.id)
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <Text>{tag.icon}</Text>
                    <Text
                      className={`text-sm ${
                        positives.includes(tag.id) ? 'text-green-400' : 'text-zinc-400'
                      }`}
                    >
                      {tag.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Concerns */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <AlertTriangle size={18} color="#f59e0b" />
                <Text className="text-white font-semibold">Any concerns? (optional)</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {CONCERN_TAGS.map((tag) => (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleConcern(tag.id)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                      concerns.includes(tag.id)
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <Text>{tag.icon}</Text>
                    <Text
                      className={`text-sm ${
                        concerns.includes(tag.id) ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      {tag.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Comment */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-4 border border-zinc-800"
            >
              <Text className="text-white font-semibold mb-3">
                Additional Comments (optional)
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share more about your experience..."
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={4}
                className="bg-zinc-800/50 rounded-xl p-3 text-white min-h-[100px]"
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Settings */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(300)}
              className="bg-zinc-900/80 rounded-2xl p-4 mb-6 border border-zinc-800"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white font-medium">Met in Person</Text>
                  <Text className="text-zinc-500 text-xs">Did you actually meet?</Text>
                </View>
                <Switch
                  value={metInPerson}
                  onValueChange={setMetInPerson}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-medium">Post Anonymously</Text>
                  <Text className="text-zinc-500 text-xs">Hide your identity</Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                />
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(350).duration(300)}>
              <Pressable onPress={handleSubmit} disabled={isSubmitting}>
                <LinearGradient
                  colors={isSubmitting ? ['#3f3f46', '#27272a'] : ['#a855f7', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isSubmitting ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <Send size={20} color="white" />
                  )}
                  <Text className="text-white font-semibold text-lg">
                    {isSubmitting ? 'Submitted!' : 'Submit Review'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
