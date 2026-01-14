import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Heart, Sparkles, Zap, Star } from 'lucide-react-native';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface CompatibilityBadgeProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
  onPress?: () => void;
  className?: string;
}

const SIZE_CONFIG = {
  small: {
    container: 40,
    iconSize: 14,
    fontSize: 'text-xs',
    fontWeight: 'font-semibold',
  },
  medium: {
    container: 56,
    iconSize: 18,
    fontSize: 'text-sm',
    fontWeight: 'font-bold',
  },
  large: {
    container: 72,
    iconSize: 24,
    fontSize: 'text-base',
    fontWeight: 'font-bold',
  },
};

function getScoreColors(score: number): [string, string] {
  if (score >= 85) {
    return ['#ec4899', '#f43f5e']; // Pink to rose - exceptional
  } else if (score >= 70) {
    return ['#8b5cf6', '#a855f7']; // Violet to purple - strong
  } else if (score >= 55) {
    return ['#3b82f6', '#6366f1']; // Blue to indigo - good
  } else if (score >= 40) {
    return ['#06b6d4', '#0ea5e9']; // Cyan to sky - moderate
  } else {
    return ['#64748b', '#94a3b8']; // Slate - low
  }
}

function getScoreIcon(score: number, size: number) {
  if (score >= 85) {
    return <Sparkles size={size} color="white" />;
  } else if (score >= 70) {
    return <Heart size={size} color="white" fill="white" />;
  } else if (score >= 55) {
    return <Star size={size} color="white" />;
  } else {
    return <Zap size={size} color="white" />;
  }
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Exploring';
}

export default function CompatibilityBadge({
  score,
  size = 'medium',
  showLabel = false,
  animated = true,
  onPress,
  className,
}: CompatibilityBadgeProps) {
  const config = SIZE_CONFIG[size];
  const colors = getScoreColors(score);

  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, { damping: 12 });
      if (score >= 70) {
        // Pulse animation for high scores
        glow.value = withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        );
      }
    } else {
      scale.value = 1;
    }
  }, [animated, score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.5,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const BadgeContent = (
    <Animated.View
      style={animatedStyle}
      className={cn('items-center', className)}
    >
      {/* Glow effect for high scores */}
      {score >= 70 && (
        <Animated.View
          style={[
            glowStyle,
            {
              position: 'absolute',
              width: config.container + 16,
              height: config.container + 16,
              borderRadius: (config.container + 16) / 2,
              backgroundColor: colors[0],
            },
          ]}
        />
      )}

      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View className="items-center">
          {getScoreIcon(score, config.iconSize)}
          <Text
            className={cn(
              'text-white mt-0.5',
              config.fontSize,
              config.fontWeight
            )}
          >
            {score}%
          </Text>
        </View>
      </LinearGradient>

      {showLabel && (
        <Text className="text-gray-400 text-xs mt-1.5 font-medium">
          {getScoreLabel(score)}
        </Text>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} hitSlop={8}>
        {BadgeContent}
      </Pressable>
    );
  }

  return BadgeContent;
}

// Compact inline version for cards
export function CompatibilityPill({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const colors = getScoreColors(score);

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {getScoreIcon(score, 12)}
      <Text className={cn('text-white text-xs font-semibold', className)}>
        {score}% Match
      </Text>
    </LinearGradient>
  );
}

// Mini version showing just score
export function CompatibilityDot({
  score,
  size = 24,
}: {
  score: number;
  size?: number;
}) {
  const colors = getScoreColors(score);

  return (
    <LinearGradient
      colors={colors}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        className="text-white font-bold"
        style={{ fontSize: size * 0.4 }}
      >
        {score}
      </Text>
    </LinearGradient>
  );
}
