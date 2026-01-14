import { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Clock } from 'lucide-react-native';

interface GameTimerProps {
  startTime: string;
  durationSeconds: number;
  onExpire?: () => void;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function GameTimer({
  startTime,
  durationSeconds,
  onExpire,
  showProgress = true,
  size = 'medium',
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const hasExpired = useRef(false);
  const progress = useSharedValue(1);

  useEffect(() => {
    const startMs = new Date(startTime).getTime();
    const endMs = startMs + durationSeconds * 1000;

    // Animate progress bar
    progress.value = withTiming(0, {
      duration: durationSeconds * 1000,
      easing: Easing.linear,
    });

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endMs - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !hasExpired.current) {
        hasExpired.current = true;
        onExpire?.();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, durationSeconds, onExpire, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs}s`;
  };

  const sizeConfig = {
    small: { iconSize: 14, textSize: 'text-sm', height: 'h-1' },
    medium: { iconSize: 18, textSize: 'text-lg', height: 'h-1.5' },
    large: { iconSize: 24, textSize: 'text-2xl', height: 'h-2' },
  };

  const config = sizeConfig[size];
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <View className="items-center">
      {/* Time Display */}
      <View className="flex-row items-center mb-2">
        <Clock
          size={config.iconSize}
          color={isCritical ? '#ef4444' : isLow ? '#f59e0b' : 'white'}
        />
        <Text
          className={`${config.textSize} font-bold ml-2 ${
            isCritical
              ? 'text-red-500'
              : isLow
              ? 'text-amber-500'
              : 'text-white'
          }`}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgress && (
        <View
          className={`w-full ${config.height} bg-white/20 rounded-full overflow-hidden`}
        >
          <Animated.View
            style={[
              progressStyle,
              {
                height: '100%',
                backgroundColor: isCritical
                  ? '#ef4444'
                  : isLow
                  ? '#f59e0b'
                  : '#ffffff',
                borderRadius: 999,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}
