import { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  X,
  Check,
  Users,
  Camera,
  Search,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { Profile } from '@/lib/types';
import { cn } from '@/lib/cn';

export default function CreateGroupScreen() {
  const router = useRouter();

  const currentUserId = useDatingStore((s) => s.currentUserId);
  const matches = useDatingStore((s) => s.matches);
  const threads = useDatingStore((s) => s.threads);
  const createGroupChat = useDatingStore((s) => s.createGroupChat);

  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all matched users that have unlocked threads
  const availableParticipants = useMemo(() => {
    const activeMatches = matches.filter((m) => {
      const thread = threads.find((t) => t.match_id === m.id);
      return thread?.unlocked && m.status !== 'archived';
    });

    return activeMatches.map((match) => {
      const otherUserId = match.user_1_id === currentUserId ? match.user_2_id : match.user_1_id;
      return MOCK_PROFILES.find((p: Profile) => p.user_id === otherUserId);
    }).filter((p): p is Profile => p !== undefined);
  }, [matches, threads, currentUserId]);

  // Filter by search
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return availableParticipants;
    return availableParticipants.filter((p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableParticipants, searchQuery]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (selectedParticipants.length < 2) return;

    const name = groupName.trim() || selectedParticipants
      .map((id) => MOCK_PROFILES.find((p: Profile) => p.user_id === id)?.display_name)
      .filter(Boolean)
      .join(', ');

    createGroupChat(name, selectedParticipants);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inbox');
    }
  };

  const canCreate = selectedParticipants.length >= 2;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-purple-900/30">
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/inbox')}
              className="w-10 h-10 items-center justify-center"
            >
              <X size={24} color="white" />
            </Pressable>

            <Text className="text-white font-semibold text-lg">New Group</Text>

            <Pressable
              onPress={handleCreate}
              disabled={!canCreate}
              className={cn(
                'w-10 h-10 items-center justify-center rounded-full',
                canCreate ? 'bg-purple-600' : 'bg-zinc-800'
              )}
            >
              <Check size={20} color={canCreate ? 'white' : '#6b7280'} />
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Group Info */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="px-5 py-6 border-b border-zinc-800/50"
            >
              <View className="flex-row items-center">
                {/* Group photo placeholder */}
                <Pressable className="w-16 h-16 bg-purple-500/20 rounded-full items-center justify-center border-2 border-purple-500/30">
                  <Camera size={24} color="#c084fc" />
                </Pressable>

                <View className="flex-1 ml-4">
                  <TextInput
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group name (optional)"
                    placeholderTextColor="#6b7280"
                    className="text-white text-lg bg-zinc-900/50 rounded-xl px-4 py-3 border border-zinc-800"
                  />
                </View>
              </View>

              {/* Selected count */}
              <View className="flex-row items-center mt-4">
                <Users size={16} color="#a855f7" />
                <Text className="text-purple-300 text-sm ml-2">
                  {selectedParticipants.length} selected (minimum 2)
                </Text>
              </View>
            </Animated.View>

            {/* Search */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="px-5 py-4"
            >
              <View className="flex-row items-center bg-zinc-900/50 rounded-xl px-4 border border-zinc-800">
                <Search size={18} color="#6b7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search connections..."
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white py-3 ml-2"
                />
              </View>
            </Animated.View>

            {/* Participants List */}
            <View className="px-5">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Your Connections
              </Text>

              {filteredParticipants.length === 0 ? (
                <View className="items-center py-12">
                  <Users size={48} color="#6b7280" />
                  <Text className="text-gray-500 mt-4 text-center">
                    No active connections yet.{'\n'}Start chatting to create groups!
                  </Text>
                </View>
              ) : (
                filteredParticipants.map((participant, index) => {
                  const isSelected = selectedParticipants.includes(participant.user_id);

                  return (
                    <Animated.View
                      key={participant.id}
                      entering={FadeInDown.delay(200 + index * 50).springify()}
                    >
                      <Pressable
                        onPress={() => toggleParticipant(participant.user_id)}
                        className={cn(
                          'flex-row items-center p-3 rounded-xl mb-2 border',
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-zinc-900/50 border-zinc-800 active:bg-zinc-800'
                        )}
                      >
                        <Image
                          source={{ uri: participant.photos[0] }}
                          className="w-12 h-12 rounded-full"
                        />

                        <View className="flex-1 ml-3">
                          <Text className="text-white font-medium">
                            {participant.display_name}
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {participant.city}
                          </Text>
                        </View>

                        <View
                          className={cn(
                            'w-6 h-6 rounded-full border-2 items-center justify-center',
                            isSelected
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-zinc-600'
                          )}
                        >
                          {isSelected && <Check size={14} color="white" />}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </View>

            {/* Selected Participants Preview */}
            {selectedParticipants.length > 0 && (
              <Animated.View
                entering={FadeInDown.springify()}
                className="px-5 py-4 mt-4 border-t border-zinc-800/50"
              >
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                  Selected
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  <View className="flex-row">
                    {selectedParticipants.map((userId) => {
                      const participant = MOCK_PROFILES.find(
                        (p: Profile) => p.user_id === userId
                      );
                      if (!participant) return null;

                      return (
                        <Pressable
                          key={userId}
                          onPress={() => toggleParticipant(userId)}
                          className="items-center mr-4"
                        >
                          <View className="relative">
                            <Image
                              source={{ uri: participant.photos[0] }}
                              className="w-14 h-14 rounded-full"
                            />
                            <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                              <X size={12} color="white" />
                            </View>
                          </View>
                          <Text className="text-gray-400 text-xs mt-1 max-w-14" numberOfLines={1}>
                            {participant.display_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {/* Create Button */}
            <View className="px-5 py-6">
              <Pressable
                onPress={handleCreate}
                disabled={!canCreate}
                className="rounded-xl overflow-hidden"
              >
                <LinearGradient
                  colors={canCreate ? ['#9333ea', '#db2777'] : ['#374151', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ padding: 16, alignItems: 'center', borderRadius: 12 }}
                >
                  <Text className={cn(
                    'font-semibold text-lg',
                    canCreate ? 'text-white' : 'text-gray-500'
                  )}>
                    Create Group Chat
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
