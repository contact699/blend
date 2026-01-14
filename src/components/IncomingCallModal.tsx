import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface IncomingCallModalProps {
  visible: boolean;
  callerName: string;
  callerPhoto?: string | null;
  callId: string;
  offerSdp: string;
  callerId: string;
  threadId?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  visible,
  callerName,
  callerPhoto,
  callId,
  offerSdp,
  callerId,
  threadId,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const router = useRouter();

  // Pulse animation for call indicator
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 800 }),
        -1,
        true
      );
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleAccept = () => {
    onAccept();

    // Navigate to video call screen
    router.push({
      pathname: '/video-call',
      params: {
        threadId: threadId || '',
        participantId: callerId,
        participantName: callerName,
        callId,
        isAnswering: 'true',
        offerSdp,
      },
    });
  };

  const handleDecline = () => {
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <View className="flex-1 bg-black/90 items-center justify-center px-6">
        <Animated.View
          entering={FadeIn.duration(300)}
          className="w-full max-w-sm"
        >
          {/* Caller Info */}
          <View className="items-center mb-8">
            {/* Caller Photo */}
            <Animated.View style={pulseStyle} className="mb-6">
              {callerPhoto ? (
                <View className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500">
                  <Image
                    source={{ uri: callerPhoto }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  style={{
                    width: 128,
                    height: 128,
                    borderRadius: 64,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white text-5xl font-bold">
                    {callerName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>

            {/* Caller Name */}
            <Text className="text-white text-2xl font-bold mb-2">
              {callerName}
            </Text>

            {/* Call Type */}
            <View className="flex-row items-center bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
              <Video size={16} color="#a855f7" />
              <Text className="text-purple-300 text-sm ml-2 font-medium">
                Incoming video call
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="flex-row justify-center items-center space-x-6"
          >
            {/* Decline Button */}
            <Pressable
              onPress={handleDecline}
              className="items-center"
            >
              <View className="w-20 h-20 rounded-full items-center justify-center overflow-hidden mb-2">
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PhoneOff size={32} color="white" />
                </LinearGradient>
              </View>
              <Text className="text-red-400 text-sm font-medium">Decline</Text>
            </Pressable>

            {/* Accept Button */}
            <Pressable
              onPress={handleAccept}
              className="items-center"
            >
              <Animated.View style={pulseStyle}>
                <View className="w-20 h-20 rounded-full items-center justify-center overflow-hidden mb-2">
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone size={32} color="white" />
                  </LinearGradient>
                </View>
              </Animated.View>
              <Text className="text-green-400 text-sm font-medium">Accept</Text>
            </Pressable>
          </Animated.View>

          {/* Security Notice */}
          <View className="mt-8 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
            <Text className="text-gray-400 text-xs text-center leading-5">
              Video calls are encrypted and private. Screen recording is blocked
              for your security.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
