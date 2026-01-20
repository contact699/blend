import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, TrendingUp, Eye, Heart, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { haptics } from '@/lib/haptics';
import useSubscriptionStore from '@/lib/state/subscription-store';

interface BoostModalProps {
  visible: boolean;
  onClose: () => void;
  onActivate: () => void;
}

export default function BoostModal({ visible, onClose, onActivate }: BoostModalProps) {
  const [isActivating, setIsActivating] = useState<boolean>(false);

  const tier = useSubscriptionStore((s) => s.getTier());
  const features = useSubscriptionStore((s) => s.getFeatures());
  const remainingBoosts = features.profile_boost_per_month; // TODO: Track actual usage

  const handleActivate = async () => {
    if (isActivating) return;

    haptics.press();
    setIsActivating(true);

    await onActivate();

    setIsActivating(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center px-6">
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
            colors={['#ec4899', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
              <TrendingUp size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">Boost Your Profile</Text>
            <Text className="text-white/80 text-center mt-2">
              Be the top profile in your area for 30 minutes
            </Text>
          </LinearGradient>

          {/* Content */}
          <View className="p-6">
            {/* Remaining Boosts */}
            {tier !== 'free' && (
              <View className="bg-pink-500/10 rounded-xl p-4 mb-4 border border-pink-500/30">
                <Text className="text-pink-300 text-center font-semibold">
                  {remainingBoosts} Boosts remaining this month
                </Text>
              </View>
            )}

            {/* Benefits */}
            <Text className="text-white font-semibold mb-3">
              {tier === 'free' ? 'Premium Members Get:' : "What's included:"}
            </Text>

            <View className="space-y-3 mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                  <Clock size={20} color="#ec4899" />
                </View>
                <Text className="text-gray-300 flex-1">30 minutes of premium visibility</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                  <Eye size={20} color="#ec4899" />
                </View>
                <Text className="text-gray-300 flex-1">
                  {tier === 'free' ? '10x more profile views' : 'Up to 10x more profile views'}
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                  <Heart size={20} color="#ec4899" />
                </View>
                <Text className="text-gray-300 flex-1">
                  {tier === 'free' ? 'Priority in discovery' : 'Appear at the top of the stack'}
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                  <TrendingUp size={20} color="#ec4899" />
                </View>
                <Text className="text-gray-300 flex-1">
                  {tier === 'free' ? 'See your boost stats' : 'Real-time boost analytics'}
                </Text>
              </View>
            </View>

            {/* Free user upsell */}
            {tier === 'free' && (
              <View className="bg-purple-500/10 rounded-xl p-4 mb-4 border border-purple-500/30">
                <Text className="text-purple-300 text-sm text-center">
                  Upgrade to Premium to get 2 Boosts/month
                </Text>
                <Text className="text-purple-300 text-sm text-center mt-1">
                  Premium Plus gets 5 Boosts/month
                </Text>
              </View>
            )}

            {/* CTA */}
            <Pressable
              onPress={tier === 'free' ? onClose : handleActivate}
              disabled={isActivating}
              className="rounded-xl overflow-hidden"
              accessibilityRole="button"
              accessibilityLabel={tier === 'free' ? 'Upgrade to use Boost' : 'Activate Boost'}
            >
              <LinearGradient
                colors={tier === 'free' ? ['#9333ea', '#db2777'] : ['#ec4899', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: isActivating ? 0.6 : 1,
                }}
              >
                {isActivating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <TrendingUp size={20} color="white" />
                    <Text className="text-white text-lg font-bold ml-2">
                      {tier === 'free' ? 'Upgrade to Premium' : 'Activate Boost Now'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {tier === 'free' && (
              <Pressable
                onPress={onClose}
                className="bg-zinc-800 py-4 rounded-xl items-center mt-3"
                accessibilityRole="button"
                accessibilityLabel="Maybe later"
              >
                <Text className="text-gray-300 font-medium">Maybe Later</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
