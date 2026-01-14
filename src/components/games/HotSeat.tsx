import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, TextInput, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Target,
  User,
  Check,
  SkipForward,
  MessageCircle,
  ChevronRight,
  Shuffle,
} from 'lucide-react-native';
import { GameSession, HotSeatQuestion } from '@/lib/types';
import useDatingStore from '@/lib/state/dating-store';
import { getRandomQuestion, HOT_SEAT_QUESTIONS } from '@/lib/game-content';
import { cn } from '@/lib/cn';
import GameTimer from './GameTimer';

interface HotSeatProps {
  game: GameSession;
  currentUserId: string;
  onEndGame: (cancelled?: boolean) => void;
}

export default function HotSeat({ game, currentUserId, onEndGame }: HotSeatProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);

  const startHotSeat = useDatingStore((s) => s.startHotSeat);
  const askQuestion = useDatingStore((s) => s.askQuestion);
  const answerQuestion = useDatingStore((s) => s.answerQuestion);
  const skipQuestion = useDatingStore((s) => s.skipHotSeatQuestion);
  const nextPerson = useDatingStore((s) => s.nextHotSeatPerson);

  const state = game.state.type === 'hot_seat' ? game.state.data : null;
  if (!state) return null;

  const hotSeatUser = game.participants.find(
    (p) => p.user_id === state.hot_seat_user_id
  );
  const isInHotSeat = state.hot_seat_user_id === currentUserId;
  const currentQuestion = state.current_question;

  const handleAskRandomQuestion = (category?: HotSeatQuestion['category']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const question = getRandomQuestion(category);
    if (question) {
      askQuestion(game.id, question);
    }
  };

  const handleAskCustomQuestion = () => {
    if (!customQuestion.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const question: HotSeatQuestion = {
      id: `custom-${Date.now()}`,
      question: customQuestion.trim(),
      category: 'fun',
      is_custom: true,
      asked_by: currentUserId,
    };
    askQuestion(game.id, question);
    setCustomQuestion('');
    setShowQuestionInput(false);
  };

  const handleAnswer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    answerQuestion(game.id);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipQuestion(game.id);
  };

  const handleNextPerson = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nextPerson(game.id);
  };

  const getAskerName = () => {
    if (!currentQuestion?.asked_by) return null;
    const asker = game.participants.find(
      (p) => p.user_id === currentQuestion.asked_by
    );
    return asker?.display_name ?? 'Someone';
  };

  // Calculate time remaining in hot seat
  const seatTimeRemaining = () => {
    if (!state.seat_started_at) return state.seat_duration_seconds;
    const elapsed =
      (Date.now() - new Date(state.seat_started_at).getTime()) / 1000;
    return Math.max(0, Math.floor(state.seat_duration_seconds - elapsed));
  };

  return (
    <View className="flex-1">
      {/* Hot Seat Info */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        className="items-center py-6 border-b border-zinc-800/50"
      >
        {/* Hot Seat User */}
        <View className="relative mb-3">
          {hotSeatUser?.photo ? (
            <Image
              source={{ uri: hotSeatUser.photo }}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center">
              <User size={40} color="#a855f7" />
            </View>
          )}
          <View className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1.5">
            <Target size={16} color="white" />
          </View>
        </View>

        <Text className="text-white font-bold text-xl">
          {isInHotSeat ? "You're in the Hot Seat!" : `${hotSeatUser?.display_name}'s Turn`}
        </Text>

        {/* Timer */}
        <View className="mt-3 w-48">
          <GameTimer
            startTime={state.seat_started_at}
            durationSeconds={state.seat_duration_seconds}
            onExpire={handleNextPerson}
            size="small"
          />
        </View>

        {/* Stats */}
        <View className="flex-row mt-4 gap-6">
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-400">
              {state.questions_answered}
            </Text>
            <Text className="text-gray-500 text-xs">Answered</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-amber-400">
              {state.questions_skipped}
            </Text>
            <Text className="text-gray-500 text-xs">Skipped</Text>
          </View>
        </View>
      </Animated.View>

      {/* Question Area */}
      <View className="flex-1 p-5">
        {currentQuestion ? (
          // Show current question
          <Animated.View entering={SlideInUp.springify()} className="flex-1">
            <LinearGradient
              colors={['#8b5cf6', '#a855f7']}
              style={{
                flex: 1,
                borderRadius: 24,
                padding: 24,
                maxHeight: 300,
              }}
            >
              {/* Question Badge */}
              <View className="flex-row items-center mb-4">
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white font-medium text-xs uppercase">
                    {currentQuestion.category}
                  </Text>
                </View>
                {currentQuestion.is_custom && (
                  <View className="bg-white/20 px-3 py-1 rounded-full ml-2">
                    <Text className="text-white font-medium text-xs">
                      From {getAskerName()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Question */}
              <View className="flex-1 justify-center">
                <Text className="text-white text-xl font-bold leading-relaxed">
                  {currentQuestion.question}
                </Text>
              </View>

              {/* Answer Timer */}
              {state.question_started_at && (
                <View className="mt-4">
                  <GameTimer
                    startTime={state.question_started_at}
                    durationSeconds={30}
                    onExpire={handleSkip}
                    size="small"
                  />
                </View>
              )}
            </LinearGradient>

            {/* Action Buttons (for hot seat person) */}
            {isInHotSeat && (
              <View className="flex-row gap-3 mt-4">
                <Pressable
                  onPress={handleSkip}
                  className="flex-1 bg-zinc-800 rounded-2xl py-4 flex-row items-center justify-center"
                >
                  <SkipForward size={20} color="#9ca3af" />
                  <Text className="text-gray-400 font-semibold ml-2">Skip</Text>
                </Pressable>

                <Pressable onPress={handleAnswer} className="flex-1">
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
                    <Text className="text-white font-semibold ml-2">
                      Answered
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </Animated.View>
        ) : (
          // Ask question interface (for non-hot-seat players)
          <Animated.View entering={FadeIn} className="flex-1">
            {!isInHotSeat ? (
              <>
                <Text className="text-white font-semibold text-lg mb-4">
                  Ask a Question
                </Text>

                {/* Category Buttons */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                  style={{ flexGrow: 0 }}
                >
                  {(['fun', 'deep', 'spicy', 'relationship'] as const).map(
                    (cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => handleAskRandomQuestion(cat)}
                        className="bg-zinc-800 px-4 py-2 rounded-full mr-2"
                      >
                        <Text className="text-white font-medium capitalize">
                          {cat}
                        </Text>
                      </Pressable>
                    )
                  )}
                </ScrollView>

                {/* Random Question Button */}
                <Pressable
                  onPress={() => handleAskRandomQuestion()}
                  className="bg-zinc-900/80 rounded-2xl p-4 flex-row items-center mb-3"
                >
                  <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                    <Shuffle size={20} color="#a855f7" />
                  </View>
                  <Text className="text-white font-medium ml-3 flex-1">
                    Random Question
                  </Text>
                  <ChevronRight size={20} color="#6b7280" />
                </Pressable>

                {/* Custom Question */}
                {showQuestionInput ? (
                  <View className="bg-zinc-900/80 rounded-2xl p-4">
                    <TextInput
                      value={customQuestion}
                      onChangeText={setCustomQuestion}
                      placeholder="Type your question..."
                      placeholderTextColor="#6b7280"
                      className="text-white text-base mb-3"
                      multiline
                      autoFocus
                    />
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => setShowQuestionInput(false)}
                        className="flex-1 bg-zinc-800 py-2 rounded-xl items-center"
                      >
                        <Text className="text-gray-400">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleAskCustomQuestion}
                        className="flex-1 bg-purple-600 py-2 rounded-xl items-center"
                      >
                        <Text className="text-white font-medium">Ask</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowQuestionInput(true)}
                    className="bg-zinc-900/80 rounded-2xl p-4 flex-row items-center"
                  >
                    <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center">
                      <MessageCircle size={20} color="#ec4899" />
                    </View>
                    <Text className="text-white font-medium ml-3 flex-1">
                      Ask Your Own Question
                    </Text>
                    <ChevronRight size={20} color="#6b7280" />
                  </Pressable>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400 text-center">
                  Waiting for someone to ask you a question...
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* Next Person Button */}
      <View className="p-5 pt-0">
        <Pressable
          onPress={handleNextPerson}
          className="bg-zinc-800 rounded-2xl py-4 items-center"
        >
          <Text className="text-gray-400 font-medium">
            Pass to Next Person
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
