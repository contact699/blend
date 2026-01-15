/**
 * Type Adapters - Transform Supabase data structures to App types
 * 
 * Supabase returns data in a different format than our app expects.
 * These adapters handle the transformation cleanly.
 * 
 * KEY DIFFERENCES:
 * - Supabase: photos are objects with { storage_path, signedUrl, ... }
 * - App: photos are string[] of URLs
 * - Supabase: nullable fields use `null`
 * - App: optional fields use `undefined`
 * - Supabase: snake_case column names
 * - App: snake_case (matching Supabase for consistency)
 */

import { 
  Profile, 
  PromptResponse, 
  Match, 
  ChatThread, 
  Message, 
  Like, 
  Ping,
  MessageReaction,
  LinkedPartner,
} from '../types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert null to undefined for optional fields
 * This handles the Supabase null vs TypeScript undefined difference
 */
export function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Convert undefined to null for database inserts
 */
export function undefinedToNull<T>(value: T | null | undefined): T | null {
  return value === undefined ? null : value;
}

/**
 * Safely parse a date string, returning undefined if invalid
 */
export function parseDate(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : dateStr;
  } catch {
    return undefined;
  }
}

// ============================================================================
// PHOTO TYPES & ADAPTERS
// ============================================================================

// Supabase database types (raw from database)
export interface SupabasePhoto {
  id: string;
  profile_id: string;
  storage_path: string;
  order_index: number;
  is_primary: boolean;
  signedUrl?: string | null;
  created_at?: string;
}

export interface SupabaseProfileIntent {
  intent_id: string;
}

export interface SupabasePromptResponse {
  id: string;
  profile_id: string;
  prompt_id: string;
  prompt_text: string;
  response_text: string;
}

export interface SupabaseProfile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string | null;
  pace_preference: 'slow' | 'medium' | 'fast';
  response_style: 'quick' | 'relaxed';
  open_to_meet: boolean;
  virtual_only: boolean;
  no_photos: boolean;
  voice_intro_url?: string | null;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  show_on_map?: boolean | null;
  // Relationships
  photos?: SupabasePhoto[];
  profile_intents?: SupabaseProfileIntent[];
  profile_prompt_responses?: SupabasePromptResponse[];
}

/**
 * Extract photo URL from Supabase photo object
 * Prefers signedUrl if available, falls back to storage_path
 */
export function extractPhotoUrl(photo: SupabasePhoto | string | undefined | null): string | undefined {
  if (!photo) return undefined;
  if (typeof photo === 'string') return photo;
  
  // Prefer signed URL if available
  if (photo.signedUrl) return photo.signedUrl;
  
  // Fallback to storage path (may need to generate signed URL)
  return photo.storage_path;
}

/**
 * Transform Supabase profile to App Profile type
 */
