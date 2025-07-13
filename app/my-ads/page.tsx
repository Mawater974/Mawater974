'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

// Components
import EditCarModal from '@/components/EditCarModal';
import EditSparePartModal from '@/components/EditSparePartModal';
import LoadingSpinner from '@/components/LoadingSpinner';

// Types
interface Brand {
  id: number;
  name: string;
  name_ar?: string | null;
  logo_url?: string | null;
}

interface Model {
  id: number;
  name: string;
  name_ar?: string | null;
}

interface Country {
  id: number;
  name: string;
  name_ar: string | null;
  code: string;
  currency_code: string;
}

interface City {
  id: number;
  name: string;
  name_ar: string | null;
  country_id: number;
  country: Country;
  [key: string]: any; // Allow additional properties
}

interface SparePartImage {
  id: string;
  url: string;
  is_primary: boolean;
}

// Interface for the SparePart type used in this component
interface SparePart {
  id: string;
  title: string;
  name_ar?: string | null;
  description: string | null;
  description_ar?: string | null;
  price: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold' | 'archived' ;
  created_at: string;
  is_featured: boolean;
  brand: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  brand_id?: number | null;
  model: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  model_id?: number | null;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    [key: string]: any;
  } | null;
  category_id?: number | null;
  city: City | null;
  city_id?: number | null;
  country: Country | null;
  country_id?: number | null;
  images: SparePartImage[];
  is_favorite: boolean;
  part_type: 'original' | 'aftermarket';
  condition: 'new' | 'used' | 'refurbished';
  user_id: string;
}

// Type for the form data in EditSparePartModal
type SparePartFormData = {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  part_type: 'original' | 'aftermarket';
  condition: 'new' | 'used' | 'refurbished';
  images: Array<{
    id: string;
    url: string;
    is_primary: boolean;
  }>;
}

interface Brand {
  id: number;
  name: string;
  name_ar?: string;
  logo_url?: string | null;
}

interface ExtendedCarWithStatus {
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold' | 'archived';
  expiration_date?: string;
  id: number;
  brand?: Brand;
  model?: Model;
  city?: City;
  country?: Country;
  location?: string;
  images: { url: string; is_main: boolean }[];
  url: string;
  is_main: boolean;
  views_count?: number;
  exact_model?: string;
  price: number;
  mileage: number;
  created_at: string;
  currency?: string;
}

// Cars Tab Component
interface CarsTabProps {
  loading: boolean;
  cars: ExtendedCarWithStatus[];
  t: any;
  currentCountry: Country | null;
  language: string;
  isExpired: (item: ExtendedCarWithStatus | SparePart) => boolean;
  handleRenew: (id: number) => void;
  renewingCarId: number | null;
  handleEditCar: (car: ExtendedCarWithStatus) => void;
  handleDeleteClick: (car: ExtendedCarWithStatus) => void;
  handleMarkAsSold: (car: ExtendedCarWithStatus) => void;
  handleSetMainPhoto: (carId: number, imageUrl: string) => Promise<void>;
  actionLoading: boolean;
}

