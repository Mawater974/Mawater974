'use client';

import { useRef, useState, useEffect } from 'react';
import { Star, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

// Custom hook to detect screen size
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const checkScreenSize = () => {
        const width = window.innerWidth;
        setIsMobile(width <= 768);
        setIsSmall(width < 640); // Tailwind's sm breakpoint is 640px
      };
      
      // Initial check
      checkScreenSize();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkScreenSize);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  return { isMobile, isSmall };
};

type DraggableImageProps = {
  id: string;
  index: number;
  preview: string;
  isMain: boolean;
  onRemove: (id: string, index: number) => void;
  onSetMain: (index: number) => void;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  t: (key: string) => string;
  totalImages: number;
};

export const DraggableImage = ({
  id,
  index,
  preview,
  isMain,
  onRemove,
  onSetMain,
  moveImage,
  t,
  totalImages,
}: DraggableImageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { isMobile, isSmall } = useScreenSize();
  const [showArrows, setShowArrows] = useState(true);

  // Handle move up/down or left/right based on screen size
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    let targetIndex = index;
    
    if ((direction === 'up' || direction === 'left') && index > 0) {
      targetIndex = index - 1;
    } else if ((direction === 'down' || direction === 'right') && index < totalImages - 1) {
      targetIndex = index + 1;
    }
    
    if (targetIndex !== index) {
      moveImage(index, targetIndex);
    }
  };

  // Toggle arrows on mobile when image is pressed
  const toggleArrows = (e: React.MouseEvent) => {
    if (isMobile) {
      setShowArrows(!showArrows);
    }
  };

  return (
    <div 
      className={`relative border-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
        isMain
          ? 'border-qatar-maroon shadow-lg scale-105' 
          : 'border-[#2a3441] hover:border-gray-600 dark:border-gray-700'
      }`}
      style={{ zIndex: isMain ? 10 : 0, position: 'relative' }}
    >
      <img 
        src={preview} 
        alt={`Car image ${index + 1}`} 
        className="w-full h-40 object-cover"
        draggable={false}
        onClick={(e) => {
          e.stopPropagation();
          if (isMobile) {
            setShowArrows(!showArrows);
          }
        }}
      />
      
      {/* Show main photo badge only on first photo */}
      {index === 0 && (
        <div className="absolute top-2 left-2 bg-qatar-maroon text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          <Star className="h-3 w-3 mr-1" />
          {t('sell.images.mainPhoto')}
        </div>
      )}

      {/* Arrows for desktop (left/right) */}
      {!isSmall && showArrows && (
        <div className="absolute inset-0 flex items-center justify-between p-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('left');
            }}
            disabled={index === 0}
            className={`p-2 rounded-full bg-black/80 text-white ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:bg-black'}`}
            aria-label="Move left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('right');
            }}
            disabled={index === totalImages - 1}
            className={`p-2 rounded-full bg-black/80 text-white ${index === totalImages - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:bg-black'}`}
            aria-label="Move right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile up/down arrows */}
        {isMobile && (
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMove('up');
              }}
              disabled={index === 0}
              className={`p-1 rounded-full bg-black/80 text-white ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:bg-black'}`}
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMove('down');
              }}
              disabled={index === totalImages - 1}
              className={`p-1 rounded-full bg-black/80 text-white ${index === totalImages - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:bg-black'}`}
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
        {!isMain && (
          <button
            type="button"
            onClick={() => onSetMain(index)}
            className="bg-qatar-maroon text-white px-2 sm:px-3 py-1.5 rounded-md text-xs 
              transition-all duration-300 ease-in-out
              transform hover:scale-105 hover:shadow-lg 
              active:scale-95 
              focus:outline-none focus:ring-2 focus:ring-qatar-maroon/50"
          >
            <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
              <Star className="h-4 w-4" />
              {t('sell.images.setMainBtn')}
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(id, index)}
          className="bg-[#2a3441] text-white px-2 sm:px-3 py-1.5 rounded-md text-xs 
            transition-all duration-300 ease-in-out 
            transform hover:scale-105 hover:shadow-lg 
            active:scale-95 
            focus:outline-none focus:ring-2 focus:ring-gray-500/50 
            hover:bg-[#323d4d] sm:ml-auto rtl:sm:mr-auto rtl:sm:ml-0"
        >
          <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
            <Trash2 className="h-4 w-4" />
            {t('common.remove')}
          </div>
        </button>
      </div>
    </div>
  );
};;
