'use client';

interface CarListing {
  id: number;
  brand: {
    id: number;
    name: string;
    name_ar?: string;
  };
  model: {
    id: number;
    name: string;
    name_ar?: string;
  };
  year: number;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  views_count: number;
  favorite_count?: number;
  images?: { url: string; is_main?: boolean }[];
  description?: string;
  description_ar?: string;
  mileage?: number;
  fuel_type?: string;
  gearbox_type?: string;
  body_type?: string;
  condition?: string;
  featured?: boolean;
  expiration_date?: string;
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
}

interface CarsTableProps {
  cars: CarListing[];
  onEdit: (car: CarListing) => void;
  onDelete: (id: number) => void;
  onView: (car: CarListing) => void;
  formatPrice: (price: number, currencyCode?: string) => string;
  t: (key: string, variables?: Record<string, any>) => string;
  language?: string;
}

import { format } from 'date-fns';
import { PencilIcon, TrashIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CarsTable({
  cars,
  onEdit,
  onDelete,
  onView,
  formatPrice,
  t,
  language: propLanguage,
}: CarsTableProps) {
  const { currentCountry } = useCountry();
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;
  const renderStatusBadge = (status: string) => {
    const statusClasses = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      hidden: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    const normalizedStatus = status.toLowerCase();
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const statusClass = statusClasses[normalizedStatus as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
      >
        {t ? t(`status.${normalizedStatus}`, { defaultValue: statusText }) : statusText}
      </span>
    );
  };

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No car listings found. Add your first car to get started.
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
              {t('cars.vehicle')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('cars.details')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('cars.price')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('cars.status')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('cars.statistics')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('cars.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {cars.map((car) => (
            <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-16">
                    {car.images?.find(img => img.is_main)?.url ? (
                      <Image
                        className="h-10 w-16 rounded-md object-cover"
                        src={car.images.find(img => img.is_main)?.url || ''}
                        alt={`${car.brand?.name} ${car.model?.name}`}
                        width={64}
                        height={40}
                      />
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 mr-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name} {language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {car.year}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {car.fuel_type} • {car.gearbox_type}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(car.price, car.currency || car.country?.currency_code)}
                </div>
                {car.featured && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {t('common.featured')}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderStatusBadge(car.status || 'Pending')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    <span>{car.views_count || 0}</span>
                  </div>
                  <div className="flex items-center text-pink-500">
                    <HeartIcon className="h-4 w-4 mr-1" />
                    <span>{car.favorite_count || 0}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link 
                    href={`${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => onEdit(car)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(car.id)}
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
