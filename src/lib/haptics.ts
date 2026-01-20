/**
 * Haptic Feedback Utility
 *
 * Provides consistent haptic feedback across the app.
 * Wraps expo-haptics with sensible defaults for common interactions.
 */

import * as Haptics from 'expo-haptics';

/**
 * Light impact - for subtle interactions
 * Use for: Toggling switches, selecting items, tapping cards
 */
export const lightImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium impact - for standard interactions
 * Use for: Button presses, like/pass actions, sending messages
 */
export const mediumImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy impact - for significant interactions
 * Use for: Matches, deleting items, completing important actions
 */
export const heavyImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Success notification - for positive outcomes
 * Use for: Match success, message sent, profile completed
 */
export const success = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning notification - for cautionary actions
 * Use for: Rate limiting, almost out of likes, validation warnings
 */
export const warning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error notification - for errors
 * Use for: Failed requests, validation errors, blocked actions
 */
export const error = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection feedback - for changing selections
 * Use for: Scrolling through options, picker wheels
 */
export const selection = () => {
  Haptics.selectionAsync();
};

/**
 * Haptic feedback for pressable components
 * Returns onPressIn handler that triggers haptics
 */
export const usePressableHaptics = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  return {
    onPressIn: () => {
      switch (style) {
        case 'light':
          lightImpact();
          break;
        case 'heavy':
          heavyImpact();
          break;
        default:
          mediumImpact();
      }
    },
  };
};

/**
 * Haptic patterns for common app actions
 */
export const haptics = {
  // Basic interactions
  tap: lightImpact,
  press: mediumImpact,
  longPress: heavyImpact,

  // User actions
  like: () => mediumImpact(),
  pass: () => lightImpact(),
  match: () => {
    // Double impact for emphasis
    heavyImpact();
    setTimeout(() => heavyImpact(), 100);
  },

  // Messaging
  sendMessage: () => lightImpact(),
  receiveMessage: () => lightImpact(),

  // Navigation
  tabSwitch: () => lightImpact(),
  swipeGesture: () => selection(),

  // Outcomes
  success,
  warning,
  error,

  // Game actions
  gameStart: () => mediumImpact(),
  turnComplete: () => lightImpact(),
  gameEnd: () => heavyImpact(),

  // Trust & Safety
  report: () => warning(),
  block: () => heavyImpact(),

  // Events
  rsvp: () => mediumImpact(),
  checkIn: () => success(),
};

export default haptics;