export function transformProfile(supabaseProfile: SupabaseProfile): Profile {
  // Extract photo URLs from photo objects
  const photos = (supabaseProfile.photos || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(photo => extractPhotoUrl(photo))
    .filter((url): url is string => !!url);

  // Extract intent IDs from relationship table
  const intent_ids = (supabaseProfile.profile_intents || [])
    .map(pi => pi.intent_id);

  // Transform prompt responses
  const prompt_responses: PromptResponse[] = (supabaseProfile.profile_prompt_responses || [])
    .map(pr => ({
      id: pr.id,
      profile_id: pr.profile_id,
      prompt_id: pr.prompt_id,
      prompt_text: pr.prompt_text,
      response_text: pr.response_text,
    }));

  return {
    id: supabaseProfile.id,
    user_id: supabaseProfile.user_id,
    display_name: supabaseProfile.display_name,
    age: supabaseProfile.age,
    city: supabaseProfile.city,
    bio: supabaseProfile.bio || '',
    photos,
    pace_preference: supabaseProfile.pace_preference,
    response_style: supabaseProfile.response_style,
    open_to_meet: supabaseProfile.open_to_meet,
    virtual_only: supabaseProfile.virtual_only ?? false,
    no_photos: supabaseProfile.no_photos,
    voice_intro_url: supabaseProfile.voice_intro_url || undefined,
    intent_ids,
    prompt_responses,
    // Location fields for map
    latitude: supabaseProfile.latitude ?? undefined,
    longitude: supabaseProfile.longitude ?? undefined,
    show_on_map: supabaseProfile.show_on_map ?? false,
  };
}

/**
 * Transform array of Supabase profiles
 */
export function transformProfiles(supabaseProfiles: SupabaseProfile[]): Profile[] {
  return supabaseProfiles.map(transformProfile);
}

/**
 * Safe photo URL extractor for images
 * Returns first photo URL or undefined
 */
export function getFirstPhotoUrl(profile: SupabaseProfile | Profile): string | undefined {
  if (!profile) return undefined;
  
  // Check if it's a Supabase profile with photo objects
  if ('photos' in profile && Array.isArray(profile.photos)) {
    if (profile.photos.length === 0) return undefined;
    
    const firstPhoto = profile.photos[0];
    if (typeof firstPhoto === 'string') {
      return firstPhoto;
    }
    return extractPhotoUrl(firstPhoto as SupabasePhoto);
  }
  
  return undefined;
}

/**
 * Check if profile has valid photos
 */
export function hasPhotos(profile: SupabaseProfile | Profile): boolean {
  if (!profile || !profile.photos) return false;
  return profile.photos.length > 0;
}

// ============================================================================
// EVENT ADAPTERS
// ============================================================================

import { Event, EventHost, EventLocation, EventCategory, EventVisibility, EventStatus } from '../types';

export interface SupabaseEvent {
  id: string;
  host_id: string;
  title: string;
  description: string;
  cover_image_path: string | null;
  category: string;
  tags: string[];
  location_name: string;
  location_address: string | null;
  location_city: string;
  location_latitude: number | null;
  location_longitude: number | null;
  is_virtual: boolean;
  virtual_link: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string | null;
  timezone: string;
  max_attendees: number | null;
  current_attendees: number;
  waitlist_count: number;
  visibility: string;
  requires_approval: boolean;
  status: string;
  is_featured: boolean;
  is_recurring: boolean;
  recurring_pattern: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  host_profile?: {
    user_id: string;
    display_name: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
  event_rsvps?: Array<{ id: string; user_id: string; status: string }>;
  coverImageSignedUrl?: string | null;
}

/**
 * Transform Supabase event to App Event type
 */
export function transformEvent(supabaseEvent: SupabaseEvent): Event {
  const location: EventLocation = {
    name: supabaseEvent.location_name,
    address: supabaseEvent.location_address || '',
    city: supabaseEvent.location_city,
    latitude: supabaseEvent.location_latitude || 0,
    longitude: supabaseEvent.location_longitude || 0,
    is_virtual: supabaseEvent.is_virtual,
    virtual_link: supabaseEvent.virtual_link || undefined,
  };

  const host: EventHost = {
    user_id: supabaseEvent.host_profile?.user_id || supabaseEvent.host_id,
    display_name: supabaseEvent.host_profile?.display_name || 'Unknown Host',
    photo: supabaseEvent.host_profile?.photos?.[0]?.signedUrl || 
           supabaseEvent.host_profile?.photos?.[0]?.storage_path,
    reputation_stars: 4, // Default, can be calculated later
    events_hosted: 0, // Would need separate query
  };

  const coverImage = supabaseEvent.coverImageSignedUrl || 
                     supabaseEvent.cover_image_path || 
                     undefined;

  return {
    id: supabaseEvent.id,
    host_id: supabaseEvent.host_id,
    host,
    title: supabaseEvent.title,
    description: supabaseEvent.description,
    cover_image: coverImage,
    category: supabaseEvent.category as EventCategory,
    tags: supabaseEvent.tags || [],
    location,
    start_date: supabaseEvent.start_date,
    end_date: supabaseEvent.end_date || undefined,
    start_time: supabaseEvent.start_time,
    end_time: supabaseEvent.end_time || undefined,
    timezone: supabaseEvent.timezone,
    max_attendees: supabaseEvent.max_attendees || undefined,
    current_attendees: supabaseEvent.current_attendees,
    waitlist_count: supabaseEvent.waitlist_count,
    visibility: supabaseEvent.visibility as EventVisibility,
    requires_approval: supabaseEvent.requires_approval,
    status: supabaseEvent.status as EventStatus,
    is_featured: supabaseEvent.is_featured,
    is_recurring: supabaseEvent.is_recurring,
    recurring_pattern: supabaseEvent.recurring_pattern as Event['recurring_pattern'],
    attendees: [], // Would need separate fetch for full attendee list
    created_at: supabaseEvent.created_at,
    updated_at: supabaseEvent.updated_at,
  };
}

/**
 * Transform array of Supabase events
 */
export function transformEvents(supabaseEvents: SupabaseEvent[]): Event[] {
  return supabaseEvents.map(transformEvent);
}

// ============================================================================
// MESSAGE ADAPTERS
// ============================================================================

export interface SupabaseMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call' | 'gif';
  content: string;
  media_storage_path: string | null;
  media_thumbnail_path?: string | null;
  is_first_message: boolean;
  created_at: string;
  read_at: string | null;
  // Video call fields
  call_status?: 'started' | 'ended' | 'missed' | null;
  call_duration?: number | null;
  // Self-destruct fields
  self_destruct_seconds?: number | null;
  viewed_at?: string | null;
  is_expired?: boolean | null;
  // Reply fields
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  reply_to_sender_id?: string | null;
  // Signed URL (added after fetching)
  mediaSignedUrl?: string | null;
  mediaThumbnailSignedUrl?: string | null;
  // Reactions (joined)
  message_reactions?: Array<{
    emoji: string;
    user_id: string;
    created_at: string;
  }>;
}

/**
 * Transform Supabase message to App Message type
 */
export function transformMessage(supabaseMessage: SupabaseMessage): Message {
  const reactions: MessageReaction[] = (supabaseMessage.message_reactions || []).map(r => ({
    emoji: r.emoji,
    user_id: r.user_id,
    created_at: r.created_at,
  }));

  return {
    id: supabaseMessage.id,
    thread_id: supabaseMessage.thread_id,
    sender_id: supabaseMessage.sender_id,
    message_type: supabaseMessage.message_type,
    content: supabaseMessage.content,
    media_url: supabaseMessage.mediaSignedUrl || nullToUndefined(supabaseMessage.media_storage_path),
    media_thumbnail: supabaseMessage.mediaThumbnailSignedUrl || nullToUndefined(supabaseMessage.media_thumbnail_path),
    is_first_message: supabaseMessage.is_first_message,
    created_at: supabaseMessage.created_at,
    read_at: nullToUndefined(supabaseMessage.read_at),
    // Video call fields
    call_status: nullToUndefined(supabaseMessage.call_status),
    call_duration: nullToUndefined(supabaseMessage.call_duration),
    // Self-destruct fields
    self_destruct_seconds: nullToUndefined(supabaseMessage.self_destruct_seconds),
    viewed_at: nullToUndefined(supabaseMessage.viewed_at),
    is_expired: nullToUndefined(supabaseMessage.is_expired),
    // Reply fields
    reply_to_id: nullToUndefined(supabaseMessage.reply_to_id),
    reply_to_content: nullToUndefined(supabaseMessage.reply_to_content),
    reply_to_sender_id: nullToUndefined(supabaseMessage.reply_to_sender_id),
    // Reactions
    reactions: reactions.length > 0 ? reactions : undefined,
  };
}

/**
 * Transform array of Supabase messages
 */
export function transformMessages(supabaseMessages: SupabaseMessage[]): Message[] {
  return supabaseMessages.map(transformMessage);
}

// ============================================================================
// MATCH ADAPTERS
// ============================================================================

export interface SupabaseMatch {
  id: string;
  user_1_id: string;
  user_2_id: string;
  status: 'pending' | 'active' | 'archived';
  matched_at: string;
  // Joined data
  shared_intents?: Array<{ intent_id: string }>;
  chat_threads?: Array<SupabaseChatThread>;
}

/**
 * Transform Supabase match to App Match type
 */
export function transformMatch(supabaseMatch: SupabaseMatch): Match {
  return {
    id: supabaseMatch.id,
    user_1_id: supabaseMatch.user_1_id,
    user_2_id: supabaseMatch.user_2_id,
    shared_intent_ids: (supabaseMatch.shared_intents || []).map(si => si.intent_id),
    status: supabaseMatch.status,
    matched_at: supabaseMatch.matched_at,
  };
}

/**
 * Transform array of Supabase matches
 */
export function transformMatches(supabaseMatches: SupabaseMatch[]): Match[] {
  return supabaseMatches.map(transformMatch);
}

// ============================================================================
// CHAT THREAD ADAPTERS
// ============================================================================

export interface SupabaseChatThread {
  id: string;
  match_id: string;
  unlocked: boolean;
  first_message_type?: 'prompt' | 'reaction' | 'voice' | null;
  last_message_at?: string | null;
  archived_at?: string | null;
  // Group chat fields
  is_group?: boolean | null;
  group_name?: string | null;
  group_photo_path?: string | null;
  group_photo_signed_url?: string | null;
  participant_ids?: string[] | null;
  created_by?: string | null;
}

/**
 * Transform Supabase chat thread to App ChatThread type
 */
export function transformChatThread(supabaseThread: SupabaseChatThread): ChatThread {
  return {
    id: supabaseThread.id,
    match_id: supabaseThread.match_id,
    unlocked: supabaseThread.unlocked,
    first_message_type: nullToUndefined(supabaseThread.first_message_type),
    last_message_at: nullToUndefined(supabaseThread.last_message_at),
    archived_at: nullToUndefined(supabaseThread.archived_at),
    // Group chat fields
    is_group: nullToUndefined(supabaseThread.is_group),
    group_name: nullToUndefined(supabaseThread.group_name),
    group_photo: supabaseThread.group_photo_signed_url || nullToUndefined(supabaseThread.group_photo_path),
    participant_ids: nullToUndefined(supabaseThread.participant_ids),
    created_by: nullToUndefined(supabaseThread.created_by),
  };
}

/**
 * Transform array of Supabase chat threads
 */
export function transformChatThreads(supabaseThreads: SupabaseChatThread[]): ChatThread[] {
  return supabaseThreads.map(transformChatThread);
}

// ============================================================================
// LIKE & PING ADAPTERS
// ============================================================================

export interface SupabaseLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  seen: boolean;
  // Joined profile data (optional)
  from_profile?: SupabaseProfile;
}

