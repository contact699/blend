import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, SafeAreaView, Pressable, Dimensions, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Heart,
  Clock,
  Users,
  Eye,
  Shield,
  RotateCcw,
  Share2,
  EyeOff,
  UserCheck,
} from 'lucide-react-native';
import { QUIZ_QUESTIONS } from '@/lib/mock-data';
import { QuizQuestion, QuizResult } from '@/lib/types';
import { useMyQuizResults, useSubmitQuizResults, useUpdateQuizVisibility } from '@/lib/supabase/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_CONFIG: {
  [key: string]: { icon: typeof MessageCircle; color: string; label: string };
} = {
  communication: { icon: MessageCircle, color: '#4ECDC4', label: 'Communication Style' },
  jealousy: { icon: Heart, color: '#FF6B6B', label: 'Jealousy Management' },
  time: { icon: Clock, color: '#FFE66D', label: 'Time Management' },
  hierarchy: { icon: Users, color: '#c084fc', label: 'Hierarchy Preference' },
  disclosure: { icon: Eye, color: '#96CEB4', label: 'Disclosure Level' },
  boundaries: { icon: Shield, color: '#45B7D1', label: 'Boundary Firmness' },
};

function QuestionCard({
  question,
  selectedOption,
  onSelectOption,
}: {
  question: QuizQuestion;
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
}) {
  const config = CATEGORY_CONFIG[question.category];
  const Icon = config?.icon || MessageCircle;

  return (
    <View className="flex-1 px-4">
      <View className="flex-row items-center mb-4">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: (config?.color || '#c084fc') + '20' }}
        >
          <Icon size={16} color={config?.color || '#c084fc'} />
        </View>
        <Text className="text-zinc-400 text-sm">{config?.label || question.category}</Text>
      </View>

      <Text className="text-white font-bold text-xl mb-6 leading-relaxed">
        {question.question}
      </Text>

      <View>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option.id;

          return (
            <Animated.View
              key={option.id}
              entering={FadeInRight.delay(index * 50)}
            >
              <Pressable
                onPress={() => onSelectOption(option.id)}
                className={`mb-3 p-4 rounded-2xl border-2 ${
                  isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 bg-zinc-800/50'
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      isSelected ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'
                    }`}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <Text
                    className={`flex-1 text-base ${isSelected ? 'text-white' : 'text-zinc-300'}`}
                  >
                    {option.text}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function ResultsScreen({
  result,
  onRetake,
  onShare,
  showOnProfile,
  shareWithMatches,
  onToggleShowOnProfile,
  onToggleShareWithMatches,
  isUpdatingVisibility,
}: {
  result: QuizResult;
  onRetake: () => void;
  onShare: () => void;
  showOnProfile: boolean;
  shareWithMatches: boolean;
  onToggleShowOnProfile: (value: boolean) => void;
  onToggleShareWithMatches: (value: boolean) => void;
  isUpdatingVisibility: boolean;
}) {
  const router = useRouter();

  const getProfileDescription = (profile: string) => {
    const descriptions: { [key: string]: string } = {
      'Open Communicator':
        'You thrive on open dialogue and transparency. You prefer knowing details and discussing feelings regularly.',
      'Independent Explorer':
        'You value autonomy and trust in your relationships. You prefer less oversight and more freedom.',
      'Security Seeker':
        'You prioritize emotional security and clear agreements. You appreciate structure and reassurance.',
      'Flexible Navigator':
        'You adapt easily to different situations. You balance independence with connection naturally.',
      'Community Builder':
        'You enjoy kitchen table polyamory and building networks of support with metamours.',
    };
    return descriptions[profile] || 'A unique blend of ENM approaches that works for you.';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'High';
    if (score >= 2.5) return 'Moderate';
    return 'Low';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#22c55e';
    if (score >= 2.5) return '#eab308';
    return '#ef4444';
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
        >
          <ChevronLeft size={24} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-xl ml-4">Your Results</Text>
      </View>

      <Animated.ScrollView
        entering={FadeIn}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
          <LinearGradient
            colors={['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24 }}
          >
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
                <Sparkles size={32} color="white" />
              </View>
              <Text className="text-white/70 text-sm mb-1">Your ENM Profile</Text>
              <Text className="text-white font-bold text-2xl mb-3">
                {result.compatibility_profile}
              </Text>
              <Text className="text-white/80 text-center text-sm leading-relaxed">
                {getProfileDescription(result.compatibility_profile)}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Detailed Scores */}
        <Text className="text-white font-semibold text-lg mb-4">Detailed Scores</Text>

        {Object.entries(result.scores).map(([key, score], index) => {
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
          const config =
            CATEGORY_CONFIG[key.replace('_style', '').replace('_management', '').replace('_preference', '').replace('_level', '').replace('_firmness', '')] ||
            {};
          const Icon = config.icon || Shield;

          return (
            <Animated.View
              key={key}
              entering={FadeInDown.delay(200 + index * 50)}
              className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: (config.color || '#9ca3af') + '20' }}
                  >
                    <Icon size={16} color={config.color || '#9ca3af'} />
                  </View>
                  <Text className="text-white font-medium">{formattedKey}</Text>
                </View>
                <Text
                  className="font-semibold"
                  style={{ color: getScoreColor(score) }}
                >
                  {getScoreLabel(score)}
                </Text>
              </View>
              <View className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    width: `${(score / 5) * 100}%`,
                    backgroundColor: getScoreColor(score),
                  }}
                />
              </View>
            </Animated.View>
          );
        })}

        {/* Visibility Settings */}
        <Text className="text-white font-semibold text-lg mb-4 mt-6">Visibility Settings</Text>
        
        <View className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                <Eye size={20} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Show on Profile</Text>
                <Text className="text-zinc-400 text-sm">Display your profile type badge</Text>
              </View>
            </View>
            <Switch
              value={showOnProfile}
              onValueChange={onToggleShowOnProfile}
              disabled={isUpdatingVisibility}
              trackColor={{ false: '#3f3f46', true: '#c084fc' }}
              thumbColor={showOnProfile ? '#fff' : '#d4d4d8'}
            />
          </View>
        </View>

        <View className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-pink-500/20 items-center justify-center mr-3">
                <UserCheck size={20} color="#db2777" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Share with Matches</Text>
                <Text className="text-zinc-400 text-sm">Used for compatibility scoring</Text>
              </View>
            </View>
            <Switch
              value={shareWithMatches}
              onValueChange={onToggleShareWithMatches}
              disabled={isUpdatingVisibility}
              trackColor={{ false: '#3f3f46', true: '#db2777' }}
              thumbColor={shareWithMatches ? '#fff' : '#d4d4d8'}
            />
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row mt-6 gap-3">
          <Pressable
            onPress={onRetake}
            className="flex-1 flex-row items-center justify-center bg-zinc-800 py-4 rounded-2xl"
          >
            <RotateCcw size={18} color="#c084fc" />
            <Text className="text-white font-medium ml-2">Retake</Text>
          </Pressable>
          <Pressable
            onPress={onShare}
            className="flex-1 flex-row items-center justify-center"
          >
            <LinearGradient
              colors={['#c084fc', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                borderRadius: 16,
              }}
            >
              <Share2 size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Share</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

