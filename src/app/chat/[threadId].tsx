import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import {
  ArrowLeft,
  Send,
  Lock,
  MessageSquare,
  Heart,
  ShieldCheck,
  EyeOff,
  User,
  Video,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useThreadMessages, useSendMessage, supabase } from '@/lib/supabase';
import { getSignedPhotoUrls } from '@/lib/supabase/photos';
import { cn } from '@/lib/cn';
import { FIRST_MESSAGE_PROMPTS } from '@/lib/static-data';
import { FirstMessagePrompt } from '@/lib/types';
import IncomingCallModal from '@/components/IncomingCallModal';
import { useIncomingCall } from '@/lib/hooks/useIncomingCall';

type FirstMessageMode = 'select' | 'prompt' | 'reaction' | 'voice' | null;

interface ThreadWithMatch {
  id: string;
  match_id: string;
  unlocked: boolean;
  last_message_at: string | null;
  match?: {
    id: string;
    user_1_id: string;
    user_2_id: string;
    matched_at: string;
  };
  otherProfile?: {
    user_id: string;
    display_name: string;
    age: number;
    city: string;
    photos: Array<{ storage_path: string; signedUrl?: string | null }>;
    prompt_responses?: Array<{ id: string; prompt_text: string; response_text: string }>;
  };
}

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading: messagesLoading } = useThreadMessages(threadId);
  const sendMessageMutation = useSendMessage();

  // Incoming call detection
  const { incomingCall, acceptCall, declineCall } = useIncomingCall(currentUser?.id || null);

  const [messageText, setMessageText] = useState('');
  const [firstMessageMode, setFirstMessageMode] = useState<FirstMessageMode>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<FirstMessagePrompt | null>(null);

  // Fetch thread with match and profile data
  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['thread-with-profile', threadId, currentUser],
    queryFn: async (): Promise<ThreadWithMatch | null> => {
      if (!threadId || !currentUser) return null;

      // Fetch thread with match
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .select(`
          *,
          matches (*)
        `)
        .eq('id', threadId)
        .single();

      if (error || !thread) {
        console.error('[Chat] Thread fetch error:', error);
        return null;
      }

      const match = thread.matches as { id: string; user_1_id: string; user_2_id: string; matched_at: string };
      const otherUserId = match.user_1_id === currentUser.id ? match.user_2_id : match.user_1_id;

      // Fetch other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          photos (id, storage_path, order_index, is_primary),
          prompt_responses (*)
        `)
        .eq('user_id', otherUserId)
        .single();

      // Get signed URLs for photos
      let profileWithUrls = profile;
      if (profile?.photos?.length) {
        const paths = profile.photos.map((p: { storage_path: string }) => p.storage_path);
        const signedUrls = await getSignedPhotoUrls(paths);
        profileWithUrls = {
          ...profile,
          photos: profile.photos.map((p: { storage_path: string }) => ({
            ...p,
            signedUrl: signedUrls.get(p.storage_path) ?? null,
          })),
        };
      }

      return {
        id: thread.id,
        match_id: thread.match_id,
        unlocked: thread.unlocked,
        last_message_at: thread.last_message_at,
        match,
        otherProfile: profileWithUrls,
      };
    },
    enabled: !!threadId && !!currentUser,
  });

  // Unlock thread mutation
  const unlockThreadMutation = useMutation({
    mutationFn: async () => {
      if (!threadId) return;
      const { error } = await supabase
        .from('chat_threads')
        .update({ unlocked: true })
        .eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-with-profile', threadId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages?.length]);

  const isLoading = threadLoading || messagesLoading;
  const isUnlocked = threadData?.unlocked ?? false;
  const otherProfile = threadData?.otherProfile;
  const match = threadData?.match;
  const photoUrl = otherProfile?.photos?.[0]?.signedUrl;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !threadId) return;

    try {
      await sendMessageMutation.mutateAsync({
        thread_id: threadId,
        content: messageText.trim(),
        message_type: 'text',
        is_first_message: !isUnlocked,
      });

      if (!isUnlocked) {
        await unlockThreadMutation.mutateAsync();
      }

      setMessageText('');
      setSelectedPrompt(null);
    } catch (error) {
      console.error('[Chat] Send message error:', error);
    }
  };

  const handleFirstMessageSelect = (mode: FirstMessageMode) => {
    setFirstMessageMode(mode);
  };

  const handlePromptSelect = (prompt: FirstMessagePrompt) => {
    setSelectedPrompt(prompt);
    setMessageText(prompt.prompt_text);
    setFirstMessageMode(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <Text className="text-gray-400 mt-4">Loading chat...</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Not found state
  if (!threadData || !otherProfile) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <Text className="text-white text-lg mb-4">Chat not found</Text>
            <Pressable
              onPress={() => router.replace('/(tabs)/inbox')}
              className="bg-purple-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-medium">Go to Messages</Text>
            </Pressable>
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
          <View className="flex-row items-center px-4 py-3 border-b border-purple-900/30">
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/inbox')}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>

            <View className="flex-1 flex-row items-center ml-2">
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                  <User size={20} color="#6b7280" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base">
                  {otherProfile.display_name}
                </Text>
                <View className="flex-row items-center">
                  <EyeOff size={10} color="#a855f7" />
                  <Text className="text-purple-400 text-xs ml-1">
                    Protected chat
                  </Text>
                </View>
              </View>
            </View>

            {/* Video Call Button */}
            <Pressable
              onPress={() => {
                router.push({
                  pathname: '/video-call',
                  params: {
                    threadId,
                    participantId: otherProfile.user_id,
                    participantName: otherProfile.display_name,
                  },
                });
              }}
              className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center border border-purple-500/30 ml-2"
            >
              <Video size={20} color="#a855f7" />
            </Pressable>
          </View>

          {/* Security Banner */}
          <View className="mx-4 mt-3 mb-2 bg-purple-500/10 rounded-xl p-3 flex-row items-center border border-purple-500/20">
            <ShieldCheck size={16} color="#a855f7" />
            <Text className="text-purple-300 text-xs ml-2 flex-1">
              Your messages are private and secure
            </Text>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Match notification */}
            {match && (
              <Animated.View
                entering={FadeInDown.delay(100)}
                className="items-center mb-6"
              >
                <View className="bg-purple-500/20 px-4 py-2 rounded-full flex-row items-center border border-purple-500/30">
                  <Heart size={14} color="#c084fc" fill="#c084fc" />
                  <Text className="text-purple-300 text-sm ml-2">
                    Matched {new Date(match.matched_at).toLocaleDateString()}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Messages */}
            {messages?.map((message, index) => {
              const isOwn = message.sender_id === currentUser?.id;

              return (
                <Animated.View
                  key={message.id}
                  entering={SlideInRight.delay(index * 50).springify()}
                  className={cn(
                    'max-w-[80%] mb-3',
                    isOwn ? 'self-end' : 'self-start'
                  )}
                >
                  {isOwn ? (
                    <View className="rounded-2xl rounded-br-sm overflow-hidden">
                      <LinearGradient
                        colors={['#9333ea', '#db2777']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ padding: 12, paddingHorizontal: 16 }}
                      >
                        <Text className="text-white">{message.content}</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View className="bg-zinc-800/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-zinc-700/50">
                      <Text className="text-white">{message.content}</Text>
                    </View>
                  )}
                  <Text
                    className={cn(
                      'text-gray-500 text-xs mt-1',
                      isOwn ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatTime(message.created_at)}
                  </Text>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* First Message Selector (when chat is locked) */}
          {!isUnlocked && firstMessageMode === null && (
            <Animated.View
              entering={FadeInUp.springify()}
              className="px-4 pb-4"
            >
              <View className="bg-zinc-900/80 rounded-2xl p-4 mb-3 border border-purple-900/30">
                <View className="flex-row items-center mb-3">
                  <Lock size={16} color="#c084fc" />
                  <Text className="text-purple-300 font-medium ml-2">
                    Chat is locked
                  </Text>
                </View>
                <Text className="text-gray-400 text-sm mb-4">
                  Send a thoughtful first message to unlock the conversation
                </Text>

                <View>
                  <Pressable
                    onPress={() => handleFirstMessageSelect('prompt')}
                    className="bg-zinc-800 rounded-xl p-4 flex-row items-center active:bg-zinc-700 mb-2 border border-zinc-700/50"
                  >
                    <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                      <MessageSquare size={20} color="#c084fc" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-medium">Use a prompt</Text>
                      <Text className="text-gray-400 text-sm">
                        Guided conversation starters
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => handleFirstMessageSelect('reaction')}
                    className="bg-zinc-800 rounded-xl p-4 flex-row items-center active:bg-zinc-700 border border-zinc-700/50"
                  >
                    <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center">
                      <Heart size={20} color="#ec4899" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-medium">
                        React to their profile
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        Comment on their prompts
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Prompt Selection */}
          {!isUnlocked && firstMessageMode === 'prompt' && (
            <Animated.View
              entering={FadeInUp.springify()}
              className="px-4 pb-4"
            >
              <View className="bg-zinc-900/80 rounded-2xl p-4 border border-purple-900/30">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">Choose a prompt</Text>
                  <Pressable onPress={() => setFirstMessageMode(null)}>
                    <Text className="text-purple-400">Cancel</Text>
                  </Pressable>
                </View>

                <ScrollView
                  className="max-h-64"
                  showsVerticalScrollIndicator={false}
                >
                  {FIRST_MESSAGE_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt.id}
                      onPress={() => handlePromptSelect(prompt)}
                      className="bg-zinc-800 rounded-xl p-3 mb-2 active:bg-zinc-700 border border-zinc-700/50"
                    >
                      <Text className="text-white">{prompt.prompt_text}</Text>
                      <Text className="text-purple-400/60 text-xs mt-1 capitalize">
                        {prompt.category}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>
          )}

          {/* Profile Prompt Reaction */}
          {!isUnlocked && firstMessageMode === 'reaction' && (
            <Animated.View
              entering={FadeInUp.springify()}
              className="px-4 pb-4"
            >
              <View className="bg-zinc-900/80 rounded-2xl p-4 border border-purple-900/30">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">
                    React to their profile
                  </Text>
                  <Pressable onPress={() => setFirstMessageMode(null)}>
                    <Text className="text-purple-400">Cancel</Text>
                  </Pressable>
                </View>

                <ScrollView
                  className="max-h-64"
                  showsVerticalScrollIndicator={false}
                >
                  {otherProfile.prompt_responses && otherProfile.prompt_responses.length > 0 ? (
                    otherProfile.prompt_responses.map((pr) => (
                      <Pressable
                        key={pr.id}
                        onPress={() => {
                          setMessageText(`Love your answer to "${pr.prompt_text}" - `);
                          setFirstMessageMode(null);
                        }}
                        className="bg-zinc-800 rounded-xl p-3 mb-2 active:bg-zinc-700 border border-zinc-700/50"
                      >
                        <Text className="text-purple-300 text-sm">{pr.prompt_text}</Text>
                        <Text className="text-white mt-1">{pr.response_text}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text className="text-gray-400">
                      No prompt responses to react to
                    </Text>
                  )}
                </ScrollView>
              </View>
            </Animated.View>
          )}

          {/* Text Input (shown when unlocked OR after selecting first message type) */}
          {(isUnlocked || firstMessageMode !== null || selectedPrompt) && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View className="px-4 pb-4">
                <View className="bg-zinc-900 flex-row items-end p-2 border border-zinc-800 rounded-2xl">
                  <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={
                      isUnlocked
                        ? 'Type a message...'
                        : 'Write your first message...'
                    }
                    placeholderTextColor="#6b7280"
                    className="flex-1 text-white py-2 px-3 max-h-24"
                    multiline
                  />

                  <Pressable
                    onPress={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                  >
                    {sendMessageMutation.isPending ? (
                      <ActivityIndicator size="small" color="#c084fc" />
                    ) : messageText.trim() ? (
                      <LinearGradient
                        colors={['#9333ea', '#db2777']}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Send size={18} color="white" />
                      </LinearGradient>
                    ) : (
                      <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                        <Send size={18} color="#6b7280" />
                      </View>
                    )}
                  </Pressable>
                </View>

                {!isUnlocked && (
                  <Text className="text-gray-500 text-xs text-center mt-2">
                    Your first message will unlock the chat
                  </Text>
                )}
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <IncomingCallModal
            visible={!!incomingCall}
            callerName={incomingCall.callerName}
            callerPhoto={incomingCall.callerPhoto}
            callId={incomingCall.callId}
            offerSdp={incomingCall.offerSdp}
            callerId={incomingCall.callerId}
            threadId={incomingCall.threadId}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}
      </LinearGradient>
    </View>
  );
}
