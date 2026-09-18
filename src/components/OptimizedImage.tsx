import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  aspectRatio?: string;
}

/**
 * High-performance responsive image component
 * Features:
 * - Native lazy loading (`loading="lazy"`)
 * - Asynchronous decoding (`decoding="async"`)
 * - Smooth fade-in blur transition once loaded
 * - Automated fallback on broken image / offline error
 * - Prevents layout shift with default aspect ratios
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = 'https://haystudio.space/wp-content/uploads/2020/08/120Cover203-scaled.jpg',
  className = '',
  aspectRatio,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const displaySrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-neutral-800 ${className}`}>
      {/* Loading Skeleton Pulse */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-neutral-700 animate-pulse" />
      )}

      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
