import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// REMOVED ALL IMPORTS THAT ACCESS NATIVE MODULES:
// - expo-splash-screen (native module)
// - react-native-keyboard-controller (native module)
// - @/lib/supabase realtime hooks (uses supabase)
// - @/lib/notifications (native module)
// - @/lib/sentry (native module)
// Even importing these can cause crashes before React Native is ready!

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
  // DISABLED ALL NATIVE MODULE INITIALIZATION TO PREVENT CRASHES:
  // - useRealtimeAll() - Supabase realtime subscriptions
  // - usePushNotifications() - Expo notifications
  // - initSentry() - Sentry error tracking
  // - SplashScreen API - Native splash screen control
  //
  // All of these can cause crashes if accessed before React Native bridge is ready.
  // App will start in minimal mode - re-enable features one by one once stable.

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
