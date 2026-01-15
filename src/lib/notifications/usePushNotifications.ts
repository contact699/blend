/**
 * Push Notifications Hook
 * 
 * React hook for managing push notifications in the app.
 * Handles registration, token storage, and notification routing.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { Subscription } from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  setupNotificationChannels,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getInitialNotification,
  parseNotificationData,
  type NotificationData,
} from './push';
import { useCurrentUser } from '../supabase/hooks';

/**
 * Hook to initialize and manage push notifications
 * Call this once at the app root level
 */
export function usePushNotifications() {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Navigate based on notification data
  const handleNotificationNavigation = useCallback((data: NotificationData | null) => {
    if (!data) return;

    switch (data.type) {
      case 'new_message':
        if (data.threadId) {
          router.push(`/chat/${data.threadId}`);
        }
        break;

      case 'new_match':
        router.push('/(tabs)/likes');
        break;

      case 'new_ping':
        router.push('/(tabs)/pings');
        break;

      case 'event_reminder':
        if (data.eventId) {
          router.push(`/event/${data.eventId}`);
        } else {
          router.push('/(tabs)/events');
        }
        break;

      case 'partner_link_request':
        router.push('/my-relationships');
        break;

      case 'trust_score_update':
      case 'vouch_received':
        router.push('/trust-profile');
        break;

      default:
        // Default to inbox
        router.push('/(tabs)/inbox');
    }
  }, [router]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!user) return;

    const register = async () => {
      // Set up Android channels first
      await setupNotificationChannels();

      // Get push token
      const token = await registerForPushNotifications();
      
      if (token) {
        // Save to database
        await savePushToken(user.id, token);
        console.log('Push token registered:', token.substring(0, 20) + '...');
      }
    };

    register();
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    // Handle notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
      // You can show an in-app toast here if desired
    });

    // Handle notification taps
    responseListener.current = addNotificationResponseListener((response) => {
      const data = parseNotificationData(response.notification);
      handleNotificationNavigation(data);
    });

    // Check if app was launched from a notification
    getInitialNotification().then((response) => {
      if (response) {
        const data = parseNotificationData(response.notification);
        handleNotificationNavigation(data);
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationNavigation]);

  // Cleanup function for logout
  const unregister = useCallback(async () => {
    if (user) {
      await removePushToken(user.id);
    }
  }, [user]);

  return { unregister };
}
