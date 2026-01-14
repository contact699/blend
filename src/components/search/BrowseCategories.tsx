import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Users,
  Sparkles,
  Heart,
  Shield,
  Clock,
  Calendar,
  Star,
  Zap,
  Globe,
  ChevronRight,
} from 'lucide-react-native';
import { BrowseCategory, BROWSE_CATEGORIES } from '@/lib/types';

interface BrowseCategoriesProps {
  onCategoryPress: (category: BrowseCategory) => void;
  featuredProfiles?: { id: string; photo: string; name: string }[];
}

export default function BrowseCategories({
  onCategoryPress,
  featuredProfiles = [],
}: BrowseCategoriesProps) {
  return (
    <View>
      {/* Featured Section */}
      {featuredProfiles.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)} className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <View className="flex-row items-center gap-2">
              <Star size={18} color="#f59e0b" />
              <Text className="text-white font-semibold text-lg">Featured</Text>
            </View>
            <Pressable className="flex-row items-center">
              <Text className="text-purple-400 text-sm mr-1">See all</Text>
              <ChevronRight size={16} color="#a855f7" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {featuredProfiles.map((profile, index) => (
              <FeaturedProfileCard
                key={profile.id}
                photo={profile.photo}
                name={profile.name}
                index={index}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Browse Categories */}
      <Animated.View entering={FadeIn.delay(150).duration(300)}>
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Text className="text-white font-semibold text-lg">Browse</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {BROWSE_CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              onPress={() => onCategoryPress(category)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Quick Access Tiles */}
      <Animated.View entering={FadeIn.delay(300).duration(300)} className="mt-6 px-4">
        <View className="flex-row gap-3">
          <QuickAccessTile
            icon={<MapPin size={24} color="#22c55e" />}
            label="Nearby"
            sublabel="< 5 miles"
            gradient={['#22c55e20', '#16a34a10']}
            onPress={() => onCategoryPress(BROWSE_CATEGORIES.find(c => c.id === 'nearby')!)}
          />
          <QuickAccessTile
            icon={<Zap size={24} color="#f59e0b" />}
            label="Online Now"
            sublabel="12 active"
            gradient={['#f59e0b20', '#d9740010']}
            onPress={() => onCategoryPress(BROWSE_CATEGORIES.find(c => c.id === 'online_now')!)}
          />
        </View>

        <View className="flex-row gap-3 mt-3">
          <QuickAccessTile
            icon={<Shield size={24} color="#a855f7" />}
            label="Verified"
            sublabel="Trust score 75+"
            gradient={['#a855f720', '#7c3aed10']}
            onPress={() => onCategoryPress(BROWSE_CATEGORIES.find(c => c.id === 'highly_rated')!)}
          />
          <QuickAccessTile
            icon={<Globe size={24} color="#3b82f6" />}
            label="Virtual"
            sublabel="Remote friendly"
            gradient={['#3b82f620', '#2563eb10']}
            onPress={() => onCategoryPress(BROWSE_CATEGORIES.find(c => c.id === 'virtual_friendly')!)}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// Featured Profile Card
function FeaturedProfileCard({
  photo,
  name,
  index,
}: {
  photo: string;
  name: string;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <Pressable className="relative">
        <Image
          source={{ uri: photo }}
          className="w-28 h-36 rounded-2xl"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
        <View className="absolute bottom-2 left-2 right-2">
          <Text className="text-white font-medium text-sm" numberOfLines={1}>
            {name}
          </Text>
        </View>

        {/* Featured badge */}
        <View className="absolute top-2 right-2">
          <View className="bg-amber-500/90 px-2 py-0.5 rounded-full">
            <Star size={10} color="white" fill="white" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Color mapping for categories
const CATEGORY_COLORS: Record<string, string> = {
  nearby: '#22c55e',
  online_now: '#f59e0b',
  new_members: '#3b82f6',
  highly_rated: '#a855f7',
  event_hosts: '#ec4899',
  virtual_friendly: '#06b6d4',
  mutual_connections: '#f97316',
  recently_active: '#14b8a6',
};

function getCategoryColor(categoryId: string): string {
  return CATEGORY_COLORS[categoryId] || '#a855f7';
}

// Category Card
function CategoryCard({
  category,
  index,
  onPress,
}: {
  category: BrowseCategory;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const color = getCategoryColor(category.id);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const IconComponent = getCategoryIcon(category.icon);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 75).springify()}
      style={animatedStyle}
    >
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={[color + '40', color + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 140,
            height: 100,
            borderRadius: 20,
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: color + '40' }}
          >
            <IconComponent size={20} color={color} />
          </View>

          <View>
            <Text className="text-white font-semibold" numberOfLines={1}>
              {category.label}
            </Text>
            {category.count !== undefined && (
              <Text className="text-zinc-400 text-xs">
                {category.count} people
              </Text>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Quick Access Tile
function QuickAccessTile({
  icon,
  label,
  sublabel,
  gradient,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-semibold">{label}</Text>
              <Text className="text-zinc-400 text-xs mt-0.5">{sublabel}</Text>
            </View>
            {icon}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Helper to get icon component from string
function getCategoryIcon(iconName: string) {
  const icons: Record<string, typeof Users> = {
    map_pin: MapPin,
    users: Users,
    sparkles: Sparkles,
    heart: Heart,
    shield: Shield,
    clock: Clock,
    calendar: Calendar,
    star: Star,
    zap: Zap,
    globe: Globe,
  };

  return icons[iconName] || Users;
}
