import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Timer, Lock, Eye, Play } from 'lucide-react-native';
import { Message } from '@/lib/types';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';

interface TimedPhotoMessageProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
}

export default function TimedPhotoMessage({
  message,
  isOwn,
  currentUserId,
}: TimedPhotoMessageProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markMessageViewed = useDatingStore((s) => s.markMessageViewed);
  const expireMessage = useDatingStore((s) => s.expireMessage);

  const progress = useSharedValue(1);

  const isExpired = message.is_expired;
  const hasTimer = !!message.self_destruct_seconds;
  const isVideo = message.message_type === 'video';

  // Check if already viewed and calculate remaining time
  useEffect(() => {
    if (message.viewed_at && message.self_destruct_seconds && !isOwn) {
      const viewedTime = new Date(message.viewed_at).getTime();
      const expiresAt = viewedTime + message.self_destruct_seconds * 1000;
      const now = Date.now();

      if (now >= expiresAt) {
        expireMessage(message.id);
      }
    }
  }, [message.viewed_at, message.self_destruct_seconds, message.id, isOwn, expireMessage]);

  const handlePress = () => {
    if (isExpired || !message.media_url) return;

    // If it's the sender's own message, just show it
    if (isOwn) {
      setIsViewing(true);
      return;
    }

    // Mark as viewed if not already
    if (!message.viewed_at && hasTimer) {
      markMessageViewed(message.id);
    }

    setIsViewing(true);

    // Start countdown if has timer
    if (hasTimer && message.self_destruct_seconds) {
      setTimeRemaining(message.self_destruct_seconds);
      progress.value = 1;
      progress.value = withTiming(0, {
        duration: message.self_destruct_seconds * 1000,
      });

      // Countdown display
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-close and expire
      timerRef.current = setTimeout(() => {
        setIsViewing(false);
        expireMessage(message.id);
      }, message.self_destruct_seconds * 1000);
    }
  };

  const handleClose = () => {
    setIsViewing(false);

    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // If has timer and was being viewed, expire immediately on close
    if (hasTimer && !isOwn && message.viewed_at) {
      expireMessage(message.id);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Expired state
  if (isExpired) {
    return (
      <View
        className={cn(
          'rounded-2xl overflow-hidden',
          isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
        )}
      >
        <View className="w-48 h-48 bg-zinc-800 items-center justify-center border border-zinc-700">
          <Lock size={32} color="#6b7280" />
          <Text className="text-gray-500 text-sm mt-2">
            {isVideo ? 'Video expired' : 'Photo expired'}
          </Text>
        </View>
      </View>
    );
  }

  // Thumbnail view (before opening)
  return (
    <>
      <Pressable onPress={handlePress}>
        <View
          className={cn(
            'rounded-2xl overflow-hidden relative',
            isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
          )}
        >
          {/* Blurred preview or locked state */}
          {hasTimer && !isOwn && !message.viewed_at ? (
            <View className="w-48 h-48 bg-zinc-800 items-center justify-center border border-purple-500/30">
              <LinearGradient
                colors={['#9333ea20', '#db277720']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mb-2">
                {isVideo ? (
                  <Play size={28} color="#c084fc" />
                ) : (
                  <Eye size={28} color="#c084fc" />
                )}
              </View>
              <Text className="text-purple-300 font-medium">
                {isVideo ? 'Tap to play' : 'Tap to view'}
              </Text>
              <View className="flex-row items-center mt-1">
                <Timer size={12} color="#a855f7" />
                <Text className="text-purple-400 text-xs ml-1">
                  {message.self_destruct_seconds}s
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Image
                source={{ uri: message.media_url }}
                className="w-48 h-48"
                resizeMode="cover"
                blurRadius={hasTimer && !isOwn ? 20 : 0}
              />
              {isVideo && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <View className="w-12 h-12 rounded-full bg-white/90 items-center justify-center">
                    <Play size={24} color="#000" fill="#000" />
                  </View>
                </View>
              )}
              {/* Timer badge */}
              {hasTimer && (
                <View className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1 flex-row items-center">
                  <Timer size={12} color="#c084fc" />
                  <Text className="text-purple-300 text-xs ml-1">
                    {message.self_destruct_seconds}s
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </Pressable>

      {/* Fullscreen viewing modal */}
      <Modal
        visible={isViewing}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable
          onPress={handleClose}
          className="flex-1 bg-black items-center justify-center"
        >
          {/* Timer progress bar */}
          {hasTimer && !isOwn && timeRemaining !== null && (
            <View className="absolute top-16 left-4 right-4 z-10">
              <View className="bg-zinc-800 h-1 rounded-full overflow-hidden">
                <Animated.View
                  style={[
                    {
                      height: 4,
                      backgroundColor: '#c084fc',
                      borderRadius: 2,
                    },
                    progressStyle,
                  ]}
                />
              </View>
              <View className="flex-row items-center justify-center mt-2">
                <Timer size={16} color="#c084fc" />
                <Text className="text-purple-300 text-lg font-bold ml-2">
                  {timeRemaining}s
                </Text>
              </View>
            </View>
          )}

          {message.media_url && isVideo ? (
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ width: '100%', height: '100%' }}
            >
              <Video
                source={{ uri: message.media_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                useNativeControls={false}
              />
            </Pressable>
          ) : message.media_url ? (
            <Image
              source={{ uri: message.media_url }}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : null}

          {/* Tap to close hint */}
          <View className="absolute bottom-16 left-0 right-0 items-center">
            <Text className="text-white/60 text-sm">Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