const CarsTab = ({
  loading,
  cars,
  t,
  currentCountry,
  language,
  isExpired,
  handleRenew,
  renewingCarId,
  handleEditCar,
  handleDeleteClick,
  handleMarkAsSold,
  handleSetMainPhoto,
  actionLoading,
}: CarsTabProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No cars found
        </p>
      </div>
    );
  }

  const router = useRouter();

  const handleCarClick = (car: ExtendedCarWithStatus, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons or links inside the card
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) {
      return;
    }
    router.push(`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div 
          key={car.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={(e) => handleCarClick(car, e)}
        >
          <div className="relative h-48 bg-gray-200">
            {car.images?.[0]?.url && (
              <Image
                src={car.images[0].url}
                alt={`${car.brand?.name || ''} ${car.model?.name || ''}`}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name} {language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                car.status === t('common.status.approved') ? 'bg-green-100 text-green-800' :
                car.status === t('common.status.pending') ? 'bg-yellow-100 text-yellow-800' :
                car.status === t('common.status.rejected') ? 'bg-red-100 text-red-800' :
                car.status === t('common.status.expired') ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {t(`common.status.${car.status.toLowerCase()}`)}
              </span>
            </div>
            <p className="text-qatar-maroon font-bold text-lg mt-2">
              {car.price.toLocaleString()} {car.currency || car.country?.currency_code}
            </p>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => handleEditCar(car)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={() => handleDeleteClick(car)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                disabled={actionLoading}
              >
                {t('common.delete')}
              </button>
              <button
                onClick={() => handleMarkAsSold(car)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={actionLoading}
              >
                {t('common.markAsSold')}
              </button>
            </div>
            {isExpired(car) && (
              <button
                onClick={() => handleRenew(car.id)}
                className="w-full mt-3 px-3 py-1.5 bg-qatar-maroon text-white rounded hover:bg-qatar-maroon/90 text-sm flex items-center justify-center"
                disabled={renewingCarId === car.id}
              >
                {renewingCarId === car.id ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    {t('common.renewing')}
                  </>
                ) : (
                  t('common.renewAd')
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Spare Parts Tab Component
interface SparePartsTabProps {
  loading: boolean;
  spareParts: SparePart[];
  t: any;
  currentCountry: Country | null;
  language: string;
  isExpired: (item: SparePart) => boolean;
  onEditSparePart: (sparePart: SparePart) => void;
  onDeleteSparePart: (sparePart: SparePart) => void;
  onMarkAsSold: (sparePart: SparePart) => void;
  actionLoading: boolean;
  renewingSparePartId: string | null;
  onRenewSparePart: (id: string) => void;
}

const SparePartsTab = ({
  loading,
  spareParts,
  t,
  currentCountry,
  language,
  isExpired,
  onEditSparePart,
  onDeleteSparePart,
  onMarkAsSold,
  actionLoading,
  renewingSparePartId,
  onRenewSparePart
}: SparePartsTabProps) => {
  const router = useRouter();

  const handleSparePartClick = (sparePart: SparePart, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons or links inside the card
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) {
      return;
    }
    router.push(`/${currentCountry?.code.toLowerCase()}/spare-parts/${sparePart.id}`);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (spareParts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No spare parts found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {spareParts.map((part) => (
        <div 
          key={part.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={(e) => handleSparePartClick(part, e)}
        >
          <div className="relative h-48 bg-gray-200">
            {part.images?.[0]?.url && (
              <Image
                src={part.images[0].url}
                alt={part.title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'ar' && part.name_ar ? part.name_ar : part.title}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                part.status === t('common.status.approved') ? 'bg-green-100 text-green-800' :
                part.status === t('common.status.pending') ? 'bg-yellow-100 text-yellow-800' :
                part.status === t('common.status.rejected') ? 'bg-red-100 text-red-800' :
                part.status === t('common.status.expired') ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {t(`common.status.${part.status.toLowerCase()}`)}
              </span>
            </div>
            <p className="text-qatar-maroon font-bold text-lg mt-2">
              {part.price.toLocaleString()} {part.currency || part.country?.currency_code}
            </p>
            
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSparePart(part);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                disabled={actionLoading}
              >
                {t('common.edit')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSparePart(part);
                }}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                disabled={actionLoading}
              >
                {t('common.delete')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsSold(part);
                }}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={actionLoading}
              >
                {t('common.markAsSold')}
              </button>
            </div>
            {isExpired(part) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenewSparePart(part.id);
                }}
                className="w-full mt-3 px-3 py-1.5 bg-qatar-maroon text-white rounded hover:bg-qatar-maroon/90 text-sm flex items-center justify-center"
                disabled={renewingSparePartId === part.id}
              >
                {renewingSparePartId === part.id ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {t('common.renewing')}
                  </>
                ) : (
                  t('common.renewAd')
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function MyAdsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currentCountry } = useCountry();
  
  const [cars, setCars] = useState<ExtendedCarWithStatus[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [renewingCarId, setRenewingCarId] = useState<number | null>(null);
  const [renewingSparePartId, setRenewingSparePartId] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<ExtendedCarWithStatus | null>(null);
  const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSparePartModalOpen, setIsEditSparePartModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'car' | 'sparePart'>('car');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired' | 'sold' | 'archived'>('all');
  
  const handleDeleteClick = (car: ExtendedCarWithStatus) => {
    setSelectedCar(car);
    setShowDeleteModal(true);
  };

  const handleMarkCarAsSold = (car: ExtendedCarWithStatus) => {
    setSelectedCar(car);
    setShowSoldModal(true);
  };

  const handleDeleteConfirm = async () => {
    if ((!selectedCar && !selectedSparePart) || !deleteItemType) return;
    
    setActionLoading(true);
    try {
      if (deleteItemType === 'car' && selectedCar) {
        const { error } = await supabase
          .from('cars')
          .update({ status: 'archived' })
          .eq('id', selectedCar.id);
        
        if (error) throw error;
        
        // Refresh cars data instead of updating locally
        await fetchCars();
      } else if (deleteItemType === 'sparePart' && selectedSparePart) {
        const { error } = await supabase
          .from('spare_parts')
          .update({ status: 'archived' })
          .eq('id', selectedSparePart.id);
           
        if (error) throw error;
         
        // Update local state to reflect the deletion
        setSpareParts(spareParts.filter(part => part.id !== selectedSparePart.id));
       
        // Refresh spare parts data from server to ensure consistency
        await fetchSpareParts();
      }

      setShowDeleteModal(false);
      toast.success(t('myAds.adDeleted'));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('myAds.error.delete'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
      setSelectedSparePart(null);
    }
  };

  // Mark as Sold handler
const handleSoldConfirm = async () => {
  if (!selectedCar && !selectedSparePart) return;
  
  setActionLoading(true);
  
  try {
    if (selectedCar) {
      // Update car status in the database
      const { error } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', selectedCar.id);

      if (error) throw error;

      // Update local state directly
      setCars(prevCars => 
        prevCars.map(car => 
          car.id === selectedCar.id ? { ...car, status: 'sold' } : car
        )
      );
    } else if (selectedSparePart) {
      // Update spare part status in the database
      const { error } = await supabase
        .from('spare_parts')
        .update({ status: 'sold' })
        .eq('id', selectedSparePart.id);

      if (error) throw error;

      // Update local state directly instead of refetching
      setSpareParts(prevParts => 
        prevParts.map(part => 
          part.id === selectedSparePart.id ? { ...part, status: 'sold' } : part
        )
      );
    }
    
    // Close the modal and show success message
    setShowSoldModal(false);
    toast.success(t('myAds.markedAsSold'));
  } catch (error) {
    console.error('Error marking as sold:', error);
    toast.error(t('myAds.error.markAsSold'));
    
    // Re-fetch data from server on error to ensure consistency
    if (selectedCar) {
      fetchCars();
    } else if (selectedSparePart) {
      fetchSpareParts();
    }
  } finally {
    setActionLoading(false);
    setSelectedCar(null);
    setSelectedSparePart(null);
  }
};

const handleMarkSparePartAsSold = (sparePart: SparePart) => {
  setSelectedSparePart(sparePart);
  setShowSoldModal(true);
};

// Edit car handler
const handleEditCar = (car: ExtendedCarWithStatus) => {
  setSelectedCar(car);
  setIsEditModalOpen(true);
};

const handleEditSparePart = (sparePart: SparePart) => {
  setSelectedSparePart(sparePart);
  setIsEditSparePartModalOpen(true);
};

const handleDeleteSparePart = (sparePart: SparePart) => {
  setSelectedSparePart(sparePart);
  setDeleteItemType('sparePart');
  setShowDeleteModal(true);
};

const handleEditComplete = async (updatedCar: ExtendedCarWithStatus) => {
  try {
    setCars(cars.map(car => 
      car.id === updatedCar.id ? updatedCar : car
    ));
    setIsEditModalOpen(false);
    toast.success(t('myAds.updateSuccess'));
    return true;
  } catch (error) {
    console.error('Error updating car:', error);
    toast.error(t('myAds.updateError'));
    return false;
  }
};

const handleRenew = async (carId: number) => {
  if (!user) return;
  
  const car = cars.find(c => c.id === carId);
  if (!car) {
    toast.error(t('myAds.carNotFound'));
    return;
  }

  // Check if the car is expired before renewal
  if (car.status !== 'expired') {
    toast.error(t('myAds.onlyExpiredCanRenew'));
    return;
  }

  setRenewingCarId(carId);
  try {
    // Update status to approved and set expiration date to 30 days from now
    const { error: updateError } = await supabase
      .from('cars')
      .update({ 
        status: 'approved',
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', carId);

    if (updateError) throw updateError;

    // Update local state to reflect the new status and refresh data
    setCars(cars.map(c => 
      c.id === carId ? { ...c, status: 'approved' } : c
    ));
    
    // Refresh data from server
    await fetchCars();
    toast.success(t('car.renewedSuccessfully'));
  } catch (error) {
    console.error('Error renewing car:', error);
    toast.error(t('common.errorOccurred'));
  } finally {
    setRenewingCarId(null);
  }
};

const handleRenewSparePart = async (sparePartId: string) => {
  if (!user) return;
  
  const sparePart = spareParts.find(p => p.id === sparePartId);
  if (!sparePart) {
    toast.error(t('myAds.sparePartNotFound'));
    return;
  }

  // Check if the spare part is expired before renewal
  if (sparePart.status !== 'expired') {
    toast.error(t('myAds.onlyExpiredCanRenew'));
    return;
  }

  setRenewingSparePartId(sparePartId);
  try {
    // Update status and let database trigger handle the expiration date
    const { error: updateError } = await supabase.rpc('renew_spare_part', {
      part_id: sparePartId
    });

    if (updateError) throw updateError;

    // Calculate new expiration date (30 days from now)
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + 30);

    // Update local state optimistically
    setSpareParts(prevParts => 
      prevParts.map(p => 
        p.id === sparePartId 
          ? { 
              ...p, 
              status: 'approved',
              expiration_date: newExpirationDate.toISOString()
            } 
          : p
      )
    );
    
    toast.success(t('spareParts.renewedSuccessfully'));
  } catch (error) {
    console.error('Error renewing spare part:', error);
    toast.error(t('common.errorOccurred'));
    // Refresh data from server to ensure consistency
    await fetchSpareParts();
  } finally {
    setRenewingSparePartId(null);
  }
};
  useEffect(() => {
    if (user) {
      fetchCars();
      fetchSpareParts();
      fetchNotifications();
      
      // Set up real-time subscription for view count updates
      const viewCountSubscription = supabase
        .channel('car_views_updates')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'cars',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            setCars(currentCars => {
              return currentCars.map(car => {
                if (car.id === payload.new.id) {
                  return { ...car, views_count: payload.new.views_count };
                }
                return car;
              });
            });
          }
        )
        .subscribe();

      return () => {
        viewCountSubscription.unsubscribe();
      };
    }
  }, [user, filter]);

  const fetchSpareParts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('spare_parts')
        .select(`
          *,
          brand:brands(id, name, name_ar),
          model:models(id, name, name_ar),
          category:spare_part_categories(id, name_en, name_ar),
          city:cities(id, name, name_ar, country_id),
          country:countries(id, name, name_ar, currency_code),
          images:spare_part_images(*)
        `)
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter.toLowerCase());
      }

      const { data: spareParts, error } = await query;

      if (error) throw error;
      setSpareParts(spareParts || []);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast.error(t('myAds.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

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
         .neq('status', 'archived')
         .eq(filter !== 'all' ? 'status' : '', filter !== 'all' ? filter.toLowerCase() : '')
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
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (notificationsError) throw notificationsError;

      setNotifications(notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('myAds.notifications.error'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'sold':
        return <TagIcon className="h-5 w-5 text-blue-500" />;
      case 'archived':
        return <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const isExpired = (item: any) => {
    if (!item) return false;
    const expirationDate = 'expiration_date' in item ? item.expiration_date : null;
    return expirationDate ? new Date(expirationDate) < new Date() : false;
  };

  // Filter cars based on status
  const filteredCars = cars.filter(car => {
    if (filter === 'all') return true;
    return car.status.toLowerCase() === filter.toLowerCase();
  });

  // Filter spare parts based on status
  const filteredSpareParts = spareParts.filter(part => {
    if (filter === 'all') return true;
    return part.status.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('myAds.title')}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/${currentCountry?.code.toLowerCase()}/spare-parts/add`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
              {t('spareParts.addSparePart')}
            </Link>
            <Link
              href={`/${currentCountry?.code.toLowerCase()}/sell`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
              {t('myAds.addNewCarAd')}
            </Link>
          </div>
        </div>

        {/* Combined Content */}
        <div className="mb-8">
          {/* Cars Section */}
          {cars.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-4">{t('myAds.carsAds')}</h2>
              <CarsTab 
                loading={loading} 
                cars={cars} 
                t={t} 
                currentCountry={currentCountry} 
                language={language}
                isExpired={isExpired}
                handleRenew={handleRenew}
                renewingCarId={renewingCarId}
                handleEditCar={handleEditCar}
                handleDeleteClick={handleDeleteClick}
                handleMarkAsSold={handleMarkCarAsSold}
                handleSetMainPhoto={() => Promise.resolve()}
                actionLoading={actionLoading}
              />
            </div>
          )}

          {/* Spare Parts Section */}
          {spareParts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('myAds.sparePartsAds')}</h2>
              <SparePartsTab 
                loading={loading} 
                spareParts={filteredSpareParts}
                t={t}
                currentCountry={currentCountry}
                language={language}
                isExpired={isExpired}
                onEditSparePart={handleEditSparePart}
                onDeleteSparePart={handleDeleteSparePart}
                onMarkAsSold={handleMarkSparePartAsSold}
                actionLoading={actionLoading}
                renewingSparePartId={renewingSparePartId}
                onRenewSparePart={handleRenewSparePart}
              />
            </div>
          )}

          {/* No items message */}
          {!loading && cars.length === 0 && spareParts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {t('noItemsFound')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
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
                  onClick={handleDeleteConfirm}
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

      {/* Mark as Sold Confirmation Modal */}
      {showSoldModal && (selectedCar || selectedSparePart) && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {t('myAds.markAsSold.title')}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('myAds.markAsSold.message')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                  onClick={handleSoldConfirm}
                  disabled={actionLoading}
                >
                  {t('myAds.markAsSold.confirm')}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowSoldModal(false)}
                >
                  {t('myAds.markAsSold.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Car Modal */}
      <EditCarModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        car={selectedCar || undefined}
        onUpdate={() => {
          // Refresh the cars list after update
          fetchCars();
        }}
        onEditComplete={handleEditComplete}
      />

      {/* Edit Spare Part Modal */}
      {selectedSparePart && (
        <EditSparePartModal
          isOpen={isEditSparePartModalOpen}
          onClose={() => {
            setIsEditSparePartModalOpen(false);
            setSelectedSparePart(null);
          }}
          sparePart={{
            id: selectedSparePart.id,
            title: selectedSparePart.title,
            name_ar: selectedSparePart.name_ar || '',
            description: selectedSparePart.description || '',
            description_ar: selectedSparePart.description_ar || '',
            price: selectedSparePart.price.toString(),
            currency: selectedSparePart.currency,
            part_type: selectedSparePart.part_type,
            condition: selectedSparePart.condition,
            brand_id: selectedSparePart.brand?.id?.toString() || '',
            model_id: selectedSparePart.model?.id?.toString() || '',
            category_id: selectedSparePart.category?.id?.toString() || '',
            city_id: selectedSparePart.city?.id?.toString() || '',
            country_id: selectedSparePart.country?.id?.toString() || '',
            brand: selectedSparePart.brand ? {
              id: selectedSparePart.brand.id,
              name: selectedSparePart.brand.name,
              name_ar: selectedSparePart.brand.name_ar || null
            } : undefined,
            model: selectedSparePart.model ? {
              id: selectedSparePart.model.id,
              name: selectedSparePart.model.name,
              name_ar: selectedSparePart.model.name_ar || null
            } : undefined,
            category: selectedSparePart.category ? {
              id: selectedSparePart.category.id,
              name_en: selectedSparePart.category.name_en,
              name_ar: selectedSparePart.category.name_ar
            } : undefined,
            city: selectedSparePart.city ? {
              id: selectedSparePart.city.id,
              name: selectedSparePart.city.name,
              name_ar: selectedSparePart.city.name_ar
            } : undefined,
            country: selectedSparePart.country ? {
              id: selectedSparePart.country.id,
              name: selectedSparePart.country.name,
              name_ar: selectedSparePart.country.name_ar,
              currency_code: selectedSparePart.country.currency_code
            } : undefined,
            images: selectedSparePart.images.map(img => ({
              id: img.id,
              url: img.url,
              is_primary: img.is_primary
            }))
          }}
          onUpdate={() => {
            // Refresh the spare parts list after update
            fetchSpareParts();
          }}
          onEditComplete={(formData: SparePartFormData) => {
            // Update the spare part in the local state
            setSpareParts(prev => 
              prev.map(sp => {
                if (sp.id === formData.id) {
                  // Create a new spare part with updated fields
                  const updatedSparePart: SparePart = {
                    ...sp,
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price) || 0,
                    currency: formData.currency,
                    part_type: formData.part_type,
                    condition: formData.condition,
                    // Ensure we have valid image objects
                    images: formData.images.map(img => ({
                      id: img.id,
                      url: img.url,
                      is_primary: img.is_primary
                    }))
                  };
                  return updatedSparePart;
                }
                return sp;
              })
            );
            setIsEditSparePartModalOpen(false);
            setSelectedSparePart(null);
          }}
        />
      )}
    </div>
  );
}
