import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Plus,
  Trash2,
  Flame,
  Target,
  BookOpen,
  Zap,
  Heart,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { GameType, TruthOrDareDifficulty } from '@/lib/types';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';

interface CustomContentManagerProps {
  visible: boolean;
  onClose: () => void;
  gameType?: GameType;
}

type TabType = 'truth_or_dare' | 'hot_seat' | 'story_chain';

const TABS: { type: TabType; label: string; icon: typeof Flame }[] = [
  { type: 'truth_or_dare', label: 'Truth or Dare', icon: Flame },
  { type: 'hot_seat', label: 'Hot Seat', icon: Target },
  { type: 'story_chain', label: 'Story Chain', icon: BookOpen },
];

const DIFFICULTIES: { value: TruthOrDareDifficulty; label: string; icon: typeof Zap }[] = [
  { value: 'playful', label: 'Playful', icon: Zap },
  { value: 'flirty', label: 'Flirty', icon: Heart },
  { value: 'intimate', label: 'Intimate', icon: Sparkles },
];

const QUESTION_CATEGORIES = ['fun', 'deep', 'spicy', 'relationship'] as const;
const STORY_CATEGORIES = ['romantic', 'adventurous', 'fantasy', 'funny'] as const;

export default function CustomContentManager({
  visible,
  onClose,
  gameType,
}: CustomContentManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(
    (gameType as TabType) || 'truth_or_dare'
  );
  const [showAddForm, setShowAddForm] = useState(false);

  // Truth or Dare form state
  const [challengeType, setChallengeType] = useState<'truth' | 'dare'>('truth');
  const [difficulty, setDifficulty] = useState<TruthOrDareDifficulty>('playful');
  const [forCouples, setForCouples] = useState(false);
  const [content, setContent] = useState('');

  // Hot Seat form state
  const [questionCategory, setQuestionCategory] = useState<typeof QUESTION_CATEGORIES[number]>('fun');

  // Story Chain form state
  const [storyCategory, setStoryCategory] = useState<typeof STORY_CATEGORIES[number]>('romantic');

  // Store
  const customChallenges = useDatingStore((s) => s.customChallenges);
  const customQuestions = useDatingStore((s) => s.customQuestions);
  const customPrompts = useDatingStore((s) => s.customPrompts);
  const addCustomChallenge = useDatingStore((s) => s.addCustomChallenge);
  const removeCustomChallenge = useDatingStore((s) => s.removeCustomChallenge);
  const addCustomQuestion = useDatingStore((s) => s.addCustomQuestion);
  const removeCustomQuestion = useDatingStore((s) => s.removeCustomQuestion);
  const addCustomPrompt = useDatingStore((s) => s.addCustomPrompt);
  const removeCustomPrompt = useDatingStore((s) => s.removeCustomPrompt);

  const resetForm = () => {
    setContent('');
    setChallengeType('truth');
    setDifficulty('playful');
    setForCouples(false);
    setQuestionCategory('fun');
    setStoryCategory('romantic');
  };

  const handleAdd = () => {
    if (!content.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (activeTab === 'truth_or_dare') {
      addCustomChallenge({
        type: challengeType,
        difficulty,
        content: content.trim(),
        for_couples: forCouples,
        timer_seconds: 60,
      });
    } else if (activeTab === 'hot_seat') {
      addCustomQuestion({
        question: content.trim(),
        category: questionCategory,
      });
    } else if (activeTab === 'story_chain') {
      addCustomPrompt({
        category: storyCategory,
        prompt: content.trim(),
      });
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeTab === 'truth_or_dare') {
      removeCustomChallenge(id);
    } else if (activeTab === 'hot_seat') {
      removeCustomQuestion(id);
    } else if (activeTab === 'story_chain') {
      removeCustomPrompt(id);
    }
  };

  const getContentList = () => {
    if (activeTab === 'truth_or_dare') return customChallenges;
    if (activeTab === 'hot_seat') return customQuestions;
    return customPrompts;
  };

  const renderAddForm = () => {
    if (activeTab === 'truth_or_dare') {
      return (
        <View className="p-5">
          {/* Type Selection */}
          <Text className="text-gray-400 text-sm mb-2">Type</Text>
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => setChallengeType('truth')}
              className={cn(
                'flex-1 py-3 rounded-xl border-2',
                challengeType === 'truth'
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-zinc-800 border-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-medium',
                  challengeType === 'truth' ? 'text-blue-400' : 'text-gray-400'
                )}
              >
                Truth
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setChallengeType('dare')}
              className={cn(
                'flex-1 py-3 rounded-xl border-2',
                challengeType === 'dare'
                  ? 'bg-orange-500/20 border-orange-500'
                  : 'bg-zinc-800 border-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-medium',
                  challengeType === 'dare' ? 'text-orange-400' : 'text-gray-400'
                )}
              >
                Dare
              </Text>
            </Pressable>
          </View>

          {/* Difficulty Selection */}
          <Text className="text-gray-400 text-sm mb-2">Difficulty</Text>
          <View className="flex-row gap-2 mb-4">
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.value}
                onPress={() => setDifficulty(diff.value)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl border-2 flex-row items-center justify-center',
                  difficulty === diff.value
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-zinc-800 border-transparent'
                )}
              >
                <diff.icon
                  size={14}
                  color={difficulty === diff.value ? '#a855f7' : '#6b7280'}
                />
                <Text
                  className={cn(
                    'ml-1 text-sm',
                    difficulty === diff.value ? 'text-purple-400' : 'text-gray-400'
                  )}
                >
                  {diff.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Couples Toggle */}
          <Pressable
            onPress={() => setForCouples(!forCouples)}
            className={cn(
              'flex-row items-center justify-between p-4 rounded-xl border-2 mb-4',
              forCouples
                ? 'bg-pink-500/20 border-pink-500'
                : 'bg-zinc-800 border-transparent'
            )}
          >
            <Text className={cn(forCouples ? 'text-pink-400' : 'text-gray-400')}>
              Couples Challenge
            </Text>
            <View
              className={cn(
                'w-6 h-6 rounded-full border-2 items-center justify-center',
                forCouples ? 'bg-pink-500 border-pink-500' : 'border-gray-600'
              )}
            >
              {forCouples && <Check size={14} color="white" />}
            </View>
          </Pressable>

          {/* Content Input */}
          <Text className="text-gray-400 text-sm mb-2">
            {challengeType === 'truth' ? 'Question' : 'Challenge'}
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={
              challengeType === 'truth'
                ? "What's a secret you've never told anyone?"
                : 'Send a flirty message to someone in the chat'
            }
            placeholderTextColor="#6b7280"
            multiline
            className="bg-zinc-800 rounded-xl p-4 text-white min-h-[100px]"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      );
    }

    if (activeTab === 'hot_seat') {
      return (
        <View className="p-5">
          {/* Category Selection */}
          <Text className="text-gray-400 text-sm mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {QUESTION_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setQuestionCategory(cat)}
                className={cn(
                  'py-2 px-4 rounded-xl border-2',
                  questionCategory === cat
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-zinc-800 border-transparent'
                )}
              >
                <Text
                  className={cn(
                    'capitalize',
                    questionCategory === cat ? 'text-purple-400' : 'text-gray-400'
                  )}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Question Input */}
          <Text className="text-gray-400 text-sm mb-2">Question</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's the most adventurous thing you've done?"
            placeholderTextColor="#6b7280"
            multiline
            className="bg-zinc-800 rounded-xl p-4 text-white min-h-[100px]"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      );
    }

    // Story Chain
    return (
      <View className="p-5">
        {/* Category Selection */}
        <Text className="text-gray-400 text-sm mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {STORY_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setStoryCategory(cat)}
              className={cn(
                'py-2 px-4 rounded-xl border-2',
                storyCategory === cat
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-zinc-800 border-transparent'
              )}
            >
              <Text
                className={cn(
                  'capitalize',
                  storyCategory === cat ? 'text-blue-400' : 'text-gray-400'
                )}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Prompt Input */}
        <Text className="text-gray-400 text-sm mb-2">Story Prompt</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="It all started when they met at..."
          placeholderTextColor="#6b7280"
          multiline
          className="bg-zinc-800 rounded-xl p-4 text-white min-h-[100px]"
          style={{ textAlignVertical: 'top' }}
        />
      </View>
    );
  };

  const contentList = getContentList();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-zinc-950">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <Text className="text-white text-xl font-bold">Custom Content</Text>
          <Pressable
            onPress={onClose}
            className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
          >
            <X size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 py-3 border-b border-zinc-800">
          {TABS.map((tab) => (
            <Pressable
              key={tab.type}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.type);
                setShowAddForm(false);
              }}
              className={cn(
                'flex-1 py-2 rounded-lg mr-2',
                activeTab === tab.type ? 'bg-purple-500/20' : 'bg-zinc-800/50'
              )}
            >
              <View className="flex-row items-center justify-center">
                <tab.icon
                  size={14}
                  color={activeTab === tab.type ? '#a855f7' : '#6b7280'}
                />
                <Text
                  className={cn(
                    'ml-1 text-xs',
                    activeTab === tab.type ? 'text-purple-400' : 'text-gray-500'
                  )}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {showAddForm ? (
          <ScrollView className="flex-1">
            {renderAddForm()}

            {/* Action Buttons */}
            <View className="flex-row gap-3 px-5 pb-5">
              <Pressable
                onPress={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="flex-1 bg-zinc-800 py-4 rounded-xl"
              >
                <Text className="text-gray-400 text-center font-medium">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={!content.trim()}
                className={cn('flex-1 rounded-xl overflow-hidden', !content.trim() && 'opacity-50')}
              >
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text className="text-white font-semibold">Add</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Content List */}
            <ScrollView className="flex-1 px-5 py-4">
              {contentList.length === 0 ? (
                <Animated.View
                  entering={FadeIn}
                  className="items-center py-12"
                >
                  <View className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center mb-4">
                    {activeTab === 'truth_or_dare' && <Flame size={28} color="#6b7280" />}
                    {activeTab === 'hot_seat' && <Target size={28} color="#6b7280" />}
                    {activeTab === 'story_chain' && <BookOpen size={28} color="#6b7280" />}
                  </View>
                  <Text className="text-gray-400 text-center">
                    No custom {activeTab.replace(/_/g, ' ')} content yet.
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-1">
                    Add your own questions," challenges, or prompts!
                  </Text>
                </Animated.View>
              ) : (
                contentList.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={SlideInRight.delay(index * 50)}
                    className="bg-zinc-900 rounded-xl p-4 mb-3 flex-row items-start"
                  >
                    <View className="flex-1 mr-3">
                      {'content' in item && (
                        <Text className="text-white">{item.content}</Text>
                      )}
                      {'question' in item && (
                        <Text className="text-white">{item.question}</Text>
                      )}
                      {'prompt' in item && (
                        <Text className="text-white">{item.prompt}</Text>
                      )}
                      <View className="flex-row mt-2 gap-2">
                        {'type' in item && (
                          <View className="bg-zinc-800 px-2 py-1 rounded">
                            <Text className="text-gray-500 text-xs capitalize">
                              {item.type}
                            </Text>
                          </View>
                        )}
                        {'difficulty' in item && (
                          <View className="bg-zinc-800 px-2 py-1 rounded">
                            <Text className="text-gray-500 text-xs capitalize">
                              {item.difficulty}
                            </Text>
                          </View>
                        )}
                        {'category' in item && (
                          <View className="bg-zinc-800 px-2 py-1 rounded">
                            <Text className="text-gray-500 text-xs capitalize">
                              {item.category}
                            </Text>
                          </View>
                        )}
                        {'for_couples' in item && item.for_couples && (
                          <View className="bg-pink-500/20 px-2 py-1 rounded">
                            <Text className="text-pink-400 text-xs">Couples</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(item.id)}
                      className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </ScrollView>

            {/* Add Button */}
            <View className="px-5 pb-8 pt-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddForm(true);
                }}
              >
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Add Custom{' '}
                    {activeTab === 'truth_or_dare'
                      ? 'Challenge'
                      : activeTab === 'hot_seat'
                      ? 'Question'
                      : 'Prompt'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
