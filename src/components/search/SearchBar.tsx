import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Search,
  X,
  SlidersHorizontal,
  Bookmark,
  Users,
  Calendar,
  BookOpen,
  MessageCircle,
} from 'lucide-react-native';
import { SearchResultType, SearchResultsGroup, AnySearchResult } from '@/lib/types';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onOpenFilters: () => void;
  onOpenSavedSearches?: () => void;
  placeholder?: string;
  isSearching?: boolean;
  resultCount?: number;
  groupedResults?: SearchResultsGroup[];
  onSelectResult?: (result: AnySearchResult) => void;
  showResultsPreview?: boolean;
}

const RESULT_TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  profile: <Users size={16} color="#a855f7" />,
  event: <Calendar size={16} color="#f59e0b" />,
  article: <BookOpen size={16} color="#22c55e" />,
  message: <MessageCircle size={16} color="#3b82f6" />,
};

const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  profile: 'People',
  event: 'Events',
  article: 'Articles',
  message: 'Messages',
};

export default function SearchBar({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onOpenFilters,
  onOpenSavedSearches,
  placeholder = 'Search people, events, articles...',
  isSearching = false,
  resultCount,
  groupedResults,
  onSelectResult,
  showResultsPreview = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onOpenFilters();
  };

  const animatedFilterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasResults = groupedResults && groupedResults.length > 0;
  const showPreview = showResultsPreview && isFocused && value.length > 0 && hasResults;

  return (
    <View className="relative z-50">
      {/* Search Input Container */}
      <View className="flex-row items-center gap-2">
        <View
          className={`flex-1 flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border ${
            isFocused ? 'border-purple-500' : 'border-zinc-800'
          }`}
        >
          <Search size={20} color={isFocused ? '#a855f7' : '#71717a'} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#52525b"
            className="flex-1 text-white ml-3 text-base"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <Pressable onPress={handleClear} className="p-1">
              <X size={18} color="#71717a" />
            </Pressable>
          )}
        </View>

        {/* Filter Button */}
        <Animated.View style={animatedFilterStyle}>
          <Pressable
            onPress={handleFilterPress}
            className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
          >
            <SlidersHorizontal size={20} color="#a855f7" />
          </Pressable>
        </Animated.View>

        {/* Saved Searches Button */}
        {onOpenSavedSearches && (
          <Pressable
            onPress={onOpenSavedSearches}
            className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
          >
            <Bookmark size={20} color="#71717a" />
          </Pressable>
        )}
      </View>

      {/* Result Count */}
      {resultCount !== undefined && value.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} className="mt-2">
          <Text className="text-zinc-500 text-sm">
            {isSearching ? 'Searching...' : `${resultCount} results found`}
          </Text>
        </Animated.View>
      )}

      {/* Results Preview Dropdown */}
      {showPreview && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(100)}
          className="absolute top-16 left-0 right-12 z-50"
        >
          <BlurView intensity={80} tint="dark" className="rounded-2xl overflow-hidden border border-zinc-800">
            <ScrollView
              className="max-h-80"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {groupedResults.map((group) => (
                <View key={group.type} className="py-2">
                  <View className="flex-row items-center gap-2 px-4 py-2">
                    {RESULT_TYPE_ICONS[group.type]}
                    <Text className="text-zinc-400 text-sm font-medium">
                      {RESULT_TYPE_LABELS[group.type]}
                    </Text>
                    <Text className="text-zinc-600 text-xs">({group.totalCount})</Text>
                  </View>
                  {group.results.slice(0, 3).map((result) => (
                    <Pressable
                      key={result.id}
                      onPress={() => {
                        Keyboard.dismiss();
                        onSelectResult?.(result);
                      }}
                      className="px-4 py-3 active:bg-zinc-800/50"
                    >
                      <ResultPreviewItem result={result} />
                    </Pressable>
                  ))}
                  {group.totalCount > 3 && (
                    <Text className="px-4 py-2 text-purple-400 text-sm">
                      +{group.totalCount - 3} more
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

function ResultPreviewItem({ result }: { result: AnySearchResult }) {
  switch (result.type) {
    case 'profile':
      return (
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-zinc-700" />
          <View>
            <Text className="text-white font-medium">{result.profile.display_name}</Text>
            <Text className="text-zinc-500 text-xs">
              {result.profile.age} • {result.profile.city}
              {result.distance ? ` • ${result.distance.toFixed(1)} mi` : ''}
            </Text>
          </View>
        </View>
      );
    case 'event':
      return (
        <View>
          <Text className="text-white font-medium">{result.event.title}</Text>
          <Text className="text-zinc-500 text-xs">
            {new Date(result.event.start_date).toLocaleDateString()}
          </Text>
        </View>
      );
    case 'article':
      return (
        <View>
          <Text className="text-white font-medium">{result.article.title}</Text>
          <Text className="text-zinc-500 text-xs">{result.article.category}</Text>
        </View>
      );
    case 'message':
      return (
        <View>
          <Text className="text-white font-medium">{result.otherUserName}</Text>
          <Text className="text-zinc-500 text-xs" numberOfLines={1}>
            {result.message.content}
          </Text>
        </View>
      );
    default:
      return null;
  }
}