/**
 * Transform Supabase like to App Like type
 */
export function transformLike(supabaseLike: SupabaseLike): Like {
  return {
    id: supabaseLike.id,
    from_user_id: supabaseLike.from_user_id,
    to_user_id: supabaseLike.to_user_id,
    created_at: supabaseLike.created_at,
    seen: supabaseLike.seen,
  };
}

/**
 * Transform array of Supabase likes
 */
export function transformLikes(supabaseLikes: SupabaseLike[]): Like[] {
  return supabaseLikes.map(transformLike);
}

export interface SupabasePing {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  created_at: string;
  read: boolean;
  // Joined profile data (optional)
  from_profile?: SupabaseProfile;
}

/**
 * Transform Supabase ping to App Ping type
 */
export function transformPing(supabasePing: SupabasePing): Ping {
  return {
    id: supabasePing.id,
    from_user_id: supabasePing.from_user_id,
    to_user_id: supabasePing.to_user_id,
    message: supabasePing.message,
    created_at: supabasePing.created_at,
    read: supabasePing.read,
  };
}

/**
 * Transform array of Supabase pings
 */
export function transformPings(supabasePings: SupabasePing[]): Ping[] {
  return supabasePings.map(transformPing);
}

// ============================================================================
// LINKED PARTNER ADAPTERS
// ============================================================================

