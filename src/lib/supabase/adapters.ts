/**
 * Type Adapters - Transform Supabase data structures to App types
 * 
 * Supabase returns data in a different format than our app expects.
 * These adapters handle the transformation cleanly.
 */

import { Profile, PromptResponse } from '../types';

// Supabase database types (raw from database)
export interface SupabasePhoto {
  id: string;
  profile_id: string;
  storage_path: string;
  order_index: number;
  is_primary: boolean;
  signedUrl?: string | null;
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
