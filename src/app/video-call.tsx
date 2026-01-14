import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import * as ScreenCapture from 'expo-screen-capture';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  FlipHorizontal,
  ShieldCheck,
  EyeOff,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { Profile } from '@/lib/types';

export default function VideoCallScreen() {
  const { threadId, participantId, participantName, participantPhoto } = useLocalSearchParams<{
    threadId: string;
    participantId: string;
    participantName: string;
    participantPhoto: string;
  }>();
  const router = useRouter();

  const sendMessage = useDatingStore((s) => s.sendMessage);
  const currentUserId = useDatingStore((s) => s.currentUserId);

  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const callStartTime = useRef<number | null>(null);

  // Pulse animation for connecting state
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Screenshot protection - prevent recording during call (only on native)
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

  // Simulate connection after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
      callStartTime.current = Date.now();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState !== 'connected') return;

    const interval = setInterval(() => {
      if (callStartTime.current) {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ended');

    // Log call in chat
    if (threadId) {
      const durationText = callDuration > 0
        ? `Video call - ${formatDuration(callDuration)}`
        : 'Missed video call';

      // We'll add a system message about the call
      sendMessage(threadId, durationText, false, 'video_call');
    }

    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/inbox');
      }
    }, 500);
  };

  const profile = MOCK_PROFILES.find((p: Profile) => p.user_id === participantId);
  const displayName = participantName || profile?.display_name || 'Unknown';
  const displayPhoto = participantPhoto || profile?.photos[0];

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        {/* Simulated remote video (show participant photo as placeholder) */}
        <View className="flex-1">
          {displayPhoto && (
            <Image
              source={{ uri: displayPhoto }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
              blurRadius={isVideoOff ? 20 : 0}
            />
          )}
          <View className="absolute inset-0 bg-black/40" />
        </View>

        <SafeAreaView className="absolute inset-0">
          {/* Header */}
          <Animated.View
            entering={FadeIn.delay(200)}
            className="items-center pt-8"
          >
            {/* Security badge */}
            <View className="bg-purple-500/20 px-4 py-2 rounded-full flex-row items-center border border-purple-500/30 mb-6">
              <EyeOff size={14} color="#a855f7" />
              <Text className="text-purple-300 text-xs ml-2">
                Recording blocked for privacy
              </Text>
            </View>

            {/* Participant info */}
            {callState === 'connecting' && (
              <Animated.View style={pulseStyle} className="items-center">
                {displayPhoto && (
                  <Image
                    source={{ uri: displayPhoto }}
                    className="w-32 h-32 rounded-full border-4 border-purple-500/50"
                  />
                )}
                <Text className="text-white text-2xl font-semibold mt-4">
                  {displayName}
                </Text>
                <Text className="text-purple-300 text-lg mt-1">Connecting...</Text>
              </Animated.View>
            )}

            {callState === 'connected' && (
              <View className="items-center">
                <Text className="text-white text-xl font-semibold">
                  {displayName}
                </Text>
                <Text className="text-green-400 text-base mt-1">
                  {formatDuration(callDuration)}
                </Text>
              </View>
            )}

            {callState === 'ended' && (
              <View className="items-center">
                <Text className="text-white text-xl font-semibold">
                  Call Ended
                </Text>
                <Text className="text-gray-400 mt-1">
                  {formatDuration(callDuration)}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Self view (picture-in-picture style) */}
          {callState === 'connected' && !isVideoOff && (
            <Animated.View
              entering={FadeInUp.delay(500)}
              className="absolute top-32 right-4 w-28 h-40 bg-zinc-900 rounded-2xl overflow-hidden border-2 border-purple-500/30"
            >
              <LinearGradient
                colors={['#9333ea', '#db2777']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-white/60 text-xs">Your camera</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Controls */}
          <Animated.View
            entering={FadeInUp.delay(300)}
            className="absolute bottom-0 left-0 right-0 pb-12"
          >
            {/* Security reminder */}
            <View className="mx-6 mb-6 bg-zinc-900/80 rounded-xl p-3 flex-row items-center border border-purple-900/30">
              <ShieldCheck size={18} color="#a855f7" />
              <Text className="text-purple-300 text-sm ml-2 flex-1">
                Screen recording is blocked during this call
              </Text>
            </View>

            {/* Control buttons */}
            <View className="flex-row justify-center items-center space-x-4 px-6">
              {/* Mute */}
              <Pressable
                onPress={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isMuted ? 'bg-red-500' : 'bg-zinc-800'
                }`}
              >
                {isMuted ? (
                  <MicOff size={24} color="white" />
                ) : (
                  <Mic size={24} color="white" />
                )}
              </Pressable>

              {/* Video toggle */}
              <Pressable
                onPress={() => setIsVideoOff(!isVideoOff)}
                className={`w-14 h-14 rounded-full items-center justify-center ml-4 ${
                  isVideoOff ? 'bg-red-500' : 'bg-zinc-800'
                }`}
              >
                {isVideoOff ? (
                  <VideoOff size={24} color="white" />
                ) : (
                  <Video size={24} color="white" />
                )}
              </Pressable>

              {/* Flip camera */}
              <Pressable
                onPress={() => setIsFrontCamera(!isFrontCamera)}
                className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center ml-4"
              >
                <FlipHorizontal size={24} color="white" />
              </Pressable>

              {/* End call */}
              <Pressable
                onPress={handleEndCall}
                className="w-16 h-16 rounded-full items-center justify-center ml-4 overflow-hidden"
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PhoneOff size={28} color="white" />
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
