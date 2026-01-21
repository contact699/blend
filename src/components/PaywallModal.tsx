import { Modal, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Crown, Heart, Sparkles, Zap, X } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import useSubscriptionStore from '@/lib/state/subscription-store';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  reason: 'likes_limit' | 'super_likes' | 'see_who_liked' | 'advanced_filters' | 'incognito' | 'boosts';
}

const PAYWALL_CONTENT = {
  likes_limit: {
    icon: Heart,
    title: "You're Out of Likes",
    description: "Upgrade to Premium for unlimited likes and never miss a connection",
    benefits: [
      'Unlimited daily likes',
      'See who liked you',
      '5 Super Likes/month',
      '2 Profile Boosts/month',
    ],
  },
  super_likes: {
    icon: Zap,
    title: 'Stand Out with Super Likes',
    description: 'Get their attention with priority notifications and special messaging',
    benefits: [
      '5 Super Likes per month',
      'Priority in their inbox',
      'Attach an icebreaker message',
      'Higher response rates',
    ],
  },
  see_who_liked: {
    icon: Sparkles,
    title: 'See Who Liked You',
    description: "Don't miss out on potential matches. See everyone who liked your profile",
    benefits: [
      'See all your likes instantly',
      'Match faster',
      'Unlimited likes',
      'Advanced matching',
    ],
  },
  advanced_filters: {
    icon: Sparkles,
    title: 'Advanced Filters',
    description: 'Find exactly who you are looking for with powerful search filters',
    benefits: [
      'Filter by kinks & interests',
      'Relationship style filters',
      'Save custom searches',
      'Get notified of new matches',
    ],
  },
  incognito: {
    icon: Crown,
    title: 'Browse Privately',
    description: 'Upgrade to Premium Plus for Incognito Mode',
    benefits: [
      'Browse without being seen',
      'Control who sees your profile',
      'Read receipts',
      'Everything in Premium',
    ],
  },
  boosts: {
    icon: Zap,
    title: 'Boost Your Profile',
    description: 'Be the top profile in your area for 30 minutes',
    benefits: [
      '2-5 boosts per month',
      '10x more profile views',
      'Priority in discovery',
      'See your boost stats',
    ],
  },
};

export default function PaywallModal({ visible, onClose, reason }: PaywallModalProps) {
  const router = useRouter();
  const content = PAYWALL_CONTENT[reason];
  const Icon = content.icon;

  const remainingLikes = useSubscriptionStore((s) => s.getRemainingLikes());

  const handleUpgrade = () => {
    haptics.press();
    onClose();
    router.push('/premium');
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
            accessibilityLabel="Close paywall"
          >
            <X size={18} color="#9ca3af" />
          </Pressable>

          {/* Header */}
          <LinearGradient
            colors={['#9333ea', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
              <Icon size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">{content.title}</Text>
            <Text className="text-white/80 text-center mt-2">{content.description}</Text>
          </LinearGradient>

          {/* Benefits */}
          <View className="p-6">
            {reason === 'likes_limit' && remainingLikes !== null && (
              <View className="bg-purple-500/10 rounded-xl p-4 mb-4 border border-purple-500/30">
                <Text className="text-purple-300 text-center font-semibold">
                  {remainingLikes} likes remaining today
                </Text>
                <Text className="text-gray-400 text-center text-xs mt-1">
                  Resets at midnight
                </Text>
              </View>
            )}

            <Text className="text-white font-semibold mb-3">Premium Benefits:</Text>

            {content.benefits.map((benefit, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-3">
                  <Sparkles size={14} color="white" />
                </View>
                <Text className="text-gray-300 flex-1">{benefit}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View className="px-6 pb-6">
            <Pressable
              onPress={handleUpgrade}
              className="rounded-xl overflow-hidden mb-3"
              accessibilityRole="button"
              accessibilityLabel="Upgrade to premium"
            >
              <LinearGradient
                colors={['#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <Text className="text-white text-lg font-bold">Upgrade to Premium</Text>
                <Text className="text-white/80 text-sm mt-1">Starting at $24.99/month</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="bg-zinc-800 py-4 rounded-xl items-center"
              accessibilityRole="button"
              accessibilityLabel="Maybe later"
            >
              <Text className="text-gray-300 font-medium">Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
