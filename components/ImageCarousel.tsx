'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { getCarImageUrl } from '@/lib/supabase';

interface ImageCarouselProps {
  images: { 
    id: string;
    image_url: string; 
    thumbnail_url: string | null;
    is_main?: boolean;
    url?: string; // Legacy support
  }[];
  alt: string;
  aspectRatio?: string;
  fallbackImage?: string;
}

export default function ImageCarousel({
  images = [],
  alt,
  aspectRatio = 'aspect-[16/9]',
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Process images - handle both new and legacy formats
  const processedImages = images.length > 0 ? images.map(img => ({
    id: img.id,
    image_url: img.image_url || img.url || '',
    thumbnail_url: img.thumbnail_url || img.url || null,
    is_main: img.is_main || false
  })) : [];

  // Sort images to show main image first
  const sortedImages = [...processedImages].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  // Use fallback text if no images
  const hasImages = sortedImages.length > 0;

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((currentIndex + 1) % imageUrls.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((currentIndex - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <div className={`${aspectRatio} relative overflow-hidden group`}>
      {hasImages ? (
        <div 
          className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {sortedImages.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full h-full relative"
            >
              <Image
                src={image.thumbnail_url || image.image_url}
                alt={`${alt} ${index + 1}`}
                fill  
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  // If the thumbnail fails to load, try falling back to the full image URL
                  if (image.thumbnail_url && image.image_url && e.currentTarget.src !== image.image_url) {
                    e.currentTarget.src = image.image_url;
                  }
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            <div className="text-2xl font-medium mb-2">No Image Available</div>
            <div className="text-sm">{alt || 'Car'}</div>
          </div>
        </div>
      )}

      {hasImages && sortedImages.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white 
                     opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 z-10"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white 
                     opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 z-10"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'w-4 bg-qatar-maroon' 
                    : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
