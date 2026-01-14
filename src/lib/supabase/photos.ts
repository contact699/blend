// Secure Photo Handling
// - Strips EXIF data (including geolocation) from photos before upload
// - Stores photos in private bucket
// - Serves photos via short-lived signed URLs

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

// Signed URL cache to avoid re-fetching
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Default expiration time for signed URLs (5 minutes)
const DEFAULT_SIGNED_URL_EXPIRY = 300; // seconds

// Cache cleanup interval
const CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

/**
 * Strips EXIF metadata from an image by re-encoding it
 * This removes geolocation, camera info, and other metadata
 */
export async function stripExifData(
  imageUri: string,
  options?: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<string> {
  const { quality = 0.8, maxWidth = 2000, maxHeight = 2000 } = options ?? {};

  try {
    // Re-encode the image which strips all EXIF data
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        // This is the key - re-encoding strips EXIF
      }
    );

    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error stripping EXIF data:', error);
    throw new Error('Failed to process image for upload');
  }
}

/**
 * Uploads a photo to the private storage bucket
 * Automatically strips EXIF data before upload
 */
export async function uploadPhoto(
  userId: string,
  imageUri: string,
  options?: {
    quality?: number;
    stripExif?: boolean;
  }
): Promise<{ path: string; error: Error | null }> {
  const { quality = 0.8, stripExif = true } = options ?? {};

  try {
    // Strip EXIF data by default
    const processedUri = stripExif
      ? await stripExifData(imageUri, { quality })
      : imageUri;

    // Generate a unique filename with UUID
    const fileExtension = 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `${userId}/${fileName}`;

    // Read the file as base64
    const base64Data = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for upload
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to private bucket
    const { error } = await supabase.storage
      .from('photos')
      .upload(storagePath, bytes.buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { path: '', error: new Error(error.message) };
    }

    // Clean up temporary processed file if different from original
    if (processedUri !== imageUri) {
      try {
        await FileSystem.deleteAsync(processedUri, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    return { path: storagePath, error: null };
  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      path: '',
      error: error instanceof Error ? error : new Error('Upload failed'),
    };
  }
}

/**
 * Gets a signed URL for a photo stored in the private bucket
 * Uses caching to avoid unnecessary API calls
 */
export async function getSignedPhotoUrl(
  storagePath: string,
  expiresIn: number = DEFAULT_SIGNED_URL_EXPIRY
): Promise<string | null> {
  if (!storagePath) return null;

  // Check cache first
  const cached = signedUrlCache.get(storagePath);
  const now = Date.now();

  // Return cached URL if still valid (with 30 second buffer)
  if (cached && cached.expiresAt > now + 30000) {
    return cached.url;
  }

  try {
    console.log('[Photos] Creating signed URL for path:', storagePath);
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('[Photos] Error creating signed URL for path:', storagePath, 'Error:', error);
      return null;
    }

    console.log('[Photos] Successfully created signed URL for:', storagePath);

    // Cache the URL
    signedUrlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: now + expiresIn * 1000,
    });

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

/**
 * Gets signed URLs for multiple photos
 * More efficient than calling getSignedPhotoUrl multiple times
 */
export async function getSignedPhotoUrls(
  storagePaths: string[],
  expiresIn: number = DEFAULT_SIGNED_URL_EXPIRY
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const pathsToFetch: string[] = [];
  const now = Date.now();

  // Check cache for each path
  for (const path of storagePaths) {
    if (!path) continue;

    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > now + 30000) {
      results.set(path, cached.url);
    } else {
      pathsToFetch.push(path);
    }
  }

  // Fetch uncached URLs in parallel
  if (pathsToFetch.length > 0) {
    const promises = pathsToFetch.map(async (path) => {
      const url = await getSignedPhotoUrl(path, expiresIn);
      if (url) {
        results.set(path, url);
      }
    });

    await Promise.all(promises);
  }

  return results;
}

/**
 * Deletes a photo from storage
 */
export async function deletePhoto(
  storagePath: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage.from('photos').remove([storagePath]);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    // Remove from cache
    signedUrlCache.delete(storagePath);

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Delete failed'),
    };
  }
}

/**
 * Cleans up expired URLs from the cache
 */
function cleanupCache() {
  const now = Date.now();
  for (const [path, { expiresAt }] of signedUrlCache.entries()) {
    if (expiresAt < now) {
      signedUrlCache.delete(path);
    }
  }
}

// Start periodic cache cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
}

/**
 * Validates an image before upload
 */
export async function validateImage(
  imageUri: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);

    if (!fileInfo.exists) {
      return { valid: false, error: 'Image file not found' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if ('size' in fileInfo && fileInfo.size && fileInfo.size > maxSize) {
      return { valid: false, error: 'Image too large (max 10MB)' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate image' };
  }
}

/**
 * Complete photo upload flow with validation
 */
export async function securePhotoUpload(
  userId: string,
  imageUri: string
): Promise<{
  success: boolean;
  path?: string;
  error?: string;
}> {
  // Validate first
  const validation = await validateImage(imageUri);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Upload with EXIF stripping
  const { path, error } = await uploadPhoto(userId, imageUri);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, path };
}
