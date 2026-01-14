import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Users,
  Calendar,
  BookOpen,
  MessageCircle,
  Shield,
  Check,
  Clock,
  Grid3X3,
  List,
  Map,
  ChevronRight,
  Star,
  Wifi,
} from 'lucide-react-native';
import {
  SearchViewMode,
  SearchSortOption,
  AnySearchResult,
  ProfileSearchResult,
  EventSearchResult,
  ArticleSearchResult,
  MessageSearchResult,
  SearchResultsGroup,
} from '@/lib/types';
import { TrustBadgeIcon } from '../TrustBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const LIST_ITEM_HEIGHT = 80;

interface SearchResultsProps {
  results: AnySearchResult[];
  groupedResults?: SearchResultsGroup[];
  viewMode: SearchViewMode;
  sortOption: SearchSortOption;
  isLoading?: boolean;
  onResultPress: (result: AnySearchResult) => void;
  onViewModeChange: (mode: SearchViewMode) => void;
  onSortChange: (option: SearchSortOption) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const SORT_OPTIONS: { value: SearchSortOption; label: string }[] = [
  { value: 'distance', label: 'Distance' },
  { value: 'trust_score', label: 'Trust Score' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_active', label: 'Most Active' },
  { value: 'compatibility', label: 'Compatibility' },
];

export default function SearchResults({
  results,
  groupedResults,
  viewMode,
  sortOption,
  isLoading,
  onResultPress,
  onViewModeChange,
  onSortChange,
  onLoadMore,
  hasMore,
}: SearchResultsProps) {
  const profileResults = useMemo(
    () => results.filter((r): r is ProfileSearchResult => r.type === 'profile'),
    [results]
  );

  if (isLoading && results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text className="text-zinc-400 mt-4">Searching...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <Animated.View
        entering={FadeIn}
        className="flex-1 items-center justify-center py-20"
      >
        <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-4">
          <Users size={40} color="#71717a" />
        </View>
        <Text className="text-white text-lg font-semibold mb-2">No results found</Text>
        <Text className="text-zinc-400 text-center px-8">
          Try adjusting your filters or search terms
        </Text>
      </Animated.View>
    );
  }

  return (
    <View className="flex-1">
      {/* View Mode & Sort Controls */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <View className="flex-row items-center gap-2">
          <ViewModeToggle mode={viewMode} onModeChange={onViewModeChange} />
        </View>

        <View className="flex-row items-center">
          <Text className="text-zinc-500 text-sm mr-2">Sort:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSortChange(option.value);
                }}
                className={`px-3 py-1.5 rounded-full ${
                  sortOption === option.value
                    ? 'bg-purple-500/20'
                    : 'bg-zinc-800'
                }`}
              >
                <Text
                  className={`text-xs ${
                    sortOption === option.value
                      ? 'text-purple-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Results Count */}
      <View className="px-4 py-2">
        <Text className="text-zinc-500 text-sm">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Results based on view mode */}
      {viewMode === 'card' && (
        <CardView
          results={profileResults}
          onResultPress={onResultPress}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'list' && (
        <ListView
          results={results}
          groupedResults={groupedResults}
          onResultPress={onResultPress}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'map' && (
        <MapView results={profileResults} onResultPress={onResultPress} />
      )}
    </View>
  );
}

// View Mode Toggle Component
function ViewModeToggle({
  mode,
  onModeChange,
}: {
  mode: SearchViewMode;
  onModeChange: (mode: SearchViewMode) => void;
}) {
  return (
    <View className="flex-row bg-zinc-800 rounded-lg p-1">
      {[
        { value: 'card' as SearchViewMode, icon: Grid3X3 },
        { value: 'list' as SearchViewMode, icon: List },
        { value: 'map' as SearchViewMode, icon: Map },
      ].map(({ value, icon: Icon }) => (
        <Pressable
          key={value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onModeChange(value);
          }}
          className={`px-3 py-2 rounded-md ${
            mode === value ? 'bg-purple-500/30' : ''
          }`}
        >
          <Icon
            size={18}
            color={mode === value ? '#a855f7' : '#71717a'}
          />
        </Pressable>
      ))}
    </View>
  );
}

// Card View - Tinder-style swipe cards
function CardView({
  results,
  onResultPress,
  onLoadMore,
  hasMore,
  isLoading,
}: {
  results: ProfileSearchResult[];
  onResultPress: (result: AnySearchResult) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}) {
  const renderItem = ({ item, index }: { item: ProfileSearchResult; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      <ProfileCard result={item} onPress={() => onResultPress(item)} />
    </Animated.View>
  );

  return (
    <FlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoading && hasMore ? (
          <View className="py-4">
            <ActivityIndicator size="small" color="#a855f7" />
          </View>
        ) : null
      }
    />
  );
}

// Profile Card Component
function ProfileCard({
  result,
  onPress,
}: {
  result: ProfileSearchResult;
  onPress: () => void;
}) {
  const { profile, distance, trustTier, trustScore } = result;
  const hasPhoto = profile.photos && profile.photos.length > 0;

  return (
    <Pressable onPress={onPress}>
      <View className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
        {/* Photo */}
        <View className="relative">
          {hasPhoto ? (
            <Image
              source={{ uri: profile.photos[0] }}
              className="w-full aspect-[4/5]"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full aspect-[4/5] bg-zinc-800 items-center justify-center">
              <Users size={64} color="#4b5563" />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
            }}
          />

          {/* Top badges */}
          <View className="absolute top-4 left-4 right-4 flex-row justify-between">
            <View className="flex-row gap-2">
              {profile.virtual_only && (
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/60">
                  <Wifi size={14} color="#c084fc" />
                  <Text className="text-purple-400 text-sm ml-1.5">Virtual</Text>
                </View>
              )}
              {trustTier && trustScore !== undefined && (
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-black/60">
                  <TrustBadgeIcon tier={trustTier} size={18} />
                  <Text className="text-white text-sm ml-1.5 font-bold">{trustScore}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom info */}
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <Text className="text-white font-bold text-2xl">{profile.display_name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-zinc-300">{profile.age}</Text>
              <View className="w-1 h-1 bg-zinc-500 rounded-full mx-2" />
              <MapPin size={14} color="#9ca3af" />
              <Text className="text-zinc-400 ml-1">{profile.city}</Text>
              {distance !== undefined && (
                <>
                  <View className="w-1 h-1 bg-zinc-500 rounded-full mx-2" />
                  <Text className="text-zinc-400">{distance.toFixed(1)} mi</Text>
                </>
              )}
            </View>

            {/* Match reasons */}
            {result.matchReasons.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-3">
                {result.matchReasons.slice(0, 3).map((reason, i) => (
                  <View
                    key={i}
                    className="px-2 py-1 rounded-full bg-purple-500/20"
                  >
                    <Text className="text-purple-400 text-xs">{reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom section */}
        <View className="p-4">
          {profile.bio && (
            <Text className="text-zinc-300 text-sm mb-3" numberOfLines={2}>
              {profile.bio}
            </Text>
          )}

          <View className="flex-row gap-2">
            <View className="flex-row items-center px-3 py-1.5 rounded-full bg-zinc-800">
              <Clock size={14} color="#9ca3af" />
              <Text className="text-zinc-400 text-sm ml-1.5 capitalize">
                {profile.pace_preference} pace
              </Text>
            </View>
            {profile.open_to_meet && (
              <View className="flex-row items-center px-3 py-1.5 rounded-full bg-green-500/20">
                <Check size={14} color="#22c55e" />
                <Text className="text-green-400 text-sm ml-1">Open to meet</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// List View - Compact list of all result types
function ListView({
  results,
  groupedResults,
  onResultPress,
  onLoadMore,
  hasMore,
  isLoading,
}: {
  results: AnySearchResult[];
  groupedResults?: SearchResultsGroup[];
  onResultPress: (result: AnySearchResult) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}) {
  // If we have grouped results, show them by category
  if (groupedResults && groupedResults.length > 0) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {groupedResults.map((group) => (
          <View key={group.type} className="mb-6">
            <View className="flex-row items-center justify-between px-4 py-2">
              <View className="flex-row items-center gap-2">
                <ResultTypeIcon type={group.type} />
                <Text className="text-white font-semibold">{getResultTypeLabel(group.type)}</Text>
                <Text className="text-zinc-500 text-sm">({group.totalCount})</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-purple-400 text-sm mr-1">See all</Text>
                <ChevronRight size={16} color="#a855f7" />
              </Pressable>
            </View>

            {group.results.map((result, index) => (
              <Animated.View
                key={result.id}
                entering={FadeInDown.delay(index * 30)}
              >
                <ListItem result={result} onPress={() => onResultPress(result)} />
              </Animated.View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  // Otherwise show flat list
  return (
    <FlatList
      data={results}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 30)}>
          <ListItem result={item} onPress={() => onResultPress(item)} />
        </Animated.View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoading && hasMore ? (
          <View className="py-4">
            <ActivityIndicator size="small" color="#a855f7" />
          </View>
        ) : null
      }
    />
  );
}

// List Item Component
function ListItem({
  result,
  onPress,
}: {
  result: AnySearchResult;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-zinc-800/50 active:bg-zinc-800/30"
    >
      <ResultTypeIcon type={result.type} />
      <View className="flex-1 ml-3">
        {renderListItemContent(result)}
      </View>
      <ChevronRight size={18} color="#52525b" />
    </Pressable>
  );
}

function renderListItemContent(result: AnySearchResult) {
  switch (result.type) {
    case 'profile':
      return (
        <View className="flex-row items-center">
          {result.profile.photos?.[0] ? (
            <Image
              source={{ uri: result.profile.photos[0] }}
              className="w-12 h-12 rounded-full mr-3"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-zinc-700 items-center justify-center mr-3">
              <Users size={20} color="#71717a" />
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-medium">{result.profile.display_name}</Text>
              <Text className="text-zinc-500 ml-1">, {result.profile.age}</Text>
              {result.trustScore !== undefined && (
                <View className="flex-row items-center ml-2">
                  <Shield size={12} color="#22c55e" />
                  <Text className="text-green-400 text-xs ml-0.5">{result.trustScore}</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-0.5">
              <MapPin size={12} color="#71717a" />
              <Text className="text-zinc-400 text-sm ml-1">{result.profile.city}</Text>
              {result.distance !== undefined && (
                <Text className="text-zinc-500 text-sm ml-2">{result.distance.toFixed(1)} mi</Text>
              )}
            </View>
          </View>
        </View>
      );

    case 'event':
      return (
        <View>
          <Text className="text-white font-medium">{result.event.title}</Text>
          <View className="flex-row items-center mt-0.5">
            <Calendar size={12} color="#f59e0b" />
            <Text className="text-zinc-400 text-sm ml-1">
              {new Date(result.event.start_date).toLocaleDateString()}
            </Text>
            <Text className="text-zinc-500 text-sm ml-2">
              {result.event.current_attendees} attending
            </Text>
          </View>
        </View>
      );

    case 'article':
      return (
        <View>
          <Text className="text-white font-medium">{result.article.title}</Text>
          <View className="flex-row items-center mt-0.5">
            <BookOpen size={12} color="#22c55e" />
            <Text className="text-zinc-400 text-sm ml-1">{result.article.category}</Text>
            <Text className="text-zinc-500 text-sm ml-2">{result.article.read_time} min read</Text>
          </View>
        </View>
      );

    case 'message':
      return (
        <View>
          <Text className="text-white font-medium">{result.otherUserName}</Text>
          <Text className="text-zinc-400 text-sm mt-0.5" numberOfLines={1}>
            {result.message.content}
          </Text>
        </View>
      );

    default:
      return null;
  }
}

// Map View - Import the actual component
import MapViewComponent from './MapView';

// Map View wrapper
function MapView({
  results,
  onResultPress,
}: {
  results: ProfileSearchResult[];
  onResultPress: (result: AnySearchResult) => void;
}) {
  return <MapViewComponent results={results} onResultPress={onResultPress} />;
}

// Helper Components
function ResultTypeIcon({ type }: { type: AnySearchResult['type'] }) {
  const config = {
    profile: { icon: Users, color: '#a855f7', bg: 'bg-purple-500/20' },
    event: { icon: Calendar, color: '#f59e0b', bg: 'bg-amber-500/20' },
    article: { icon: BookOpen, color: '#22c55e', bg: 'bg-green-500/20' },
    message: { icon: MessageCircle, color: '#3b82f6', bg: 'bg-blue-500/20' },
  };

  const { icon: Icon, color, bg } = config[type];

  return (
    <View className={`w-10 h-10 rounded-full ${bg} items-center justify-center`}>
      <Icon size={20} color={color} />
    </View>
  );
}

function getResultTypeLabel(type: AnySearchResult['type']): string {
  const labels = {
    profile: 'People',
    event: 'Events',
    article: 'Articles',
    message: 'Messages',
  };
  return labels[type];
}
