import { View, Text, Pressable, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Mail, X, MessageCircle, MapPin, Sparkles, Send, User } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePingsReceived, useCurrentUser, supabase } from '@/lib/supabase';
import { getSignedPhotoUrls } from '@/lib/supabase/photos';

interface PingWithProfile {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  read: boolean;
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

export default function PingsScreen() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: pings, isLoading } = usePingsReceived();

  // Fetch profiles for all pings
  const { data: pingsWithProfiles } = useQuery({
    queryKey: ['pings-with-profiles', pings],
    queryFn: async () => {
      if (!pings || pings.length === 0) return [];

      const userIds = pings.map((p) => p.from_user_id);

      // Fetch profiles for all users who pinged us
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          photos (id, storage_path, order_index, is_primary)
        `)
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching profiles:', error);
        return pings.map((p) => ({ ...p, profile: undefined }));
      }

      // Get signed URLs for all photos
      const allPhotoPaths = (profiles ?? []).flatMap(
        (p: { photos?: Array<{ storage_path: string }> }) =>
          p.photos?.map((photo) => photo.storage_path) ?? []
      );
      const signedUrls = await getSignedPhotoUrls(allPhotoPaths);

      // Map profiles to pings
      return pings.map((ping) => {
        const profile = (profiles ?? []).find(
          (p: { user_id: string }) => p.user_id === ping.from_user_id
        );
        return {
          ...ping,
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
    enabled: !!pings && pings.length > 0,
  });

  // Mutation to reply to ping (create match and chat)
  const replyMutation = useMutation({
    mutationFn: async (ping: PingWithProfile) => {
      if (!currentUser) throw new Error('Not authenticated');

      // Create a match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          user_1_id: currentUser.id,
          user_2_id: ping.from_user_id,
          status: 'active',
        })
        .select()
        .single();

      if (matchError && !matchError.message.includes('duplicate')) {
        throw matchError;
      }

      // Mark the ping as read
      await supabase.from('pings').update({ read: true }).eq('id', ping.id);

      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pings'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  // Mutation to dismiss a ping
  const dismissMutation = useMutation({
    mutationFn: async (pingId: string) => {
      const { error } = await supabase.from('pings').delete().eq('id', pingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pings'] });
    },
  });

  // Mutation to mark ping as read
  const markReadMutation = useMutation({
    mutationFn: async (pingId: string) => {
      const { error } = await supabase
        .from('pings')
        .update({ read: true })
        .eq('id', pingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pings'] });
    },
  });

  const myPings = pingsWithProfiles ?? [];

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

  const handleReply = (ping: PingWithProfile) => {
    replyMutation.mutate(ping);
  };

  const handleDismiss = (ping: PingWithProfile) => {
    dismissMutation.mutate(ping.id);
  };

  const handleViewPing = (ping: PingWithProfile) => {
    if (!ping.read) {
      markReadMutation.mutate(ping.id);
    }
  };

  const renderPingItem = (ping: PingWithProfile, index: number) => {
    const profile = ping.profile;

    return (
      <Animated.View
        key={ping.id}
        entering={FadeInDown.delay(index * 80).springify()}
        className="mb-4"
      >
        <Pressable
          onPress={() => handleViewPing(ping)}
          className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800"
        >
          {/* Header with profile info */}
          <View className="flex-row p-4 items-center">
            <View className="relative">
              {profile?.photos?.[0]?.signedUrl ? (
                <Image
                  source={{ uri: profile.photos[0].signedUrl }}
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center">
                  <User size={24} color="#6b7280" />
                </View>
              )}
              {!ping.read && (
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-zinc-900" />
              )}
            </View>
            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-lg font-semibold">
                  {profile?.display_name ?? 'Unknown'}{profile?.age ? `, ${profile.age}` : ''}
                </Text>
                <Text className="text-gray-500 text-xs">{formatTime(ping.created_at)}</Text>
              </View>
              {profile?.city && (
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color="#9ca3af" />
                  <Text className="text-gray-400 text-sm ml-1">{profile.city}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Message */}
          <View className="px-4 pb-4">
            <View className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
              <View className="flex-row items-center mb-2">
                <Send size={14} color="#c084fc" />
                <Text className="text-purple-300 text-xs font-medium ml-1">Private Message</Text>
                {!ping.read && (
                  <View className="ml-2 bg-purple-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                    <Sparkles size={10} color="#c084fc" />
                    <Text className="text-purple-300 text-xs ml-1">New</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-200 text-base leading-relaxed">
                "{ping.message}"
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row px-4 pb-4 gap-3">
            <Pressable
              onPress={() => handleDismiss(ping)}
              disabled={dismissMutation.isPending}
              className="flex-1 bg-zinc-800 py-3 rounded-xl flex-row items-center justify-center active:bg-zinc-700"
            >
              <X size={20} color="#ef4444" />
              <Text className="text-gray-300 font-medium ml-2">Dismiss</Text>
            </Pressable>
            <Pressable
              onPress={() => handleReply(ping)}
              disabled={replyMutation.isPending}
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
              <MessageCircle size={20} color="white" />
              <Text className="text-white font-medium ml-2">Reply</Text>
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
            <Text className="text-gray-400 mt-4">Loading pings...</Text>
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
              <Mail size={24} color="#c084fc" />
              <Text className="text-white text-2xl font-bold ml-2">Pings</Text>
            </View>
            {myPings.length > 0 && (
              <View className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                <Text className="text-purple-300 font-semibold">
                  {myPings.length} {myPings.length === 1 ? 'message' : 'messages'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Subtitle */}
          <View className="px-5 mb-4">
            <Text className="text-gray-400 text-sm">
              Private messages from people who want to connect
            </Text>
          </View>

          {/* Pings List */}
          {myPings.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-24 h-24 bg-zinc-900 rounded-full items-center justify-center mb-4 border border-zinc-800">
                <Mail size={40} color="#6b7280" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">No pings yet</Text>
              <Text className="text-gray-400 text-center">
                When someone sends you a private message, it'll appear here. No matching required!
              </Text>
            </View>
          ) : (
            <FlatList
              data={myPings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              renderItem={({ item, index }) => renderPingItem(item, index)}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
