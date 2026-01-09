
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getCars, CarFilters } from '../services/dataService';
import { Car } from '../types';
import { CarCard } from '../components/CarCard';
import { Car as CarIcon, CalendarRange } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const CarRentalPage: React.FC = () => {
  const { t, language, selectedCountryId } = useAppContext();
  const [rentals, setRentals] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Prevent fetching until country ID is resolved
      if (!selectedCountryId) return;

      setLoading(true);
      // Fetch cars that match rental criteria (using mock filter logic)
      const { data } = await getCars({ isRental: true, status: 'approved', countryId: selectedCountryId }, 1, 20);
      setRentals(data);
      setLoading(false);
    };
    fetch();
  }, [selectedCountryId]);

  return (
    <div>
      <div className="mb-8 bg-primary-600 rounded-2xl p-8 text-white relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                <CalendarRange className="w-8 h-8" /> {t('nav.rental')}
            </h1>
            <p className="text-primary-100 max-w-xl">
                Rent the perfect car for your weekend getaway or daily commute. Affordable rates and premium service.
            </p>
         </div>
         <CarIcon className="absolute -right-6 -bottom-6 w-48 h-48 text-primary-500 opacity-50" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner className="w-16 h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.length > 0 ? rentals.map(car => (
            <CarCard key={car.id} car={car} language={language} t={t} />
          )) : (
             <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <CarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <h3 className="text-lg font-semibold dark:text-white">No Rentals Available</h3>
                <p className="text-gray-500">Check back later for available rental cars.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
