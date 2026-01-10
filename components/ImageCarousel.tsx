
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../services/dataService';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  showCounter?: boolean;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  onClick?: () => void;
  priority?: boolean;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  aspectRatio = 'aspect-[4/3]',
  className = '',
  showArrows = true,
  showDots = false,
  showCounter = false,
  activeIndex,
  onIndexChange,
  onClick,
  priority = false
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track previous index to determine wrap direction for smooth vs auto scroll
  const prevIndexRef = useRef(activeIndex !== undefined ? activeIndex : 0);
  
  const currentIndex = activeIndex !== undefined ? activeIndex : internalIndex;

  // Sync external index change to scroll position
  useEffect(() => {
    if (activeIndex !== undefined && scrollRef.current) {
        const width = scrollRef.current.clientWidth;
        if (width > 0) {
            const targetLeft = activeIndex * width;
            const currentLeft = scrollRef.current.scrollLeft;
            
            // Only scroll if we are not already sufficiently close to the target (e.g. manual swipe).
            // Threshold increased to 20px to be safe.
            if (Math.abs(currentLeft - targetLeft) > 20) {
                // Determine if we are wrapping around (jumping more than 1 index)
                // This covers Last->First, First->Last, and distant Dot clicks
                const diff = Math.abs(activeIndex - prevIndexRef.current);
                
                // If diff > 1, assume wrap/jump -> use 'auto' for instant jump to avoid "rewind" lag
                const behavior = diff > 1 ? 'auto' : 'smooth';
                
                scrollRef.current.scrollTo({ left: targetLeft, behavior });
            }
        }
        prevIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      if (width === 0) return;
      const newIndex = Math.round(scrollRef.current.scrollLeft / width);
      
      // Update internal state or notify parent if index changed
      if (newIndex !== currentIndex) {
        // Debounce slightly or just update? Native scroll is frequent.
        // React batching handles it mostly, but checking != currentIndex saves renders.
        if (activeIndex === undefined) {
            setInternalIndex(newIndex);
        }
        if (onIndexChange) {
            onIndexChange(newIndex);
        }
      }
    }
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: index * width, behavior });
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let newIndex = currentIndex - 1;
    let behavior: ScrollBehavior = 'smooth';
    
    // Loop to end
    if (newIndex < 0) {
        newIndex = images.length - 1;
        behavior = 'auto'; // Instant jump
    }

    if (activeIndex === undefined) {
        setInternalIndex(newIndex);
        scrollToIndex(newIndex, behavior);
    }
    else if (onIndexChange) onIndexChange(newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let newIndex = currentIndex + 1;
    let behavior: ScrollBehavior = 'smooth';
    
    // Loop to start
    if (newIndex >= images.length) {
        newIndex = 0;
        behavior = 'auto'; // Instant jump
    }

    if (activeIndex === undefined) {
        setInternalIndex(newIndex);
        scrollToIndex(newIndex, behavior);
    }
    else if (onIndexChange) onIndexChange(newIndex);
  };
  
  const noScrollbarStyle: React.CSSProperties = {
      scrollbarWidth: 'none', 
      msOverflowStyle: 'none'
  };

  if (images.length === 0) return null;

  return (
    <div className={`relative group overflow-hidden ${className}`} dir="ltr">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto snap-x snap-mandatory w-full ${aspectRatio}`}
        style={noScrollbarStyle}
        dir="ltr"
      >
        {images.map((src, idx) => (
          <div 
            key={idx} 
            className="w-full flex-shrink-0 snap-center flex items-center justify-center bg-gray-100 dark:bg-gray-900 cursor-pointer relative"
            onClick={onClick}
          >
            <img 
              src={getOptimizedImageUrl(src, 800)} 
              alt={`${alt} ${idx + 1}`} 
              className="w-full h-full object-cover"
              loading={priority && idx === 0 ? "eager" : "lazy"}
              // @ts-ignore - fetchPriority might not be in all React definitions yet
              fetchPriority={priority && idx === 0 ? "high" : "auto"}
              decoding="async"
            />
          </div>
        ))}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>

      {/* Arrows - Always show if more than 1 image */}
      {showArrows && images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {showCounter && images.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md z-20 pointer-events-none">
            {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
