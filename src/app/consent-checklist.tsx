import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Check,
  X,
  HelpCircle,
  MessageSquare,
  Hand,
  Heart,
  Camera,
  Users,
  Sparkles,
  Save,
} from 'lucide-react-native';
import { CONSENT_ITEMS_TEMPLATE } from '@/lib/static-data';
import { ConsentItem, ConsentChecklist as ConsentChecklistType } from '@/lib/types';

const CATEGORY_CONFIG: {
  [key: string]: { icon: typeof Hand; color: string; label: string };
} = {
  touch: { icon: Hand, color: '#4ECDC4', label: 'Touch' },
  intimacy: { icon: Heart, color: '#FF6B6B', label: 'Intimacy' },
  communication: { icon: MessageSquare, color: '#c084fc', label: 'Communication' },
  photos: { icon: Camera, color: '#FFE66D', label: 'Photos & Media' },
  social: { icon: Users, color: '#96CEB4', label: 'Social' },
  kink: { icon: Sparkles, color: '#DDA0DD', label: 'Kink & Play' },
};

type ConsentValue = 'yes' | 'no' | 'maybe' | 'discuss' | null;

const CONSENT_OPTIONS: { value: ConsentValue; label: string; color: string; icon: typeof Check }[] = [
  { value: 'yes', label: 'Yes', color: '#22c55e', icon: Check },
  { value: 'maybe', label: 'Maybe', color: '#eab308', icon: HelpCircle },
  { value: 'discuss', label: 'Discuss', color: '#c084fc', icon: MessageSquare },
  { value: 'no', label: 'No', color: '#ef4444', icon: X },
];

function ConsentItemRow({
  item,
  index,
  onUpdate,
}: {
  item: ConsentItem;
  index: number;
  onUpdate: (value: ConsentValue) => void;
}) {
  return (
    <Animated.View
      entering={SlideInRight.delay(index * 30)}
      className="bg-zinc-800/50 rounded-xl p-4 mb-2 border border-zinc-700/50"
    >
      <Text className="text-white font-medium mb-3">{item.activity}</Text>
      <View className="flex-row justify-between">
        {CONSENT_OPTIONS.map((option) => {
          const isSelected = item.user_consent === option.value;
          const Icon = option.icon;

          return (
            <Pressable
              key={option.value}
              onPress={() => onUpdate(isSelected ? null : option.value)}
              className={`flex-1 py-2.5 rounded-lg mx-0.5 items-center ${
                isSelected ? '' : 'bg-zinc-700/30'
              }`}
              style={{
                backgroundColor: isSelected ? option.color + '30' : undefined,
                borderWidth: isSelected ? 1 : 0,
                borderColor: isSelected ? option.color : undefined,
              }}
            >
              <Icon size={16} color={isSelected ? option.color : '#6b7280'} />
              <Text
                className={`text-xs mt-1 ${isSelected ? 'font-medium' : ''}`}
                style={{ color: isSelected ? option.color : '#6b7280' }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

function CategorySection({
  category,
  items,
  onUpdateItem,
}: {
  category: string;
  items: ConsentItem[];
  onUpdateItem: (itemId: string, value: ConsentValue) => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config?.icon || Hand;

  const [expanded, setExpanded] = useState(true);

  const completionCount = items.filter((i) => i.user_consent !== null).length;
  const completionPercent = Math.round((completionCount / items.length) * 100);

  return (
    <Animated.View entering={FadeInDown} className="mb-6">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between mb-3"
      >
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: (config?.color || '#9ca3af') + '20' }}
          >
            <Icon size={20} color={config?.color || '#9ca3af'} />
          </View>
          <View>
            <Text className="text-white font-semibold text-base">{config?.label || category}</Text>
            <Text className="text-zinc-500 text-sm">
              {completionCount}/{items.length} answered
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden mr-3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${completionPercent}%`,
                backgroundColor: config?.color || '#9ca3af',
              }}
            />
          </View>
          <Text
            className={`text-lg ${expanded ? 'rotate-90' : ''}`}
            style={{ color: config?.color || '#9ca3af' }}
          >
            {'>'}
          </Text>
        </View>
      </Pressable>

      {expanded && (
        <View>
          {items.map((item, index) => (
            <ConsentItemRow
              key={item.id}
              item={item}
              index={index}
              onUpdate={(value) => onUpdateItem(item.id, value)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default function ConsentChecklistScreen() {
  const router = useRouter();

  // Initialize items with IDs
  const [items, setItems] = useState<ConsentItem[]>(() =>
    CONSENT_ITEMS_TEMPLATE.map((item, index) => ({
      ...item,
      id: `consent-${index}`,
    }))
  );

  // Load saved checklist on mount
  useEffect(() => {
    const loadSavedChecklist = async () => {
      try {
        const saved = await AsyncStorage.getItem('consent_checklist_user-1');
        if (saved) {
          const checklist: ConsentChecklistType = JSON.parse(saved);
          setItems(checklist.items);
        }
      } catch (error) {
        console.error('Failed to load saved consent checklist:', error);
      }
    };

    loadSavedChecklist();
  }, []);

  const handleUpdateItem = (itemId: string, value: ConsentValue) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, user_consent: value } : item
      )
    );
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: ConsentItem[] } = {};
    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const totalAnswered = items.filter((i) => i.user_consent !== null).length;
  const totalItems = items.length;
  const overallProgress = Math.round((totalAnswered / totalItems) * 100);

  const handleSave = async () => {
    try {
      // Save the checklist
      const checklist: ConsentChecklistType = {
        id: `checklist-${Date.now()}`,
        user_id: 'user-1',
        items,
        is_template: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `consent_checklist_${checklist.user_id}`,
        JSON.stringify(checklist)
      );

      Alert.alert(
        'Saved!',
        'Your consent preferences have been saved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save consent checklist:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-xl ml-4">Consent Checklist</Text>
        </View>

        {/* Progress overview */}
        <Animated.View entering={FadeIn} className="px-4 py-4">
          <LinearGradient
            colors={['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <Text className="text-white/70 text-sm mb-1">Your consent profile</Text>
            <Text className="text-white font-bold text-2xl mb-3">
              {overallProgress}% Complete
            </Text>
            <View className="h-3 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </View>
            <Text className="text-white/70 text-sm mt-2">
              {totalAnswered} of {totalItems} preferences set
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Description */}
        <View className="px-4 mb-4">
          <Text className="text-zinc-400 text-sm leading-relaxed">
            Set your preferences for different activities. You can share this with partners to
            establish clear communication about boundaries before meeting.
          </Text>
        </View>

        {/* Categories */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <CategorySection
              key={category}
              category={category}
              items={categoryItems}
              onUpdateItem={handleUpdateItem}
            />
          ))}
        </ScrollView>

        {/* Save button */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-8">
          <Pressable onPress={handleSave}>
            <LinearGradient
              colors={['#c084fc', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Save size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Save Preferences</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
