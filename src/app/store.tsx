import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { X, Zap, TrendingUp, Heart, Gift, Sparkles } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import useSubscriptionStore from '@/lib/state/subscription-store';
import { revenueService } from '@/lib/services/revenue-service';

interface StoreItem {
  id: string;
  type: 'super_likes' | 'boosts' | 'gifts';
  name: string;
  description: string;
  quantity: number;
  price: number;
  savings?: string;
  icon: React.ReactNode;
  color: string;
  gradient: string[];
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'super_likes_5',
    type: 'super_likes',
    name: '5 Super Likes',
    description: 'Stand out and get more matches',
    quantity: 5,
    price: 7.99,
    icon: <Zap size={32} color="white" fill="white" />,
    color: '#f59e0b',
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 'super_likes_10',
    type: 'super_likes',
    name: '10 Super Likes',
    description: 'Best value - 20% savings',
    quantity: 10,
    price: 12.99,
    savings: 'Save 20%',
    icon: <Zap size={32} color="white" fill="white" />,
    color: '#f59e0b',
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 'super_likes_30',
    type: 'super_likes',
    name: '30 Super Likes',
    description: 'Maximum value - 35% savings',
    quantity: 30,
    price: 29.99,
    savings: 'Save 35%',
    icon: <Zap size={32} color="white" fill="white" />,
    color: '#f59e0b',
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 'boost_single',
    type: 'boosts',
    name: 'Profile Boost',
    description: '30 min of premium visibility',
    quantity: 1,
    price: 4.99,
    icon: <TrendingUp size={32} color="white" />,
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
  },
  {
    id: 'boost_3',
    type: 'boosts',
    name: '3 Profile Boosts',
    description: 'Save 20% vs single boost',
    quantity: 3,
    price: 11.99,
    savings: 'Save 20%',
    icon: <TrendingUp size={32} color="white" />,
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
  },
  {
    id: 'boost_5',
    type: 'boosts',
    name: '5 Profile Boosts',
    description: 'Best value - 30% savings',
    quantity: 5,
    price: 17.49,
    savings: 'Save 30%',
    icon: <TrendingUp size={32} color="white" />,
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
  },
];

export default function StoreScreen() {
  const router = useRouter();
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);

  const tier = useSubscriptionStore((s) => s.getTier());

  const handlePurchase = async (item: StoreItem) => {
    haptics.press();
    setPurchasingItem(item.id);

    try {
      // Use RevenueCat to purchase one-time item
      const result = await revenueService.purchaseItem(item.id);

      if (result.success) {
        haptics.success();
        Alert.alert(
          'Purchase Successful!',
          `You've purchased ${item.quantity} ${item.type === 'super_likes' ? 'Super Likes' : 'Boosts'}`,
          [{ text: 'Great!', onPress: () => {} }]
        );
      } else {
        if (result.error !== 'Purchase cancelled') {
          haptics.warning();
          Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
        }
      }
    } catch (error: any) {
      haptics.warning();
      Alert.alert('Error', error.message ?? 'Failed to process purchase');
    } finally {
      setPurchasingItem(null);
    }
  };

  const renderItem = (item: StoreItem) => {
    const isPurchasing = purchasingItem === item.id;

    return (
      <Pressable
        key={item.id}
        onPress={() => handlePurchase(item)}
        disabled={isPurchasing}
        className="mb-4"
        accessibilityRole="button"
        accessibilityLabel={`Purchase ${item.name} for $${item.price}`}
      >
        <View className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <View className="flex-row items-center p-4">
            {/* Icon */}
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: `${item.color}20` }}
            >
              {item.icon}
            </View>

            {/* Info */}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold">{item.name}</Text>
                {item.savings && (
                  <View className="bg-green-500/20 px-2 py-1 rounded-full ml-2">
                    <Text className="text-green-400 text-xs font-bold">{item.savings}</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-sm mt-1">{item.description}</Text>
            </View>

            {/* Price Button */}
            <Pressable
              onPress={() => handlePurchase(item)}
              disabled={isPurchasing}
              className="ml-2 rounded-xl overflow-hidden"
              accessibilityRole="button"
              accessibilityLabel={`Buy for $${item.price}`}
            >
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  opacity: isPurchasing ? 0.6 : 1,
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-bold">${item.price}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-zinc-800">
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Store</Text>
              <Text className="text-gray-400 text-sm mt-0.5">
                Boost your profile and stand out
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <X size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Premium Upsell Banner */}
            {tier === 'free' && (
              <View className="mx-5 mt-4 mb-2">
                <Pressable
                  onPress={() => router.push('/premium')}
                  className="rounded-2xl overflow-hidden"
                  accessibilityRole="button"
                  accessibilityLabel="Upgrade to premium"
                >
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding: 16 }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                        <Sparkles size={24} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base">
                          Get More with Premium
                        </Text>
                        <Text className="text-white/80 text-sm">
                          Includes 5 Super Likes & 2 Boosts per month
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* Super Likes Section */}
            <View className="px-5 mt-6">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center mr-3">
                  <Zap size={20} color="#f59e0b" fill="#f59e0b" />
                </View>
                <Text className="text-white text-lg font-bold">Super Likes</Text>
              </View>

              {STORE_ITEMS.filter((item) => item.type === 'super_likes').map(renderItem)}
            </View>

            {/* Boosts Section */}
            <View className="px-5 mt-6 mb-8">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                  <TrendingUp size={20} color="#ec4899" />
                </View>
                <Text className="text-white text-lg font-bold">Profile Boosts</Text>
              </View>

              {STORE_ITEMS.filter((item) => item.type === 'boosts').map(renderItem)}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-zinc-800">
            <Text className="text-gray-500 text-xs text-center">
              All purchases are processed securely through your app store.
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              No refunds available after use.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