export interface SupabaseLinkedPartner {
  id: string;
  name: string;
  age: number;
  photo_storage_path: string | null;
  photo_signed_url?: string | null;
  blend_user_id?: string | null;
  is_on_blend: boolean;
  relationship_type?: string | null;
  relationship_duration?: string | null;
  link_status?: 'pending' | 'confirmed' | 'declined' | null;
  linked_at?: string | null;
  // Joined Blend profile (if linked)
  blend_profile?: SupabaseProfile;
}

/**
 * Transform Supabase linked partner to App LinkedPartner type
 */
export function transformLinkedPartner(supabasePartner: SupabaseLinkedPartner): LinkedPartner {
  return {
    id: supabasePartner.id,
    name: supabasePartner.name,
    age: supabasePartner.age,
    photo: supabasePartner.photo_signed_url || nullToUndefined(supabasePartner.photo_storage_path),
    blend_user_id: nullToUndefined(supabasePartner.blend_user_id),
    blend_profile: supabasePartner.blend_profile 
      ? transformProfile(supabasePartner.blend_profile) 
      : undefined,
    is_on_blend: supabasePartner.is_on_blend,
    relationship_type: nullToUndefined(supabasePartner.relationship_type) as LinkedPartner['relationship_type'],
    relationship_duration: nullToUndefined(supabasePartner.relationship_duration),
    link_status: nullToUndefined(supabasePartner.link_status),
    linked_at: nullToUndefined(supabasePartner.linked_at),
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a Supabase profile (has photos as objects)
 */
export function isSupabaseProfile(profile: unknown): profile is SupabaseProfile {
  if (!profile || typeof profile !== 'object') return false;
  const p = profile as Record<string, unknown>;
  return 'id' in p && 'user_id' in p && 'display_name' in p;
}

/**
 * Check if a profile has been transformed (has photos as strings)
 */
export function isAppProfile(profile: unknown): profile is Profile {
  if (!profile || typeof profile !== 'object') return false;
  const p = profile as Record<string, unknown>;
  if (!('photos' in p) || !Array.isArray(p.photos)) return false;
  return p.photos.length === 0 || typeof p.photos[0] === 'string';
}

/**
 * Ensure a profile is in App format, transforming if needed
 */
export function ensureAppProfile(profile: SupabaseProfile | Profile): Profile {
  if (isAppProfile(profile)) return profile;
  return transformProfile(profile as SupabaseProfile);
}

