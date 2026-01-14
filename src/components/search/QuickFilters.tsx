import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QuickFilterType, QUICK_FILTER_OPTIONS } from '@/lib/types';

interface QuickFiltersProps {
  activeFilters: QuickFilterType[];
  onToggleFilter: (filter: QuickFilterType) => void;
  onClearAll?: () => void;
}

export default function QuickFilters({
  activeFilters,
  onToggleFilter,
  onClearAll,
}: QuickFiltersProps) {
  const handleToggle = (filter: QuickFilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFilter(filter);
  };

  const handleClearAll = () => {
    if (activeFilters.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onClearAll?.();
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {/* Clear All Button */}
        {activeFilters.length > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={handleClearAll}
              className="flex-row items-center px-3 py-2 rounded-full bg-zinc-800 border border-zinc-700"
            >
              <Text className="text-zinc-400 text-sm">Clear ({activeFilters.length})</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Filter Chips */}
        {QUICK_FILTER_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            id={option.id}
            label={option.label}
            icon={option.icon}
            isActive={activeFilters.includes(option.id)}
            onToggle={() => handleToggle(option.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface FilterChipProps {
  id: QuickFilterType;
  label: string;
  icon: string;
  isActive: boolean;
  onToggle: () => void;
}

function FilterChip({ label, icon, isActive, onToggle }: FilterChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
          isActive
            ? 'bg-purple-500/20 border-purple-500'
            : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <Text className="text-sm">{icon}</Text>
        <Text
          className={`text-sm font-medium ${
            isActive ? 'text-purple-400' : 'text-zinc-400'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
