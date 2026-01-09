
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getFavorites } from '../services/dataService';
import { Car } from '../types';
import { CarCard } from '../components/CarCard';
import { Heart } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const FavoritesPage: React.FC = () => {
  const { t, language } = useAppContext();
  const { user } = useAuth();
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getFavorites(user.id).then(favs => {
        // Map favorites structure back to Car structure
        // Filter out null/undefined cars (e.g. if the car was deleted)
        const cars = favs
          .map(f => f.cars)
          .filter((c): c is Car => !!c);
        
        setFavoriteCars(cars);
        setLoading(false);
      });
    }
  }, [user]);

  if (!user) return <div className="p-8 text-center">{t('nav.login')}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 dark:text-white flex items-center gap-2">
         <Heart className="text-red-500 fill-current" /> {t('nav.favorites')}
      </h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner className="w-16 h-16" />
        </div>
      ) : favoriteCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {favoriteCars.map(car => (
             <CarCard key={car.id} car={car} language={language} t={t} isFavorite={true} />
           ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
           <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500 text-lg">You haven't saved any cars yet.</p>
        </div>
      )}
    </div>
  );
};
