'use client';

import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';
import { Star, Trash2 } from 'lucide-react';

type DraggableImageProps = {
  id: string;
  index: number;
  preview: string;
  isMain: boolean;
  onRemove: (id: string, index: number) => void;
  onSetMain: (index: number) => void;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  t: (key: string) => string;
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

      <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90">
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
