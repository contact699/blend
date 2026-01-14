import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Bookmark,
  Bell,
  BellOff,
  Trash2,
  Clock,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react-native';
import { SavedSearch, SearchFilters } from '@/lib/types';

interface SavedSearchesModalProps {
  visible: boolean;
  onClose: () => void;
  savedSearches: SavedSearch[];
  recentSearches: string[];
  onSelectSavedSearch: (search: SavedSearch) => void;
  onSelectRecentSearch: (query: string) => void;
  onDeleteSavedSearch: (searchId: string) => void;
  onToggleNotifications: (searchId: string, enabled: boolean) => void;
  onSaveCurrentSearch: (name: string) => void;
  currentFilters?: SearchFilters;
}

export default function SavedSearchesModal({
  visible,
  onClose,
  savedSearches,
  recentSearches,
  onSelectSavedSearch,
  onSelectRecentSearch,
  onDeleteSavedSearch,
  onToggleNotifications,
  onSaveCurrentSearch,
  currentFilters,
}: SavedSearchesModalProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  const handleSave = () => {
    if (newSearchName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaveCurrentSearch(newSearchName.trim());
      setNewSearchName('');
      setShowSaveForm(false);
    }
  };

  const handleSelectSaved = (search: SavedSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSavedSearch(search);
    onClose();
  };

  const handleSelectRecent = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectRecentSearch(query);
    onClose();
  };

  const handleDelete = (searchId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeleteSavedSearch(searchId);
  };

  const handleToggleNotifications = (searchId: string, enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleNotifications(searchId, enabled);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
          >
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center"
            >
              <X size={22} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Saved Searches</Text>
            <View className="w-10" />
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            {/* Save Current Search */}
            {currentFilters && (
              <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
                {showSaveForm ? (
                  <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <Text className="text-white font-semibold mb-3">Save Current Search</Text>
                    <TextInput
                      value={newSearchName}
                      onChangeText={setNewSearchName}
                      placeholder="Search name..."
                      placeholderTextColor="#52525b"
                      className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-3"
                      autoFocus
                    />
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => setShowSaveForm(false)}
                        className="flex-1 py-3 rounded-xl bg-zinc-800"
                      >
                        <Text className="text-zinc-400 text-center font-medium">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSave}
                        className="flex-1 py-3 rounded-xl overflow-hidden"
                      >
                        <LinearGradient
                          colors={['#a855f7', '#7c3aed']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                        />
                        <Text className="text-white text-center font-medium">Save</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowSaveForm(true)}
                    className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-purple-500/50 bg-purple-500/10"
                  >
                    <Plus size={20} color="#a855f7" />
                    <Text className="text-purple-400 font-medium">Save Current Search</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* Saved Searches */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Bookmark size={18} color="#a855f7" />
                <Text className="text-white font-semibold">Saved</Text>
                <Text className="text-zinc-500 text-sm">({savedSearches.length})</Text>
              </View>

              {savedSearches.length === 0 ? (
                <View className="bg-zinc-900/50 rounded-2xl p-6 items-center border border-zinc-800">
                  <Bookmark size={32} color="#52525b" />
                  <Text className="text-zinc-400 mt-3 text-center">
                    No saved searches yet
                  </Text>
                  <Text className="text-zinc-500 text-sm mt-1 text-center">
                    Save your favorite searches for quick access
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {savedSearches.map((search, index) => (
                    <Animated.View
                      key={search.id}
                      entering={FadeInDown.delay(index * 50 + 250)}
                    >
                      <SavedSearchItem
                        search={search}
                        onSelect={() => handleSelectSaved(search)}
                        onDelete={() => handleDelete(search.id)}
                        onToggleNotifications={(enabled) =>
                          handleToggleNotifications(search.id, enabled)
                        }
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Recent Searches */}
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <View className="flex-row items-center gap-2 mb-3">
                <Clock size={18} color="#71717a" />
                <Text className="text-white font-semibold">Recent</Text>
                <Text className="text-zinc-500 text-sm">({recentSearches.length})</Text>
              </View>

              {recentSearches.length === 0 ? (
                <View className="bg-zinc-900/50 rounded-2xl p-6 items-center border border-zinc-800">
                  <Search size={32} color="#52525b" />
                  <Text className="text-zinc-400 mt-3 text-center">
                    No recent searches
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {recentSearches.map((query, index) => (
                    <Animated.View
                      key={`${query}-${index}`}
                      entering={FadeInDown.delay(index * 30 + 350)}
                    >
                      <Pressable
                        onPress={() => handleSelectRecent(query)}
                        className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800 active:bg-zinc-800"
                      >
                        <Clock size={16} color="#71717a" />
                        <Text className="text-white flex-1 ml-3">{query}</Text>
                        <ChevronRight size={18} color="#52525b" />
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Saved Search Item Component
function SavedSearchItem({
  search,
  onSelect,
  onDelete,
  onToggleNotifications,
}: {
  search: SavedSearch;
  onSelect: () => void;
  onDelete: () => void;
  onToggleNotifications: (enabled: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const filterSummary = getFilterSummary(search.filters);

  return (
    <View className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <Pressable
        onPress={onSelect}
        onLongPress={() => setExpanded(!expanded)}
        className="flex-row items-center px-4 py-3"
      >
        <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
          <Bookmark size={18} color="#a855f7" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-white font-medium">{search.name}</Text>
          <Text className="text-zinc-500 text-sm" numberOfLines={1}>
            {filterSummary}
          </Text>
        </View>
        {search.notificationsEnabled && (
          <View className="mr-2">
            <Bell size={16} color="#22c55e" />
          </View>
        )}
        <ChevronRight size={18} color="#52525b" />
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="px-4 py-3 border-t border-zinc-800"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Bell size={16} color="#71717a" />
              <Text className="text-zinc-400 ml-2">Notifications</Text>
            </View>
            <Switch
              value={search.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: '#3f3f46', true: '#22c55e' }}
            />
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onDelete}
              className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text className="text-red-400 font-medium">Delete</Text>
            </Pressable>
          </View>

          <Text className="text-zinc-600 text-xs mt-3 text-center">
            Last used: {new Date(search.last_used_at).toLocaleDateString()}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// Helper to generate filter summary
function getFilterSummary(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.query) {
    parts.push(`"${filters.query}"`);
  }

  if (filters.location.radiusMiles && filters.location.radiusMiles < 100) {
    parts.push(`${filters.location.radiusMiles}mi`);
  }

  if (filters.basics.ageRange[0] > 18 || filters.basics.ageRange[1] < 65) {
    parts.push(`${filters.basics.ageRange[0]}-${filters.basics.ageRange[1]}yo`);
  }

  if (filters.quickFilters.length > 0) {
    parts.push(`${filters.quickFilters.length} filters`);
  }

  if (filters.trust.minTrustScore) {
    parts.push(`Trust ${filters.trust.minTrustScore}+`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'All profiles';
}
