import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  Zap,
  AlertCircle,
  Lightbulb,
  Check,
} from 'lucide-react-native';
import { CompatibilityScore } from '@/lib/types';
import { cn } from '@/lib/cn';

interface MatchInsightsProps {
  score: CompatibilityScore;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface DimensionConfig {
  label: string;
  icon: React.ReactNode;
  maxScore: number;
  color: string;
}

const DIMENSION_CONFIG: Record<string, DimensionConfig> = {
  intent_compatibility: {
    label: 'Shared Goals',
    icon: <Target size={16} color="#f59e0b" />,
    maxScore: 25,
    color: '#f59e0b',
  },
  quiz_compatibility: {
    label: 'Personality',
    icon: <Sparkles size={16} color="#a855f7" />,
    maxScore: 20,
    color: '#a855f7',
  },
  relationship_structure_fit: {
    label: 'Relationship Style',
    icon: <Users size={16} color="#ec4899" />,
    maxScore: 15,
    color: '#ec4899',
  },
  communication_style_match: {
    label: 'Communication',
    icon: <MessageCircle size={16} color="#3b82f6" />,
    maxScore: 15,
    color: '#3b82f6',
  },
  values_alignment: {
    label: 'Values',
    icon: <Heart size={16} color="#ef4444" />,
    maxScore: 15,
    color: '#ef4444',
  },
  behavioral_compatibility: {
    label: 'Lifestyle',
    icon: <Zap size={16} color="#10b981" />,
    maxScore: 10,
    color: '#10b981',
  },
};

function DimensionBar({
  dimension,
  score,
  delay = 0,
}: {
  dimension: string;
  score: { score: number; factors: string[] };
  delay?: number;
}) {
  const config = DIMENSION_CONFIG[dimension];
  if (!config) return null;

  const percentage = Math.round((score.score / config.maxScore) * 100);

  return (
    <Animated.View
      entering={SlideInRight.delay(delay).springify()}
      className="mb-3"
    >
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          {config.icon}
          <Text className="text-white text-sm ml-2">{config.label}</Text>
        </View>
        <Text className="text-gray-400 text-sm">
          {score.score}/{config.maxScore}
        </Text>
      </View>

      <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <Animated.View
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: config.color,
            borderRadius: 999,
          }}
        />
      </View>

      {score.factors.length > 0 && (
        <View className="flex-row flex-wrap mt-1 gap-1">
          {score.factors.slice(0, 2).map((factor, idx) => (
            <View
              key={idx}
              className="bg-zinc-800/50 px-2 py-0.5 rounded-full"
            >
              <Text className="text-gray-500 text-xs">{factor}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default function MatchInsights({
  score,
  expanded: controlledExpanded,
  onToggle,
  className,
}: MatchInsightsProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!expanded);
    }
  };

  return (
    <View className={cn('bg-zinc-900/80 rounded-2xl overflow-hidden', className)}>
      {/* Header - Always visible */}
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center flex-1">
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="white" />
          </LinearGradient>
          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold">Why You Match</Text>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              {score.match_explanation || 'See your compatibility breakdown'}
            </Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color="#9ca3af" />
        ) : (
          <ChevronDown size={20} color="#9ca3af" />
        )}
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="px-4 pb-4"
        >
          {/* Dimension Breakdown */}
          <View className="mb-4">
            {Object.entries(score.dimensions).map(([key, value], idx) => (
              <DimensionBar
                key={key}
                dimension={key}
                score={value}
                delay={idx * 50}
              />
            ))}
          </View>

          {/* Conversation Starters */}
          {score.conversation_starters && score.conversation_starters.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(300)}
              className="bg-zinc-800/50 rounded-xl p-3 mb-3"
            >
              <View className="flex-row items-center mb-2">
                <Lightbulb size={16} color="#f59e0b" />
                <Text className="text-amber-500 text-sm font-medium ml-2">
                  Conversation Starters
                </Text>
              </View>
              {score.conversation_starters.slice(0, 3).map((starter, idx) => (
                <View key={idx} className="flex-row items-start mt-1.5">
                  <Text className="text-amber-500/50 mr-2">•</Text>
                  <Text className="text-gray-300 text-sm flex-1">
                    {starter}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Potential Challenges */}
          {score.potential_challenges && score.potential_challenges.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(400)}
              className="bg-zinc-800/50 rounded-xl p-3"
            >
              <View className="flex-row items-center mb-2">
                <AlertCircle size={16} color="#f87171" />
                <Text className="text-red-400 text-sm font-medium ml-2">
                  Things to Explore
                </Text>
              </View>
              {score.potential_challenges.slice(0, 2).map((challenge, idx) => (
                <View key={idx} className="flex-row items-start mt-1.5">
                  <Text className="text-red-400/50 mr-2">•</Text>
                  <Text className="text-gray-300 text-sm flex-1">
                    {challenge}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// Compact version for quick display
export function MatchInsightsCompact({
  score,
  onPress,
}: {
  score: CompatibilityScore;
  onPress?: () => void;
}) {
  // Find top 3 scoring dimensions
  const topDimensions = Object.entries(score.dimensions)
    .map(([key, value]) => ({
      key,
      ...value,
      config: DIMENSION_CONFIG[key],
    }))
    .filter((d) => d.config)
    .sort((a, b) => {
      const aPercent = a.score / (a.config?.maxScore ?? 1);
      const bPercent = b.score / (b.config?.maxScore ?? 1);
      return bPercent - aPercent;
    })
    .slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-zinc-900/60 rounded-xl px-3 py-2"
    >
      <View className="flex-row items-center flex-1 gap-3">
        {topDimensions.map((dim) => (
          <View key={dim.key} className="flex-row items-center">
            {dim.config?.icon}
            <Text className="text-gray-400 text-xs ml-1">
              {Math.round((dim.score / (dim.config?.maxScore ?? 1)) * 100)}%
            </Text>
          </View>
        ))}
      </View>
      <ChevronDown size={16} color="#6b7280" />
    </Pressable>
  );
}

// Summary badges for quick viewing
export function MatchHighlights({
  score,
  maxHighlights = 3,
}: {
  score: CompatibilityScore;
  maxHighlights?: number;
}) {
  const highlights: { label: string; icon: React.ReactNode }[] = [];

  const dims = score.dimensions;

  if (dims.intent_compatibility.score >= 20) {
    highlights.push({
      label: 'Aligned Goals',
      icon: <Target size={12} color="#f59e0b" />,
    });
  }
  if (dims.quiz_compatibility.score >= 15) {
    highlights.push({
      label: 'Personality Click',
      icon: <Sparkles size={12} color="#a855f7" />,
    });
  }
  if (dims.communication_style_match.score >= 12) {
    highlights.push({
      label: 'Great Communication',
      icon: <MessageCircle size={12} color="#3b82f6" />,
    });
  }
  if (dims.values_alignment.score >= 12) {
    highlights.push({
      label: 'Shared Values',
      icon: <Heart size={12} color="#ef4444" />,
    });
  }
  if (dims.relationship_structure_fit.score >= 12) {
    highlights.push({
      label: 'Compatible Style',
      icon: <Users size={12} color="#ec4899" />,
    });
  }

  if (highlights.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {highlights.slice(0, maxHighlights).map((h, idx) => (
        <Animated.View
          key={idx}
          entering={FadeIn.delay(idx * 100)}
          className="flex-row items-center bg-zinc-800/80 px-2.5 py-1.5 rounded-full"
        >
          {h.icon}
          <Text className="text-gray-300 text-xs ml-1.5">{h.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
