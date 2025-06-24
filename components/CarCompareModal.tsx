import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useContext } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { Car, Brand } from '../types/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountry } from '../contexts/CountryContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ExtendedCar extends Omit<Car, 'brand_id' | 'model_id'> {
  brand: Brand;
  model: {
    id: number;
    name: string;
  };
  images: {
    id: number;
    url: string;
  }[];
}

interface CarCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: ExtendedCar[];
}

const formatValue = (value: any, type: string) => {
  const { formatPrice } = useCountry();
  
  switch (type) {
    case 'price':
      return formatPrice(Number(value));
    case 'mileage':
      return `${new Intl.NumberFormat('en-US').format(value)} km`;
    case 'engine_size':
      return `${value}L`;
    default:
      return value;
  }
};

const getHighlightClass = (values: any[], currentValue: any, type: string) => {
  if (type === 'price') {
    const prices = values.map(v => Number(v));
    const minPrice = Math.min(...prices);
    return Number(currentValue) === minPrice ? 'text-green-500 font-semibold' : '';
  }
  if (type === 'mileage') {
    const mileages = values.map(v => Number(v));
    const minMileage = Math.min(...mileages);
    return Number(currentValue) === minMileage ? 'text-green-500 font-semibold' : '';
  }
  return '';
};

export default function CarCompareModal({ isOpen, onClose, cars }: CarCompareModalProps) {
  const { t, language, currentLanguage } = useLanguage();
  const { formatPrice } = useCountry();

  const specs = [
  { 
    label: t('carSpecs.brand', { defaultValue: 'Brand' }), 
    key: 'brand',
    format: (value: any) => value?.name || '-'
  },
  { 
    label: t('carSpecs.model', { defaultValue: 'Model' }), 
    key: 'model',
    format: (value: any) => value?.name || '-'
  },
  { 
    label: t('carSpecs.year', { defaultValue: 'Year' }), 
    key: 'year' 
  },
  { 
    label: t('carSpecs.price', { defaultValue: 'Price' }), 
    key: 'price',
    format: (value: number) => {
      return value ? formatPrice(value) : '-';
    }
  },
  { 
    label: t('carSpecs.mileage', { defaultValue: 'Mileage' }), 
    key: 'mileage',
    format: (value: number) => value ? `${new Intl.NumberFormat(language === 'ar' ? 'ar' : 'en').format(value)} ${t('carSpecs.km', { defaultValue: 'km' })}` : '-'
  },
  { 
    label: t('carSpecs.fuelType', { defaultValue: 'Fuel Type' }), 
    key: 'fuel_type',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.fuelType.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  { 
    label: t('carSpecs.gearboxType', { defaultValue: 'Gearbox Type' }), 
    key: 'gearbox_type',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.gearboxType.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  { 
    label: t('carSpecs.bodyType', { defaultValue: 'Body Type' }), 
    key: 'body_type',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.bodyType.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  { 
    label: t('carSpecs.color', { defaultValue: 'Color' }), 
    key: 'color',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.color.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  { 
    label: t('carSpecs.condition', { defaultValue: 'Condition' }), 
    key: 'condition',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.condition.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  { 
    label: t('carSpecs.location', { defaultValue: 'Location' }), 
    key: 'location',
    format: (value: any) => {
      if (!value) return '-';
      if (typeof value === 'object') {
        return language === 'ar' ? (value.name_ar || value.name) : value.name;
      }
      return value;
    }
  },
  { 
    label: t('carSpecs.cylinders', { defaultValue: 'Cylinders' }), 
    key: 'cylinders',
    format: (value: any) => value || '-'
  },
  { 
    label: t('carSpecs.doors', { defaultValue: 'Doors' }), 
    key: 'doors',
    format: (value: any) => value || '-'
  },
  { 
    label: t('carSpecs.driveType', { defaultValue: 'Drive Type' }), 
    key: 'drive_type',
    format: (value: any) => {
      if (!value) return '-';
      const translation = t(`car.driveType.${value.toLowerCase()}`, { defaultValue: value });
      return translation === value.toLowerCase() ? value : translation;
    }
  },
  {   
    label: t('carSpecs.warranty', { defaultValue: 'Warranty' }), 
    key: 'warranty',
    format: (value: any) => {
      if (value === undefined || value === null) return '-';
      return value ? t('common.yes') : t('common.no');
    }
  }
];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {t('compareCars.title', { defaultValue: 'Compare Cars' })}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {cars.map((car, index) => (
                      <div key={car.id}>
                        <div className="relative aspect-[3/2] rounded-lg overflow-hidden shadow-lg mb-2">
                          <Image
                            src={car.images?.[0]?.url || '/placeholder-car.jpg'}
                            alt={`${car.brand.name} ${car.model.name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{car.brand.name} {car.model.name}</h3>
                          <p className="text-qatar-maroon font-medium text-sm">{formatValue(car.price, 'price')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {specs.map((spec) => (
                    <div key={spec.key} className="mb-3">
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {spec.label}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {cars.map((car) => (
                          <div
                            key={`${car.id}-${spec.key}`}
                            className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-white"
                          >
                            {spec.format ? spec.format(car[spec.key]) : formatValue(car[spec.key], spec.key) || '-'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:grid grid-cols-[180px_1fr_1fr] gap-6">
                  {/* Car Images */}
                  <div className="pt-4">
                    <div className="font-medium text-gray-900 dark:text-white mb-4">{t('compareCars.specifications')}</div>
                  </div>
                  {cars.map((car, index) => (
                    <div key={car.id} className="space-y-4">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                        <Image
                          src={car.images?.[0]?.url || '/placeholder-car.jpg'}
                          alt={`${car.brand.name} ${car.model.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">{car.brand.name} {car.model.name}</h3>
                        <p className="text-qatar-maroon font-medium">{formatValue(car.price, 'price')}</p>
                      </div>
                    </div>
                  ))}

                  {/* Specifications */}
                  {specs.map((spec) => (
                    <Fragment key={spec.key}>
                      <div className="py-3 font-medium text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
                        {spec.label}
                      </div>
                      {cars.map((car) => (
                        <div
                          key={`${car.id}-${spec.key}`}
                          className="py-3 text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700"
                        >
                          {spec.format ? spec.format(car[spec.key]) : formatValue(car[spec.key], spec.key) || '-'}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
