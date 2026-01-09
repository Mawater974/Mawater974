
import React from 'react';
import { useAppContext } from '../context/AppContext';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "w-12 h-12" }) => {
  const { t } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-black dark:text-gray-600">
        <svg 
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 256 256" 
            className={`animate-spin ${className}`}
        >
            <g>
            <g>
                <path 
                fill="currentColor" 
                d="M128,10C62.8,10,10,62.8,10,128c0,65.2,52.8,118,118,118c65.2,0,118-52.8,118-118C246,62.8,193.2,10,128,10z M128,210.7c-45.7,0-82.7-37-82.7-82.7c0-45.7,37-82.6,82.7-82.6c45.7,0,82.7,37,82.7,82.7C210.7,173.7,173.7,210.7,128,210.7z"
                />
                <path 
                fill="#8B1538" 
                d="M190.9,121.2c5.5,0,10.7,1.6,15.1,4.2c-0.5-15.1-5.2-29-13-40.8c-4.2,10.9-14.7,18.7-27.1,18.7c-16,0-29-13-29-29c0-8.9,4-16.8,10.3-22.2c-6.1-1.6-12.6-2.4-19.2-2.4c-6.6,0-13.1,0.8-19.2,2.4c6.3,5.3,10.3,13.3,10.3,22.2c0,16-13,29-29,29c-12.4,0-22.9-7.8-27.1-18.7c-8,12-12.8,26.3-13.1,41.7c4.7-3.2,10.4-5.1,16.5-5.1c16,0,29,13,29,29c0,15.1-11.6,27.6-26.4,28.9c8.1,9.4,18.5,16.8,30.2,21.4c-0.2-1.3-0.3-2.6-0.3-3.9c0-16,13-29,29-29c16,0,29,13,29,29c0,1.3-0.1,2.6-0.3,3.9c11.8-4.7,22.2-12.1,30.3-21.6c-14.2-1.9-25.2-14-25.2-28.8C161.9,134.1,174.9,121.2,190.9,121.2z M128,145.7c-8.6,0-15.6-7-15.6-15.6c0-8.6,7-15.6,15.6-15.6s15.6,7,15.6,15.6C143.6,138.7,136.6,145.7,128,145.7z"
                />
            </g>
            </g>
        </svg>
        <span className="text-sm font-bold text-gray-500 animate-pulse tracking-widest">{t('common.loading')}</span>
    </div>
  );
};
