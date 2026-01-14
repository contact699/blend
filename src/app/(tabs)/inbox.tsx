import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MessageCircle, Archive, Lock, ChevronRight, EyeOff, User } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useMatches, useCurrentUser, supabase } from '@/lib/supabase';
import { getSignedPhotoUrls } from '@/lib/supabase/photos';
import { cn } from '@/lib/cn';

type TabType = 'active' | 'archived';

interface MatchWithProfile {
  id: string;
  user_1_id: string;
  user_2_id: string;
  status: string;
  matched_at: string;
  chat_threads: Array<{
    id: string;
    match_id: string;
    unlocked: boolean;
    last_message_at: string | null;
  }>;
  otherProfile?: {
    id: string;
    user_id: string;
    display_name: string;
    age: number;
    city: string;
    photos: Array<{ storage_path: string; signedUrl?: string | null }>;
  };
  lastMessage?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  unreadCount: number;
}

export default function InboxScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const { data: currentUser } = useCurrentUser();
  const { data: matches, isLoading: matchesLoading } = useMatches();

  // Fetch profiles and messages for all matches
  const { data: matchesWithProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['matches-with-profiles', matches, currentUser],
    queryFn: async () => {
      if (!matches || matches.length === 0 || !currentUser) return [];

      // Get other user IDs
      const otherUserIds = matches.map((m) =>
        m.user_1_id === currentUser.id ? m.user_2_id : m.user_1_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          photos (id, storage_path, order_index, is_primary)
        `)
        .in('user_id', otherUserIds);

      // Get signed URLs for photos
      const allPhotoPaths = (profiles ?? []).flatMap(
        (p: { photos?: Array<{ storage_path: string }> }) =>
          p.photos?.map((photo) => photo.storage_path) ?? []
      );
      const signedUrls = await getSignedPhotoUrls(allPhotoPaths);

      // Fetch last messages for each thread
      const threadIds = matches.flatMap((m) => m.chat_threads?.map((t) => t.id) ?? []);

      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });

      // Count unread messages
      const { data: unreadCounts } = await supabase
        .from('messages')
        .select('thread_id')
        .in('thread_id', threadIds)
        .neq('sender_id', currentUser.id)
        .is('read_at', null);

      const unreadByThread = (unreadCounts ?? []).reduce((acc, msg) => {
        acc[msg.thread_id] = (acc[msg.thread_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map matches with profiles
      return matches.map((match) => {
        const otherUserId = match.user_1_id === currentUser.id ? match.user_2_id : match.user_1_id;
        const profile = (profiles ?? []).find((p: { user_id: string }) => p.user_id === otherUserId);
        const thread = match.chat_threads?.[0];
        const threadLastMessage = (lastMessages ?? []).find((m) => m.thread_id === thread?.id);

        return {
          ...match,
          otherProfile: profile
            ? {
                ...profile,
                photos: profile.photos?.map((photo: { storage_path: string }) => ({
                  ...photo,
                  signedUrl: signedUrls.get(photo.storage_path) ?? null,
                })) ?? [],
              }
            : undefined,
          lastMessage: threadLastMessage,
          unreadCount: thread ? (unreadByThread[thread.id] || 0) : 0,
        } as MatchWithProfile;
      });
    },
    enabled: !!matches && matches.length > 0 && !!currentUser,
  });

  const isLoading = matchesLoading || profilesLoading;

  // Filter by tab
  const filteredMatches = useMemo(() => {
    if (!matchesWithProfiles) return [];

    return matchesWithProfiles.filter((m) => {
      const isArchived = m.status === 'archived';
      return activeTab === 'archived' ? isArchived : !isArchived;
    }).sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.chat_threads?.[0]?.last_message_at || a.matched_at;
      const bTime = b.lastMessage?.created_at || b.chat_threads?.[0]?.last_message_at || b.matched_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [matchesWithProfiles, activeTab]);

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

  const handleChatPress = (match: MatchWithProfile) => {
    const thread = match.chat_threads?.[0];
    if (thread) {
      router.push(`/chat/${thread.id}`);
    }
  };

  const renderChatItem = (match: MatchWithProfile, index: number) => {
    const profile = match.otherProfile;
    const thread = match.chat_threads?.[0];
    const isUnlocked = thread?.unlocked ?? false;
    const photoUrl = profile?.photos?.[0]?.signedUrl;
    const timeString = match.lastMessage?.created_at || thread?.last_message_at || match.matched_at;

    return (
      <Animated.View
        key={match.id}
        entering={FadeInDown.delay(index * 50).springify()}
      >
        <Pressable
          onPress={() => handleChatPress(match)}
          className="bg-zinc-900/80 rounded-2xl p-4 mb-3 flex-row items-center active:bg-zinc-800 border border-zinc-800"
        >
          {/* Avatar */}
          <View className="relative">
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center">
                <User size={24} color="#6b7280" />
              </View>
            )}
            {match.unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center overflow-hidden">
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white text-xs font-bold">
                    {match.unreadCount}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-semibold text-base" numberOfLines={1}>
                {profile?.display_name ?? 'Unknown'}
              </Text>
              <Text className="text-gray-500 text-xs">
                {timeString ? formatTime(timeString) : ''}
              </Text>
            </View>

            {/* Last message or status */}
            <View className="flex-row items-center mt-1">
              {!isUnlocked ? (
                <View className="flex-row items-center">
                  <Lock size={12} color="#c084fc" />
                  <Text className="text-purple-300 text-sm ml-1">
                    Send first message to unlock
                  </Text>
                </View>
              ) : match.lastMessage ? (
                <Text
                  className={cn(
                    'text-sm flex-1',
                    match.unreadCount > 0
                      ? 'text-white font-medium'
                      : 'text-gray-400'
                  )}
                  numberOfLines={1}
                >
                  {match.lastMessage.sender_id === currentUser?.id ? 'You: ' : ''}
                  {match.lastMessage.content}
                </Text>
              ) : (
                <Text className="text-gray-500 text-sm">
                  Chat unlocked - say hello!
                </Text>
              )}
            </View>
          </View>

          <ChevronRight size={20} color="#6b7280" />
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
            <Text className="text-gray-400 mt-4">Loading messages...</Text>
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
          <View className="px-5 py-3 flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">Messages</Text>
            <View className="flex-row items-center bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              <EyeOff size={12} color="#c084fc" />
              <Text className="text-purple-300 text-xs ml-1">Protected</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row px-5 mb-4">
            <Pressable
              onPress={() => setActiveTab('active')}
              className={cn(
                'flex-1 py-3 rounded-xl mr-2 overflow-hidden',
                activeTab !== 'active' && 'bg-zinc-900 border border-zinc-800'
              )}
            >
              {activeTab === 'active' ? (
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
                    borderRadius: 12,
                  }}
                />
              ) : null}
              <View className="flex-row items-center justify-center">
                <MessageCircle
                  size={18}
                  color={activeTab === 'active' ? 'white' : '#9ca3af'}
                />
                <Text
                  className={cn(
                    'ml-2 font-medium',
                    activeTab === 'active' ? 'text-white' : 'text-gray-400'
                  )}
                >
                  Active
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('archived')}
              className={cn(
                'flex-1 py-3 rounded-xl overflow-hidden',
                activeTab !== 'archived' && 'bg-zinc-900 border border-zinc-800'
              )}
            >
              {activeTab === 'archived' ? (
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
                    borderRadius: 12,
                  }}
                />
              ) : null}
              <View className="flex-row items-center justify-center">
                <Archive
                  size={18}
                  color={activeTab === 'archived' ? 'white' : '#9ca3af'}
                />
                <Text
                  className={cn(
                    'ml-2 font-medium',
                    activeTab === 'archived' ? 'text-white' : 'text-gray-400'
                  )}
                >
                  Archived
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Chat List */}
          {filteredMatches.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-20 h-20 bg-zinc-900 rounded-full items-center justify-center mb-4 border border-zinc-800">
                {activeTab === 'active' ? (
                  <MessageCircle size={36} color="#6b7280" />
                ) : (
                  <Archive size={36} color="#6b7280" />
                )}
              </View>
              <Text className="text-gray-400 text-center">
                {activeTab === 'active'
                  ? 'No active conversations yet.\nLike someone to start matching!'
                  : 'No archived conversations.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMatches}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item, index }) => renderChatItem(item, index)}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
