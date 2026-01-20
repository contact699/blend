import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Sparkles,
  Heart,
  Eye,
  Shield,
  Zap,
  Star,
  Check,
  X,
  Crown,
  TrendingUp,
  MessageCircle,
  Video,
  Calendar,
  Gift,
} from 'lucide-react-native';
import useSubscriptionStore from '@/lib/state/subscription-store';
import { haptics } from '@/lib/haptics';
import { SUBSCRIPTION_FEATURES } from '@/lib/types/monetization';

export default function PremiumScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'premium_plus'>('premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tier = useSubscriptionStore((s) => s.getTier());
  const isPremium = useSubscriptionStore((s) => s.isPremium());

  const handleSelectPlan = (plan: 'premium' | 'premium_plus') => {
    haptics.tap();
    setSelectedPlan(plan);
  };

  const handleSelectBilling = (cycle: 'monthly' | 'yearly') => {
    haptics.tap();
    setBillingCycle(cycle);
  };

  const handleUpgrade = () => {
    haptics.press();
    // TODO: Integrate with RevenueCat/Stripe
    alert('Payment integration coming soon!');
  };

  const getPricing = (plan: 'premium' | 'premium_plus', cycle: 'monthly' | 'yearly') => {
    const prices = {
      premium: { monthly: 24.99, yearly: 249.99 },
      premium_plus: { monthly: 39.99, yearly: 399.99 },
    };

    return prices[plan][cycle];
  };

  const getYearlySavings = (plan: 'premium' | 'premium_plus') => {
    const monthly = getPricing(plan, 'monthly') * 12;
    const yearly = getPricing(plan, 'yearly');
    const savings = monthly - yearly;
    const percentage = Math.round((savings / monthly) * 100);
    return { savings, percentage };
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <X size={24} color="#fff" />
            </Pressable>
            <Text className="text-white text-lg font-bold">Upgrade to Premium</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View className="px-5 pt-4 pb-6 items-center">
              <View className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full items-center justify-center mb-4">
                <Crown size={40} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold text-center mb-2">
                Find Your Perfect Match Faster
              </Text>
              <Text className="text-gray-400 text-center text-base">
                Get unlimited likes, advanced matching, and exclusive features
              </Text>
            </View>

            {/* Plan Selection */}
            <View className="px-5 mb-6">
              <Text className="text-white text-sm font-medium mb-3 uppercase tracking-wide">
                Choose Your Plan
              </Text>

              {/* Premium */}
              <Pressable
                onPress={() => handleSelectPlan('premium')}
                className={`rounded-2xl border-2 p-4 mb-3 ${
                  selectedPlan === 'premium'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
                accessibilityRole="radio"
                accessibilityLabel="Premium plan"
                accessibilityState={{ checked: selectedPlan === 'premium' }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Sparkles size={20} color="#c084fc" />
                      <Text className="text-white text-xl font-bold ml-2">Premium</Text>
                    </View>
                    <Text className="text-gray-400 text-sm mt-1">Most Popular</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white text-2xl font-bold">
                      ${getPricing('premium', billingCycle)}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </Text>
                  </View>
                </View>
                {selectedPlan === 'premium' && (
                  <View className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                    <Check size={16} color="white" />
                  </View>
                )}
              </Pressable>

              {/* Premium Plus */}
              <Pressable
                onPress={() => handleSelectPlan('premium_plus')}
                className={`rounded-2xl border-2 p-4 ${
                  selectedPlan === 'premium_plus'
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
                accessibilityRole="radio"
                accessibilityLabel="Premium Plus plan"
                accessibilityState={{ checked: selectedPlan === 'premium_plus' }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Crown size={20} color="#ec4899" />
                      <Text className="text-white text-xl font-bold ml-2">Premium Plus</Text>
                      <View className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-black text-[10px] font-bold">BEST VALUE</Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm mt-1">Ultimate Experience</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white text-2xl font-bold">
                      ${getPricing('premium_plus', billingCycle)}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </Text>
                  </View>
                </View>
                {selectedPlan === 'premium_plus' && (
                  <View className="absolute top-4 right-4 w-6 h-6 bg-pink-500 rounded-full items-center justify-center">
                    <Check size={16} color="white" />
                  </View>
                )}
              </Pressable>
            </View>

            {/* Billing Cycle Toggle */}
            <View className="px-5 mb-6">
              <View className="flex-row bg-zinc-900 rounded-xl p-1">
                <Pressable
                  onPress={() => handleSelectBilling('monthly')}
                  className={`flex-1 py-3 rounded-lg ${
                    billingCycle === 'monthly' ? 'bg-purple-500' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Monthly billing"
                >
                  <Text
                    className={`text-center font-semibold ${
                      billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    Monthly
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSelectBilling('yearly')}
                  className={`flex-1 py-3 rounded-lg ${
                    billingCycle === 'yearly' ? 'bg-purple-500' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Yearly billing"
                >
                  <View>
                    <Text
                      className={`text-center font-semibold ${
                        billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      Yearly
                    </Text>
                    <Text className="text-green-400 text-[10px] text-center font-bold mt-0.5">
                      SAVE {getYearlySavings(selectedPlan).percentage}%
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Features Comparison */}
            <View className="px-5 mb-6">
              <Text className="text-white text-sm font-medium mb-3 uppercase tracking-wide">
                What You Get
              </Text>

              {/* Feature List */}
              <View className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <FeatureRow
                  icon={<Heart size={20} color="#c084fc" />}
                  title="Unlimited Likes"
                  free={false}
                  premium={true}
                  premiumPlus={true}
                />
                <FeatureRow
                  icon={<Zap size={20} color="#c084fc" />}
                  title="Super Likes"
                  free="0/month"
                  premium="5/month"
                  premiumPlus="20/month"
                />
                <FeatureRow
                  icon={<Eye size={20} color="#c084fc" />}
                  title="See Who Liked You"
                  free={false}
                  premium={true}
                  premiumPlus={true}
                />
                <FeatureRow
                  icon={<TrendingUp size={20} color="#c084fc" />}
                  title="Profile Boosts"
                  free={false}
                  premium="2/month"
                  premiumPlus="5/month"
                />
                <FeatureRow
                  icon={<Shield size={20} color="#c084fc" />}
                  title="Incognito Mode"
                  free={false}
                  premium={false}
                  premiumPlus={true}
                />
                <FeatureRow
                  icon={<MessageCircle size={20} color="#c084fc" />}
                  title="Read Receipts"
                  free={false}
                  premium={false}
                  premiumPlus={true}
                />
                <FeatureRow
                  icon={<Video size={20} color="#c084fc" />}
                  title="Video Profile Slots"
                  free="1"
                  premium="3"
                  premiumPlus="10"
                />
                <FeatureRow
                  icon={<Calendar size={20} color="#c084fc" />}
                  title="Relationship OS"
                  free={false}
                  premium={false}
                  premiumPlus={true}
                  isLast
                />
              </View>
            </View>

            {/* Social Proof */}
            <View className="px-5 mb-6">
              <View className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/30">
                <View className="flex-row items-center mb-2">
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                </View>
                <Text className="text-white text-sm mb-1">
                  "Premium changed everything. I found 3 amazing partners in my first month!"
                </Text>
                <Text className="text-gray-400 text-xs">- Alex, SF</Text>
              </View>
            </View>

            {/* Stats */}
            <View className="px-5 mb-8">
              <View className="flex-row justify-between">
                <View className="flex-1 bg-zinc-900/50 rounded-xl p-4 mr-2 border border-zinc-800">
                  <Text className="text-purple-400 text-2xl font-bold">3.5x</Text>
                  <Text className="text-gray-400 text-xs mt-1">More Matches</Text>
                </View>
                <View className="flex-1 bg-zinc-900/50 rounded-xl p-4 ml-2 border border-zinc-800">
                  <Text className="text-pink-400 text-2xl font-bold">10K+</Text>
                  <Text className="text-gray-400 text-xs mt-1">Premium Members</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* CTA Button */}
          <View className="px-5 pb-6 pt-4 border-t border-zinc-800">
            <Pressable
              onPress={handleUpgrade}
              className="rounded-xl overflow-hidden"
              accessibilityRole="button"
              accessibilityLabel="Upgrade to premium"
            >
              <LinearGradient
                colors={selectedPlan === 'premium_plus' ? ['#ec4899', '#db2777'] : ['#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 18, alignItems: 'center' }}
              >
                <Text className="text-white text-lg font-bold">
                  Upgrade to {selectedPlan === 'premium' ? 'Premium' : 'Premium Plus'}
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  ${getPricing(selectedPlan, billingCycle)}/{billingCycle === 'monthly' ? 'month' : 'year'}
                </Text>
              </LinearGradient>
            </Pressable>
            <Text className="text-gray-500 text-xs text-center mt-3">
              Cancel anytime. No commitments.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// Feature Row Component
function FeatureRow({
  icon,
  title,
  free,
  premium,
  premiumPlus,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  free: boolean | string;
  premium: boolean | string;
  premiumPlus: boolean | string;
  isLast?: boolean;
}) {
  return (
    <View className={`py-3 ${!isLast ? 'border-b border-zinc-800' : ''}`}>
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-white font-medium ml-2 flex-1">{title}</Text>
      </View>
      <View className="flex-row items-center ml-7">
        <View className="flex-1">
          <Text className="text-gray-500 text-xs">Free</Text>
          {typeof free === 'boolean' ? (
            free ? (
              <Check size={16} color="#22c55e" />
            ) : (
              <X size={16} color="#6b7280" />
            )
          ) : (
            <Text className="text-gray-400 text-xs">{free}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-purple-400 text-xs">Premium</Text>
          {typeof premium === 'boolean' ? (
            premium ? (
              <Check size={16} color="#c084fc" />
            ) : (
              <X size={16} color="#6b7280" />
            )
          ) : (
            <Text className="text-purple-300 text-xs">{premium}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-pink-400 text-xs">Plus</Text>
          {typeof premiumPlus === 'boolean' ? (
            premiumPlus ? (
              <Check size={16} color="#ec4899" />
            ) : (
              <X size={16} color="#6b7280" />
            )
          ) : (
            <Text className="text-pink-300 text-xs">{premiumPlus}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
