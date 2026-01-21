/**
 * Error Boundary Components
 *
 * Catches React errors and prevents full app crashes.
 * Provides fallback UI with recovery options.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { ErrorBoundary as SentryErrorBoundary } from '@/lib/sentry';
import { logger } from '@/lib/logger';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  minimal?: boolean;
}

/**
 * Full-screen error fallback
 * Use for critical errors or top-level boundaries
 */
export function ErrorFallbackFull({ error, resetError }: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center mb-6">
        <AlertTriangle size={40} color="#ef4444" />
      </View>

      <Text className="text-white text-2xl font-bold text-center mb-2">
        Something Went Wrong
      </Text>

      <Text className="text-zinc-400 text-center mb-8">
        {error?.message || 'An unexpected error occurred'}
      </Text>

      <View className="w-full gap-3">
        {resetError && (
          <Pressable
            onPress={resetError}
            className="bg-purple-500 rounded-xl py-4 items-center flex-row justify-center"
          >
            <RefreshCw size={20} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">Try Again</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push('/(tabs)/discover')}
          className="bg-zinc-800 rounded-xl py-4 items-center flex-row justify-center"
        >
          <Home size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">Go Home</Text>
        </Pressable>
      </View>

      {__DEV__ && error && (
        <View className="mt-8 p-4 bg-zinc-900 rounded-lg w-full">
          <Text className="text-red-400 text-xs font-mono">
            {error.stack}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Minimal error fallback
 * Use for non-critical sections (cards, lists, etc.)
 */
export function ErrorFallbackMinimal({ error, resetError }: ErrorFallbackProps) {
  return (
    <View className="p-6 items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800">
      <AlertTriangle size={32} color="#ef4444" className="mb-3" />

      <Text className="text-white font-semibold text-center mb-2">
        Unable to Load
      </Text>

      <Text className="text-zinc-400 text-sm text-center mb-4">
        {error?.message || 'Something went wrong'}
      </Text>

      {resetError && (
        <Pressable
          onPress={resetError}
          className="bg-zinc-800 rounded-lg py-2 px-4 flex-row items-center"
        >
          <RefreshCw size={16} color="white" />
          <Text className="text-white font-medium ml-2">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Wrapper component for error boundaries
 */
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: 'full' | 'minimal';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorBoundaryWrapper({
  children,
  fallback = 'full',
  onError,
}: ErrorBoundaryWrapperProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });

    onError?.(error, errorInfo);
  };

  const FallbackComponent = fallback === 'full' ? ErrorFallbackFull : ErrorFallbackMinimal;

  return (
    <SentryErrorBoundary
      fallback={(props: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) => (
        <FallbackComponent
          error={props.error instanceof Error ? props.error : new Error(String(props.error))}
          resetError={props.resetError}
        />
      )}
      onError={(error: unknown, componentStack: string, eventId: string) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        handleError(errorObj, { componentStack } as React.ErrorInfo);
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
}

// Export default for convenience
export default ErrorBoundaryWrapper;
