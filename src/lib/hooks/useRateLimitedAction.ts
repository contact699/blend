/**
 * Rate Limiting Hook
 *
 * Prevents users from spamming actions (swipes, messages, likes, etc.)
 * Provides better UX and prevents API abuse.
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

interface UseRateLimitedActionOptions {
  /**
   * Cooldown period in milliseconds
   * @default 1000
   */
  cooldownMs?: number;

  /**
   * Custom message to show when on cooldown
   */
  cooldownMessage?: string;

  /**
   * Whether to show an alert when on cooldown
   * @default true
   */
  showAlert?: boolean;

  /**
   * Whether to provide haptic feedback on cooldown
   * @default true
   */
  hapticFeedback?: boolean;
}

/**
 * Hook to rate-limit an action
 *
 * @example
 * const { execute: sendLike, isOnCooldown } = useRateLimitedAction(
 *   () => likeMutation.mutateAsync(profileId),
 *   { cooldownMs: 2000 }
 * );
 */
export function useRateLimitedAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  options: UseRateLimitedActionOptions = {}
): {
  execute: (...args: T) => Promise<R | null>;
  isOnCooldown: boolean;
  reset: () => void;
} {
  const {
    cooldownMs = 1000,
    cooldownMessage = 'Please wait a moment before trying again',
    showAlert = true,
    hapticFeedback = true,
  } = options;

  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOnCooldown(false);
  }, []);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      if (isOnCooldown) {
        if (hapticFeedback) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        if (showAlert) {
          Alert.alert('Too Fast', cooldownMessage);
        }

        return null;
      }

      setIsOnCooldown(true);

      try {
        const result = await action(...args);

        // Set timeout to reset cooldown
        timeoutRef.current = setTimeout(() => {
          setIsOnCooldown(false);
          timeoutRef.current = null;
        }, cooldownMs);

        return result;
      } catch (error) {
        // Reset immediately on error so user can retry
        setIsOnCooldown(false);
        throw error;
      }
    },
    [action, cooldownMs, isOnCooldown, cooldownMessage, showAlert, hapticFeedback]
  );

  return { execute, isOnCooldown, reset };
}

/**
 * Hook for debouncing actions (waits for user to stop before executing)
 * Useful for search inputs, etc.
 */
export function useDebouncedAction<T extends any[], R>(
  action: (...args: T) => R,
  delayMs: number = 500
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        action(...args);
        timeoutRef.current = null;
      }, delayMs);
    },
    [action, delayMs]
  );
}
