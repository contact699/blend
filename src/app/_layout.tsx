import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useRealtimeAll } from '@/lib/supabase';
import { usePushNotifications } from '@/lib/notifications';
import { initSentry } from '@/lib/sentry';

const queryClient = new QueryClient();

// Custom dark theme for the dating app
const DatingDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0a',
    card: '#1a1a1a',
    primary: '#c084fc',
  },
};

// Inner component to use hooks inside QueryClientProvider
function AppContent() {
  // Subscribe to real-time updates for matches, likes, pings, events
  // DISABLED: This might be crashing the app on startup
  // useRealtimeAll();

  // Initialize push notifications
  usePushNotifications();

  useEffect(() => {
    // Initialize Sentry error tracking
    let sentryInitialized = false;
    try {
      initSentry();
      sentryInitialized = true;
    } catch (e) {
      console.warn('Sentry init failed:', e);
    }

    // Prevent the splash screen from auto-hiding
    let splashScreenPrevented = false;
    try {
      SplashScreen.preventAutoHideAsync();
      splashScreenPrevented = true;
    } catch (e) {
      console.warn('SplashScreen.preventAutoHideAsync failed:', e);
    }

    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      if (splashScreenPrevented) {
        SplashScreen.hideAsync().catch(e => console.warn('SplashScreen.hideAsync failed:', e));
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DatingDarkTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="chat/[threadId]" />
          <Stack.Screen name="group-chat/[threadId]" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="video-call" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="create-group" options={{ presentation: 'modal' }} />
          <Stack.Screen name="create-event" options={{ presentation: 'modal' }} />
          <Stack.Screen name="event/[id]/index" />
          <Stack.Screen name="event/[id]/chat" />
          <Stack.Screen name="event/[id]/manage" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="my-relationships" />
          <Stack.Screen name="education" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="sti-safety" />
          <Stack.Screen name="consent-checklist" />
          <Stack.Screen name="trust-profile" />
          <Stack.Screen name="taste-profile" />
          <Stack.Screen name="link-partner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="leave-review" options={{ presentation: 'modal' }} />
          <Stack.Screen name="vouch-user" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="moderation" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
