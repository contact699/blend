/**
 * Image Optimization Utility
 *
 * Provides image compression, resizing, and optimization utilities.
 * Uses expo-image-manipulator for client-side image processing.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { logger } from './logger';

const imageLogger = logger.scope('Image');

// Image size presets
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 0.7 },
  small: { width: 400, height: 400, quality: 0.8 },
  medium: { width: 800, height: 800, quality: 0.85 },
  large: { width: 1200, height: 1200, quality: 0.9 },
  full: { width: 2000, height: 2000, quality: 0.95 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

interface OptimizeImageOptions {
  preset?: ImagePreset;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // File size in bytes
}

/**
 * Optimize an image by resizing and compressing
 * Returns the optimized image URI
 */
export async function optimizeImage(
  uri: string,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImage> {
  const startTime = Date.now();

  try {
    // Get original image info
    const originalInfo = await FileSystem.getInfoAsync(uri);
    const originalSize = (originalInfo.exists && 'size' in originalInfo) ? originalInfo.size : 0;

    imageLogger.debug('Starting image optimization', {
      uri,
      originalSize,
      options,
    });

    // Determine target dimensions and quality
    let { maxWidth, maxHeight, quality, format } = options;

    if (options.preset) {
      const preset = IMAGE_PRESETS[options.preset];
      maxWidth = preset.width;
      maxHeight = preset.height;
      quality = preset.quality;
    }

    // Default values
    maxWidth = maxWidth || IMAGE_PRESETS.medium.width;
    maxHeight = maxHeight || IMAGE_PRESETS.medium.height;
    quality = quality || IMAGE_PRESETS.medium.quality;
    format = format || 'jpeg';

    // Manipulate image
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
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
        format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
      }
    );

    // Get optimized image info
    const optimizedInfo = await FileSystem.getInfoAsync(manipResult.uri);
    const optimizedSize = (optimizedInfo.exists && 'size' in optimizedInfo) ? optimizedInfo.size : 0;

    const duration = Date.now() - startTime;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    imageLogger.info('Image optimized successfully', {
      originalSize,
      optimizedSize,
      reduction: `${reduction}%`,
      duration: `${duration}ms`,
    });

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      size: optimizedSize,
    };
  } catch (error) {
    imageLogger.error('Image optimization failed', error);
    throw error;
  }
}

/**
 * Optimize multiple images in parallel
 * Returns array of optimized image URIs
 */
export async function optimizeImages(
  uris: string[],
  options: OptimizeImageOptions = {}
): Promise<OptimizedImage[]> {
  imageLogger.info('Optimizing multiple images', { count: uris.length });

  const results = await Promise.all(
    uris.map((uri) => optimizeImage(uri, options))
  );

  return results;
}

/**
 * Create a thumbnail from an image
 * Fast preset for generating thumbnails
 */
export async function createThumbnail(uri: string): Promise<OptimizedImage> {
  return optimizeImage(uri, { preset: 'thumbnail' });
}

/**
 * Crop image to square aspect ratio
 * Useful for profile photos
 */
export async function cropToSquare(
  uri: string,
  size: number = 800
): Promise<OptimizedImage> {
  try {
    // Get image dimensions
    const { width, height } = await getImageDimensions(uri);

    // Calculate crop parameters for center square crop
    const cropSize = Math.min(width, height);
    const originX = (width - cropSize) / 2;
    const originY = (height - cropSize) / 2;

    // Crop to square
    const croppedResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX,
            originY,
            width: cropSize,
            height: cropSize,
          },
        },
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const info = await FileSystem.getInfoAsync(croppedResult.uri);

    return {
      uri: croppedResult.uri,
      width: croppedResult.width,
      height: croppedResult.height,
      size: (info.exists && 'size' in info) ? info.size : 0,
    };
  } catch (error) {
    imageLogger.error('Image cropping failed', error);
    throw error;
  }
}

/**
 * Get image dimensions without loading the full image
 */
export async function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  try {
    // Use manipulateAsync with no operations to get dimensions
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    imageLogger.error('Failed to get image dimensions', error);
    throw error;
  }
}

/**
 * Check if image needs optimization
 * Returns true if image is too large
 */
export async function needsOptimization(
  uri: string,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return (info.exists && 'size' in info) ? info.size > maxSizeBytes : false;
  } catch (error) {
    imageLogger.error('Failed to check if image needs optimization', error);
    return false;
  }
}

/**
 * Optimize image for profile photo
 * Square crop + medium size + good quality
 */
export async function optimizeForProfile(uri: string): Promise<OptimizedImage> {
  imageLogger.info('Optimizing for profile photo');
  return cropToSquare(uri, 800);
}

/**
 * Optimize image for chat message
 * Preserve aspect ratio + smaller size
 */
export async function optimizeForChat(uri: string): Promise<OptimizedImage> {
  imageLogger.info('Optimizing for chat message');
  return optimizeImage(uri, { preset: 'small' });
}

/**
 * Optimize image for event banner
 * Wide aspect ratio + high quality
 */
export async function optimizeForEventBanner(uri: string): Promise<OptimizedImage> {
  imageLogger.info('Optimizing for event banner');
  return optimizeImage(uri, {
    maxWidth: 1200,
    maxHeight: 600,
    quality: 0.9,
    format: 'jpeg',
  });
}

/**
 * Clean up temporary optimized images
 */
export async function cleanupOptimizedImage(uri: string): Promise<void> {
  try {
    // Only delete if it's a temporary file in cache directory
    if (uri.includes(FileSystem.cacheDirectory || '')) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      imageLogger.debug('Cleaned up optimized image', { uri });
    }
  } catch (error) {
    imageLogger.error('Failed to cleanup optimized image', error);
  }
}

export default {
  optimizeImage,
  optimizeImages,
  createThumbnail,
  cropToSquare,
  getImageDimensions,
  needsOptimization,
  optimizeForProfile,
  optimizeForChat,
  optimizeForEventBanner,
  cleanupOptimizedImage,
};
