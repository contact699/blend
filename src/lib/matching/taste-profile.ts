/**
 * Taste Profile Analyzer
 *
 * Analyzes user behavior patterns to build a taste profile
 * that predicts what types of profiles they'll like.
 */

import {
  Profile,
  ProfileView,
  UserTasteProfile,
  AttractionPatterns,
  BehavioralPatterns,
  RelationshipStructure,
  ConversationMetrics,
} from '../types';

// Default taste profile for new users
export const DEFAULT_TASTE_PROFILE: UserTasteProfile = {
  user_id: '',
  attraction_patterns: {
    preferred_age_range: [21, 55],
    avg_liked_age: 0,
    bio_length_preference: 'medium',
    preferred_photo_count: 3,
    prefers_voice_intros: false,
    preferred_relationship_structures: [],
    preferred_intents: [],
    values_keywords: [],
    activity_keywords: [],
    communication_keywords: [],
    preferred_pace: 'medium',
    preferred_response_style: 'relaxed',
  },
  behavioral_patterns: {
    avg_daily_sessions: 0,
    avg_session_duration_mins: 0,
    typical_active_hours: [],
    most_active_day: 0,
    avg_profiles_viewed_per_session: 0,
    like_rate: 0,
    message_initiation_rate: 0,
    message_style: 'balanced',
    avg_message_length: 0,
    response_speed: 'moderate',
    avg_response_time_mins: 0,
    avg_days_to_first_message: 0,
    avg_days_to_meetup_suggestion: 0,
  },
  total_profiles_viewed: 0,
  total_likes: 0,
  total_passes: 0,
  total_matches: 0,
  total_conversations: 0,
  successful_connections: 0,
  confidence_score: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Analyze profile views to extract attraction patterns
 */
export function analyzeAttractionPatterns(
  views: ProfileView[],
  profiles: Map<string, Profile>
): AttractionPatterns {
  const likedViews = views.filter((v) => v.action === 'like' || v.action === 'super_like');

  if (likedViews.length < 5) {
    // Not enough data
    return DEFAULT_TASTE_PROFILE.attraction_patterns;
  }

  // Analyze liked profiles
  const likedProfiles = likedViews
    .map((v) => profiles.get(v.viewed_profile_id))
    .filter((p): p is Profile => p !== undefined);

  // Age preferences
  const ages = likedProfiles.map((p) => p.age).filter((a) => a > 0);
  const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 30;
  const minAge = ages.length > 0 ? Math.min(...ages) : 21;
  const maxAge = ages.length > 0 ? Math.max(...ages) : 55;

  // Bio length preference
  const bioLengths = likedProfiles.map((p) => p.bio?.length || 0);
  const avgBioLength = bioLengths.reduce((a, b) => a + b, 0) / bioLengths.length;
  const bioPreference: AttractionPatterns['bio_length_preference'] =
    avgBioLength < 100 ? 'short' : avgBioLength < 300 ? 'medium' : 'long';

  // Photo count preference
  const photoCounts = likedProfiles.map((p) => p.photos?.length || 0);
  const avgPhotoCount = photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length;

  // Voice intro preference
  const withVoice = likedProfiles.filter((p) => p.voice_intro_url).length;
  const prefersVoice = withVoice / likedProfiles.length > 0.5;

  // Relationship structures
  const structureCounts = new Map<RelationshipStructure, number>();
  likedViews.forEach((v) => {
    const structure = v.profile_snapshot?.relationship_structure;
    if (structure) {
      structureCounts.set(structure, (structureCounts.get(structure) || 0) + 1);
    }
  });
  const preferredStructures = Array.from(structureCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  // Intent preferences
  const intentCounts = new Map<string, number>();
  likedProfiles.forEach((p) => {
    p.intent_ids?.forEach((intent) => {
      intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
    });
  });
  const preferredIntents = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([i]) => i);

  // Extract keywords from liked bios
  const allBioText = likedProfiles.map((p) => p.bio?.toLowerCase() || '').join(' ');
  const valuesKeywords = extractTopKeywords(allBioText, VALUE_KEYWORDS);
  const activityKeywords = extractTopKeywords(allBioText, ACTIVITY_KEYWORDS);
  const communicationKeywords = extractTopKeywords(allBioText, COMMUNICATION_KEYWORDS);

  // Pace preference
  const paceCounts = { slow: 0, medium: 0, fast: 0 };
  likedProfiles.forEach((p) => {
    if (p.pace_preference) paceCounts[p.pace_preference]++;
  });
  const preferredPace = (Object.entries(paceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'medium') as AttractionPatterns['preferred_pace'];

  // Response style preference
  const styleCounts = { quick: 0, relaxed: 0 };
  likedProfiles.forEach((p) => {
    if (p.response_style) styleCounts[p.response_style]++;
  });
  const preferredStyle = (Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'relaxed') as AttractionPatterns['preferred_response_style'];

  return {
    preferred_age_range: [Math.max(18, minAge - 2), maxAge + 2],
    avg_liked_age: Math.round(avgAge),
    bio_length_preference: bioPreference,
    preferred_photo_count: Math.round(avgPhotoCount),
    prefers_voice_intros: prefersVoice,
    preferred_relationship_structures: preferredStructures,
    preferred_intents: preferredIntents,
    values_keywords: valuesKeywords,
    activity_keywords: activityKeywords,
    communication_keywords: communicationKeywords,
    preferred_pace: preferredPace,
    preferred_response_style: preferredStyle,
  };
}

/**
 * Analyze user behavior to extract behavioral patterns
 */
export function analyzeBehavioralPatterns(
  views: ProfileView[],
  conversations: ConversationMetrics[]
): BehavioralPatterns {
  if (views.length < 10) {
    return DEFAULT_TASTE_PROFILE.behavioral_patterns;
  }

  // Group views by session (within 30 mins = same session)
  const sessions = groupIntoSessions(views, 30 * 60 * 1000);

  // Activity patterns
  const avgSessionDuration =
    sessions.reduce((sum, s) => {
      const duration =
        new Date(s[s.length - 1].created_at).getTime() -
        new Date(s[0].created_at).getTime();
      return sum + duration;
    }, 0) /
    sessions.length /
    60000; // Convert to minutes

  // Active hours
  const hourCounts = new Array(24).fill(0);
  views.forEach((v) => {
    const hour = new Date(v.created_at).getHours();
    hourCounts[hour]++;
  });
  const typicalHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((h) => h.hour);

  // Most active day
  const dayCounts = new Array(7).fill(0);
  views.forEach((v) => {
    const day = new Date(v.created_at).getDay();
    dayCounts[day]++;
  });
  const mostActiveDay = dayCounts.indexOf(Math.max(...dayCounts));

  // Interaction style
  const avgViewsPerSession = views.length / sessions.length;
  const likes = views.filter((v) => v.action === 'like' || v.action === 'super_like').length;
  const likeRate = likes / views.length;

  // Message patterns from conversations
  let messageStyle: BehavioralPatterns['message_style'] = 'balanced';
  let avgMessageLength = 0;
  let responseSpeed: BehavioralPatterns['response_speed'] = 'moderate';
  let avgResponseTime = 0;
  let messageInitiationRate = 0;

  if (conversations.length > 0) {
    const totalSent = conversations.reduce((sum, c) => sum + c.messages_sent, 0);
    const totalReceived = conversations.reduce((sum, c) => sum + c.messages_received, 0);
    messageInitiationRate = totalSent > 0 ? totalSent / (totalSent + totalReceived) : 0.5;

    avgMessageLength =
      conversations.reduce((sum, c) => sum + c.avg_message_length, 0) / conversations.length;
    messageStyle = avgMessageLength < 50 ? 'concise' : avgMessageLength > 150 ? 'verbose' : 'balanced';

    avgResponseTime =
      conversations.reduce((sum, c) => sum + c.avg_response_time_ms, 0) /
      conversations.length /
      60000; // Convert to minutes
    responseSpeed = avgResponseTime < 30 ? 'fast' : avgResponseTime > 120 ? 'slow' : 'moderate';
  }

  return {
    avg_daily_sessions: sessions.length / Math.max(1, getUniqueDays(views)),
    avg_session_duration_mins: Math.round(avgSessionDuration),
    typical_active_hours: typicalHours,
    most_active_day: mostActiveDay,
    avg_profiles_viewed_per_session: Math.round(avgViewsPerSession),
    like_rate: Math.round(likeRate * 100) / 100,
    message_initiation_rate: Math.round(messageInitiationRate * 100) / 100,
    message_style: messageStyle,
    avg_message_length: Math.round(avgMessageLength),
    response_speed: responseSpeed,
    avg_response_time_mins: Math.round(avgResponseTime),
    avg_days_to_first_message: 1, // Would need more data
    avg_days_to_meetup_suggestion: 7, // Would need more data
  };
}

/**
 * Build complete taste profile from all available data
 */
export function buildTasteProfile(
  userId: string,
  views: ProfileView[],
  profiles: Map<string, Profile>,
  conversations: ConversationMetrics[],
  existingProfile?: UserTasteProfile
): UserTasteProfile {
  const likes = views.filter((v) => v.action === 'like' || v.action === 'super_like');
  const passes = views.filter((v) => v.action === 'pass');
  const matches = views.filter((v) => v.action === 'message');

  const attractionPatterns = analyzeAttractionPatterns(views, profiles);
  const behavioralPatterns = analyzeBehavioralPatterns(views, conversations);

  // Calculate confidence score based on data volume
  const dataPoints = views.length + conversations.length * 5; // Conversations are more valuable
  const confidenceScore = Math.min(dataPoints / 100, 1); // Max confidence at 100 data points

  return {
    user_id: userId,
    attraction_patterns: attractionPatterns,
    behavioral_patterns: behavioralPatterns,
    total_profiles_viewed: views.length,
    total_likes: likes.length,
    total_passes: passes.length,
    total_matches: matches.length,
    total_conversations: conversations.length,
    successful_connections: conversations.filter((c) => c.met_in_person).length,
    confidence_score: Math.round(confidenceScore * 100) / 100,
    created_at: existingProfile?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Check if a profile matches user's taste patterns
 */
export function matchesTasteProfile(
  profile: Profile,
  taste: UserTasteProfile
): { matches: boolean; score: number; reasons: string[] } {
  if (taste.confidence_score < 0.3) {
    return { matches: true, score: 50, reasons: ['Not enough data for taste matching'] };
  }

  let score = 50;
  const reasons: string[] = [];
  const patterns = taste.attraction_patterns;

  // Age check
  if (
    profile.age >= patterns.preferred_age_range[0] &&
    profile.age <= patterns.preferred_age_range[1]
  ) {
    score += 10;
    reasons.push('Age is in your preferred range');
  }

  // Intent match
  const matchedIntents = profile.intent_ids.filter((i) => patterns.preferred_intents.includes(i));
  if (matchedIntents.length > 0) {
    score += matchedIntents.length * 8;
    reasons.push(`Shares ${matchedIntents.length} intent(s) you typically like`);
  }

  // Pace preference
  if (profile.pace_preference === patterns.preferred_pace) {
    score += 10;
    reasons.push('Matches your preferred dating pace');
  }

  // Response style
  if (profile.response_style === patterns.preferred_response_style) {
    score += 10;
    reasons.push('Has your preferred communication style');
  }

  // Bio length
  const bioLength = profile.bio?.length || 0;
  const expectedLength =
    patterns.bio_length_preference === 'short'
      ? 100
      : patterns.bio_length_preference === 'medium'
      ? 200
      : 400;
  if (Math.abs(bioLength - expectedLength) < 100) {
    score += 5;
  }

  return {
    matches: score >= 60,
    score: Math.min(score, 100),
    reasons,
  };
}

// Helper functions

const VALUE_KEYWORDS = [
  'honest',
  'communication',
  'trust',
  'respect',
  'growth',
  'adventure',
  'stability',
  'freedom',
  'connection',
  'intimacy',
  'family',
  'career',
  'health',
  'spiritual',
  'creative',
];

const ACTIVITY_KEYWORDS = [
  'hiking',
  'travel',
  'cooking',
  'music',
  'reading',
  'movies',
  'games',
  'sports',
  'yoga',
  'meditation',
  'art',
  'dancing',
  'outdoors',
  'beach',
  'mountains',
];

const COMMUNICATION_KEYWORDS = [
  'talk',
  'listen',
  'share',
  'discuss',
  'express',
  'understand',
  'support',
  'boundaries',
  'needs',
  'feelings',
];

function extractTopKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((kw) => text.includes(kw)).slice(0, 5);
}

function groupIntoSessions(views: ProfileView[], maxGapMs: number): ProfileView[][] {
  if (views.length === 0) return [];

  const sorted = [...views].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const sessions: ProfileView[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].created_at).getTime() -
      new Date(sorted[i - 1].created_at).getTime();

    if (gap > maxGapMs) {
      sessions.push([sorted[i]]);
    } else {
      sessions[sessions.length - 1].push(sorted[i]);
    }
  }

  return sessions;
}

function getUniqueDays(views: ProfileView[]): number {
  const days = new Set(views.map((v) => new Date(v.created_at).toDateString()));
  return days.size;
}
