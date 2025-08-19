'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '@/lib/supabase';
import { ExtendedCar, ExtendedSparePart } from '@/types/supabase';
import CarCard from '@/components/CarCard';
import SparePartCard from '@/components/spare-parts/SparePartCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingSpinner from '@/components/LoadingSpinner';

type FavoriteItem = {
  id: string;
  type: 'car' | 'spare_part';
  created_at: string;
  [key: string]: any;
};


export default function FavoritesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { currentCountry } = useCountry();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const countryCode = params.countryCode as string;

  // Fetch favorites when user, country, or countryCode changes
  useEffect(() => {
    const loadFavorites = async () => {
      // Wait for authentication to complete
      if (isAuthLoading) return;
      
      // Redirect to login if no user
      if (!user) {
        router.push(`/${countryCode}/login?redirect=/favorites`);
        return;
      }

      await fetchFavorites();
    };

    loadFavorites();
  }, [user, isAuthLoading, currentCountry?.id, countryCode]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get both car and spare part favorites
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('car_id, spare_part_id, created_at')
        .eq('user_id', user.id);

      if (favError) throw favError;

      if (!favData || favData.length === 0) {
        setFavorites([]);
        return;
      }

      // Separate car and spare part favorites
      const carFavorites = favData.filter(fav => fav.car_id !== null);
      const sparePartFavorites = favData.filter(fav => fav.spare_part_id !== null);

      // Fetch car favorites
      let cars: any[] = [];
      if (carFavorites.length > 0) {
        const carIds = carFavorites.map(fav => fav.car_id).filter(Boolean) as number[];
        if (carIds.length > 0) {
          const { data: carsData, error: carsError } = await supabase
            .from('cars')
            .select(`
              *,
              brand:brands(id, name, name_ar),
              model:models(id, name, name_ar),
              user:profiles(id, full_name),
              city:cities(id, name, name_ar),
              country:countries(id, name, name_ar, code, currency_code),
              images:car_images(url, is_main)
            `)
            .in('id', carIds);

          if (carsError) throw carsError;
          if (carsData) cars = carsData;
        }
      }

      // Fetch spare part favorites
      let spareParts: any[] = [];
      if (sparePartFavorites.length > 0) {
        const sparePartIds = sparePartFavorites.map(fav => fav.spare_part_id).filter(Boolean) as string[];
        if (sparePartIds.length > 0) {
          const { data: partsData, error: partsError } = await supabase
            .from('spare_parts')
            .select(`
              *,
              brand:brands(id, name, name_ar),
              model:models(id, name, name_ar),
              category:spare_part_categories(id, name_en, name_ar),
              city:cities(id, name, name_ar),
              images:spare_part_images(url, is_primary)
            `)
            .in('id', sparePartIds);

          if (partsError) throw partsError;
          if (partsData) spareParts = partsData;
        }
      }

      // Combine and format the results with their favorite creation date
      const allFavorites: FavoriteItem[] = [
        ...cars.map(car => ({
          ...car,
          type: 'car' as const,
          id: car.id.toString(),
          created_at: favData.find(f => f.car_id === car.id)?.created_at || car.created_at
        })),
        ...spareParts.map(part => ({
          ...part,
          type: 'spare_part' as const,
          id: part.id,
          created_at: favData.find(f => f.spare_part_id === part.id)?.created_at || part.created_at
        }))
      ];

      // Sort by favorite creation date, newest first
      allFavorites.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFavorites(allFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error(t('favorites.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (itemId: string, type: 'car' | 'spare_part') => {
    if (!user) return;

    try {
      // Remove from favorites in database
      const query = supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id);

      // Use the appropriate column based on the item type
      if (type === 'car') {
        await query.eq('car_id', itemId);
      } else {
        await query.eq('spare_part_id', itemId);
      }

      const { error } = await query;
      if (error) throw error;

      // Update local state with animation
      setFavorites(prev => prev.filter(item => item.id !== itemId));
      
      toast.success(t('favorites.success.removed'), {
        icon: '💔',
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error(t('favorites.error.remove'));
    }
  };

 // Track page view
 /*useEffect(() => {
  const trackPageView = async () => {
    try {
      const response = await fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: '--', // Default to Qatar since this is a global page
          userId: user?.id,
          pageType: 'favorites'
        })
      });

      if (!response.ok) {
        console.error('Failed to track page view:', await response.json());
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  trackPageView();
}, [user?.id]);*/

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('favorites.title')}
          </h1>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t(`favorites.count${favorites.length === 1 ? '' : '_plural'}`, { count: favorites.length })}
          </span>
        </div>
        
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('favorites.empty.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('favorites.empty.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${countryCode}/cars`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                {t('favorites.empty.browseCars')}
              </button>
              <button
                onClick={() => router.push(`/${currentCountry?.code.toLowerCase()}/spare-parts`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-teal hover:bg-qatar-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-teal"
              >
                {t('favorites.empty.browseSpareParts')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {favorites.map((item) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {item.type === 'car' ? (
                    <CarCard
                      car={item as unknown as ExtendedCar}
                      onFavoriteToggle={() => {
                        handleFavoriteToggle(item.id, 'car');
                      }}
                      isFavorite={true}
                    />
                  ) : (
                    <SparePartCard
                      part={item as unknown as ExtendedSparePart}
                      onToggleFavorite={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleFavoriteToggle(item.id, 'spare_part');
                      }}
                      isFavorite={true}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
