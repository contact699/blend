/**
 * Analytics Integration
 *
 * Centralized analytics tracking for user behavior, features, and funnels.
 * Currently set up for Mixpanel, but can be swapped for PostHog, Amplitude, etc.
 *
 * To enable: Add EXPO_PUBLIC_MIXPANEL_TOKEN to your .env file
 */

import { logger } from './logger';

// Analytics will be lazy-loaded when needed
let mixpanel: any = null;
const ANALYTICS_ENABLED = !!process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;

/**
 * Initialize analytics
 * Call this early in app lifecycle
 */
export async function initAnalytics() {
  if (!ANALYTICS_ENABLED) {
    logger.info('[Analytics] Disabled - no token provided');
    return;
  }

  try {
    // Dynamically import mixpanel only if enabled
    const MixpanelModule = await import('mixpanel-react-native');
    mixpanel = new MixpanelModule.Mixpanel(
      process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!,
      false // trackAutomaticEvents
    );

    await mixpanel.init();
    logger.info('[Analytics] Initialized successfully');
  } catch (error) {
    logger.error('[Analytics] Failed to initialize', error);
  }
}

/**
 * Identify user for analytics
 */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!ANALYTICS_ENABLED || !mixpanel) return;

  try {
    mixpanel.identify(userId);

    if (traits) {
      mixpanel.getPeople().set(traits);
    }

    logger.debug('[Analytics] User identified', { userId });
  } catch (error) {
    logger.error('[Analytics] Failed to identify user', error);
  }
}

/**
 * Track an event
 */
export function track(event: string, properties?: Record<string, any>) {
  if (!ANALYTICS_ENABLED || !mixpanel) {
    logger.debug('[Analytics] Track (disabled)', { event, properties });
    return;
  }

  try {
    mixpanel.track(event, properties);
    logger.debug('[Analytics] Tracked event', { event, properties });
  } catch (error) {
    logger.error('[Analytics] Failed to track event', error, { event });
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (!ANALYTICS_ENABLED || !mixpanel) return;

  try {
    mixpanel.getPeople().set(properties);
  } catch (error) {
    logger.error('[Analytics] Failed to set user properties', error);
  }
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics() {
  if (!ANALYTICS_ENABLED || !mixpanel) return;

  try {
    mixpanel.reset();
    logger.info('[Analytics] Reset');
  } catch (error) {
    logger.error('[Analytics] Failed to reset', error);
  }
}

// ============================================================================
// PREDEFINED EVENTS
// ============================================================================

export const Analytics = {
  // Auth Events
  signUp(method: 'email' | 'google' | 'apple') {
    track('Sign Up', { method });
  },

  signIn(method: 'email' | 'google' | 'apple') {
    track('Sign In', { method });
  },

  signOut() {
    track('Sign Out');
  },

  // Profile Events
  profileCompleted() {
    track('Profile Completed');
  },

  profileUpdated(fields: string[]) {
    track('Profile Updated', { fields });
  },

  photoUploaded(count: number) {
    track('Photo Uploaded', { count });
  },

  // Discovery Events
  profileViewed(profileId: string, source: 'discover' | 'search' | 'event' | 'chat') {
    track('Profile Viewed', { profileId, source });
  },

  swipeAction(action: 'like' | 'pass', profileId: string) {
    track('Swipe Action', { action, profileId });
  },

  // Matching Events
  matchCreated(matchId: string, otherUserId: string) {
    track('Match Created', { matchId, otherUserId });
  },

  likeReceived(fromUserId: string) {
    track('Like Received', { fromUserId });
  },

  // Messaging Events
  messageSent(threadId: string, messageType: 'text' | 'photo' | 'voice' | 'gif') {
    track('Message Sent', { threadId, messageType });
  },

  messageReceived(threadId: string) {
    track('Message Received', { threadId });
  },

  conversationStarted(matchId: string) {
    track('Conversation Started', { matchId });
  },

  // Events Feature
  eventViewed(eventId: string, eventType: string) {
    track('Event Viewed', { eventId, eventType });
  },

  eventCreated(eventId: string, eventType: string) {
    track('Event Created', { eventId, eventType });
  },

  eventRSVP(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    track('Event RSVP', { eventId, status });
  },

  eventAttended(eventId: string) {
    track('Event Attended', { eventId });
  },

  // Games Feature
  gameStarted(gameType: 'truth_or_dare' | 'hot_seat' | 'story_chain', threadId: string) {
    track('Game Started', { gameType, threadId });
  },

  gameCompleted(gameType: string, duration: number) {
    track('Game Completed', { gameType, duration });
  },

  // Partner Linking
  partnerLinked(relationshipType: string) {
    track('Partner Linked', { relationshipType });
  },

  partnerInviteSent(relationshipType: string) {
    track('Partner Invite Sent', { relationshipType });
  },

  // Trust & Safety
  profileReported(reportedUserId: string, reason: string) {
    track('Profile Reported', { reportedUserId, reason });
  },

  userBlocked(blockedUserId: string) {
    track('User Blocked', { blockedUserId });
  },

  stiRecordAdded() {
    track('STI Record Added');
  },

  consentChecklistCompleted() {
    track('Consent Checklist Completed');
  },

  // Search & Filters
  searchPerformed(filters: Record<string, any>) {
    track('Search Performed', filters);
  },

  filterApplied(filterType: string, value: any) {
    track('Filter Applied', { filterType, value });
  },

  // Screen Views
  screenViewed(screenName: string, params?: Record<string, any>) {
    track('Screen Viewed', { screenName, ...params });
  },

  // Feature Usage
  featureUsed(featureName: string, context?: Record<string, any>) {
    track('Feature Used', { featureName, ...context });
  },

  // Errors
  errorOccurred(errorType: string, errorMessage: string) {
    track('Error Occurred', { errorType, errorMessage });
  },
};

export default Analytics;
