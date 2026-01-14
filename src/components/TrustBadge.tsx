import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Star, Check, User, Sprout } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TrustTier, TRUST_TIER_INFO } from '@/lib/types';

interface TrustBadgeProps {
  tier: TrustTier;
  score?: number;
  showScore?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  animated?: boolean;
}

const TIER_GRADIENTS: Record<TrustTier, [string, string]> = {
  newcomer: ['#52525b', '#3f3f46'],
  member: ['#3b82f6', '#1d4ed8'],
  trusted: ['#22c55e', '#15803d'],
  verified: ['#a855f7', '#7c3aed'],
  ambassador: ['#f59e0b', '#d97706'],
};

const TIER_ICONS: Record<TrustTier, React.ReactNode> = {
  newcomer: <Sprout size={14} color="white" />,
  member: <User size={14} color="white" />,
  trusted: <Check size={14} color="white" />,
  verified: <Shield size={14} color="white" />,
  ambassador: <Star size={14} color="white" />,
};

export default function TrustBadge({
  tier,
  score,
  showScore = false,
  size = 'medium',
  onPress,
  animated = true,
}: TrustBadgeProps) {
  const scale = useSharedValue(1);
  const tierInfo = TRUST_TIER_INFO[tier];
  const gradientColors = TIER_GRADIENTS[tier];
  const Icon = TIER_ICONS[tier];

  const sizeStyles = {
    small: {
      container: 'h-6 px-2',
      text: 'text-xs',
      iconSize: 12,
    },
    medium: {
      container: 'h-8 px-3',
      text: 'text-sm',
      iconSize: 14,
    },
    large: {
      container: 'h-10 px-4',
      text: 'text-base',
      iconSize: 18,
    },
  };

  const currentSize = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.95, {}, () => {
        scale.value = withSpring(1);
      });
      onPress();
    }
  };

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
        height: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
        gap: 4,
      }}
    >
      {Icon}
      <Text
        className={`font-semibold text-white ${currentSize.text}`}
        numberOfLines={1}
      >
        {tierInfo.label}
      </Text>
      {showScore && score !== undefined && (
        <View className="bg-white/20 rounded-full px-1.5 ml-1">
          <Text className="text-white text-xs font-bold">{score}</Text>
        </View>
      )}
    </LinearGradient>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={animatedStyle}>
        {onPress ? (
          <Pressable onPress={handlePress}>{content}</Pressable>
        ) : (
          content
        )}
      </Animated.View>
    );
  }

  return onPress ? (
    <Pressable onPress={handlePress}>{content}</Pressable>
  ) : (
    content
  );
}

// Mini version for inline use
interface TrustBadgeMiniProps {
  tier: TrustTier;
  score?: number;
}

export function TrustBadgeMini({ tier, score }: TrustBadgeMiniProps) {
  const tierInfo = TRUST_TIER_INFO[tier];

  return (
    <View className="flex-row items-center gap-1">
      <Text style={{ color: tierInfo.color }}>{tierInfo.icon}</Text>
      {score !== undefined && (
        <Text style={{ color: tierInfo.color }} className="text-xs font-semibold">
          {score}
        </Text>
      )}
    </View>
  );
}

// Icon only version
interface TrustBadgeIconProps {
  tier: TrustTier;
  size?: number;
}

export function TrustBadgeIcon({ tier, size = 20 }: TrustBadgeIconProps) {
  const gradientColors = TIER_GRADIENTS[tier];

  const icons: Record<TrustTier, React.ReactNode> = {
    newcomer: <Sprout size={size * 0.6} color="white" />,
    member: <User size={size * 0.6} color="white" />,
    trusted: <Check size={size * 0.6} color="white" />,
    verified: <Shield size={size * 0.6} color="white" />,
    ambassador: <Star size={size * 0.6} color="white" />,
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icons[tier]}
    </LinearGradient>
  );
}
