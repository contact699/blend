/**
 * Push Notifications Module
 * 
 * Handles Expo push notifications for:
 * - New messages
 * - New matches
 * - New pings
 * - Event reminders
 * - Partner link requests
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 
  | 'new_message'
  | 'new_match'
  | 'new_ping'
  | 'event_reminder'
  | 'partner_link_request'
  | 'trust_score_update'
  | 'vouch_received';

export interface NotificationData {
  type: NotificationType;
  threadId?: string;
  matchId?: string;
  eventId?: string;
  senderId?: string;
  senderName?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register for push notifications and get the Expo push token
 * Returns null if device doesn't support push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Save the push token to the user's profile in Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ 
      push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to save push token:', error);
    throw error;
  }
}

/**
 * Remove push token from user's profile (on logout)
 */
export async function removePushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ 
      push_token: null,
      push_token_updated_at: null,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to remove push token:', error);
  }
}

// ============================================================================
// ANDROID CHANNEL SETUP
// ============================================================================

/**
 * Set up notification channels for Android
 * This must be called early in app initialization
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // Messages channel - high priority
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#c084fc',
    sound: 'default',
  });

  // Matches channel - high priority
  await Notifications.setNotificationChannelAsync('matches', {
    name: 'Matches',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#ec4899',
    sound: 'default',
  });

  // Events channel - default priority
  await Notifications.setNotificationChannelAsync('events', {
    name: 'Events',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#10b981',
  });

  // Social channel - default priority (pings, vouches, etc.)
  await Notifications.setNotificationChannelAsync('social', {
    name: 'Social',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#8b5cf6',
  });
}

// ============================================================================
// NOTIFICATION LISTENERS
// ============================================================================

export type NotificationReceivedListener = (
  notification: Notifications.Notification
) => void;

export type NotificationResponseListener = (
  response: Notifications.NotificationResponse
) => void;

/**
 * Subscribe to notifications received while app is foregrounded
 */
export function addNotificationReceivedListener(
  listener: NotificationReceivedListener
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Subscribe to notification taps (user interaction)
 */
export function addNotificationResponseListener(
  listener: NotificationResponseListener
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Get the notification that launched the app (if any)
 */
export async function getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

// ============================================================================
// LOCAL NOTIFICATIONS (for testing)
// ============================================================================

/**
 * Schedule a local notification (useful for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  seconds: number = 1
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as unknown as Record<string, unknown>,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================================================
// HELPER: Parse notification data for navigation
// ============================================================================

/**
 * Parse notification data and return navigation params
 */
export function parseNotificationData(
  notification: Notifications.Notification
): NotificationData | null {
  const data = notification.request.content.data;
  
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    type: data.type as NotificationType,
    threadId: data.threadId as string | undefined,
    matchId: data.matchId as string | undefined,
    eventId: data.eventId as string | undefined,
    senderId: data.senderId as string | undefined,
    senderName: data.senderName as string | undefined,
  };
}
