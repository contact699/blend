import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TrendingUp, Eye, Heart, Clock, Zap, Star } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';

export default function BoostResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // In production, fetch actual boost results from Supabase
  const impressions = parseInt(params.impressions as string) || 247;
  const likes = parseInt(params.likes as string) || 18;
  const matches = parseInt(params.matches as string) || 3;

  const handleBoostAgain = () => {
    haptics.press();
    router.back();
    // TODO: Show boost modal again
  };

  const handleClose = () => {
    haptics.tap();
    router.back();
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-5 pt-6 pb-8 items-center">
              <View className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full items-center justify-center mb-4">
                <TrendingUp size={48} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold text-center mb-2">
                Your Boost is Complete!
              </Text>
              <Text className="text-gray-400 text-center text-base">
                Here's how your profile performed
              </Text>
            </View>

            {/* Stats Grid */}
            <View className="px-5 mb-6">
              <View className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800">
                {/* Impressions */}
                <View className="p-6 border-b border-zinc-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center mr-3">
                        <Eye size={24} color="#3b82f6" />
                      </View>
                      <Text className="text-white font-semibold text-lg">Profile Views</Text>
                    </View>
                    <Text className="text-blue-400 text-3xl font-bold">{impressions}</Text>
                  </View>
                  <Text className="text-gray-400 text-sm ml-15">
                    {impressions > 200 ? 'Amazing!' : 'Great!'} Your profile was shown to{' '}
                    {impressions} people
                  </Text>
                </View>

                {/* Likes */}
                <View className="p-6 border-b border-zinc-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center mr-3">
                        <Heart size={24} color="#c084fc" />
                      </View>
                      <Text className="text-white font-semibold text-lg">New Likes</Text>
                    </View>
                    <Text className="text-purple-400 text-3xl font-bold">{likes}</Text>
                  </View>
                  <Text className="text-gray-400 text-sm ml-15">
                    {Math.round((likes / impressions) * 100)}% of viewers liked your profile
                  </Text>
                </View>

                {/* Matches */}
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-pink-500/20 rounded-full items-center justify-center mr-3">
                        <Zap size={24} color="#ec4899" />
                      </View>
                      <Text className="text-white font-semibold text-lg">New Matches</Text>
                    </View>
                    <Text className="text-pink-400 text-3xl font-bold">{matches}</Text>
                  </View>
                  <Text className="text-gray-400 text-sm ml-15">
                    {matches > 0
                      ? `${matches} mutual ${matches === 1 ? 'match' : 'matches'} from this boost`
                      : 'Keep swiping to find your matches!'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Performance Rating */}
            <View className="px-5 mb-6">
              <View className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-500/30">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-yellow-500/20 rounded-full items-center justify-center mr-3">
                    <Star size={20} color="#fbbf24" fill="#fbbf24" />
                  </View>
                  <Text className="text-white font-bold text-lg">Boost Performance</Text>
                </View>

                <View className="flex-row items-center">
                  {[1, 2, 3, 4, 5].map((star, index) => {
                    const filled = index < Math.min(5, Math.ceil((likes / impressions) * 100 / 4));
                    return (
                      <Star
                        key={star}
                        size={24}
                        color="#fbbf24"
                        fill={filled ? '#fbbf24' : 'transparent'}
                      />
                    );
                  })}
                  <Text className="text-gray-300 ml-3">
                    {likes / impressions > 0.1
                      ? 'Excellent conversion rate!'
                      : 'Good performance!'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View className="px-5 mb-8">
              <Text className="text-white font-semibold mb-3">Tips for Better Results</Text>

              <View className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 space-y-3">
                <View className="flex-row items-start">
                  <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">1</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Update your photos regularly to keep your profile fresh
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">2</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Boost during peak hours (7-9 PM) for maximum visibility
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">3</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Complete your bio and answer prompts to improve match quality
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* CTA Buttons */}
          <View className="px-5 pb-6 pt-4 border-t border-zinc-800">
            <Pressable
              onPress={handleBoostAgain}
              className="rounded-xl overflow-hidden mb-3"
              accessibilityRole="button"
              accessibilityLabel="Boost again"
            >
              <LinearGradient
                colors={['#ec4899', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <TrendingUp size={20} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">Boost Again</Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleClose}
              className="bg-zinc-800 py-4 rounded-xl items-center"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text className="text-gray-300 font-medium">Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
