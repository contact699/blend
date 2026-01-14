import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Flag, MoreVertical } from 'lucide-react-native';
import { GameSession, GameType } from '@/lib/types';
import { GameSession as DbGameSession, GameType as DbGameType } from '@/lib/supabase/types';
import { GAME_INFO } from '@/lib/game-content';
import TruthOrDare from './TruthOrDare';
import HotSeat from './HotSeat';
import StoryChain from './StoryChain';
import { useEndGame } from '@/lib/supabase/hooks';

interface GameOverlayProps {
  visible: boolean;
  game: DbGameSession | GameSession | null;
  currentUserId: string;
  onClose: () => void;
  onEndGame: (cancelled?: boolean) => void;
}

const GAME_GRADIENTS: Record<DbGameType, readonly [string, string]> = {
  truth_or_dare: ['#ef4444', '#f97316'],
  hot_seat: ['#8b5cf6', '#a855f7'],
  story_chain: ['#3b82f6', '#6366f1'],
  mystery_date_planner: ['#ec4899', '#f43f5e'],
  compatibility_triangle: ['#14b8a6', '#06b6d4'],
  group_challenge: ['#f59e0b', '#eab308'],
};

export default function GameOverlay({
  visible,
  game,
  currentUserId,
  onClose,
  onEndGame,
}: GameOverlayProps) {
  const endGameMutation = useEndGame();

  if (!game) return null;

  const gameInfo = GAME_INFO[game.game_type as GameType];
  const gradient = GAME_GRADIENTS[game.game_type as DbGameType];

  const handleEndGame = async (cancelled = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await endGameMutation.mutateAsync({
        gameSessionId: game.id,
        status: cancelled ? 'cancelled' : 'completed',
      });
      onEndGame(cancelled);
    } catch (error) {
      console.error('Error ending game:', error);
      // Still call onEndGame to close the overlay
      onEndGame(cancelled);
    }
  };

  const renderGameContent = () => {
    switch (game.game_type) {
      case 'truth_or_dare':
        return (
          <TruthOrDare
            game={game}
            currentUserId={currentUserId}
            onEndGame={handleEndGame}
          />
        );
      case 'hot_seat':
        return (
          <HotSeat
            game={game}
            currentUserId={currentUserId}
            onEndGame={handleEndGame}
          />
        );
      case 'story_chain':
        return (
          <StoryChain
            game={game}
            currentUserId={currentUserId}
            onEndGame={handleEndGame}
          />
        );
      default:
        return (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Coming Soon
            </Text>
            <Text className="text-gray-400 text-center">
              {gameInfo.name} is not yet implemented. Stay tuned!
            </Text>
            <Pressable
              onPress={() => handleEndGame(true)}
              className="mt-6 bg-zinc-800 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-medium">Close</Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => handleEndGame(true)}
    >
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1" edges={['top']}>
            {/* Header */}
            <Animated.View
              entering={FadeIn.delay(100)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800/50"
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={[...gradient]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white font-bold text-sm">
                    {gameInfo.name.charAt(0)}
                  </Text>
                </LinearGradient>
                <View className="ml-3">
                  <Text className="text-white font-semibold">
                    {gameInfo.name}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {game.participants.length} players
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                {/* Report/Options */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Could show options menu
                  }}
                  className="w-10 h-10 bg-zinc-800/80 rounded-full items-center justify-center"
                >
                  <MoreVertical size={18} color="#9ca3af" />
                </Pressable>

                {/* Close */}
                <Pressable
                  onPress={() => handleEndGame(true)}
                  className="w-10 h-10 bg-zinc-800/80 rounded-full items-center justify-center"
                >
                  <X size={18} color="#9ca3af" />
                </Pressable>
              </View>
            </Animated.View>

            {/* Game Content */}
            <View className="flex-1">{renderGameContent()}</View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  );
}
