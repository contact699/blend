import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  Check,
  SkipForward,
  Users,
  User,
  Zap,
  Heart,
  Sparkles,
} from 'lucide-react-native';
import { GameSession, TruthOrDareDifficulty, GameChallenge } from '@/lib/types';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';
import GameTimer from './GameTimer';

interface TruthOrDareProps {
  game: GameSession;
  currentUserId: string;
  onEndGame: (cancelled?: boolean) => void;
}

const DIFFICULTY_CONFIG = {
  playful: {
    label: 'Playful',
    icon: Zap,
    color: '#22c55e',
    gradient: ['#22c55e', '#16a34a'] as const,
    description: 'Light-hearted fun',
  },
  flirty: {
    label: 'Flirty',
    icon: Heart,
    color: '#f43f5e',
    gradient: ['#f43f5e', '#e11d48'] as const,
    description: 'Turn up the heat',
  },
  intimate: {
    label: 'Intimate',
    icon: Sparkles,
    color: '#a855f7',
    gradient: ['#a855f7', '#9333ea'] as const,
    description: 'Deep connections',
  },
};

export default function TruthOrDare({
  game,
  currentUserId,
  onEndGame,
}: TruthOrDareProps) {
  const [selectingTarget, setSelectingTarget] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const setDifficulty = useDatingStore((s) => s.setTruthOrDareDifficulty);
  const drawChallenge = useDatingStore((s) => s.drawChallenge);
  const completeChallenge = useDatingStore((s) => s.completeChallenge);
  const skipChallenge = useDatingStore((s) => s.skipChallenge);

  const cardScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Get state from game
  const state = game.state.type === 'truth_or_dare' ? game.state.data : null;

  if (!state) return null;

  const currentChallenge = state.current_challenge;
  const difficulty = state.difficulty;
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];

  const handleSelectDifficulty = (diff: TruthOrDareDifficulty) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDifficulty(game.id, diff);
  };

  const handleSelectTarget = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedTargets.includes(userId)) {
      setSelectedTargets(selectedTargets.filter((id) => id !== userId));
    } else {
      // Allow max 2 targets for couples challenges
      if (selectedTargets.length < 2) {
        setSelectedTargets([...selectedTargets, userId]);
      }
    }
  };

  const handleDrawChallenge = () => {
    if (selectedTargets.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cardScale.value = withSpring(1.05, { damping: 10 }, () => {
      cardScale.value = withSpring(1);
    });

    drawChallenge(game.id, selectedTargets);
    setSelectingTarget(false);
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeChallenge(game.id);
    setSelectedTargets([]);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipChallenge(game.id);
    setSelectedTargets([]);
  };

  const handleStartNewRound = () => {
    setSelectingTarget(true);
    setSelectedTargets([]);
  };

  const getTargetNames = () => {
    return state.current_target_ids
      .map((id) => {
        const participant = game.participants.find((p) => p.user_id === id);
        return participant?.display_name ?? 'Unknown';
      })
      .join(' & ');
  };

  // Render difficulty selector
  if (!currentChallenge && !selectingTarget) {
    return (
      <View className="flex-1 p-5">
        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          className="bg-zinc-900/80 rounded-2xl p-4 mb-6"
        >
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-3xl font-bold text-white">
                {state.challenges_completed}
              </Text>
              <Text className="text-gray-500 text-xs">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-white">
                {game.participants.length}
              </Text>
              <Text className="text-gray-500 text-xs">Players</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-white">
                {game.settings.max_skips_per_player}
              </Text>
              <Text className="text-gray-500 text-xs">Skips Each</Text>
            </View>
          </View>
        </Animated.View>

        {/* Difficulty Selection */}
        <Text className="text-gray-400 text-sm font-medium mb-3">
          Select Difficulty
        </Text>

        {(Object.keys(DIFFICULTY_CONFIG) as TruthOrDareDifficulty[]).map(
          (diff, index) => {
            const config = DIFFICULTY_CONFIG[diff];
            const Icon = config.icon;
            const isSelected = difficulty === diff;

            return (
              <Animated.View
                key={diff}
                entering={FadeInDown.delay(150 + index * 50)}
              >
                <Pressable
                  onPress={() => handleSelectDifficulty(diff)}
                  className={cn(
                    'mb-3 rounded-2xl overflow-hidden border-2',
                    isSelected ? 'border-white' : 'border-transparent'
                  )}
                >
                  <View className="bg-zinc-900/80 p-4 flex-row items-center">
                    <LinearGradient
                      colors={[...config.gradient]}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} color="white" />
                    </LinearGradient>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-semibold">
                        {config.label}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {config.description}
                      </Text>
                    </View>
                    <View
                      className={cn(
                        'w-6 h-6 rounded-full border-2 items-center justify-center',
                        isSelected ? 'border-white bg-white' : 'border-gray-600'
                      )}
                    >
                      {isSelected && (
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          }
        )}

        {/* Start Button */}
        <Animated.View entering={FadeInDown.delay(350)} className="mt-auto">
          <Pressable onPress={handleStartNewRound}>
            <LinearGradient
              colors={[...difficultyConfig.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text className="text-white font-bold text-lg">
                Choose Who's Up
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Render target selection
  if (selectingTarget) {
    return (
      <View className="flex-1 p-5">
        <Animated.View entering={FadeIn}>
          <Text className="text-white text-xl font-bold mb-2">
            Who's taking the challenge?
          </Text>
          <Text className="text-gray-400 text-sm mb-6">
            Select 1 player, or 2 for a couples challenge
          </Text>
        </Animated.View>

        {/* Participants */}
        {game.participants.map((participant, index) => {
          const isSelected = selectedTargets.includes(participant.user_id);
          const skipsRemaining =
            game.settings.max_skips_per_player - participant.skips_used;

          return (
            <Animated.View
              key={participant.user_id}
              entering={FadeInDown.delay(index * 50)}
            >
              <Pressable
                onPress={() => handleSelectTarget(participant.user_id)}
                className={cn(
                  'mb-3 bg-zinc-900/80 rounded-2xl p-4 flex-row items-center border-2',
                  isSelected ? 'border-purple-500' : 'border-transparent'
                )}
              >
                {participant.photo ? (
                  <Image
                    source={{ uri: participant.photo }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-purple-500/20 items-center justify-center">
                    <User size={24} color="#a855f7" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-white font-medium">
                    {participant.display_name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {skipsRemaining} skips left
                  </Text>
                </View>
                <View
                  className={cn(
                    'w-6 h-6 rounded-full border-2 items-center justify-center',
                    isSelected
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-600'
                  )}
                >
                  {isSelected && <Check size={14} color="white" />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Draw Button */}
        <Animated.View entering={FadeInDown.delay(300)} className="mt-auto">
          <Pressable
            onPress={handleDrawChallenge}
            disabled={selectedTargets.length === 0}
            className={cn(selectedTargets.length === 0 && 'opacity-50')}
          >
            <LinearGradient
              colors={[...difficultyConfig.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Flame size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Draw Challenge
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Render current challenge
  return (
    <View className="flex-1 p-5">
      {/* Target info */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        className="items-center mb-6"
      >
        <View className="flex-row items-center bg-zinc-900/80 px-4 py-2 rounded-full">
          {state.current_target_ids.length > 1 ? (
            <Users size={16} color="#a855f7" />
          ) : (
            <User size={16} color="#a855f7" />
          )}
          <Text className="text-purple-300 font-medium ml-2">
            {getTargetNames()}
          </Text>
        </View>
      </Animated.View>

      {/* Challenge Card */}
      <Animated.View
        entering={SlideInRight.springify()}
        style={cardAnimatedStyle}
        className="flex-1"
      >
        <LinearGradient
          colors={[...difficultyConfig.gradient]}
          style={{
            flex: 1,
            borderRadius: 24,
            padding: 24,
          }}
        >
          {/* Challenge Type Badge */}
          <View className="flex-row items-center mb-4">
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold uppercase text-xs">
                {currentChallenge?.type}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full ml-2">
              <Text className="text-white font-medium text-xs">
                {difficultyConfig.label}
              </Text>
            </View>
          </View>

          {/* Challenge Content */}
          <View className="flex-1 justify-center">
            <Text className="text-white text-2xl font-bold leading-relaxed">
              {currentChallenge?.content}
            </Text>
          </View>

          {/* Timer */}
          {currentChallenge?.timer_seconds && state.challenge_started_at && (
            <View className="items-center mb-4">
              <GameTimer
                startTime={state.challenge_started_at}
                durationSeconds={currentChallenge.timer_seconds}
                onExpire={() => {
                  // Could auto-skip or show warning
                }}
              />
            </View>
          )}

          {/* Couples indicator */}
          {currentChallenge?.for_couples && (
            <View className="flex-row items-center justify-center bg-white/20 rounded-full py-2 mb-4">
              <Users size={16} color="white" />
              <Text className="text-white font-medium ml-2">
                Couples Challenge
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInDown.delay(200)}
        className="flex-row gap-3 mt-6"
      >
        <Pressable
          onPress={handleSkip}
          className="flex-1 bg-zinc-800 rounded-2xl py-4 flex-row items-center justify-center"
        >
          <SkipForward size={20} color="#9ca3af" />
          <Text className="text-gray-400 font-semibold ml-2">Skip</Text>
        </Pressable>

        <Pressable onPress={handleComplete} className="flex-1">
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Complete</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
