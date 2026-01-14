import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import * as ScreenCapture from 'expo-screen-capture';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Send,
  Users,
  MoreVertical,
  ShieldCheck,
  EyeOff,
  ImageIcon,
  Camera,
  X,
  Play,
  Video,
  Info,
  Timer,
  Smile,
  CornerUpLeft,
  Gamepad2,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { useDiscoverProfiles } from '@/lib/supabase';
import { Profile, Message, GameType, GameParticipant } from '@/lib/types';
import { cn } from '@/lib/cn';
import TimedPhotoMessage from '@/components/TimedPhotoMessage';
import EmojiPicker from '@/components/EmojiPicker';
import GifPicker from '@/components/GifPicker';
import GameLauncher from '@/components/games/GameLauncher';
import GameOverlay from '@/components/games/GameOverlay';

export default function GroupChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch profiles from Supabase
  const { data: profiles = [] } = useDiscoverProfiles();

  const threads = useDatingStore((s) => s.threads);
  const messages = useDatingStore((s) => s.messages);
  const currentUserId = useDatingStore((s) => s.currentUserId);
  const sendMessage = useDatingStore((s) => s.sendMessage);
  const markAsRead = useDatingStore((s) => s.markAsRead);
  const addReaction = useDatingStore((s) => s.addReaction);
  const removeReaction = useDatingStore((s) => s.removeReaction);
  const startGame = useDatingStore((s) => s.startGame);
  const endGame = useDatingStore((s) => s.endGame);
  const gameSessions = useDatingStore((s) => s.gameSessions);

  const [messageText, setMessageText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showGameLauncher, setShowGameLauncher] = useState(false);
  const [showGameOverlay, setShowGameOverlay] = useState(false);

  // Screenshot protection
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (e) {
        console.log('Screen capture prevention not available');
      }
    };

    enableProtection();

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  // Get thread data
  const thread = threads.find((t) => t.id === threadId);
  const threadMessages = useMemo(() => {
    if (!thread) return [];
    return messages
      .filter((m) => m.thread_id === thread.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [thread, messages]);

  const participants = useMemo(() => {
    if (!thread?.participant_ids) return [];
    return thread.participant_ids
      .filter((id) => id !== currentUserId)
      .map((id) => profiles.find((p: Profile) => p.user_id === id))
      .filter((p): p is Profile => p !== undefined);
  }, [thread, currentUserId, profiles]);

  // Get active game for this thread - subscribe to gameSessions for reactivity
  const activeGame = useMemo(() => {
    if (!threadId) return null;
    return gameSessions.find(
      (g) => g.thread_id === threadId && g.status === 'active'
    ) ?? null;
  }, [threadId, gameSessions]);

  // Mark messages as read
  useEffect(() => {
    if (thread?.id) {
      markAsRead(thread.id);
    }
  }, [thread?.id, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [threadMessages.length]);

  if (!thread) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Group chat not found</Text>
      </View>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const replyTo = replyingTo ? {
      id: replyingTo.id,
      content: replyingTo.message_type === 'text' ? replyingTo.content : `[${replyingTo.message_type}]`,
      senderId: replyingTo.sender_id,
    } : undefined;

    sendMessage(thread.id, messageText.trim(), false, 'text', undefined, undefined, replyTo);
    setMessageText('');
    setReplyingTo(null);
  };

  const handleSendGif = (gifUrl: string) => {
    sendMessage(thread.id, '', false, 'gif', gifUrl);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    const message = threadMessages.find(m => m.id === messageId);
    const hasReacted = message?.reactions?.some(
      r => r.user_id === currentUserId && r.emoji === emoji
    );

    if (hasReacted) {
      removeReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
    setSelectedMessageForReaction(null);
    setShowReactionPicker(false);
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.message_type === 'system') return;
    setSelectedMessageForReaction(message.id);
  };

  const handlePickImage = async () => {
    setShowMediaOptions(false);
    const timerToUse = selectedTimer;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setIsSendingMedia(true);

        const isVideo = asset.mimeType?.startsWith('video/') ||
          asset.uri?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
        const messageType = isVideo ? 'video' : 'image';

        sendMessage(thread.id, '', false, messageType, asset.uri, timerToUse ?? undefined);
        setIsSendingMedia(false);
        setSelectedTimer(null);
      }
    } catch (error) {
      console.log('Error picking media:', error);
      setIsSendingMedia(false);
    }
  };

  const handleTakePhoto = async () => {
    setShowMediaOptions(false);
    const timerToUse = selectedTimer;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsSendingMedia(true);
        sendMessage(thread.id, '', false, 'image', result.assets[0].uri, timerToUse ?? undefined);
        setIsSendingMedia(false);
        setSelectedTimer(null);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      setIsSendingMedia(false);
    }
  };

  const handleVideoCall = () => {
    // For group video calls, we'd need additional logic
    // For now, show a message
    setShowOptions(false);
  };

  // Game handlers
  const handleStartGame = (gameType: GameType, gameParticipants: GameParticipant[]) => {
    if (!threadId) return;
    const game = startGame(threadId, gameType, gameParticipants);
    if (game) {
      setShowGameOverlay(true);
      // Send system message about game starting
      sendMessage(threadId, `Started a game of ${gameType.replace(/_/g, ' ')}!`, false, 'system');
    }
  };

  const handleEndGame = (cancelled = false) => {
    if (activeGame) {
      endGame(activeGame.id, cancelled);
      setShowGameOverlay(false);
      if (threadId) {
        sendMessage(
          threadId,
          cancelled ? 'Game was cancelled' : 'Game completed!',
          false,
          'system'
        );
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderProfile = (senderId: string): Profile | undefined => {
    return profiles.find((p: Profile) => p.user_id === senderId);
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.sender_id === currentUserId;
    const isSystem = message.message_type === 'system';
    const isMedia = message.message_type === 'image' || message.message_type === 'video';
    const isGif = message.message_type === 'gif';
    const isVideoCall = message.message_type === 'video_call';
    const hasSelfDestruct = isMedia && message.self_destruct_seconds && message.self_destruct_seconds > 0;
    const senderProfile = !isOwn && !isSystem ? getSenderProfile(message.sender_id) : null;
    const isSelected = selectedMessageForReaction === message.id;
    const reactions = message.reactions || [];

    // Get reply sender name
    const getReplyToName = () => {
      if (!message.reply_to_sender_id) return '';
      if (message.reply_to_sender_id === currentUserId) return 'You';
      const sender = getSenderProfile(message.reply_to_sender_id);
      return sender?.display_name ?? 'Unknown';
    };

    // System message
    if (isSystem) {
      return (
        <Animated.View
          key={message.id}
          entering={SlideInRight.delay(index * 50).springify()}
          className="self-center mb-3"
        >
          <View className="bg-zinc-800/50 px-4 py-2 rounded-full">
            <Text className="text-gray-400 text-sm">{message.content}</Text>
          </View>
        </Animated.View>
      );
    }

    // Video call message
    if (isVideoCall) {
      return (
        <Animated.View
          key={message.id}
          entering={SlideInRight.delay(index * 50).springify()}
          className="self-center mb-3"
        >
          <View className="bg-purple-500/20 px-4 py-2 rounded-full flex-row items-center border border-purple-500/30">
            <Video size={14} color="#c084fc" />
            <Text className="text-purple-300 text-sm ml-2">{message.content}</Text>
          </View>
        </Animated.View>
      );
    }

    // Timed photo/video message with self-destruct
    if (hasSelfDestruct && message.media_url) {
      return (
        <Animated.View
          key={message.id}
          entering={SlideInRight.delay(index * 50).springify()}
          className={cn('max-w-[80%] mb-3', isOwn ? 'self-end' : 'self-start')}
        >
          {/* Sender name for group messages */}
          {!isOwn && senderProfile && (
            <View className="flex-row items-center mb-1">
              <Image
                source={{ uri: senderProfile.photos[0] }}
                className="w-5 h-5 rounded-full mr-1"
              />
              <Text className="text-purple-300 text-xs">{senderProfile.display_name}</Text>
            </View>
          )}
          <TimedPhotoMessage
            message={message}
            isOwn={isOwn}
            currentUserId={currentUserId}
          />
          <Text className={cn('text-gray-500 text-xs mt-1', isOwn ? 'text-right' : 'text-left')}>
            {formatTime(message.created_at)}
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={message.id}
        entering={SlideInRight.delay(index * 50).springify()}
        className={cn('max-w-[80%] mb-3', isOwn ? 'self-end' : 'self-start')}
      >
        {/* Sender name for group messages */}
        {!isOwn && senderProfile && (
          <View className="flex-row items-center mb-1">
            <Image
              source={{ uri: senderProfile.photos[0] }}
              className="w-5 h-5 rounded-full mr-1"
            />
            <Text className="text-purple-300 text-xs">{senderProfile.display_name}</Text>
          </View>
        )}

        {/* Reply preview */}
        {message.reply_to_id && (
          <View className={cn(
            'mb-1 px-3 py-1.5 rounded-lg border-l-2 border-purple-500',
            isOwn ? 'bg-purple-500/10' : 'bg-zinc-800/50'
          )}>
            <Text className="text-purple-400 text-xs font-medium">{getReplyToName()}</Text>
            <Text className="text-gray-400 text-xs" numberOfLines={1}>
              {message.reply_to_content}
            </Text>
          </View>
        )}

        {/* Message content */}
        <Pressable
          onLongPress={() => handleLongPressMessage(message)}
          delayLongPress={300}
        >
          {isGif && message.media_url ? (
            <View className={cn('rounded-2xl overflow-hidden', isOwn ? 'rounded-br-sm' : 'rounded-bl-sm')}>
              <Image source={{ uri: message.media_url }} className="w-48 h-48" resizeMode="cover" />
            </View>
          ) : isMedia && message.media_url ? (
            <Pressable onPress={() => setFullscreenImage(message.media_url ?? null)}>
              <View className={cn('rounded-2xl overflow-hidden', isOwn ? 'rounded-br-sm' : 'rounded-bl-sm')}>
                <Image source={{ uri: message.media_url }} className="w-48 h-48" resizeMode="cover" />
                {message.message_type === 'video' && (
                  <View className="absolute inset-0 items-center justify-center bg-black/30">
                    <View className="w-12 h-12 rounded-full bg-white/90 items-center justify-center">
                      <Play size={24} color="#000" fill="#000" />
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          ) : isOwn ? (
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
        </Pressable>

        {/* Reactions display */}
        {reactions.length > 0 && (
          <View className={cn(
            'flex-row flex-wrap mt-1 gap-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            {Object.entries(
              reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => {
              const hasUserReacted = reactions.some(
                r => r.emoji === emoji && r.user_id === currentUserId
              );
              return (
                <Pressable
                  key={emoji}
                  onPress={() => handleReaction(message.id, emoji)}
                  className={cn(
                    'px-1.5 py-0.5 rounded-full flex-row items-center',
                    hasUserReacted ? 'bg-purple-500/30 border border-purple-500/50' : 'bg-zinc-700/50'
                  )}
                >
                  <Text className="text-sm">{emoji}</Text>
                  {count > 1 && (
                    <Text className="text-gray-400 text-xs ml-1">{count}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Action buttons when selected */}
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(100)}
            className={cn(
              'flex-row mt-2 gap-2',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            {/* Quick reactions */}
            {['❤️', '😂', '😮', '👍', '🔥'].map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleReaction(message.id, emoji)}
                className="w-9 h-9 bg-zinc-800 rounded-full items-center justify-center"
              >
                <Text className="text-lg">{emoji}</Text>
              </Pressable>
            ))}
            {/* More emoji button */}
            <Pressable
              onPress={() => setShowReactionPicker(true)}
              className="w-9 h-9 bg-zinc-800 rounded-full items-center justify-center"
            >
              <Smile size={18} color="#9ca3af" />
            </Pressable>
            {/* Reply button */}
            <Pressable
              onPress={() => {
                setReplyingTo(message);
                setSelectedMessageForReaction(null);
              }}
              className="w-9 h-9 bg-zinc-800 rounded-full items-center justify-center"
            >
              <CornerUpLeft size={18} color="#9ca3af" />
            </Pressable>
          </Animated.View>
        )}

        <Text className={cn('text-gray-500 text-xs mt-1', isOwn ? 'text-right' : 'text-left')}>
          {formatTime(message.created_at)}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-purple-900/30">
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/inbox'))}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>

            <Pressable
              className="flex-1 flex-row items-center ml-2"
              onPress={() => setShowParticipants(true)}
            >
              <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center border border-purple-500/30">
                <Users size={20} color="#c084fc" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base" numberOfLines={1}>
                  {thread.group_name}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-xs">
                    {participants.length + 1} members
                  </Text>
                  <View className="mx-2 w-1 h-1 bg-gray-500 rounded-full" />
                  <EyeOff size={10} color="#a855f7" />
                  <Text className="text-purple-400 text-xs ml-1">Protected</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setShowParticipants(true)}
              className="w-10 h-10 items-center justify-center"
            >
              <Info size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Security Banner */}
          <View className="mx-4 mt-3 mb-2 bg-purple-500/10 rounded-xl p-3 flex-row items-center border border-purple-500/20">
            <ShieldCheck size={16} color="#a855f7" />
            <Text className="text-purple-300 text-xs ml-2 flex-1">
              Screenshots are blocked in this group for privacy
            </Text>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            onTouchStart={() => {
              setShowOptions(false);
              setShowMediaOptions(false);
            }}
          >
            {/* Group creation notice */}
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-6">
              <View className="bg-purple-500/20 px-4 py-2 rounded-full flex-row items-center border border-purple-500/30">
                <Users size={14} color="#c084fc" />
                <Text className="text-purple-300 text-sm ml-2">Group chat</Text>
              </View>
            </Animated.View>

            {/* Messages */}
            {threadMessages.map((message, index) => renderMessage(message, index))}

            {/* Sending indicator */}
            {isSendingMedia && (
              <View className="self-end mb-3">
                <View className="bg-purple-500/20 rounded-2xl px-4 py-3">
                  <ActivityIndicator color="#c084fc" />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Media Options Popup */}
          {showMediaOptions && (
            <Animated.View
              entering={FadeInUp.duration(150)}
              className="absolute bottom-32 left-4 right-4 bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-purple-900/30"
            >
              {/* Timer selection */}
              <View className="px-4 py-3 border-b border-zinc-800">
                <View className="flex-row items-center mb-2">
                  <Timer size={14} color="#a855f7" />
                  <Text className="text-purple-400 text-xs ml-2">Self-destruct timer</Text>
                </View>
                <View className="flex-row gap-2">
                  {[null, 5, 10, 30].map((seconds) => (
                    <Pressable
                      key={seconds ?? 'off'}
                      onPress={() => setSelectedTimer(seconds)}
                      className={cn(
                        'px-3 py-1.5 rounded-full',
                        selectedTimer === seconds
                          ? 'bg-purple-600'
                          : 'bg-zinc-800'
                      )}
                    >
                      <Text className={cn(
                        'text-xs font-medium',
                        selectedTimer === seconds ? 'text-white' : 'text-gray-400'
                      )}>
                        {seconds ? `${seconds}s` : 'Off'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                onPress={handleTakePhoto}
                className="flex-row items-center px-4 py-3 active:bg-zinc-800 border-b border-zinc-800"
              >
                <Camera size={20} color="#c084fc" />
                <Text className="text-white ml-3">Take Photo</Text>
                {selectedTimer && (
                  <View className="ml-auto bg-purple-600/30 px-2 py-0.5 rounded-full">
                    <Text className="text-purple-300 text-xs">{selectedTimer}s</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={handlePickImage}
                className="flex-row items-center px-4 py-3 active:bg-zinc-800"
              >
                <ImageIcon size={20} color="#c084fc" />
                <Text className="text-white ml-3">Choose from Library</Text>
                {selectedTimer && (
                  <View className="ml-auto bg-purple-600/30 px-2 py-0.5 rounded-full">
                    <Text className="text-purple-300 text-xs">{selectedTimer}s</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* Text Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="px-4 pb-4">
              {/* Reply preview */}
              {replyingTo && (
                <View className="bg-zinc-800 rounded-t-xl px-4 py-2 flex-row items-center border-b border-zinc-700">
                  <CornerUpLeft size={14} color="#a855f7" />
                  <View className="flex-1 ml-2">
                    <Text className="text-purple-400 text-xs font-medium">
                      Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : getSenderProfile(replyingTo.sender_id)?.display_name ?? 'Unknown'}
                    </Text>
                    <Text className="text-gray-400 text-xs" numberOfLines={1}>
                      {replyingTo.message_type === 'text' ? replyingTo.content : `[${replyingTo.message_type}]`}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReplyingTo(null)} className="p-1">
                    <X size={16} color="#9ca3af" />
                  </Pressable>
                </View>
              )}

              <View className={cn(
                "bg-zinc-900 flex-row items-end p-2 border border-zinc-800",
                replyingTo ? "rounded-b-2xl" : "rounded-2xl"
              )}>
                <Pressable
                  onPress={() => setShowMediaOptions(!showMediaOptions)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <ImageIcon size={22} color={showMediaOptions ? '#c084fc' : '#6b7280'} />
                </Pressable>

                {/* Game button */}
                <Pressable
                  onPress={() => setShowGameLauncher(true)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <Gamepad2 size={22} color={activeGame ? '#c084fc' : '#6b7280'} />
                </Pressable>

                {/* GIF button */}
                <Pressable
                  onPress={() => setShowGifPicker(true)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-400 font-bold text-xs">GIF</Text>
                </Pressable>

                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Message the group..."
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white py-2 px-2 max-h-24"
                  multiline
                  onFocus={() => {
                    setShowMediaOptions(false);
                    setSelectedMessageForReaction(null);
                  }}
                />

                {/* Emoji button */}
                <Pressable
                  onPress={() => setShowEmojiPicker(true)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <Smile size={22} color="#6b7280" />
                </Pressable>

                <Pressable
                  onPress={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                >
                  {messageText.trim() ? (
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
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Participants Modal */}
      <Modal
        visible={showParticipants}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipants(false)}
      >
        <View className="flex-1 bg-black/80">
          <SafeAreaView className="flex-1 justify-end">
            <View className="bg-zinc-900 rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
                <Text className="text-white font-semibold text-lg">Group Members</Text>
                <Pressable onPress={() => setShowParticipants(false)}>
                  <X size={24} color="#9ca3af" />
                </Pressable>
              </View>

              <ScrollView className="px-5 py-4">
                {/* Current user */}
                <View className="flex-row items-center py-3 border-b border-zinc-800/50">
                  <View className="w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center border-2 border-purple-500/30">
                    <Text className="text-purple-300 font-semibold">You</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-medium">You</Text>
                    <Text className="text-purple-400 text-xs">Group creator</Text>
                  </View>
                </View>

                {/* Other participants */}
                {participants.map((participant) => (
                  <View
                    key={participant.id}
                    className="flex-row items-center py-3 border-b border-zinc-800/50"
                  >
                    <Image
                      source={{ uri: participant.photos[0] }}
                      className="w-12 h-12 rounded-full"
                    />
                    <View className="ml-3">
                      <Text className="text-white font-medium">{participant.display_name}</Text>
                      <Text className="text-gray-500 text-xs">{participant.city}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <Pressable
              onPress={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            >
              <X size={24} color="white" />
            </Pressable>
            {fullscreenImage && (
              <Image source={{ uri: fullscreenImage }} className="flex-1" resizeMode="contain" />
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Emoji Picker */}
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />

      {/* GIF Picker */}
      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleSendGif}
      />

      {/* Reaction Emoji Picker */}
      <EmojiPicker
        visible={showReactionPicker}
        onClose={() => {
          setShowReactionPicker(false);
          setSelectedMessageForReaction(null);
        }}
        onSelect={(emoji) => {
          if (selectedMessageForReaction) {
            handleReaction(selectedMessageForReaction, emoji);
          }
        }}
      />

      {/* Game Launcher */}
      <GameLauncher
        visible={showGameLauncher}
        onClose={() => setShowGameLauncher(false)}
        onStartGame={handleStartGame}
        participants={participants}
        currentUserId={currentUserId}
      />

      {/* Game Overlay */}
      <GameOverlay
        visible={showGameOverlay}
        game={activeGame}
        currentUserId={currentUserId}
        onClose={() => setShowGameOverlay(false)}
        onEndGame={handleEndGame}
      />

      {/* Active Game Banner */}
      {activeGame && !showGameOverlay && (
        <Pressable
          onPress={() => setShowGameOverlay(true)}
          className="absolute top-28 left-4 right-4"
        >
          <Animated.View
            entering={FadeIn}
            className="bg-purple-600 rounded-xl p-3 flex-row items-center"
          >
            <Gamepad2 size={20} color="white" />
            <Text className="text-white font-medium ml-2 flex-1">
              Game in progress - Tap to rejoin
            </Text>
            <Play size={16} color="white" />
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}
