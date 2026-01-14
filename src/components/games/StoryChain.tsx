import { useState } from 'react';
import { View, Text, Pressable, Image, TextInput, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  User,
  Send,
  RotateCcw,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { GameSession } from '@/lib/types';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';
import GameTimer from './GameTimer';

interface StoryChainProps {
  game: GameSession;
  currentUserId: string;
  onEndGame: (cancelled?: boolean) => void;
}

export default function StoryChain({
  game,
  currentUserId,
  onEndGame,
}: StoryChainProps) {
  const [entryText, setEntryText] = useState('');
  const [showFullStory, setShowFullStory] = useState(false);

  const addEntry = useDatingStore((s) => s.addStoryEntry);
  const voteRedo = useDatingStore((s) => s.voteRedo);
  const redoEntry = useDatingStore((s) => s.redoEntry);

  const state = game.state.type === 'story_chain' ? game.state.data : null;
  if (!state) return null;

  const isMyTurn = state.current_author_id === currentUserId;
  const currentAuthor = game.participants.find(
    (p) => p.user_id === state.current_author_id
  );
  const entries = state.entries.filter((e) => !e.is_redone);

  const handleSubmitEntry = () => {
    if (!entryText.trim() || !isMyTurn) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addEntry(game.id, entryText.trim());
    setEntryText('');
  };

  const handleVoteRedo = (entryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voteRedo(game.id, entryId);

    // Check if threshold reached
    const entry = state.entries.find((e) => e.id === entryId);
    if (entry && entry.redo_votes.length + 1 >= state.redo_threshold) {
      redoEntry(game.id, entryId);
    }
  };

  const getAuthorName = (authorId: string) => {
    if (authorId === currentUserId) return 'You';
    const author = game.participants.find((p) => p.user_id === authorId);
    return author?.display_name ?? 'Unknown';
  };

  const getAuthorPhoto = (authorId: string) => {
    const author = game.participants.find((p) => p.user_id === authorId);
    return author?.photo;
  };

  const hasVotedRedo = (entryId: string) => {
    const entry = state.entries.find((e) => e.id === entryId);
    return entry?.redo_votes.includes(currentUserId) ?? false;
  };

  // Build full story text
  const fullStory = entries.map((e) => e.content).join(' ');

  return (
    <View className="flex-1">
      {/* Story Prompt */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        className="mx-5 mt-4 mb-2"
      >
        <LinearGradient
          colors={['#3b82f6', '#6366f1']}
          style={{
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View className="flex-row items-center mb-2">
            <BookOpen size={16} color="white" />
            <Text className="text-white/80 text-xs font-medium ml-2 uppercase">
              Story Prompt
            </Text>
          </View>
          <Text className="text-white font-medium leading-relaxed">
            {state.prompt.prompt}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Current Turn Info */}
      <Animated.View
        entering={FadeInDown.delay(150)}
        className="flex-row items-center justify-between mx-5 my-3 bg-zinc-900/80 rounded-xl p-3"
      >
        <View className="flex-row items-center">
          {currentAuthor?.photo ? (
            <Image
              source={{ uri: currentAuthor.photo }}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center">
              <User size={16} color="#a855f7" />
            </View>
          )}
          <Text className="text-white font-medium ml-2">
            {isMyTurn ? "Your turn!" : `${currentAuthor?.display_name}'s turn`}
          </Text>
        </View>

        {/* Timer */}
        <GameTimer
          startTime={state.turn_started_at}
          durationSeconds={state.turn_duration_seconds}
          onExpire={() => {
            // Could auto-skip or notify
          }}
          size="small"
          showProgress={false}
        />
      </Animated.View>

      {/* Story Entries */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle Full Story View */}
        {entries.length > 2 && (
          <Pressable
            onPress={() => setShowFullStory(!showFullStory)}
            className="flex-row items-center justify-center py-2 mb-2"
          >
            {showFullStory ? (
              <ChevronUp size={16} color="#9ca3af" />
            ) : (
              <ChevronDown size={16} color="#9ca3af" />
            )}
            <Text className="text-gray-500 text-sm ml-1">
              {showFullStory ? 'Show entries' : 'Show full story'}
            </Text>
          </Pressable>
        )}

        {showFullStory ? (
          // Full Story View
          <Animated.View
            entering={FadeIn}
            className="bg-zinc-900/80 rounded-2xl p-4 mb-4"
          >
            <Text className="text-white leading-relaxed">{fullStory}</Text>
          </Animated.View>
        ) : (
          // Entry-by-Entry View
          entries.map((entry, index) => {
            const isOwn = entry.author_id === currentUserId;
            const votedRedo = hasVotedRedo(entry.id);
            const redoVotes = entry.redo_votes.length;

            return (
              <Animated.View
                key={entry.id}
                entering={SlideInUp.delay(index * 50).springify()}
                className="mb-3"
              >
                <View
                  className={cn(
                    'rounded-2xl p-4',
                    isOwn ? 'bg-blue-600/20' : 'bg-zinc-900/80'
                  )}
                >
                  {/* Author */}
                  <View className="flex-row items-center mb-2">
                    {getAuthorPhoto(entry.author_id) ? (
                      <Image
                        source={{ uri: getAuthorPhoto(entry.author_id) }}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center">
                        <User size={12} color="#a855f7" />
                      </View>
                    )}
                    <Text className="text-gray-400 text-sm ml-2">
                      {getAuthorName(entry.author_id)}
                    </Text>
                    <Text className="text-gray-600 text-xs ml-auto">
                      #{index + 1}
                    </Text>
                  </View>

                  {/* Content */}
                  <Text className="text-white leading-relaxed">
                    {entry.content}
                  </Text>

                  {/* Redo Vote Button */}
                  {!isOwn && index === entries.length - 1 && (
                    <Pressable
                      onPress={() => handleVoteRedo(entry.id)}
                      disabled={votedRedo}
                      className={cn(
                        'flex-row items-center mt-3 self-start px-3 py-1.5 rounded-full',
                        votedRedo ? 'bg-amber-500/20' : 'bg-zinc-800'
                      )}
                    >
                      <RotateCcw
                        size={14}
                        color={votedRedo ? '#f59e0b' : '#9ca3af'}
                      />
                      <Text
                        className={cn(
                          'text-xs ml-1.5',
                          votedRedo ? 'text-amber-500' : 'text-gray-400'
                        )}
                      >
                        {votedRedo ? 'Voted' : 'Vote Redo'}{' '}
                        {redoVotes > 0 && `(${redoVotes}/${state.redo_threshold})`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            );
          })
        )}

        {entries.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-gray-500">
              No entries yet. Start the story!
            </Text>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>

      {/* Input Area */}
      <Animated.View entering={FadeInDown.delay(200)} className="p-5 pt-0">
        {isMyTurn ? (
          <View className="bg-zinc-900 rounded-2xl p-3 flex-row items-end">
            <TextInput
              value={entryText}
              onChangeText={setEntryText}
              placeholder="Continue the story..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white py-2 px-2 max-h-24"
              multiline
              maxLength={280}
            />
            <Pressable
              onPress={handleSubmitEntry}
              disabled={!entryText.trim()}
              className={cn(!entryText.trim() && 'opacity-50')}
            >
              <LinearGradient
                colors={['#3b82f6', '#6366f1']}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={20} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View className="bg-zinc-900/50 rounded-2xl p-4 items-center">
            <Text className="text-gray-500">
              Waiting for {currentAuthor?.display_name} to write...
            </Text>
          </View>
        )}

        {/* Character Count */}
        {isMyTurn && entryText.length > 0 && (
          <Text className="text-gray-600 text-xs text-right mt-1">
            {entryText.length}/280
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
