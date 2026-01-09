
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { getOptimizedImageUrl } from '../services/dataService';

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleZoomIn = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setScale(prev => {
          const newScale = Math.max(prev - 0.5, 1);
          if (newScale === 1) setPosition({ x: 0, y: 0 });
          return newScale;
      });
  };

  const handleNext = useCallback((e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex(prev => (prev + 1) % images.length);
      resetZoom();
  }, [images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      resetZoom();
  }, [images.length]);

  const resetZoom = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  // Keyboard support
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') handlePrev();
          if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.5, 3));
          if (e.key === '-') setScale(s => {
              const newScale = Math.max(s - 0.5, 1);
              if (newScale === 1) setPosition({ x: 0, y: 0 });
              return newScale;
          });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Drag Logic
  const onMouseDown = (e: React.MouseEvent) => {
      if (scale > 1) {
          setIsDragging(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
          e.preventDefault(); // Prevent default image dragging
      }
  };

  const onMouseMove = (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
          setPosition({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const onMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in select-none touch-none">
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 text-white bg-gradient-to-b from-black/60 to-transparent">
            <span className="font-bold font-mono tracking-widest text-lg drop-shadow-md">{currentIndex + 1} / {images.length}</span>
            <div className="flex items-center gap-4">
                <div className="flex gap-1 bg-white/10 rounded-lg p-1 backdrop-blur-md border border-white/10">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-md transition disabled:opacity-30" disabled={scale <= 1}>
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-md transition disabled:opacity-30" disabled={scale >= 3}>
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition border border-white/10">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Main Image Area */}
        <div 
            className="flex-1 flex items-center justify-center overflow-hidden w-full h-full"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={(e) => {
               // Double click to zoom toggle
               if (e.detail === 2) {
                   if (scale > 1) resetZoom();
                   else setScale(2);
               }
            }}
        >
            <img 
                src={getOptimizedImageUrl(images[currentIndex], 1920)} 
                alt="Full Screen View" 
                className="max-w-none max-h-none transition-transform duration-200 ease-out"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                    maxWidth: scale === 1 ? '100%' : 'none',
                    maxHeight: scale === 1 ? '100%' : 'none',
                    objectFit: 'contain'
                }}
                draggable={false}
            />
        </div>

        {/* Navigation Arrows */}
        <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition z-40 border border-white/10 hover:scale-110 active:scale-95"
        >
            <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition z-40 border border-white/10 hover:scale-110 active:scale-95"
        >
            <ChevronRight className="w-8 h-8" />
        </button>
    </div>
  );
};
