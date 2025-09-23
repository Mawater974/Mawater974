'use client';

import { useDrag, useDrop } from 'react-dnd';
import { useRef, useState, useEffect } from 'react';
import { Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth <= 768); // Common breakpoint for mobile devices
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

  return isMobile;
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

type DragItem = {
  index: number;
  id: string;
  type: string;
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

  const [{ isDragging }, drag] = useDrag({
    type: 'image',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'image',
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const opacity = isDragging ? 0.5 : 1;
  const [showArrows, setShowArrows] = useState(false);
  const isMobile = useIsMobile();
  
  // Toggle arrows on mobile when image is pressed
  const toggleArrows = () => {
    if (isMobile) {
      setShowArrows(!showArrows);
    }
  };

  // Handle move left/right
  const handleMove = (direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      moveImage(index, index - 1);
    } else if (direction === 'right' && index < totalImages - 1) {
      moveImage(index, index + 1);
    }
  };

  // Hide arrows when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowArrows(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      style={{ opacity, cursor: 'move' }}
      className={`relative border-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
        isMain
          ? 'border-qatar-maroon shadow-lg scale-105' 
          : 'border-[#2a3441] hover:border-gray-600 dark:border-gray-700'
      }`}
    >
      <img 
        src={preview} 
        alt={`Car image ${index + 1}`} 
        className="w-full h-40 object-cover"
        draggable={false}
      />
      
      {isMain && (
        <div className="absolute top-2 left-2 bg-qatar-maroon text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          <Star className="h-3 w-3 mr-1" />
          {t('sell.images.mainPhoto')}
        </div>
      )}

      {/* Mobile Arrows */}
      {isMobile && showArrows && (
        <div className="absolute inset-0 flex items-center justify-between p-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('left');
            }}
            disabled={index === 0}
            className={`p-2 rounded-full bg-black/70 text-white ${index === 0 ? 'opacity-50' : 'opacity-90 hover:opacity-100'}`}
            aria-label="Move left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('right');
            }}
            disabled={index === totalImages - 1}
            className={`p-2 rounded-full bg-black/70 text-white ${index === totalImages - 1 ? 'opacity-50' : 'opacity-90 hover:opacity-100'}`}
            aria-label="Move right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      <div 
        className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90"
        onClick={toggleArrows}
      >
        {!isMain && (
          <button
            type="button"
            onClick={() => onSetMain(index)}
            className="bg-qatar-maroon text-white px-3 py-1.5 rounded-md text-xs 
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
          className="bg-[#2a3441] text-white px-3 py-1.5 rounded-md text-xs 
            transition-all duration-300 ease-in-out 
            transform hover:scale-105 hover:shadow-lg 
            active:scale-95 
            focus:outline-none focus:ring-2 focus:ring-gray-500/50 
            hover:bg-[#323d4d] ml-auto rtl:mr-auto rtl:ml-0"
        >
          <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
            <Trash2 className="h-4 w-4" />
            {t('common.remove')}
          </div>
        </button>
      </div>
    </div>
  );
};
