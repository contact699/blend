/**
 * State Management - Domain-Specific Stores
 *
 * The Zustand store has been split into domain-specific stores for better:
 * - Performance (lazy loading, selective subscriptions)
 * - Maintainability (smaller, focused files)
 * - Type safety (isolated concerns)
 *
 * Usage:
 * ```tsx
 * import { useAuthStore, useProfileStore } from '@/lib/state';
 *
 * function MyComponent() {
 *   // Subscribe to specific slices
 *   const isOnboarded = useAuthStore(s => s.isOnboarded);
 *   const profile = useProfileStore(s => s.currentProfile);
 *
 *   // Get actions
 *   const setOnboarded = useAuthStore(s => s.setOnboarded);
 *
 *   return ...;
 * }
 * ```
 */

// Store exports
export { default as useAuthStore } from './auth-store';
export { default as useProfileStore } from './profile-store';
export { default as useMatchingStore } from './matching-store';
export { default as useMessagingStore } from './messaging-store';
export { default as useGamesStore } from './games-store';
export { default as useSearchStore } from './search-store';
export { default as useAIMatchingStore } from './ai-matching-store';
export { default as useTrustStore } from './trust-store';
export { default as useEventsStore } from './events-store';

// Backwards compatibility: Re-export the old unified store
// This allows existing code to continue working while we migrate
export { default as useDatingStore } from './dating-store';

// Utility functions
import useAuthStore from './auth-store';
import useProfileStore from './profile-store';
import useMatchingStore from './matching-store';
import useMessagingStore from './messaging-store';
import useGamesStore from './games-store';
import useSearchStore from './search-store';
import useAIMatchingStore from './ai-matching-store';
import useTrustStore from './trust-store';
import useEventsStore from './events-store';

/**
 * Reset all stores to their initial state
 * Call this on user logout
 */
export function resetAllStores() {
  useAuthStore.getState().reset();
  useProfileStore.getState().reset();
  useMatchingStore.getState().reset();
  useMessagingStore.getState().reset();
  useGamesStore.getState().reset();
  useSearchStore.getState().reset();
  useAIMatchingStore.getState().reset();
  useTrustStore.getState().reset();
  useEventsStore.getState().reset();
}

/**
 * Get current user ID from auth store
 * Useful for passing to other store actions
 */
export function getCurrentUserId(): string {
  return useAuthStore.getState().currentUserId;
}

/**
 * Get current profile from profile store
 */
export function getCurrentProfile() {
  return useProfileStore.getState().currentProfile;
}
