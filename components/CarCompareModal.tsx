import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { Car, Brand } from '../types/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
  switch (type) {
    case 'price':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'QAR',
      }).format(value);
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

const specs = [
  { 
    label: 'Brand', 
    key: 'brand',
    format: (value: any) => value?.name || '-'
  },
  { 
    label: 'Model', 
    key: 'model',
    format: (value: any) => value?.name || '-'
  },
  { 
    label: 'Year', 
    key: 'year' 
  },
  { 
    label: 'Price', 
    key: 'price',
    format: (value: number) => value ? `${value.toLocaleString()} QAR` : '-'
  },
  { 
    label: 'Mileage', 
    key: 'mileage',
    format: (value: number) => value ? `${value.toLocaleString()} km` : '-'
  },
  { 
    label: 'Fuel Type', 
    key: 'fuel_type' 
  },
  { 
    label: 'Gearbox Type', 
    key: 'gearbox_type' 
  },
  { 
    label: 'Body Type', 
    key: 'body_type' 
  },
  { 
    label: 'Color', 
    key: 'color' 
  },
  { 
    label: 'Condition', 
    key: 'condition' 
  }
];

export default function CarCompareModal({ isOpen, onClose, cars }: CarCompareModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800/95 p-4 sm:p-6 shadow-xl transition-all backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Compare Cars
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    aria-label="Close comparison"
                  >
                    <XMarkIcon className="h-6 w-6" />
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
                    <div className="font-medium text-gray-900 dark:text-white mb-4">Features</div>
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
    </Transition.Root>
  );
}
