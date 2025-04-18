'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageCarouselProps {
  images: { url: string; is_main?: boolean }[];
  alt: string;
  aspectRatio?: string;
}

export default function ImageCarousel({
  images = [],
  alt,
  aspectRatio = 'aspect-[16/9]',
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort images to show main image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  // Use placeholder if no images
  const imageUrls = sortedImages.length > 0 ? sortedImages : [{ url: '/placeholder-car.jpg' }];

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
      <div 
        className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {imageUrls.map((image, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full relative"
          >
            <Image
              src={image.url}
              alt={`${alt} ${index + 1}`}
              fill  
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {imageUrls.length > 1 && (
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
            {imageUrls.map((_, index) => (
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
