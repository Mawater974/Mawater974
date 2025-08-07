'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, Edit2, Star, Image as ImageIcon } from 'lucide-react';
import { ImageFile } from '@/types/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';

interface PreviewStepProps {
  formData: any;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
  t: (key: string) => string;
  isSubmitting: boolean;
  brands?: Array<{ id: string | number; name: string }>;
  models?: Array<{ id: string | number; name: string }>;
  cities?: Array<{ id: string | number; name: string; name_ar?: string }>;
  currentLanguage?: string;
  currentCountry?: { currency_code: string };
  mainPhotoIndex?: number;
  images?: ImageFile[];
}

export default function PreviewStep({ 
  formData, 
  onSubmit, 
  onBack, 
  onEditStep,
  t,
  isSubmitting,
  brands = [],
  models = [],
  cities = [] as Array<{ id: string | number; name: string; name_ar?: string }>,
  mainPhotoIndex = 0,
  images = []
}: PreviewStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { currentLanguage } = useLanguage();
  const { currentCountry } = useCountry();
  
  // Use formData.images if images prop is not provided
  const photos = images.length > 0 ? images : formData.images || [];
  
  const selectedBrand = brands.find(b => b.id.toString() === formData.brand_id?.toString());
  const selectedModel = models.find(m => m.id.toString() === formData.model_id?.toString());

  const previewItems = [
    { label: t('sell.basic.brand'), value: selectedBrand?.name },
    { label: t('sell.payment.status'), value: formData.payment_status || t('sell.payment.pending') },
    { label: t('sell.payment.isFeatured'), value: formData.is_featured ? t('sell.payment.featured') : t('sell.payment.standard') },
    { label: t('sell.basic.model'), value: selectedModel?.name },
    { label: t('sell.basic.exactModel') || 'Exact Model', value: formData.exact_model || null },
    { label: t('sell.basic.year'), value: formData.year },
    { 
      label: t('sell.basic.price'), 
      value: formData.price ? `${formData.price} ${t(`common.currency.${currentCountry?.currency_code}`)}` : null 
    },
    { 
      label: t('sell.details.mileage'), 
      value: formData.mileage ? `${formData.mileage} ${t('car.km')}` : null 
    },
    { 
      label: t('sell.details.fuelType'), 
      value: formData.fuel_type ? t(`car.fuelType.${formData.fuel_type.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.gearboxType'), 
      value: formData.gearbox_type ? t(`car.gearboxType.${formData.gearbox_type.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.bodyType'), 
      value: formData.body_type ? t(`car.bodyType.${formData.body_type.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.condition'), 
      value: formData.condition ? t(`car.condition.${formData.condition.toLowerCase().replace(' ', '_')}`) : null 
    },
    { 
      label: t('sell.details.color'), 
      value: formData.color ? t(`car.color.${formData.color.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.doors'), 
      value: formData.doors ? t(`car.doors.${formData.doors.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.driveType'), 
      value: formData.drive_type ? t(`car.driveType.${formData.drive_type.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.warranty'), 
      value: formData.warranty ? t(`car.warranty.${formData.warranty.toLowerCase()}`) : null 
    },
    { 
      label: t('sell.details.warrantyMonthsRemaining'), 
      value: formData.warranty_months_remaining ? t('car.warrantyMonths').replace('{count}', formData.warranty_months_remaining) : null 
    },
    { 
      label: t('sell.details.cylinders'), 
      value: formData.cylinders ? 
        (formData.cylinders === 'Electric' ? 
          t('sell.details.cylinders.electric') : 
          t('sell.details.cylinders.count').replace('{count}', formData.cylinders)) : 
        null 
    },
    { 
      label: t('sell.details.city'), 
      value: formData.city_id ? 
        (currentLanguage === 'ar' ? 
          cities.find(c => c.id.toString() === formData.city_id?.toString())?.name_ar : 
          cities.find(c => c.id.toString() === formData.city_id?.toString())?.name) : 
        null 
    },
    { 
      label: t('sell.details.description'), 
      value: formData.description 
    },
  ].filter(item => item.value !== undefined && item.value !== null);

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('sell.review.title')}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {t('sell.review.subtitle')}
        </p>
      </div>

      {/* Car Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('sell.review.carDetails')}
          </h3>
        </div>
        <dl>
          {previewItems.map((item, index) => (
            <div 
              key={item.label} 
              className={`${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
            >
              <dt className="text-sm font-medium text-gray-900 dark:text-white">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {item.value || t('sell.review.notSpecified')}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Payment Information */}
      <div className="mt-6">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('sell.review.paymentInfo')}
          </h3>
        </div>
        <dl>
          {previewItems
            .filter(item => item.label === t('sell.payment.status') || item.label === t('sell.payment.isFeatured'))
            .map((item, index) => (
              <div 
                key={item.label} 
                className={`${
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
              >
                <dt className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {item.value}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      {/* Photo Preview */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('sell.media.photos')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((image, index) => (
            <div 
              key={image.id}
              className="relative group"
            >
              <img
                src={image.preview}
                alt={t('sell.media.photoPreview')}
                className="w-full h-48 object-cover rounded-lg"
              />
              {formData.mainPhotoIndex === index && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm">
                  <Star className="w-4 h-4 inline-block" />
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="mt-6 mb-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="confirm"
              name="confirm"
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="focus:ring-qatar-maroon h-4 w-4 text-qatar-maroon border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="confirm" className="font-medium text-gray-700 dark:text-gray-200">
              {t('sell.review.confirm.label')}
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              {t('sell.review.confirm.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-200">
              {t('sell.review.notice.message')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between space-x-4">
        <Button variant="outline" onClick={onBack} className="w-1/2">
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Button onClick={onSubmit} className="w-1/2">
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('common.submitting')}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('common.submit')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
