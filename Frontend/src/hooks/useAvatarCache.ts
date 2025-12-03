import { useState, useEffect, useRef } from 'react';

interface CacheEntry {
  url: string;
  timestamp: number;
  blob?: Blob;
}

// Avatar cache with TTL (Time To Live) of 30 minutes
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const avatarCache = new Map<string, CacheEntry>();

// Helper function to check if URL should be cached
const shouldCacheUrl = (url: string): boolean => {
  // Don't cache external URLs like Google avatars to avoid CORS issues
  if (url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com')) {
    return false;
  }
  
  // Cache internal uploaded avatars
  if (url.includes('/uploads/avatars/')) {
    return true;
  }
  
  // For other URLs, try to determine if they're internal
  try {
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    return urlObj.origin === currentOrigin;
  } catch {
    return false;
  }
};

export const useAvatarCache = () => {
  const cleanupCache = () => {
    const now = Date.now();
    for (const [key, entry] of avatarCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        // Revoke blob URL to prevent memory leaks
        if (entry.blob) {
          URL.revokeObjectURL(entry.url);
        }
        avatarCache.delete(key);
      }
    }
  };

  const getCachedAvatar = (originalUrl: string): string | null => {
    // Don't try to get cached version for URLs we shouldn't cache
    if (!shouldCacheUrl(originalUrl)) {
      return null;
    }
    
    cleanupCache();
    const entry = avatarCache.get(originalUrl);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
      return entry.url;
    }
    return null;
  };

  const cacheAvatar = async (originalUrl: string): Promise<string> => {
    try {
      // Don't cache external URLs to avoid CORS issues
      if (!shouldCacheUrl(originalUrl)) {
        return originalUrl;
      }

      // Check if already cached
      const cached = getCachedAvatar(originalUrl);
      if (cached) {
        return cached;
      }

      // Fetch and cache the image
      const response = await fetch(originalUrl, {
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch avatar: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store in cache
      avatarCache.set(originalUrl, {
        url: blobUrl,
        timestamp: Date.now(),
        blob
      });

      return blobUrl;
    } catch (error) {
      console.error('Failed to cache avatar:', error);
      // Fallback to original URL
      return originalUrl;
    }
  };

  const preloadAvatar = async (url: string): Promise<void> => {
    if (!url || getCachedAvatar(url) || !shouldCacheUrl(url)) return;
    
    try {
      await cacheAvatar(url);
    } catch (error) {
      console.error('Failed to preload avatar:', error);
    }
  };

  const clearCache = () => {
    for (const [, entry] of avatarCache.entries()) {
      if (entry.blob) {
        URL.revokeObjectURL(entry.url);
      }
    }
    avatarCache.clear();
  };

  return {
    getCachedAvatar,
    cacheAvatar,
    preloadAvatar,
    clearCache
  };
};