export default function CompatibilityQuiz() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [shareWithMatches, setShareWithMatches] = useState(true);

  // Fetch existing quiz results
  const { data: existingResults, isLoading: isLoadingResults } = useMyQuizResults();
  const submitQuizMutation = useSubmitQuizResults();
  const updateVisibilityMutation = useUpdateQuizVisibility();

  // Load existing results on mount
  useEffect(() => {
    if (existingResults && !showResults) {
      // Convert database format to UI format
      const dbResult: QuizResult = {
        id: existingResults.id,
        user_id: existingResults.user_id,
        answers: existingResults.answers.map(a => ({
          question_id: a.questionId,
          option_id: a.answerId,
          value: a.value,
        })),
        scores: {
          communication_style: existingResults.communication_score / 20, // Convert from 0-100 to 1-5 scale
          jealousy_management: existingResults.jealousy_score / 20,
          time_management: existingResults.time_management_score / 20,
          hierarchy_preference: existingResults.hierarchy_score / 20,
          disclosure_level: existingResults.disclosure_score / 20,
          boundary_firmness: existingResults.boundaries_score / 20,
        },
        compatibility_profile: existingResults.profile_type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        completed_at: existingResults.created_at,
      };
      
      setResult(dbResult);
      setShowOnProfile(existingResults.show_on_profile);
      setShareWithMatches(existingResults.share_with_matches);
      setShowResults(true);
    }
  }, [existingResults]);

  const progress = (currentQuestion + 1) / QUIZ_QUESTIONS.length;

  const handleSelectOption = (optionId: string) => {
    const question = QUIZ_QUESTIONS[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    // Calculate scores
    const categoryScores: { [key: string]: number[] } = {};

    QUIZ_QUESTIONS.forEach((question) => {
      const answerId = answers[question.id];
      if (answerId) {
        const option = question.options.find((o) => o.id === answerId);
        if (option) {
          if (!categoryScores[question.category]) {
            categoryScores[question.category] = [];
          }
          categoryScores[question.category].push(option.value);
        }
      }
    });

    const scores = {
      communication_style:
        categoryScores.communication?.reduce((a, b) => a + b, 0) /
          (categoryScores.communication?.length || 1) || 3,
      jealousy_management:
        categoryScores.jealousy?.reduce((a, b) => a + b, 0) /
          (categoryScores.jealousy?.length || 1) || 3,
      time_management:
        categoryScores.time?.reduce((a, b) => a + b, 0) /
          (categoryScores.time?.length || 1) || 3,
      hierarchy_preference:
        categoryScores.hierarchy?.reduce((a, b) => a + b, 0) /
          (categoryScores.hierarchy?.length || 1) || 3,
      disclosure_level:
        categoryScores.disclosure?.reduce((a, b) => a + b, 0) /
          (categoryScores.disclosure?.length || 1) || 3,
      boundary_firmness:
        categoryScores.boundaries?.reduce((a, b) => a + b, 0) /
          (categoryScores.boundaries?.length || 1) || 3,
    };

    // Determine profile based on scores
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6;
    let profile = 'Flexible Navigator';
    let profileType: 'open_communicator' | 'independent_explorer' | 'security_seeker' | 'flexible_navigator' | 'community_builder' = 'flexible_navigator';

    if (scores.communication_style >= 4 && scores.disclosure_level >= 4) {
      profile = 'Open Communicator';
      profileType = 'open_communicator';
    } else if (scores.boundary_firmness <= 2 && scores.hierarchy_preference <= 2) {
      profile = 'Independent Explorer';
      profileType = 'independent_explorer';
    } else if (scores.boundary_firmness >= 4 && scores.jealousy_management <= 2) {
      profile = 'Security Seeker';
      profileType = 'security_seeker';
    } else if (scores.hierarchy_preference >= 4) {
      profile = 'Community Builder';
      profileType = 'community_builder';
    }

    // Prepare answers in database format
    const dbAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      answerId: optionId,
      value:
        QUIZ_QUESTIONS.find((q) => q.id === questionId)?.options.find((o) => o.id === optionId)
          ?.value || 3,
    }));

    // Convert scores from 1-5 scale to 0-100 scale for database
    const dbScores = {
      jealousy_score: Math.round(scores.jealousy_management * 20),
      communication_score: Math.round(scores.communication_style * 20),
      hierarchy_score: Math.round(scores.hierarchy_preference * 20),
      disclosure_score: Math.round(scores.disclosure_level * 20),
      time_management_score: Math.round(scores.time_management * 20),
      boundaries_score: Math.round(scores.boundary_firmness * 20),
    };

    try {
      // Save to Supabase
      const savedResult = await submitQuizMutation.mutateAsync({
        answers: dbAnswers,
        ...dbScores,
        profile_type: profileType,
        show_on_profile: showOnProfile,
        share_with_matches: shareWithMatches,
      });

      // Create UI result
      const quizResult: QuizResult = {
        id: savedResult.id,
        user_id: savedResult.user_id,
        answers: dbAnswers.map(a => ({
          question_id: a.questionId,
          option_id: a.answerId,
          value: a.value,
        })),
        scores,
        compatibility_profile: profile,
        completed_at: savedResult.created_at,
      };

      setResult(quizResult);
      setShowResults(true);
    } catch (error) {
      console.error('Error saving quiz results:', error);
      // Still show results even if save fails
      const quizResult: QuizResult = {
        id: `result-${Date.now()}`,
        user_id: 'error',
        answers: dbAnswers.map(a => ({
          question_id: a.questionId,
          option_id: a.answerId,
          value: a.value,
        })),
        scores,
        compatibility_profile: profile,
        completed_at: new Date().toISOString(),
      };

      setResult(quizResult);
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setResult(null);
  };

  const handleToggleShowOnProfile = async (value: boolean) => {
    setShowOnProfile(value);
    try {
      await updateVisibilityMutation.mutateAsync({ show_on_profile: value });
    } catch (error) {
      console.error('Error updating show_on_profile:', error);
      // Revert on error
      setShowOnProfile(!value);
    }
  };

  const handleToggleShareWithMatches = async (value: boolean) => {
    setShareWithMatches(value);
    try {
      await updateVisibilityMutation.mutateAsync({ share_with_matches: value });
    } catch (error) {
      console.error('Error updating share_with_matches:', error);
      // Revert on error
      setShareWithMatches(!value);
    }
  };

  const isComplete = Object.keys(answers).length === QUIZ_QUESTIONS.length;

  if (isLoadingResults) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading quiz results...</Text>
      </View>
    );
  }

  if (showResults && result) {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          <ResultsScreen
            result={result}
            onRetake={handleRetake}
            onShare={() => {
              // Share functionality
            }}
            showOnProfile={showOnProfile}
            shareWithMatches={shareWithMatches}
            onToggleShowOnProfile={handleToggleShowOnProfile}
            onToggleShareWithMatches={handleToggleShareWithMatches}
            isUpdatingVisibility={updateVisibilityMutation.isPending}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-zinc-400">
            {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
          </Text>
          <View className="w-10" />
        </View>

        {/* Progress bar */}
        <View className="px-4 py-2">
          <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: '#c084fc',
              }}
            />
          </View>
        </View>

        {/* Question */}
        <View className="flex-1 pt-6">
          <Animated.View
            key={currentQuestion}
            entering={SlideInRight}
            exiting={SlideOutLeft}
            className="flex-1"
          >
            <QuestionCard
              question={QUIZ_QUESTIONS[currentQuestion]}
              selectedOption={answers[QUIZ_QUESTIONS[currentQuestion].id] || null}
              onSelectOption={handleSelectOption}
            />
          </Animated.View>
        </View>

        {/* Navigation */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Pressable
            onPress={handleBack}
            disabled={currentQuestion === 0}
            className={`px-6 py-3 rounded-xl ${
              currentQuestion === 0 ? 'opacity-50' : ''
            } bg-zinc-800`}
          >
            <Text className="text-white font-medium">Back</Text>
          </Pressable>

          {currentQuestion === QUIZ_QUESTIONS.length - 1 ? (
            <Pressable onPress={handleComplete} disabled={!isComplete}>
              <LinearGradient
                colors={['#c084fc', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                  opacity: isComplete ? 1 : 0.5,
                }}
              >
                <Text className="text-white font-semibold">See Results</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setCurrentQuestion((prev) => prev + 1)}
              disabled={!answers[QUIZ_QUESTIONS[currentQuestion].id]}
              className={`flex-row items-center px-6 py-3 rounded-xl ${
                !answers[QUIZ_QUESTIONS[currentQuestion].id] ? 'opacity-50 bg-zinc-800' : 'bg-purple-500'
              }`}
            >
              <Text className="text-white font-medium mr-1">Next</Text>
              <ChevronRight size={18} color="white" />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
