'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, EyeIcon, WrenchScrewdriverIcon, HeartIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { SparePart } from '@/types/spare-parts';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';

// Extend the SparePart type to include additional properties for the table
export interface SparePartListing extends Omit<SparePart, 'brand' | 'category'> {
  brand: {
    id: number;
    name: string;
    name_ar?: string;
  };
  model?: {
    id: number;
    name: string;
    name_ar?: string;
  };
  category: {
    id: number;
    name: string;
    name_ar?: string;
  };
  country?: {
    id: number;
    name: string;
    name_ar?: string;
    code: string;
    currency_code?: string;
  };
  city?: {
    id: number;
    name: string;
    name_ar?: string;
  };
  featured?: boolean;
  favorite_count?: number;
  part_type?: string;
  images?: Array<{
    url: string;
    is_primary?: boolean;
    is_main?: boolean; // For backward compatibility
  }>;
}

export interface SparePartsTableProps {
  spareParts: SparePartListing[];
  onEdit: (part: SparePartListing) => void;
  onDelete: (id: number) => void;
  onView: (part: SparePartListing) => void;
  formatPrice: (price: number, currencyCode?: string) => string;
  t: (key: string, variables?: Record<string, any>) => string;
  language?: string;
}

export default function SparePartsTable({
  spareParts,
  onEdit,
  onDelete,
  onView,
  formatPrice,
  t,
  language: propLanguage,
}: SparePartsTableProps) {
  const { currentCountry } = useCountry();
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;
  
  const { supabase } = useSupabase();
  // State to track image loading and error states
  const [imageStatus, setImageStatus] = useState<Record<number, { loading: boolean; error: boolean }>>({});
  
  // Function to get the primary image URL
  const getPrimaryImage = (part: SparePartListing) => {
    const primaryImage = part.images?.find(img => img.is_primary || img.is_main);
    return primaryImage?.url || '';
  };

  const handleImageLoad = (id: number) => {
    setImageStatus(prev => ({
      ...prev,
      [id]: { ...prev[id], loading: false, error: false }
    }));
  };

  const handleImageError = (id: number) => {
    setImageStatus(prev => ({
      ...prev,
      [id]: { ...prev[id], loading: false, error: true }
    }));
  };

  const renderStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      hidden: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    
    const normalizedStatus = status.toLowerCase() as keyof typeof statusClasses;
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
        {t ? t(`status.${normalizedStatus}`, { defaultValue: statusText }) : statusText}
      </span>
    );
  };

  if (spareParts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
        {language === 'ar' ? 'لا يوجد قطع غيار' : 'No spare parts found. Add your first spare part to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'قطع غيار' : 'Spare Part'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'تفاصيل' : 'Details'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'السعر' : 'Price'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'الإجراءات' : 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {spareParts.map((part) => (
            <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-16 relative">
                    {getPrimaryImage(part) ? (
                      <div className="h-10 w-16 relative">
                        <Image
                          className="h-full w-full rounded-md object-cover"
                          src={getPrimaryImage(part)}
                          alt={language === 'ar' && part.title_ar ? part.title_ar : part.title || 'Spare part image'}
                          width={64}
                          height={40}
                          onLoadingComplete={() => handleImageLoad(part.id)}
                          onError={() => handleImageError(part.id)}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 mr-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === 'ar' && part.title_ar ? part.title_ar : part.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {part.part_number}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {typeof part.brand === 'string' 
                    ? (language === 'ar' && part.brand_ar ? part.brand_ar : part.brand)
                    : (language === 'ar' && part.brand.name_ar ? part.brand.name_ar : part.brand.name)
                  }
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {format(new Date(part.created_at), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(part.price, part.currency_code || part.country?.currency_code || '-')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {part.status ? renderStatusBadge(part.status) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    <span>{part.views_count || 0}</span>
                  </div>
                  <div className="flex items-center text-pink-500">
                    <HeartIcon className="h-4 w-4 mr-1" />
                    <span>{part.favorite_count || 0}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link 
                    href={`${currentCountry?.code.toLowerCase()}/spare-parts/${part.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => onEdit(part)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(part.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
