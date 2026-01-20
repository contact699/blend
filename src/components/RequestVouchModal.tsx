import { Modal, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, UserCheck, Heart } from 'lucide-react-native';
import { useState } from 'react';
import { haptics } from '@/lib/haptics';

interface RequestVouchModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (relationship: string, message: string) => Promise<void>;
  recipientName: string;
}

type VouchRelationship = 'met_irl' | 'partner' | 'friend' | 'event_cohost' | 'community_member';

const RELATIONSHIP_OPTIONS: Array<{ value: VouchRelationship; label: string; description: string }> = [
  {
    value: 'met_irl',
    label: 'Met in Real Life',
    description: 'We\'ve met face-to-face',
  },
  {
    value: 'partner',
    label: 'Partner',
    description: 'Current or past relationship partner',
  },
  {
    value: 'friend',
    label: 'Friend',
    description: 'Personal friend from outside the app',
  },
  {
    value: 'event_cohost',
    label: 'Event Co-Host',
    description: 'We\'ve organized events together',
  },
  {
    value: 'community_member',
    label: 'Community Member',
    description: 'Active in the same ENM community',
  },
];

export default function RequestVouchModal({
  visible,
  onClose,
  onSend,
  recipientName,
}: RequestVouchModalProps) {
  const [selectedRelationship, setSelectedRelationship] = useState<VouchRelationship | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSend = async () => {
    if (!selectedRelationship || isSending) return;

    haptics.press();
    setIsSending(true);

    try {
      await onSend(selectedRelationship, message.trim());

      // Reset state
      setSelectedRelationship(null);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send vouch request:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    haptics.tap();
    setSelectedRelationship(null);
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/80 justify-center px-6"
      >
        <View className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 max-h-[80%]">
          {/* Close Button */}
          <Pressable
            onPress={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-zinc-800 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color="#9ca3af" />
          </Pressable>

          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 24, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
              <UserCheck size={32} color="white" />
            </View>
            <Text className="text-white text-xl font-bold text-center">
              Request Vouch from {recipientName}
            </Text>
            <Text className="text-white/80 text-center text-sm mt-2">
              Vouches help build trust in the community
            </Text>
          </LinearGradient>

          {/* Content */}
          <View className="p-6">
            {/* Relationship Selection */}
            <Text className="text-white font-semibold mb-3">How do you know them?</Text>

            <View className="space-y-2 mb-6">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    haptics.tap();
                    setSelectedRelationship(option.value);
                  }}
                  className={`rounded-xl p-4 border ${
                    selectedRelationship === option.value
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800/60 border-zinc-700/50'
                  }`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedRelationship === option.value }}
                  accessibilityLabel={option.label}
                >
                  <Text className={`font-medium ${
                    selectedRelationship === option.value ? 'text-white' : 'text-gray-300'
                  }`}>
                    {option.label}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">{option.description}</Text>
                </Pressable>
              ))}
            </View>

            {/* Optional Message */}
            <Text className="text-white font-semibold mb-2">
              Add a message (optional)
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell them why you're requesting a vouch..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={200}
              className="bg-zinc-800 text-white rounded-xl p-4 min-h-[100px]"
              style={{ textAlignVertical: 'top' }}
              accessibilityLabel="Vouch request message"
            />
            <Text className="text-gray-500 text-xs mt-1">
              {message.length}/200 characters
            </Text>

            {/* Info Box */}
            <View className="bg-blue-500/10 rounded-xl p-4 mt-6 border border-blue-500/30">
              <View className="flex-row items-start">
                <Heart size={16} color="#3b82f6" className="mt-1" />
                <Text className="text-blue-300 text-sm ml-2 flex-1">
                  They'll receive a notification and can approve or decline your request. Vouches are visible on your profile once approved.
                </Text>
              </View>
            </View>

            {/* CTAs */}
            <View className="mt-6">
              <Pressable
                onPress={handleSend}
                disabled={!selectedRelationship || isSending}
                className="rounded-xl overflow-hidden"
                accessibilityRole="button"
                accessibilityLabel="Send vouch request"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    opacity: !selectedRelationship || isSending ? 0.5 : 1,
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center">
                      <UserCheck size={20} color="white" />
                      <Text className="text-white text-lg font-bold ml-2">
                        Send Request
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
