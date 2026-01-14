import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  Plus,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { EVENT_CATEGORIES } from '@/lib/mock-events';
import { EventCategory } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { useEvents } from '@/lib/supabase/hooks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventsScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch events from Supabase
  const { data: events = [], isLoading, refetch, isRefetching } = useEvents({
    category: selectedCategory || undefined,
  });

  // Filter events locally for search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;

    const query = searchQuery.toLowerCase();
    return events.filter((e) => {
      return (
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        e.tags?.some((t) => t.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query))
      );
    });
  }, [events, searchQuery]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${eventId}`);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-event');
  };

  const handleCategoryPress = (category: EventCategory) => {
    Haptics.selectionAsync();
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <View className="flex-1 bg-black">
      {/* Background gradient */}
      <LinearGradient
        colors={['#18181b', '#09090b', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-3xl font-bold">Events</Text>
              <Text className="text-zinc-400 text-sm mt-0.5">
                Discover community gatherings
              </Text>
            </View>
            <Pressable
              onPress={handleCreateEvent}
              className="w-12 h-12 rounded-full bg-gradient-to-br items-center justify-center"
            >
              <LinearGradient
                colors={['#c084fc', '#a855f7']}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={24} color="white" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-zinc-900/80 rounded-2xl px-4 py-3 border border-zinc-800/50">
              <Search size={20} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search events, locations, tags..."
                placeholderTextColor="#52525b"
                className="flex-1 text-white ml-3"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color="#71717a" />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className={`ml-3 w-12 h-12 rounded-2xl items-center justify-center border ${
                showFilters
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-zinc-900/80 border-zinc-800/50'
              }`}
            >
              <Filter
                size={20}
                color={showFilters ? '#a855f7' : '#71717a'}
              />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#a855f7"
            />
          }
        >
          {/* Category Pills */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            >
              {EVENT_CATEGORIES.map((category, index) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <CategoryPill
                    key={category.id}
                    category={category}
                    isSelected={isSelected}
                    onPress={() => handleCategoryPress(category.id)}
                    index={index}
                  />
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Loading State */}
          {isLoading && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-zinc-400 text-sm mt-4">Loading events...</Text>
            </View>
          )}

          {/* Events List */}
          {!isLoading && (
            <>
              {/* Quick Actions */}
              {!searchQuery && !selectedCategory && (
                <Animated.View
                  entering={FadeInDown.delay(300).duration(400)}
                  className="flex-row px-5 mb-6"
                >
                  <QuickActionButton
                    icon={<MapPin size={18} color="#60a5fa" />}
                    label="Near Me"
                    color="#60a5fa"
                    onPress={() => {}}
                  />
                  <QuickActionButton
                    icon={<Calendar size={18} color="#4ade80" />}
                    label="This Week"
                    color="#4ade80"
                    onPress={() => {}}
                  />
                </Animated.View>
              )}

              {/* Events List */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                className="px-5 pb-32"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-lg font-bold">
                    {selectedCategory
                      ? EVENT_CATEGORIES.find((c) => c.id === selectedCategory)?.label
                      : searchQuery
                      ? 'Search Results'
                      : 'Upcoming Events'}
                  </Text>
                  <Text className="text-zinc-500 text-sm">
                    {filteredEvents.length} events
                  </Text>
                </View>

                {filteredEvents.length === 0 ? (
                  <View className="items-center py-12">
                    <View className="w-16 h-16 rounded-full bg-zinc-800/50 items-center justify-center mb-4">
                      <Calendar size={32} color="#52525b" />
                    </View>
                    <Text className="text-zinc-400 text-base font-medium mb-1">
                      No events found
                    </Text>
                    <Text className="text-zinc-500 text-sm text-center px-8">
                      Try adjusting your filters or check back later
                    </Text>
                  </View>
                ) : (
                  filteredEvents.map((event, index) => (
                    <Animated.View
                      key={event.id}
                      entering={FadeInDown.delay(100 + index * 50).duration(400)}
                      layout={Layout.springify()}
                    >
                      <EventCard
                        event={event}
                        variant="default"
                        onPress={() => handleEventPress(event.id)}
                      />
                    </Animated.View>
                  ))
                )}
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Category Pill Component
function CategoryPill({
  category,
  isSelected,
  onPress,
  index,
}: {
  category: (typeof EVENT_CATEGORIES)[number];
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 30).duration(300)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`mr-2 px-4 py-2 rounded-full border ${
          isSelected
            ? 'border-transparent'
            : 'bg-zinc-900/60 border-zinc-800/50'
        }`}
        style={
          isSelected
            ? { backgroundColor: `${category.color}20`, borderColor: `${category.color}50` }
            : undefined
        }
      >
        <Text
          className={`text-sm font-medium ${
            isSelected ? '' : 'text-zinc-400'
          }`}
          style={isSelected ? { color: category.color } : undefined}
        >
          {category.emoji} {category.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Quick Action Button
function QuickActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="flex-1 mr-3 last:mr-0"
    >
      <View
        className="flex-row items-center justify-center py-3 rounded-2xl border"
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}30`,
        }}
      >
        {icon}
        <Text
          className="text-sm font-medium ml-2"
          style={{ color }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
