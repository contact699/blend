import { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Flame,
  Target,
  BookOpen,
  Sparkles,
  Triangle,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  Play,
  Settings,
  PenSquare,
} from 'lucide-react-native';
import { GameType, GameParticipant, Profile } from '@/lib/types';
import { GAME_INFO } from '@/lib/game-content';
import { cn } from '@/lib/cn';
import CustomContentManager from './CustomContentManager';

interface GameLauncherProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (gameType: GameType, participants: GameParticipant[]) => void;
  participants: Profile[];
  currentUserId: string;
}

const GAME_ICONS = {
  truth_or_dare: Flame,
  hot_seat: Target,
  story_chain: BookOpen,
  mystery_date_planner: Sparkles,
  compatibility_triangle: Triangle,
  group_challenge: Trophy,
} as const;

const GAME_GRADIENTS = {
  truth_or_dare: ['#ef4444', '#f97316'] as const,
  hot_seat: ['#8b5cf6', '#a855f7'] as const,
  story_chain: ['#3b82f6', '#6366f1'] as const,
  mystery_date_planner: ['#ec4899', '#f43f5e'] as const,
  compatibility_triangle: ['#14b8a6', '#06b6d4'] as const,
  group_challenge: ['#f59e0b', '#eab308'] as const,
} as const;

export default function GameLauncher({
  visible,
  onClose,
  onStartGame,
  participants,
  currentUserId,
}: GameLauncherProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [showCustomContent, setShowCustomContent] = useState(false);

  const totalParticipants = participants.length + 1; // +1 for current user

  const availableGames = useMemo(() => {
    return (Object.keys(GAME_INFO) as GameType[]).filter((gameType) => {
      const info = GAME_INFO[gameType];
      return totalParticipants >= info.minPlayers && totalParticipants <= info.maxPlayers;
    });
  }, [totalParticipants]);

  const unavailableGames = useMemo(() => {
    return (Object.keys(GAME_INFO) as GameType[]).filter((gameType) => {
      const info = GAME_INFO[gameType];
      return totalParticipants < info.minPlayers || totalParticipants > info.maxPlayers;
    });
  }, [totalParticipants]);

  const handleSelectGame = (gameType: GameType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGame(gameType);
  };

  const handleStartGame = () => {
    if (!selectedGame) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create participants array including current user
    const gameParticipants: GameParticipant[] = [
      {
        user_id: currentUserId,
        display_name: 'You',
        score: 0,
        skips_used: 0,
        turns_taken: 0,
      },
      ...participants.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        photo: p.photos[0],
        score: 0,
        skips_used: 0,
        turns_taken: 0,
      })),
    ];

    onStartGame(selectedGame, gameParticipants);
    setSelectedGame(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedGame(null);
    onClose();
  };

  const renderGameCard = (gameType: GameType, available: boolean, index: number) => {
    const info = GAME_INFO[gameType];
    const Icon = GAME_ICONS[gameType];
    const gradient = GAME_GRADIENTS[gameType];
    const isSelected = selectedGame === gameType;

    return (
      <Animated.View
        key={gameType}
        entering={FadeInDown.delay(index * 50).springify()}
      >
        <Pressable
          onPress={() => available && handleSelectGame(gameType)}
          disabled={!available}
          className={cn(
            'mb-3 rounded-2xl overflow-hidden',
            !available && 'opacity-50'
          )}
        >
          <View
            className={cn(
              'p-4 border-2',
              isSelected ? 'border-white' : 'border-transparent'
            )}
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <View className="flex-row items-center">
              {/* Icon */}
              <LinearGradient
                colors={[...gradient]}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color="white" />
              </LinearGradient>

              {/* Info */}
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base">
                  {info.name}
                </Text>
                <Text className="text-gray-400 text-sm mt-0.5">
                  {info.description}
                </Text>
                <View className="flex-row items-center mt-1.5 gap-3">
                  <View className="flex-row items-center">
                    <Users size={12} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">
                      {info.minPlayers}-{info.maxPlayers}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={12} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">
                      {info.estimatedTime}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selection indicator */}
              {available && (
                <View
                  className={cn(
                    'w-6 h-6 rounded-full border-2 items-center justify-center',
                    isSelected ? 'border-white bg-white' : 'border-gray-600'
                  )}
                >
                  {isSelected && (
                    <View className="w-3 h-3 rounded-full bg-purple-600" />
                  )}
                </View>
              )}
            </View>

            {/* Unavailable reason */}
            {!available && (
              <View className="mt-2 bg-red-500/10 rounded-lg px-3 py-1.5">
                <Text className="text-red-400 text-xs">
                  {totalParticipants < info.minPlayers
                    ? `Needs at least ${info.minPlayers} players`
                    : `Maximum ${info.maxPlayers} players`}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/90">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-white font-bold text-xl">Play a Game</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCustomContent(true);
                }}
                className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
              >
                <PenSquare size={18} color="#a855f7" />
              </Pressable>
              <Pressable
                onPress={handleClose}
                className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
              >
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* Participants Preview */}
          <Animated.View
            entering={FadeIn.delay(100)}
            className="mx-5 mb-4 bg-zinc-900/80 rounded-xl p-3"
          >
            <View className="flex-row items-center">
              <View className="flex-row -space-x-2">
                {participants.slice(0, 4).map((p, i) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.photos[0] }}
                    className="w-8 h-8 rounded-full border-2 border-zinc-900"
                    style={{ marginLeft: i > 0 ? -8 : 0 }}
                  />
                ))}
                {participants.length > 4 && (
                  <View
                    className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center border-2 border-zinc-900"
                    style={{ marginLeft: -8 }}
                  >
                    <Text className="text-white text-xs font-bold">
                      +{participants.length - 4}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 text-sm ml-3">
                {totalParticipants} players ready
              </Text>
            </View>
          </Animated.View>

          {/* Game List */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Available Games */}
            {availableGames.length > 0 && (
              <View className="mb-4">
                <Text className="text-purple-400 text-sm font-medium mb-3">
                  Available Games
                </Text>
                {availableGames.map((gameType, index) =>
                  renderGameCard(gameType, true, index)
                )}
              </View>
            )}

            {/* Unavailable Games */}
            {unavailableGames.length > 0 && (
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-medium mb-3">
                  Need Different Group Size
                </Text>
                {unavailableGames.map((gameType, index) =>
                  renderGameCard(gameType, false, availableGames.length + index)
                )}
              </View>
            )}

            <View className="h-24" />
          </ScrollView>

          {/* Start Button */}
          {selectedGame && (
            <Animated.View
              entering={SlideInUp.springify()}
              className="absolute bottom-0 left-0 right-0 p-5 pb-8"
            >
              <Pressable onPress={handleStartGame}>
                <LinearGradient
                  colors={[...GAME_GRADIENTS[selectedGame]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={20} color="white" fill="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Start {GAME_INFO[selectedGame].name}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>

      {/* Custom Content Manager */}
      <CustomContentManager
        visible={showCustomContent}
        onClose={() => setShowCustomContent(false)}
        gameType={selectedGame ?? undefined}
      />
    </Modal>
  );
}
