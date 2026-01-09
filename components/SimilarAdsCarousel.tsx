
import React, { useRef } from 'react';
import { Car, SparePart } from '../types';
import { CarCard } from './CarCard';
import { SparePartCard } from './SparePartCard';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  items: (Car | SparePart)[];
  type: 'car' | 'part';
  title?: string;
}

export const SimilarAdsCarousel: React.FC<Props> = ({ items, type, title = "Similar Ads" }) => {
  const { t, language, dir } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount 
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (items.length === 0) return null;

  const ChevronPrev = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const ChevronNext = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="mt-12 mb-8">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-2xl font-bold dark:text-white">{title}</h3>
        
        <div className="flex gap-2">
            <button 
                onClick={() => scroll('left')}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
            >
                <ChevronPrev className="w-5 h-5" />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
            >
                <ChevronNext className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="relative group">
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item) => (
                <div key={item.id} className="min-w-[280px] md:min-w-[320px] max-w-[320px] snap-center">
                    {type === 'car' ? (
                        <CarCard car={item as Car} language={language} t={t} />
                    ) : (
                        <SparePartCard part={item as SparePart} language={language} t={t} />
                    )}
                </div>
            ))}
          </div>
          
          {/* Gradient Overlay for hint on mobile */}
          <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none md:hidden" />
      </div>
    </div>
  );
};
