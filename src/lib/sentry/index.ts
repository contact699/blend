/**
 * Sentry Error Tracking Module
 * 
 * Provides crash reporting, error tracking, and performance monitoring.
 * Initialize this at app startup before any other code runs.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry error tracking
 * Call this in the root _layout.tsx before rendering
 */
export function initSentry() {
  try {
    if (!SENTRY_DSN) {
      console.warn('Sentry DSN not configured. Error tracking disabled.');
      return;
    }

    // Safely get app version
    let appVersion = '1.0.0';
    try {
      appVersion = Constants.expoConfig?.version ?? '1.0.0';
    } catch (e) {
      console.warn('Could not read app version, using default');
    }

    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment based on Expo config
      environment: __DEV__ ? 'development' : 'production',

      // App version from Expo config
      release: appVersion,

      // Only send errors in production (disable in dev)
      enabled: !__DEV__,

      // Sample rate for performance monitoring (0.0 to 1.0)
      tracesSampleRate: __DEV__ ? 0 : 0.2,

      // Attach stack traces to all messages
      attachStacktrace: true,

      // Before sending, filter/modify events
      beforeSend(event, hint) {
        // Don't send events in development
        if (__DEV__) {
          console.log('Sentry event (dev):', event.message || event.exception);
          return null;
        }

        // Filter out known non-critical errors
        const message = event.message || '';
        if (
          message.includes('Network request failed') ||
          message.includes('timeout') ||
          message.includes('AbortError')
        ) {
          return null;
        }

        return event;
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'console') {
          return null;
        }
        return breadcrumb;
      },
    });
  } catch (error) {
    // Silently fail - don't crash the app if Sentry fails to initialize
    console.warn('Failed to initialize Sentry:', error);
  }
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Set the current user for Sentry context
 * Call this after user authentication
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add custom tags for filtering in Sentry dashboard
 */
export function setTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Set extra context data
 */
export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}

// ============================================================================
// ERROR CAPTURE
// ============================================================================

/**
 * Capture an exception and send to Sentry
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Start a performance transaction
 * Returns a function to finish the transaction
 */
export function startTransaction(
  name: string,
  op: string
): () => void {
  const transaction = Sentry.startInactiveSpan({
    name,
    op,
  });
  
  return () => {
    transaction?.end();
  };
}

/**
 * Wrap an async function with performance monitoring
 */
export async function withPerformanceTracking<T>(
  name: string,
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  const finish = startTransaction(name, op);
  try {
    return await fn();
  } finally {
    finish();
  }
}

// ============================================================================
// ERROR BOUNDARY WRAPPER
// ============================================================================

/**
 * Sentry's error boundary wrapper for React components
 * Use this to wrap screens or sections of your app
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap a component with Sentry error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactElement
) {
  return Sentry.withErrorBoundary(Component, {
    fallback,
  });
}

// ============================================================================
// NAVIGATION TRACKING
// ============================================================================

/**
 * Track navigation state changes
 * Call this on navigation state change
 */
export function trackNavigation(routeName: string, params?: Record<string, unknown>) {
  addBreadcrumb(`Navigated to ${routeName}`, 'navigation', params);
  
  // Set the current screen as a tag for filtering
  Sentry.setTag('screen', routeName);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export Sentry for advanced usage
export { Sentry };
