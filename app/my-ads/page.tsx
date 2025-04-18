'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  TruckIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import EditCarModal from '@/components/EditCarModal';
import LoadingSpinner from '@/components/LoadingSpinner';

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];
type City = Database['public']['Tables']['cities']['Row'];
type Country = Database['public']['Tables']['countries']['Row'];

interface ExtendedCar extends Car {
  id: number;
  brand?: Brand;
  model?: Model;
  city?: City;
  country?: Country;
  location?: string;
  images: { url: string; is_main: boolean }[];
  views_count?: number;
}

export default function MyAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currentCountry } = useCountry();
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sold'>('all');
  const [selectedCar, setSelectedCar] = useState<ExtendedCar | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
  }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCars();
      fetchNotifications();
      const viewCountSubscription = supabase
        .channel('view-counts')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cars',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            if (payload.new && payload.new.id) {
              setCars(prevCars => prevCars.map(car => 
                car.id === payload.new.id 
                  ? { ...car, views_count: payload.new.views_count || 0 }
                  : car
              ));
            }
          }
        )
        .subscribe();

      return () => {
        viewCountSubscription.unsubscribe();
      };
    }
  }, [user, filter]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data: cars, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(id, name, name_ar),
          model:models(id, name, name_ar),
          city:cities(id, name, name_ar, country_id),
          country:countries(id, name, name_ar, currency_code)
        `)
        .eq('user_id', user?.id)
        .eq(filter !== 'all' ? 'status' : '', filter !== 'all' ? filter.charAt(0).toUpperCase() + filter.slice(1) : '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const carsWithImages = await Promise.all(
        (cars || []).map(async (car) => {
          const { data: imagesData } = await supabase
            .from('car_images')
            .select('*')
            .eq('car_id', car.id)
            .order('is_main', { ascending: false });

          return {
            ...car,
            images: imagesData || []
          };
        })
      );

      setCars(carsWithImages || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.error(t('myAds.error.fetch'));
    } finally {
      setLoading(false);
    }
  };


  const fetchNotifications = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotifications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Sold':
        return <TagIcon className="h-5 w-5 text-blue-500" />;
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDelete = async () => {
    if (!selectedCar) return;
    
    setActionLoading(true);
    try {
      const { error: imagesError } = await supabase
        .from('car_images')
        .delete()
        .eq('car_id', selectedCar.id);

      if (imagesError) throw imagesError;

      const { error: carError } = await supabase
        .from('cars')
        .delete()
        .eq('id', selectedCar.id);

      if (carError) throw carError;

      toast.success(t('myAds.success.deleted'));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error(t('myAds.error.delete'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleMarkAsSold = async () => {
    if (!selectedCar) return;
    
    setActionLoading(true);
    try {
      const { error: carError } = await supabase
        .from('cars')
        .update({ status: 'Sold' })
        .eq('id', selectedCar.id);

      if (carError) throw carError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          title: t('myAds.success.soldNotification'),
          message: t('myAds.success.soldMessage', { brand: selectedCar.brand.name, model: selectedCar.model.name }),
          type: 'sold',
          is_read: false,
        });

      if (notificationError) throw notificationError;

      toast.success(t('myAds.success.markedSold'));
      setShowSoldModal(false);
      await Promise.all([
        fetchCars(), 
        fetchNotifications(), 
      ]);
    } catch (error) {
      console.error('Error marking car as sold:', error);
      toast.error(t('myAds.error.markSold'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
    }
  };

  const handleEditCar = (car: ExtendedCar) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const handleEditComplete = () => {
    fetchCars();
  };

  const handleSetMainPhoto = async (carId: number, imageUrl: string) => {
    setActionLoading(true);
    try {
      const { error: resetError } = await supabase
        .from('car_images')
        .update({ is_main: false })
        .eq('car_id', carId);

      if (resetError) throw resetError;

      const { error: updateError } = await supabase
        .from('car_images')
        .update({ is_main: true })
        .eq('car_id', carId)
        .eq('url', imageUrl);

      if (updateError) throw updateError;

      toast.success(t('myAds.success.mainPhoto'));
      fetchCars(); 
    } catch (error) {
      console.error('Error setting main photo:', error);
      toast.error(t('myAds.error.mainPhoto'));
    } finally {
      setActionLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
// Track page view
useEffect(() => {
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
          pageType: 'my-ads'
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
}, [user?.id]);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('myAds.title')}
          </h1>
          <Link
            href={`/${currentCountry?.code.toLowerCase()}/sell`}
            className="inline-flex items-center px-4 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            {t('myAds.createListing')}
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-4 bg-white dark:bg-gray-800 p-4 mb-4 rounded-xl shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-qatar-maroon text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <TruckIcon className="h-5 w-5 mr-2" />
            {t('myAds.filters.all')}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-qatar-maroon text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            {t('myAds.filters.pending')}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-qatar-maroon text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {t('myAds.filters.approved')}
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'rejected'
                ? 'bg-qatar-maroon text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <XCircleIcon className="h-5 w-5 mr-2" />
            {t('myAds.filters.rejected')}
          </button>
          <button
            onClick={() => setFilter('sold')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'sold'
                ? 'bg-qatar-maroon text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <TagIcon className="h-5 w-5 mr-2" />
            {t('myAds.filters.sold')}
          </button>
        </div>

        {/* Car Listings */}
        {cars.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
            {cars.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
              >
                  {/* Car Image and Status */}
                  <div className="aspect-w-16 aspect-h-9 relative h-48">
                  <Link
                    href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                    className="block"
                  > 
                  {car.images && car.images.length > 0 ? (
                    <Image
                      src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                      alt={t`${car.brand.name} ${car.model.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                      className="object-cover"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <TruckIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  </Link>
                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium shadow-lg" style={{
                    backgroundColor: car.status === 'Approved' ? 'rgba(34, 197, 94, 0.9)' : 
                                   car.status === 'Pending' ? 'rgba(234, 179, 8, 0.9)' :
                                   car.status === 'Rejected' ? 'rgba(239, 68, 68, 0.9)' :
                                   car.status === 'Sold' ? 'rgba(59, 130, 246, 0.9)' :
                                   'rgba(239, 68, 68, 0.9)',
                    color: 'white'
                  }}>
                    {t(`myAds.status.${car.status}`)}
                  </div>
                </div>

                {/* Car Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {car.brand?.name} {car.model?.name} {car.exact_model && `(${car.exact_model})`}
                  </h3>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-medium">{t('myAds.car.price')}:</span>{' '}
                      {car.price.toLocaleString('en-US')} {t(`common.currency.${car.country?.currency_code || 'QAR'}`)}
                    </p>
                    <p>
                      <span className="font-medium">{t('myAds.car.mileage')}:</span>{' '}
                      {car.mileage.toLocaleString()}  {t('car.mileage.unit')}
                    </p>
                    <p>
                      <span className="font-medium">{t('myAds.car.location')}:</span>{' '}
                      {car.city 
                        ? (language === 'ar' ? car.city.name_ar : car.city.name)
                        : car.location || t('myAds.car.locationNotSpecified')}
                    </p>
                    <p>
                      <span className="font-medium">{t('myAds.car.posted')}:</span>{' '}
                      {new Date(car.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">{t('myAds.car.views')}:</span>{' '}
                      {car.views_count || 0}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end gap-.5">
                    <button
                      onClick={() => handleEditCar(car)}
                      className="flex items-center px-2 py-1.5 text-sm rounded-lg text-gray-600 hover:text-qatar-maroon dark:text-gray-400 dark:hover:text-qatar-maroon hover:bg-qatar-maroon/10 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1.5" />
                      {t('myAds.actions.edit')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCar(car);
                        setShowSoldModal(true);
                      }}
                      className="flex items-center px-2 py-1.5 text-sm rounded-lg text-gray-600 hover:text-qatar-maroon dark:text-gray-400 dark:hover:text-qatar-maroon hover:bg-qatar-maroon/10 transition-colors"
                    >
                      <ShoppingBagIcon className="h-4 w-4 mr-1.5" />
                      {t('myAds.actions.markSold')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCar(car);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:text-qatar-maroon dark:text-gray-400 dark:hover:text-qatar-maroon hover:bg-qatar-maroon/10 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-1.5" />
                      {t('myAds.actions.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No listings state */}
        {cars.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('myAds.noListings')}
            </h3>
            <div className="mt-6">
              <Link
                href={`/${currentCountry?.code.toLowerCase()}/sell`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                {t('myAds.createListing')}
              </Link>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('myAds.delete.title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('myAds.delete.message')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={handleDelete}
                    disabled={actionLoading}
                  >
                    {t('myAds.delete.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    {t('myAds.delete.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Sold Modal */}
        {showSoldModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('myAds.sold.title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('myAds.sold.message')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleMarkAsSold}
                    disabled={actionLoading}
                  >
                    {t('myAds.sold.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowSoldModal(false)}
                  >
                    {t('myAds.sold.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {selectedCar && (
          <EditCarModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onUpdate={() => {
              fetchCars();
            }}
            onEditComplete={handleEditComplete}
          />
        )}
      </div>
    </div>
  );
}
