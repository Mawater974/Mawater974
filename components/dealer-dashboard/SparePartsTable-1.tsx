'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, EyeIcon, HeartIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Types
export interface SparePartImage {
  id?: string;
  url: string;
  is_primary?: boolean;
  is_main?: boolean; // For backward compatibility
  file?: File;
  isNew?: boolean;
}

export interface Brand {
  id: number;
  name: string;
  name_ar?: string | null;
}

export interface Model {
  id: number;
  name: string;
  name_ar?: string | null;
  brand_id?: number;
}

export interface Category {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
}

export interface Country {
  id: number;
  name: string;
  name_ar: string | null;
  code: string;
  currency_code?: string;
}

export interface City {
  id: number;
  name: string;
  name_ar: string | null;
  country_id?: number;
}

export interface SparePart {
  id: number;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  price: number | string;
  currency?: string;
  condition: 'new' | 'used' | 'refurbished';
  part_type: 'original' | 'aftermarket';
  brand_id: number | string;
  model_id?: number | string | null;
  category_id: number | string;
  city_id: number | string;
  country_id: number | string;
  status?: 'pending' | 'approved' | 'rejected' | 'sold' | 'hidden';
  featured?: boolean;
  favorite_count?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  part_number?: string;
  brand?: Brand | string;
  model?: Model | string | null;
  category?: Category | string;
  city?: City | string;
  country?: Country | string;
  images?: SparePartImage[];
}

interface SparePartsTableProps {
  spareParts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (id: number) => void;
  onView: (part: SparePart) => void;
  formatPrice: (price: number, currencyCode?: string) => string;
  t: (key: string, variables?: Record<string, any>) => string;
  language?: string;
}

export default function SparePartsTable1({
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
  
  // State to track image loading and error states
  const [imageStatus, setImageStatus] = useState<Record<number, { loading: boolean; error: boolean }>>({});
  
  // Function to get the primary image URL
  const getPrimaryImage = (part: SparePart) => {
    if (!part.images || part.images.length === 0) return '';
    const primaryImage = part.images.find(img => img.is_primary || img.is_main);
    return primaryImage?.url || part.images[0]?.url || '';
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
    
    const normalizedStatus = status.toLowerCase();
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClasses[normalizedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      }`}>
        {t ? t(`status.${normalizedStatus}`, { defaultValue: statusText }) : statusText}
      </span>
    );
  };

  const getBrandName = (part: SparePart) => {
    if (!part.brand) return 'N/A';
    if (typeof part.brand === 'string') return part.brand;
    return language === 'ar' && part.brand.name_ar ? part.brand.name_ar : part.brand.name;
  };

  const getCategoryName = (part: SparePart) => {
    if (!part.category) return 'N/A';
    if (typeof part.category === 'string') return part.category;
    return language === 'ar' ? part.category.name_ar : part.category.name_en || part.category.name;
  };

  if (spareParts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ar' ? 'لا توجد قطع غيار' : 'No spare parts found. Add your first spare part to get started.'}
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
              {language === 'ar' ? 'القطعة' : 'Part'}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {language === 'ar' ? 'التفاصيل' : 'Details'}
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
          {spareParts.map((part) => {
            const primaryImageUrl = getPrimaryImage(part);
            const currencyCode = typeof part.country === 'object' && part.country?.currency_code 
              ? part.country.currency_code 
              : part.currency || '';
            
            return (
              <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-16 relative">
                      {primaryImageUrl ? (
                        <div className="h-10 w-16 relative">
                          <Image
                            className="h-full w-full rounded-md object-cover"
                            src={primaryImageUrl}
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
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {language === 'ar' && part.title_ar ? part.title_ar : part.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {part.part_number || '—'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getBrandName(part)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getCategoryName(part)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(Number(part.price), currencyCode)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(part.created_at), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(part.status || 'pending')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">{part.views_count || 0}</span>
                    </div>
                    <div className="flex items-center text-pink-500">
                      <HeartIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">{part.favorite_count || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2 justify-end">
                    <Link
                      href={`/${currentCountry?.code?.toLowerCase() || 'qa'}/spare-parts/${part.id}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title={language === 'ar' ? 'عرض' : 'View'}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => onEdit(part)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(part.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title={language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
