import { View, Text, Pressable, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { X, Heart, Sparkles, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import useSubscriptionStore from '@/lib/state/subscription-store';
import { haptics } from '@/lib/haptics';
import type { Profile } from '@/lib/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

export default function WhoLikedMeScreen() {
  const router = useRouter();
  const [likes, setLikes] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const tier = useSubscriptionStore((s) => s.getTier());
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const canSeeWhoLiked = useSubscriptionStore((s) => s.getFeatures().see_who_liked_you);

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase query
      // const { data } = await supabase
      //   .from('likes')
      //   .select('from_user:users!likes_from_user_id_fkey(id, profile:profiles(*))')
      //   .eq('to_user_id', currentUserId)
      //   .order('created_at', { ascending: false });

      // Mock data for now
      const mockLikes: Profile[] = [
        {
          id: '1',
          user_id: '1',
          display_name: 'Sarah',
          age: 28,
          bio: 'Polyamorous, exploring connections',
          photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: '2',
          display_name: 'Alex',
          age: 32,
          bio: 'ENM advocate, love hiking',
          photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: '3',
          display_name: 'Jamie',
          age: 26,
          bio: 'Open relationship, seeking friends',
          photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          user_id: '4',
          display_name: 'Morgan',
          age: 30,
          bio: 'Kitchen table poly',
          photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '5',
          user_id: '5',
          display_name: 'Taylor',
          age: 29,
          bio: 'Swinger couple seeking fun',
          photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '6',
          user_id: '6',
          display_name: 'Riley',
          age: 27,
          bio: 'Relationship anarchist',
          photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setLikes(mockLikes);
    } catch (error) {
      console.error('Failed to load likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeBack = (profile: Profile) => {
    haptics.like();
    // TODO: Implement like-back logic
    // This should create a match since both users liked each other
    console.log('Liked back:', profile.name);
  };

  const handleUpgrade = () => {
    haptics.press();
    router.push('/premium');
  };

  const renderLikeItem = ({ item, index }: { item: Profile; index: number }) => {
    const shouldBlur = !canSeeWhoLiked && index >= 2;

    return (
      <Pressable
        onPress={() => {
          if (shouldBlur) {
            handleUpgrade();
          } else {
            haptics.tap();
            // TODO: Navigate to profile
            console.log('View profile:', item.name);
          }
        }}
        className="mb-4"
        style={{ width: ITEM_SIZE }}
        accessibilityRole="button"
        accessibilityLabel={shouldBlur ? 'Locked profile - upgrade to view' : `View ${item.name}'s profile`}
      >
        <View className="relative rounded-2xl overflow-hidden" style={{ height: ITEM_SIZE * 1.4 }}>
          <Image
            source={{ uri: item.photos[0] }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Blur overlay for free users */}
          {shouldBlur && (
            <BlurView intensity={80} tint="dark" style={{ position: 'absolute', inset: 0 }}>
              <View className="flex-1 items-center justify-center">
                <View className="w-16 h-16 bg-purple-500 rounded-full items-center justify-center mb-2">
                  <Lock size={28} color="white" />
                </View>
                <Text className="text-white font-semibold">Upgrade to see</Text>
              </View>
            </BlurView>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' }}
          />

          {/* Profile info */}
          {!shouldBlur && (
            <View className="absolute bottom-0 left-0 right-0 p-3">
              <Text className="text-white font-bold text-base">
                {item.name}, {item.age}
              </Text>
              <Text className="text-white/80 text-xs mt-0.5" numberOfLines={2}>
                {item.bio}
              </Text>

              {/* Like back button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleLikeBack(item);
                }}
                className="absolute bottom-3 right-3 w-10 h-10 bg-purple-500 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Like back"
              >
                <Heart size={20} color="white" fill="white" />
              </Pressable>
            </View>
          )}

          {/* New badge */}
          <View className="absolute top-3 left-3 bg-purple-500 rounded-full px-2 py-1 flex-row items-center">
            <Sparkles size={12} color="white" />
            <Text className="text-white text-xs font-bold ml-1">NEW</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-3 flex-row items-center justify-between border-b border-zinc-800">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Who Liked You</Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {likes.length} {likes.length === 1 ? 'person' : 'people'} liked your profile
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

        {/* Premium upsell banner for free users */}
        {!canSeeWhoLiked && likes.length > 2 && (
          <View className="mx-5 mt-4">
            <Pressable
              onPress={handleUpgrade}
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
                      See All {likes.length} Likes
                    </Text>
                    <Text className="text-white/80 text-sm">
                      Upgrade to Premium to see everyone who liked you
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Likes grid */}
        <FlatList
          data={likes}
          renderItem={renderLikeItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 bg-zinc-900 rounded-full items-center justify-center mb-4">
                <Heart size={32} color="#6b7280" />
              </View>
              <Text className="text-gray-400 text-base text-center">
                No one has liked you yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Keep swiping to find your match!
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
