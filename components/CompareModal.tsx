
import React from 'react';
import { Car } from '../types';
import { X, Check, Minus } from 'lucide-react';
import { getOptimizedImageUrl } from '../services/dataService';

interface CompareModalProps {
  cars: Car[];
  onClose: () => void;
  onRemove: (carId: number) => void;
  language: 'en' | 'ar';
}

export const CompareModal: React.FC<CompareModalProps> = ({ cars, onClose, onRemove, language }) => {
  if (cars.length === 0) return null;

  const getBrandModel = (car: Car) => {
      const brand = language === 'ar' ? (car.brands?.name_ar || car.brands?.name) : car.brands?.name;
      const model = language === 'ar' ? (car.models?.name_ar || car.models?.name) : car.models?.name;
      return `${brand} ${model}`;
  };

  const getMainImage = (car: Car) => {
      const main = car.car_images?.find(img => img.is_main) || car.car_images?.[0];
      return main?.thumbnail_url || main?.image_url || '';
  };

  const specs = [
    { label: 'Price', render: (c: Car) => `${c.price.toLocaleString()} ${c.countries?.currency_code || 'QAR'}` },
    { label: 'Year', field: 'year' },
    { label: 'Mileage', render: (c: Car) => `${c.mileage.toLocaleString()} km` },
    { label: 'Fuel Type', field: 'fuel_type' },
    { label: 'Gearbox', field: 'gearbox_type' },
    { label: 'Cylinders', field: 'cylinders' },
    { label: 'Drive Type', field: 'drive_type' },
    { label: 'Body Type', field: 'body_type' },
    { label: 'Condition', field: 'condition' },
    { label: 'Color', field: 'color' },
    { label: 'Warranty', field: 'warranty' },
  ];

  // Dynamic Grid Columns style based on number of cars
  // Base column (labels) + 1 column per car
  const gridStyle = {
    gridTemplateColumns: `140px repeat(${cars.length}, minmax(0, 1fr))`
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white">Compare Vehicles</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 p-6">
          <div 
            className="grid border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            style={gridStyle}
          >
             
             {/* Header Row (Images) */}
             <div className="p-4 bg-gray-50 dark:bg-gray-800 font-bold flex items-center text-sm border-b border-r dark:border-gray-700">
                Vehicle
             </div>
             {cars.map(car => (
                <div key={car.id} className="p-4 border-b border-r dark:border-gray-700 last:border-r-0 relative min-w-[180px]">
                    <button 
                        onClick={() => onRemove(car.id)}
                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition z-10"
                        title="Remove"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
                        <img 
                            src={getOptimizedImageUrl(getMainImage(car), 300)} 
                            className="w-full h-full object-cover" 
                            alt=""
                        />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">{getBrandModel(car)}</h3>
                    <p className="text-primary-600 font-bold">{car.price.toLocaleString()} <span className="text-xs text-gray-500">{car.countries?.currency_code}</span></p>
                </div>
             ))}

             {/* Specs Rows */}
             {specs.map((spec, idx) => (
                <React.Fragment key={idx}>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 font-medium text-gray-600 dark:text-gray-300 text-sm border-b border-r dark:border-gray-700 flex items-center">
                        {spec.label}
                    </div>
                    {cars.map(car => (
                        <div key={`${car.id}-${idx}`} className="p-4 border-b border-r dark:border-gray-700 last:border-r-0 text-gray-900 dark:text-white flex items-center text-sm md:text-base">
                            {spec.render 
                                ? spec.render(car) 
                                : (
                                   // Logic for booleans or strings
                                   spec.field && car[spec.field as keyof Car] === 'Yes' ? <Check className="w-5 h-5 text-green-500" /> :
                                   spec.field && car[spec.field as keyof Car] === 'No' ? <Minus className="w-5 h-5 text-gray-400" /> :
                                   spec.field ? String(car[spec.field as keyof Car] || '-') : '-'
                                )
                            }
                        </div>
                    ))}
                </React.Fragment>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
