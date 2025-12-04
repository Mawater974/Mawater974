'use client';

import { Star, Trash2 } from 'lucide-react';

type SimpleImageProps = {
  id: string;
  index: number;
  preview: string;
  isMain: boolean;
  onRemove: (id: string) => void;
  onSetMain: (index: number) => void;
  t: (key: string) => string;
};

export const SimpleImage = ({
  id,
  index,
  preview,
  isMain,
  onRemove,
  onSetMain,
  t,
}: SimpleImageProps) => {
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
        alt={`Spare part image ${index + 1}`}
        className="w-full h-40 object-cover"
        draggable={false}
      />

      {/* Show main photo badge on primary image */}
      {isMain && (
        <div className="absolute top-2 left-2 bg-qatar-maroon text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          <Star className="h-3 w-3 mr-1" />
          {t('sell.images.mainPhoto')}
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90 z-20">
        {!isMain && (
          <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    onSetMain(index);
  }}
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
  onClick={(e) => {
    e.stopPropagation();
    onRemove(id);
  }}
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
};
