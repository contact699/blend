import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Image, FlatList, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Heart, X, Check, MapPin, Sparkles, User, MessageCircle, PartyPopper } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLikesReceived, useCurrentUser, supabase } from '@/lib/supabase';
import { getSignedPhotoUrls } from '@/lib/supabase/photos';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';

interface LikeWithProfile {
  id: string;
  from_user_id: string;
  to_user_id: string;
  seen: boolean;
  created_at: string;
  profile?: {
    id: string;
    user_id: string;
    display_name: string;
    age: number;
    city: string;
    bio: string;
    photos: Array<{ storage_path: string; signedUrl?: string | null }>;
  };
}

export default function LikesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: likes, isLoading, refetch } = useLikesReceived();

  // State for match success modal
  const [matchedProfile, setMatchedProfile] = useState<LikeWithProfile['profile'] | null>(null);
  const [matchedThreadId, setMatchedThreadId] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Fetch profiles for all likes
  const { data: likesWithProfiles } = useQuery({
    queryKey: ['likes-with-profiles', likes],
    queryFn: async () => {
      if (!likes || likes.length === 0) return [];

      const userIds = likes.map((l) => l.from_user_id);

      // Fetch profiles for all users who liked us
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          photos (id, storage_path, order_index, is_primary)
        `)
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching profiles:', error);
        return likes.map((l) => ({ ...l, profile: undefined }));
      }

      // Get signed URLs for all photos
      const allPhotoPaths = (profiles ?? []).flatMap(
        (p: { photos?: Array<{ storage_path: string }> }) =>
          p.photos?.map((photo) => photo.storage_path) ?? []
      );
      const signedUrls = await getSignedPhotoUrls(allPhotoPaths);

      // Map profiles to likes
      return likes.map((like) => {
        const profile = (profiles ?? []).find(
          (p: { user_id: string }) => p.user_id === like.from_user_id
        );
        return {
          ...like,
          profile: profile
            ? {
                ...profile,
                photos:
                  profile.photos?.map(
                    (photo: { storage_path: string }) => ({
                      ...photo,
                      signedUrl: signedUrls.get(photo.storage_path) ?? null,
                    })
                  ) ?? [],
              }
            : undefined,
        };
      });
    },
    enabled: !!likes && likes.length > 0,
  });

  // Mutation to like back (create match)
  const likeBackMutation = useMutation({
    mutationFn: async (like: LikeWithProfile) => {
      if (!currentUser) throw new Error('Not authenticated');

      console.log('[Likes] Creating match with:', like.from_user_id);

      // Create a like from current user to the other user
      const { error: likeError } = await supabase.from('likes').insert({
        from_user_id: currentUser.id,
        to_user_id: like.from_user_id,
      });

      if (likeError && !likeError.message.includes('duplicate')) {
        console.error('[Likes] Like insert error:', likeError);
        throw likeError;
      }

      // Create a match
      const { data: matchData, error: matchError } = await supabase.from('matches').insert({
        user_1_id: currentUser.id,
        user_2_id: like.from_user_id,
        status: 'active',
      }).select().single();

      if (matchError && !matchError.message.includes('duplicate')) {
        console.error('[Likes] Match insert error:', matchError);
        throw matchError;
      }

      console.log('[Likes] Match created:', matchData);

      // Create a chat thread for the match
      let threadId = null;
      if (matchData) {
        const { data: threadData, error: threadError } = await supabase.from('chat_threads').insert({
          match_id: matchData.id,
          unlocked: false,
        }).select().single();

        if (threadError) {
          console.error('[Likes] Chat thread error:', threadError);
          // Don't throw - match was still created
        } else {
          console.log('[Likes] Chat thread created:', threadData);
          threadId = threadData.id;
        }
      }

      // Mark the like as seen
      await supabase.from('likes').update({ seen: true }).eq('id', like.id);

      // Delete the original like since it's now a match
      await supabase.from('likes').delete().eq('id', like.id);

      return { success: true, profile: like.profile, threadId };
    },
    onSuccess: (data) => {
      haptics.match();
      queryClient.invalidateQueries({ queryKey: ['likes'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });

      // Show match success modal
      if (data?.profile) {
        setMatchedProfile(data.profile);
        setMatchedThreadId(data.threadId);
        setShowMatchModal(true);
      }
    },
    onError: (error) => {
      console.error('[Likes] Match creation failed:', error);
      Alert.alert('Error', 'Failed to create match. Please try again.');
    },
  });

  // Mutation to dismiss a like
  const dismissMutation = useMutation({
    mutationFn: async (likeId: string) => {
      const { error } = await supabase.from('likes').delete().eq('id', likeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });

  // Mutation to mark like as seen
  const markSeenMutation = useMutation({
    mutationFn: async (likeId: string) => {
      const { error } = await supabase
        .from('likes')
        .update({ seen: true })
        .eq('id', likeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });

  const myLikes = likesWithProfiles ?? [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLikeBack = (like: LikeWithProfile) => {
    likeBackMutation.mutate(like);
  };

  const handleDismiss = (like: LikeWithProfile) => {
    dismissMutation.mutate(like.id);
  };

  const handleViewProfile = (like: LikeWithProfile) => {
    if (!like.seen) {
      markSeenMutation.mutate(like.id);
    }
  };

  const renderLikeItem = (like: LikeWithProfile, index: number) => {
    const profile = like.profile;

    return (
      <Animated.View
        key={like.id}
        entering={FadeInDown.delay(index * 80).springify()}
        className="mb-4"
      >
        <Pressable
          onPress={() => handleViewProfile(like)}
          className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800"
        >
          {/* Profile Image */}
          <View className="relative">
            {profile?.photos?.[0]?.signedUrl ? (
              <Image
                source={{ uri: profile.photos[0].signedUrl }}
                className="w-full h-48"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-48 bg-zinc-800 items-center justify-center">
                <User size={48} color="#6b7280" />
              </View>
            )}
            {/* Gradient overlay */}
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
            {/* New badge */}
            {!like.seen && (
              <View className="absolute top-3 left-3 bg-pink-500 px-2 py-1 rounded-full flex-row items-center">
                <Sparkles size={12} color="white" />
                <Text className="text-white text-xs font-semibold ml-1">New</Text>
              </View>
            )}
            {/* Time badge */}
            <View className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-full">
              <Text className="text-white text-xs">{formatTime(like.created_at)}</Text>
            </View>
            {/* Name and location */}
            <View className="absolute bottom-3 left-3">
              <Text className="text-white text-xl font-bold">
                {profile?.display_name ?? 'Unknown'}{profile?.age ? `, ${profile.age}` : ''}
              </Text>
              {profile?.city && (
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color="#9ca3af" />
                  <Text className="text-gray-400 text-sm ml-1">{profile.city}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bio */}
          {profile?.bio && (
            <View className="p-4">
              <Text className="text-gray-300 text-sm" numberOfLines={2}>
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="flex-row px-4 pb-4 gap-3">
            <Pressable
              onPress={() => handleDismiss(like)}
              disabled={dismissMutation.isPending}
              className="flex-1 bg-zinc-800 py-3 rounded-xl flex-row items-center justify-center active:bg-zinc-700"
            >
              <X size={20} color="#ef4444" />
              <Text className="text-gray-300 font-medium ml-2">Pass</Text>
            </Pressable>
            <Pressable
              onPress={() => handleLikeBack(like)}
              disabled={likeBackMutation.isPending}
              className="flex-1 rounded-xl flex-row items-center justify-center overflow-hidden active:opacity-80"
            >
              <LinearGradient
                colors={['#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              />
              <Check size={20} color="white" />
              <Text className="text-white font-medium ml-2">Match</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text className="text-gray-400 mt-4">Loading likes...</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <Animated.View
            entering={FadeInUp.springify()}
            className="px-5 py-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Heart size={24} color="#db2777" fill="#db2777" />
              <Text className="text-white text-2xl font-bold ml-2">Likes</Text>
            </View>
            {myLikes.length > 0 && (
              <View className="bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                <Text className="text-pink-300 font-semibold">
                  {myLikes.length} {myLikes.length === 1 ? 'person' : 'people'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Subtitle */}
          <View className="px-5 mb-4">
            <Text className="text-gray-400 text-sm">
              People who liked your profile
            </Text>
          </View>

          {/* Likes List */}
          {myLikes.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-24 h-24 bg-zinc-900 rounded-full items-center justify-center mb-4 border border-zinc-800">
                <Heart size={40} color="#6b7280" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">No likes yet</Text>
              <Text className="text-gray-400 text-center">
                When someone likes your profile, they'll appear here. Keep exploring!
              </Text>
            </View>
          ) : (
            <FlatList
              data={myLikes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              renderItem={({ item, index }) => renderLikeItem(item, index)}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>

        {/* Match Success Modal */}
        <Modal
          visible={showMatchModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMatchModal(false)}
        >
          <View className="flex-1 bg-black/90 items-center justify-center px-6">
            <Animated.View
              entering={FadeIn.duration(300)}
              className="w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800"
            >
              {/* Header with confetti/hearts */}
              <View className="pt-8 pb-6 items-center">
                <View className="w-20 h-20 bg-pink-500/20 rounded-full items-center justify-center mb-4 border-2 border-pink-500">
                  <PartyPopper size={40} color="#ec4899" />
                </View>
                <Text className="text-white text-2xl font-bold">It's a Match!</Text>
                <Text className="text-gray-400 text-center mt-2">
                  You and {matchedProfile?.display_name ?? 'them'} liked each other
                </Text>
              </View>

              {/* Matched profile photo */}
              {matchedProfile?.photos?.[0]?.signedUrl ? (
                <View className="mx-6 mb-6 rounded-2xl overflow-hidden">
                  <Image
                    source={{ uri: matchedProfile.photos[0].signedUrl }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                    }}
                  />
                  <View className="absolute bottom-3 left-3">
                    <Text className="text-white text-lg font-bold">
                      {matchedProfile.display_name}, {matchedProfile.age}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="mx-6 mb-6 rounded-2xl overflow-hidden h-48 bg-zinc-800 items-center justify-center">
                  <User size={64} color="#6b7280" />
                  <Text className="text-white text-lg font-bold mt-2">
                    {matchedProfile?.display_name ?? 'Your Match'}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View className="px-6 pb-8">
                <Pressable
                  onPress={() => {
                    setShowMatchModal(false);
                    // Navigate directly to the chat thread
                    if (matchedThreadId) {
                      router.push(`/chat/${matchedThreadId}`);
                    } else {
                      // Fallback to inbox if no thread ID
                      router.push('/(tabs)/inbox');
                    }
                  }}
                  className="rounded-xl overflow-hidden mb-3"
                  accessibilityRole="button"
                  accessibilityLabel={`Send message to ${matchedProfile?.display_name ?? 'match'}`}
                  accessibilityHint="Start a conversation with your new match"
                >
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <MessageCircle size={20} color="white" />
                    <Text className="text-white font-semibold text-lg ml-2">Send a Message</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => setShowMatchModal(false)}
                  className="bg-zinc-800 py-4 rounded-xl items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Keep browsing"
                  accessibilityHint="Close this dialog and continue browsing likes"
                >
                  <Text className="text-gray-300 font-medium">Keep Browsing</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}
