import React, { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { useAvatarCache } from '@/hooks/useAvatarCache';

interface OptimizedAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  lazy?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
};

// Helper function to check if URL is a Google avatar
const isGoogleAvatar = (url: string): boolean => {
  return url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com');
};

// Helper function to check if URL is a custom uploaded avatar
const isCustomAvatar = (url: string): boolean => {
  return url.includes('/uploads/avatars/');
};

const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt = 'Avatar',
  fallbackText,
  size = 'md',
  className = '',
  lazy = true,
  onError,
  onLoad
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getCachedAvatar, cacheAvatar } = useAvatarCache();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, inView]);

  // Handle image loading with different strategies for different avatar types
  useEffect(() => {
    if (!src || !inView || imageLoaded || imageError) return;

    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);

      try {
        let finalUrl = src;

        // For Google avatars, use them directly without caching to avoid CORS issues
        if (isGoogleAvatar(src)) {
          // Test if the Google image loads successfully
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Try to load with CORS
          
          img.onload = () => {
            setOptimizedSrc(src);
            setImageLoaded(true);
            setIsLoading(false);
            onLoad?.();
          };
          
          img.onerror = () => {
            // If CORS fails, try without crossOrigin
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              setOptimizedSrc(src);
              setImageLoaded(true);
              setIsLoading(false);
              onLoad?.();
            };
            fallbackImg.onerror = () => {
              setImageError(true);
              setIsLoading(false);
              onError?.();
            };
            fallbackImg.src = src;
          };

          img.src = src;
          return;
        }

        // For custom uploaded avatars, use caching
        if (isCustomAvatar(src)) {
          // Check cache first
          const cachedUrl = getCachedAvatar(src);
          
          if (cachedUrl) {
            finalUrl = cachedUrl;
          } else {
            // Cache the image if it's not already cached
            finalUrl = await cacheAvatar(src);
          }
        }

        // Test if the image loads successfully
        const img = new Image();
        img.onload = () => {
          setOptimizedSrc(finalUrl);
          setImageLoaded(true);
          setIsLoading(false);
          onLoad?.();
        };
        
        img.onerror = () => {
          setImageError(true);
          setIsLoading(false);
          onError?.();
        };

        img.src = finalUrl;

      } catch (error) {
        console.error('Failed to load avatar:', error);
        setImageError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    loadImage();
  }, [src, inView, imageLoaded, imageError, getCachedAvatar, cacheAvatar, onLoad, onError]);

  // Reset states when src changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setOptimizedSrc(null);
    setIsLoading(false);
  }, [src]);

  const shouldShowImage = optimizedSrc && inView && imageLoaded && !imageError;
  const shouldShowFallback = !src || imageError || (!imageLoaded && !isLoading);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full border-2 border-white/20 border-t-white/60 w-4 h-4"></div>
        </div>
      )}

      {/* Image */}
      {shouldShowImage && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
          // Add crossOrigin for Google avatars to try loading with CORS
          crossOrigin={isGoogleAvatar(optimizedSrc) ? 'anonymous' : undefined}
        />
      )}

      {/* Fallback */}
      {shouldShowFallback && (
        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
          {fallbackText ? (
            <span className={`text-white font-bold ${
              size === 'sm' ? 'text-xs' : 
              size === 'md' ? 'text-sm' : 
              size === 'lg' ? 'text-base' : 'text-lg'
            }`}>
              {fallbackText.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className={`text-white ${iconSizes[size]}`} />
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedAvatar;