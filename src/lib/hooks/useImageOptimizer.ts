/**
 * useImageOptimizer Hook
 *
 * React hook for optimizing images with loading states and error handling.
 */

import { useState, useCallback } from 'react';
import {
  optimizeImage,
  optimizeForProfile,
  optimizeForChat,
  optimizeForEventBanner,
  OptimizedImage,
  ImagePreset,
} from '../image-optimizer';
import { logger } from '../logger';

const imageLogger = logger.scope('ImageHook');

interface UseImageOptimizerResult {
  optimizedImage: OptimizedImage | null;
  isOptimizing: boolean;
  error: Error | null;
  optimize: (uri: string, preset?: ImagePreset) => Promise<OptimizedImage | null>;
  optimizeForProfile: (uri: string) => Promise<OptimizedImage | null>;
  optimizeForChat: (uri: string) => Promise<OptimizedImage | null>;
  optimizeForEventBanner: (uri: string) => Promise<OptimizedImage | null>;
  reset: () => void;
}

/**
 * Hook for optimizing images with loading states
 */
export function useImageOptimizer(): UseImageOptimizerResult {
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImage | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimize = useCallback(async (uri: string, preset?: ImagePreset) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeImage(uri, { preset });
      setOptimizedImage(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Image optimization failed');
      setError(error);
      imageLogger.error('Optimization failed in hook', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const optimizeProfile = useCallback(async (uri: string) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeForProfile(uri);
      setOptimizedImage(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile image optimization failed');
      setError(error);
      imageLogger.error('Profile optimization failed in hook', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const optimizeChat = useCallback(async (uri: string) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeForChat(uri);
      setOptimizedImage(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Chat image optimization failed');
      setError(error);
      imageLogger.error('Chat optimization failed in hook', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const optimizeBanner = useCallback(async (uri: string) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizeForEventBanner(uri);
      setOptimizedImage(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Event banner optimization failed');
      setError(error);
      imageLogger.error('Banner optimization failed in hook', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setOptimizedImage(null);
    setError(null);
    setIsOptimizing(false);
  }, []);

  return {
    optimizedImage,
    isOptimizing,
    error,
    optimize,
    optimizeForProfile: optimizeProfile,
    optimizeForChat: optimizeChat,
    optimizeForEventBanner: optimizeBanner,
    reset,
  };
}

/**
 * Hook for batch optimizing multiple images
 */
export function useBatchImageOptimizer() {
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const optimizeBatch = useCallback(async (uris: string[], preset?: ImagePreset) => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);
    setOptimizedImages([]);

    try {
      const results: OptimizedImage[] = [];

      for (let i = 0; i < uris.length; i++) {
        const uri = uris[i];
        if (!uri) continue;

        const result = await optimizeImage(uri, { preset });
        results.push(result);
        setProgress(((i + 1) / uris.length) * 100);
      }

      setOptimizedImages(results);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch optimization failed');
      setError(error);
      imageLogger.error('Batch optimization failed', error);
      return [];
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setOptimizedImages([]);
    setError(null);
    setIsOptimizing(false);
    setProgress(0);
  }, []);

  return {
    optimizedImages,
    isOptimizing,
    error,
    progress,
    optimizeBatch,
    reset,
  };
}
