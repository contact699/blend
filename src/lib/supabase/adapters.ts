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
