import { Modal, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { haptics } from '@/lib/haptics';
import useSubscriptionStore from '@/lib/state/subscription-store';

interface SuperLikeModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string | null) => void;
  recipientName: string;
}

export default function SuperLikeModal({
  visible,
  onClose,
  onSend,
  recipientName,
}: SuperLikeModalProps) {
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const tier = useSubscriptionStore((s) => s.getTier());
  const getRemainingSuperLikes = useSubscriptionStore((s) => s.getRemainingSuperLikes);
  const remainingSuperLikes = getRemainingSuperLikes();

  const handleSend = async () => {
    if (isSending) return;

    haptics.press();
    setIsSending(true);

    // Send Super Like
    await onSend(message.trim() || null);

    setIsSending(false);
    setMessage('');
    onClose();
  };

  const handleSkipMessage = () => {
    haptics.tap();
    onSend(null);
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/80 justify-center px-6"
      >
        <View className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
          {/* Close Button */}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-zinc-800 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color="#9ca3af" />
          </Pressable>

          {/* Header */}
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
              <Zap size={32} color="white" fill="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">Super Like {recipientName}?</Text>
            <Text className="text-white/80 text-center mt-2">
              Stand out with a Super Like and get their attention
            </Text>
          </LinearGradient>

          {/* Content */}
          <View className="p-6">
            {/* Remaining Super Likes */}
            <View className="bg-orange-500/10 rounded-xl p-4 mb-4 border border-orange-500/30">
              <Text className="text-orange-300 text-center font-semibold">
                {remainingSuperLikes} Super Likes remaining this month
              </Text>
            </View>

            {/* Benefits */}
            <Text className="text-white font-semibold mb-3">What happens:</Text>

            <View className="space-y-3 mb-6">
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">1</Text>
                </View>
                <Text className="text-gray-300 flex-1">They get a priority notification</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
                <Text className="text-gray-300 flex-1">Your profile appears at the top of their queue</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">3</Text>
                </View>
                <Text className="text-gray-300 flex-1">
                  {tier === 'free' ? 'Premium members' : 'You'} can attach an icebreaker message
                </Text>
              </View>
            </View>

            {/* Optional Message (Premium feature) */}
            {tier !== 'free' && (
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">
                  Add an icebreaker (optional)
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Say something interesting..."
                  placeholderTextColor="#6b7280"
                  multiline
                  maxLength={200}
                  className="bg-zinc-800 text-white rounded-xl p-4 min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                  accessibilityLabel="Icebreaker message"
                />
                <Text className="text-gray-500 text-xs mt-1">
                  {message.length}/200 characters
                </Text>
              </View>
            )}

            {/* CTAs */}
            <View className="space-y-3">
              <Pressable
                onPress={handleSend}
                disabled={isSending}
                className="rounded-xl overflow-hidden"
                accessibilityRole="button"
                accessibilityLabel="Send Super Like"
              >
                <LinearGradient
                  colors={['#f59e0b', '#f97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: 'center', opacity: isSending ? 0.6 : 1 }}
                >
                  <View className="flex-row items-center">
                    <Zap size={20} color="white" fill="white" />
                    <Text className="text-white text-lg font-bold ml-2">
                      Send Super Like
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {tier !== 'free' && message.trim() && (
                <Pressable
                  onPress={handleSkipMessage}
                  className="bg-zinc-800 py-4 rounded-xl items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Send without message"
                >
                  <Text className="text-gray-300 font-medium">Send Without Message</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
