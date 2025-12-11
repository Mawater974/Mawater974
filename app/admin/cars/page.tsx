'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types/car';
import { CarImage } from '@/types/supabase';
import { TrashIcon, StarIcon, CheckIcon, XMarkIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';

// Dynamically import components that use browser APIs
const EditCarModal = dynamic(
  () => import('@/components/EditCarModal'),
  { ssr: false }
);

const AdminCarForm = dynamic(
  () => import('@/components/admin/cars/AdminCarForm'),
  { ssr: false }
);


interface ExtendedCar extends Car {
  id: number;
  user_id?: string;
  brand_id?: number;
  model_id?: number;
  year: number;
  mileage: number;
  price: number;
  color: string;
  description?: string;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  status: string;
  images?: string[];
  thumbnail?: string;
  created_at: string;
  updated_at?: string;
  image?: string;
  is_featured?: boolean;
  location?: string;
  cylinders?: string;
  views_count?: number;
  dealership_id?: number;
  country_id?: number;
  city_id?: number;
  exact_model?: string;
  rejection_reason?: any;
  expiration_date?: string;
  
  brand?: {
    name: string;
  };
  model?: {
    name: string;
  };
  country?: {
    name: string;
  };
  city?: {
    name: string;
  };
  dealership?: {
    name: string;
  };
  user?: {
    id?: string;
    full_name: string;
    email: string;
  };
  images_array?: {
    url: string;
    is_main: boolean;
  }[];
}

type CarStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'expired' | 'hidden' | 'archived';
type SortOrder = 'newest' | 'oldest' | 'price_high' | 'price_low';

export default function AdminCarsPage() {
  const [mounted, setMounted] = useState(false);
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [editingCar, setEditingCar] = useState<ExtendedCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStatus, setActiveStatus] = useState<CarStatus>('pending');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showAddForm, setShowAddForm] = useState(false);
  const { currentCountry } = useCountry();
  const { t, currentLanguage } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAdminStatus();
    fetchCars();
    checkExpiredCars();
  }, [user, activeStatus, sortOrder]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(profile?.role === 'admin');
  };

  // Function to get thumbnail URL with fallback
  const getThumbnailUrl = (car: any) => {
    // First try to get the thumbnail URL
    if (car.thumbnail) return car.thumbnail;
    
    // If no thumbnail, try to get the main image from car_images
    if (car.images && car.images.length > 0) {
      const mainImage = car.images.find((img: any) => img.is_main) || car.images[0];
      if (mainImage && mainImage.url) return mainImage.url;
    }
    
    // Fallback to the image URL if it exists
    if (car.image) return car.image;
    
    // If no images at all, return a placeholder
    return '/placeholder-car.jpg';
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      
      // Build the base query
      let query = supabase
        .from('cars')
        .select(`
          *,
          brand:brands!inner(id, name, name_ar),
          model:models!inner(id, name, name_ar),
          user:profiles!inner(full_name, email, phone_number),
          country:countries!inner(id, currency_code, code, name, name_ar),
          city:cities!inner(id, name, name_ar),
          car_images!car_images_car_id_fkey(id, image_url, thumbnail_url, is_main, display_order)
        `);

      // Filter by status if not 'all'
      if (activeStatus !== 'all') {
        query = query.eq('status', activeStatus);
      }

      // Apply sorting
      switch (sortOrder) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Process the cars to ensure they have proper image URLs and structure
      const processedCars = data.map((car: any) => {
        // Ensure images array is properly formatted
        const images = (car.car_images || []).map((img: any) => ({
          id: img.id,
          url: img.image_url,
          thumbnail_url: img.thumbnail_url || img.image_url,
          is_main: img.is_main,
          display_order: img.display_order || 0
        })).sort((a: any, b: any) => {
          // Sort by is_main (main image first) then by display_order
          if (a.is_main && !b.is_main) return -1;
          if (!a.is_main && b.is_main) return 1;
          return (a.display_order || 0) - (b.display_order || 0);
        });

        // Get the main image URL for the thumbnail
        const mainImage = images.find((img: any) => img.is_main) || images[0];
        const thumbnail = mainImage?.thumbnail_url || 
                         mainImage?.url || 
                         '/images/car-placeholder.jpg';

        return {
          ...car,
          thumbnail,
          images,
          // Keep backward compatibility
          image: mainImage?.url,
          images_array: images.map((img: any) => ({
            url: img.url,
            is_main: img.is_main
          }))
        };
      });
      
      setCars(processedCars);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (userId: string, type: string, brandName: string, modelName: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type,
            title_en: t(`notifications.${type}.title_en`),
            title_ar: t(`notifications.${type}.title_ar`),
            message_en: t(`notifications.${type}.message_en`, { 
              brand: brandName,
              model: modelName
            }),
            message_ar: t(`notifications.${type}.message_ar`, { 
              brand: brandName,
              model: modelName
            })
          }
        ]);

      if (error) throw error;
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const handleStatusChange = async (carId: number, newStatus: CarStatus) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId);

      if (error) throw error;
      
      // Process the cars to ensure they have proper image URLs
      const processedCars = cars.map((car: any) => ({
        ...car,
        // For admin, we'll use the first image as thumbnail
        thumbnail: car.images?.find((img: any) => img.is_main)?.thumbnail_url || 
                  car.images?.[0]?.thumbnail_url || 
                  car.images?.[0]?.image_url || 
                  '/images/car-placeholder.jpg',
        // Ensure images array is properly formatted
        images: (car.images || []).map((img: any) => ({
          id: img.id,
          url: img.image_url,
          thumbnail_url: img.thumbnail_url || img.image_url,
          is_main: img.is_main,
          display_order: img.display_order
        })).sort((a: any, b: any) => {
          if (a.is_main && !b.is_main) return -1;
          if (!a.is_main && b.is_main) return 1;
          return (a.display_order || 0) - (b.display_order || 0);
        })
      }));
      
      setCars(processedCars);

      // Create notification for the user
      const car = cars.find(c => c.id === carId);
      if (car) {
        if (newStatus === 'approved') {
          await createNotification(
            car.user_id,
            'approval',
            car.brand.name,
            car.model.name
          );
        } else if (newStatus === 'rejected') {
          await createNotification(
            car.user_id,
            'rejection',
            car.brand.name,
            car.model.name
          );
        } else if (newStatus === 'sold') {
          await createNotification(
            car.user_id,
            'sold',
            car.brand.name,
            car.model.name
          );
        }
      }

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error updating car status:', err);
      setError('Failed to update car status');
    }
  };

  const handleToggleFeature = async (carId: number, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_featured: !currentFeatured })
        .eq('id', carId);

      if (error) throw error;

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error updating featured status:', err);
      setError('Failed to update featured status');
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car listing?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error deleting car:', err);
      setError('Failed to delete car');
    }
  };

  const handleEdit = async (car: ExtendedCar) => {
    setEditingCar(car);
  };

  const handleAcceptAll = async () => {
    try {
      // Get all pending cars
      const { data: pendingCars, error: fetchError } = await supabase
        .from('cars')
        .select('id, brand:brands(name), model:models(name), user_id')
        .eq('status', 'Pending');

      if (fetchError) throw fetchError;

      if (!pendingCars || pendingCars.length === 0) {
        toast('No pending cars to approve', { icon: '📋' });
        return;
      }

      // Update all pending cars to approved
      const { error: updateError } = await supabase
        .from('cars')
        .update({ status: 'approved' })
        .eq('status', 'pending');

      if (updateError) throw updateError;

      // Create notifications for all users
      for (const car of pendingCars) {
        await createNotification(
          car.user_id,
          'Car Listing Approved!',
          `Great news! Your ${car.brand.name} ${car.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
          'approval'
        );
      }

      toast('Successfully approved cars', { icon: '✅' });
      fetchCars();
    } catch (err) {
      console.error('Error approving all cars:', err);
      toast.error('Failed to approve all cars');
    }
  };

  const handleSetSold = async () => {
    try {
      // Get all approved cars
      const { data: approvedCars, error: fetchError } = await supabase
        .from('cars')
        .select('id, brand:brands(name), model:models(name), user_id')
        .eq('status', 'approved');

      if (fetchError) throw fetchError;

      if (!approvedCars || approvedCars.length === 0) {
        toast('No approved cars to set as sold', { icon: '📋' });
        return;
      }

      // Update all approved cars to sold
      const { error: updateError } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('status', 'approved');

      if (updateError) throw updateError;

      // Create notifications for all users
      for (const car of approvedCars) {
        await createNotification(
          car.user_id,
          'Car Marked as Sold!',
          `Your ${car.brand.name} ${car.model.name} has been marked as sold. Congratulations on your sale!`,
          'sold'
        );
      }

      toast('Successfully set cars as sold', { icon: '✅' });
      fetchCars();
    } catch (err) {
      console.error('Error setting all cars as sold:', err);
      toast.error('Failed to set all cars as sold');
    }
  };

  const handleSetApproved = async (carId?: number) => {
    try {
      if (!carId) {
        toast.error('Invalid car ID');
        return;
      }

      // Get car details first
      const { data: carData, error: fetchError } = await supabase
        .from('cars')
        .select('*, brand:brands(name), model:models(name), user_id')
        .eq('id', carId)
        .single();

      if (fetchError) {
        console.error('Error fetching car details:', fetchError);
        toast.error('Failed to fetch car details');
        return;
      }

      // Update car status to Approved
      const { error: updateError } = await supabase
        .from('cars')
        .update({ status: 'approved' })
        .eq('id', carId);

      if (updateError) {
        console.error('Error updating car status:', updateError);
        toast.error('Failed to approve car');
        return;
      }

      // Create notification for the user
      await createNotification(
        carData.user_id,
        'Car Listing Approved!',
        `Great news! Your ${carData.brand.name} ${carData.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
        'approval'
      );

      // Refresh the cars list
      fetchCars();

      toast('Car successfully approved', { icon: '✅' });
    } catch (err) {
      console.error('Error in handleSetApproved:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handleSetPending = async (carId?: number) => {
    try {
      if (!carId) {
        toast.error('Invalid car ID');
        return;
      }

      // Update single car to pending
      const { error } = await supabase
        .from('cars')
        .update({ status: 'Pending' })
        .eq('id', carId);

      if (error) throw error;

      toast('Car listing set to pending successfully', { icon: '✅' });
    } catch (err) {
      console.error('Error setting car to pending:', err);
      toast.error('Failed to set car to pending');
    }
  };

  const checkExpiredCars = async () => {
    try {
      // Manually trigger the update_expired_car_status function in Supabase
      const { data, error } = await supabase.rpc('update_expired_car_status');

      if (error) {
        console.error('Error updating expired cars:', error);
        toast.error('Failed to update expired cars');
        return;
      }

      // Refresh the cars list after updating
      await fetchCars();
      
      toast('Successfully updated expired cars', { icon: '✅' });
    } catch (err) {
      console.error('Error in checkExpiredCars:', err);
      toast.error('An unexpected error occurred');
    }
  };

  // Export function for specific car statuses with format selection
  const exportCarsByStatus = async (statuses: CarStatus[], format: 'json' | 'csv' | 'both' = 'both') => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Preparing export...');
      
      // Filter cars by specified statuses
      const filteredCars = cars.filter(car => 
        statuses.includes(car.status as CarStatus)
      );

      if (!filteredCars || filteredCars.length === 0) {
        toast.dismiss(loadingToastId);
        toast.error(`No cars found with status: ${statuses.join(', ')}`);
        return;
      }

      // Prepare data for export with safe property access - memoize to improve performance
      const exportData = filteredCars.map(car => ({
        id: car?.id ?? '',
        user_id: car?.user_id ?? '',
        brand_id: car?.brand_id ?? '',
        model_id: car?.model_id ?? '',
        year: car?.year ?? '',
        mileage: car?.mileage ?? '',
        price: car?.price ?? '',
        color: car?.color ?? '',
        description: car?.description ?? '',
        fuel_type: car?.fuel_type ?? '',
        gearbox_type: car?.gearbox_type ?? '',
        body_type: car?.body_type ?? '',
        condition: car?.condition ?? '',
        status: car?.status ?? '',
        images: car?.images ?? [],
        thumbnail: car?.thumbnail ?? '',
        created_at: car?.created_at ?? '',
        updated_at: car?.updated_at ?? '',
        image: car?.image ?? '',
        is_featured: car?.is_featured ?? false,
        location: car?.location ?? '',
        cylinders: car?.cylinders ?? '',
        views_count: car?.views_count ?? '',
        dealership_id: car?.dealership_id ?? '',
        country_id: car?.country_id ?? '',
        city_id: car?.city_id ?? '',
        exact_model: car?.exact_model ?? '',
        rejection_reason: car?.rejection_reason ?? null,
        expiration_date: car?.expiration_date ?? '',
        
        // Additional descriptive fields
        brand_name: car?.brand?.name ?? '',
        model_name: car?.model?.name ?? '',
        country_name: car?.country?.name ?? '',
        city_name: car?.city?.name ?? '',
        dealership_name: car?.dealership?.name ?? '',
        user_full_name: car?.user?.full_name ?? '',
        user_email: car?.user?.email ?? ''
      }));

      // Generate timestamp for filenames
      const timestamp = new Date().toISOString().split('T')[0];
      const statusString = statuses.join('_');
      let exportCount = 0;

      // Export to JSON if requested
      if (format === 'json' || format === 'both') {
        try {
          const jsonString = JSON.stringify(exportData, null, 2);
          const jsonBlob = new Blob([jsonString], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `cars_export_${statusString}_${timestamp}.json`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          URL.revokeObjectURL(jsonUrl);
          exportCount++;
        } catch (jsonError) {
          console.error('JSON export error:', jsonError);
          toast.error('Failed to export JSON format');
        }
      }

      // Export to CSV if requested
      if (format === 'csv' || format === 'both') {
        try {
          // Define columns for CSV in a comprehensive order
          const columns = [
            'ID', 'User ID', 'Brand ID', 'Model ID', 
            'Year', 'Mileage', 'Price', 'Color', 
            'Description', 'Fuel Type', 'Gearbox Type', 
            'Body Type', 'Condition', 'Status', 
            'Images', 'Thumbnail', 'Created At', 
            'Updated At', 'Image', 'Is Featured', 
            'Location', 'Cylinders', 'Views Count', 
            'Dealership ID', 'Country ID', 'City ID', 
            'Exact Model', 'Expiration Date',
            // Additional descriptive fields
            'Brand Name', 'Model Name', 
            'Country Name', 'City Name', 
            'Dealership Name', 
            'User Full Name', 'User Email'
          ];

          const csvRows = [
            columns.join(','), // Header
            ...filteredCars.map(car => [
              car?.id ?? '',
              car?.user_id ?? '',
              car?.brand_id ?? '',
              car?.model_id ?? '',
              car?.year ?? '',
              car?.mileage ?? '',
              car?.price ?? '',
              car?.color ?? '',
              car?.description?.replace(/,/g, ';').replace(/\n/g, ' ') ?? '',
              car?.fuel_type ?? '',
              car?.gearbox_type ?? '',
              car?.body_type ?? '',
              car?.condition ?? '',
              car?.status ?? '',
              (car?.images?.join('|') ?? '').replace(/,/g, ';'),
              car?.thumbnail ?? '',
              car?.created_at ?? '',
              car?.updated_at ?? '',
              car?.image ?? '',
              car?.is_featured ?? '',
              car?.location ?? '',
              car?.cylinders ?? '',
              car?.views_count ?? '',
              car?.dealership_id ?? '',
              car?.country_id ?? '',
              car?.city_id ?? '',
              car?.exact_model?.replace(/,/g, ';') ?? '',
              car?.expiration_date ?? '',
              // Additional descriptive fields
              car?.brand?.name?.replace(/,/g, ';') ?? '',
              car?.model?.name?.replace(/,/g, ';') ?? '',
              car?.country?.name?.replace(/,/g, ';') ?? '',
              car?.city?.name?.replace(/,/g, ';') ?? '',
              car?.dealership?.name?.replace(/,/g, ';') ?? '',
              car?.user?.full_name?.replace(/,/g, ';') ?? '',
              car?.user?.email?.replace(/,/g, ';') ?? ''
            ].map(value => 
              value !== null && value !== undefined 
                ? `"${String(value).replace(/"/g, '""')}"` 
                : '""'
            ).join(','))
          ].join('\n');

          const csvBlob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `cars_export_${statusString}_${timestamp}.csv`;
          document.body.appendChild(csvLink);
          csvLink.click();
          document.body.removeChild(csvLink);
          URL.revokeObjectURL(csvUrl);
          exportCount++;
        } catch (csvError) {
          console.error('CSV export error:', csvError);
          toast.error('Failed to export CSV format');
        }
      }

      // Dismiss loading toast and show success message
      toast.dismiss(loadingToastId);
      
      if (exportCount > 0) {
        const formatMsg = format === 'both' ? 'JSON and CSV formats' : `${format.toUpperCase()} format`;
        toast.success(`Exported ${filteredCars.length} cars with status: ${statuses.join(', ')} in ${formatMsg}`);
      } else {
        toast.error('Export failed. No files were created.');
      }
    } catch (err) {
      console.error('Export by status error:', err);
      toast.error('Failed to export cars: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Convenience methods for exporting specific statuses
  const exportPendingCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['pending'], format);
  const exportApprovedCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['approved'], format);
  const exportRejectedCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['rejected'], format);
  const exportSoldCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['sold'], format);
  const exportExpiredCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['expired'], format);
  const exportHiddenCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus(['hidden'], format);
  
  // Export all statuses together
  const exportAllCars = (format?: 'json' | 'csv' | 'both') => exportCarsByStatus([
    'pending', 'approved', 'rejected', 
    'sold', 'expired', 'hidden'
  ], format);

  // Export functions
  const exportToJSON = () => {
    try {
      if (!cars || cars.length === 0) {
        toast.error('No cars to export');
        return;
      }

      // Prepare data for export with safe property access
      const exportData = cars.map(car => ({
        id: car?.id ?? '',
        user_id: car?.user_id ?? '',
        brand_id: car?.brand_id ?? '',
        model_id: car?.model_id ?? '',
        year: car?.year ?? '',
        mileage: car?.mileage ?? '',
        price: car?.price ?? '',
        color: car?.color ?? '',
        description: car?.description ?? '',
        fuel_type: car?.fuel_type ?? '',
        gearbox_type: car?.gearbox_type ?? '',
        body_type: car?.body_type ?? '',
        condition: car?.condition ?? '',
        status: car?.status ?? '',
        images: car?.images ?? [],
        thumbnail: car?.thumbnail ?? '',
        created_at: car?.created_at ?? '',
        updated_at: car?.updated_at ?? '',
        image: car?.image ?? '',
        is_featured: car?.is_featured ?? false,
        location: car?.location ?? '',
        cylinders: car?.cylinders ?? '',
        views_count: car?.views_count ?? '',
        dealership_id: car?.dealership_id ?? '',
        country_id: car?.country_id ?? '',
        city_id: car?.city_id ?? '',
        exact_model: car?.exact_model ?? '',
        rejection_reason: car?.rejection_reason ?? null,
        expiration_date: car?.expiration_date ?? '',
        
        // Additional descriptive fields
        brand_name: car?.brand?.name ?? '',
        model_name: car?.model?.name ?? '',
        country_name: car?.country?.name ?? '',
        city_name: car?.city?.name ?? '',
        dealership_name: car?.dealership?.name ?? '',
        user_full_name: car?.user?.full_name ?? '',
        user_email: car?.user?.email ?? ''
      }));

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cars_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} cars`);
    } catch (err) {
      console.error('Export to JSON error:', err);
      toast.error('Failed to export cars');
    }
  };

  const exportToCSV = () => {
    try {
      if (!cars || cars.length === 0) {
        toast.error('No cars to export');
        return;
      }

      // Define columns for CSV in a comprehensive order
      const columns = [
        'ID', 'User ID', 'Brand ID', 'Model ID', 
        'Year', 'Mileage', 'Price', 'Color', 
        'Description', 'Fuel Type', 'Gearbox Type', 
        'Body Type', 'Condition', 'Status', 
        'Images', 'Thumbnail', 'Created At', 
        'Updated At', 'Image', 'Is Featured', 
        'Location', 'Cylinders', 'Views Count', 
        'Dealership ID', 'Country ID', 'City ID', 
        'Exact Model', 'Expiration Date',
        // Additional descriptive fields
        'Brand Name', 'Model Name', 
        'Country Name', 'City Name', 
        'Dealership Name', 
        'User Full Name', 'User Email'
      ];

      // Prepare CSV content with safe property access
      const csvRows = [
        columns.join(','), // Header
        ...cars.map(car => [
          car?.id ?? '',
          car?.user_id ?? '',
          car?.brand_id ?? '',
          car?.model_id ?? '',
          car?.year ?? '',
          car?.mileage ?? '',
          car?.price ?? '',
          car?.color ?? '',
          car?.description?.replace(/,/g, ';') ?? '',
          car?.fuel_type ?? '',
          car?.gearbox_type ?? '',
          car?.body_type ?? '',
          car?.condition ?? '',
          car?.status ?? '',
          (car?.images?.join('|') ?? '').replace(/,/g, ';'),
          car?.thumbnail ?? '',
          car?.created_at ?? '',
          car?.updated_at ?? '',
          car?.image ?? '',
          car?.is_featured ?? '',
          car?.location ?? '',
          car?.cylinders ?? '',
          car?.views_count ?? '',
          car?.dealership_id ?? '',
          car?.country_id ?? '',
          car?.city_id ?? '',
          car?.exact_model?.replace(/,/g, ';') ?? '',
          car?.expiration_date ?? '',
          // Additional descriptive fields
          car?.brand?.name?.replace(/,/g, ';') ?? '',
          car?.model?.name?.replace(/,/g, ';') ?? '',
          car?.country?.name?.replace(/,/g, ';') ?? '',
          car?.city?.name?.replace(/,/g, ';') ?? '',
          car?.dealership?.name?.replace(/,/g, ';') ?? '',
          car?.user?.full_name?.replace(/,/g, ';') ?? '',
          car?.user?.email?.replace(/,/g, ';') ?? ''
        ].map(value => 
          value !== null && value !== undefined 
            ? `"${String(value).replace(/"/g, '""')}"` 
            : '""'
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cars_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${cars.length} cars`);
    } catch (err) {
      console.error('Export to CSV error:', err);
      toast.error('Failed to export cars');
    }
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingCar(null);
    fetchCars(); // Refresh the car list
  };

  // Handle edit car
  const handleEditCar = (car: ExtendedCar) => {
    setEditingCar(car);
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingCar(null);
  };

  if (loading && !cars.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  // Show the add/edit form if needed
  if (showAddForm || editingCar) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleCancelForm}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronDownIcon className="h-4 w-4 mr-1 transform rotate-90" />
          Back to car listings
        </button>
        <AdminCarForm
          car={editingCar || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusTabs: { status: CarStatus; label: string }[] = [
    { status: 'pending', label: 'Pending' },
    { status: 'approved', label: 'Approved' },
    { status: 'rejected', label: 'Rejected' },
    { status: 'expired', label: 'Expired' },
    { status: 'sold', label: 'Sold' },
    { status: 'hidden', label: 'Hidden' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'price_low', label: 'Price: Low to High' }
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Car Listings</h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          {/* Add New Car Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Car
          </button>
          
          {/* View mode toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'detail' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Car Listings</h1>
              </div>
              <div className="flex items-center space-x-4">
                {activeStatus === 'pending' && (
                  <button
                    onClick={handleAcceptAll}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                  >
                    Accept All Pending
                  </button>
                )}
                {activeStatus === 'approved' && (
                  <button
                    onClick={handleSetSold}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                  >
                    Set All as Sold
                  </button>
                )}
                {activeStatus === 'rejected' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSetApproved}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                    >
                      Approve All
                    </button>
                    <button
                      onClick={handleSetPending}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors duration-200"
                    >
                      Set All to Pending
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md ${
                      viewMode === 'grid'
                        ? 'bg-qatar-maroon text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('detail')}
                    className={`px-3 py-1.5 rounded-md ${
                      viewMode === 'detail'
                        ? 'bg-qatar-maroon text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Detail
                  </button>
                </div>

                {/* Sort Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon">
                    Sort by
                    <ChevronDownIcon className="ml-2 h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <Menu.Item key={option.value}>
                            {({ active }) => (
                              <button
                                onClick={() => setSortOrder(option.value as SortOrder)}
                                className={`
                                  ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                  ${sortOrder === option.value ? 'text-qatar-maroon' : 'text-gray-700 dark:text-gray-200'}
                                  group flex items-center w-full px-4 py-2 text-sm
                                `}
                              >
                                {option.label}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                {/* Export Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon">
                    Export
                    <ChevronDownIcon className="ml-2 h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportToJSON}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              JSON
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportToCSV}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              CSV
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportPendingCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Pending Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportApprovedCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Approved Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportRejectedCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Rejected Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportSoldCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Sold Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportExpiredCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Expired Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportHiddenCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              Hidden Cars
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={exportAllCars}
                              className={`
                                ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                text-gray-700 dark:text-gray-200 group flex items-center w-full px-4 py-2 text-sm
                              `}
                            >
                              All Cars
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {statusTabs.map(({ status, label }) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`
                      whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeStatus === status
                          ? 'border-qatar-maroon text-qatar-maroon'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <LoadingSpinner />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {cars.map((car) => (
                <div

                  key={car.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors duration-200"

                >
                  {/* Car Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                        alt={`${car.brand.name} ${car.model.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Car Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {car.brand.name} {car.model.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {car.year} • {car.mileage.toLocaleString()} km
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Featured Toggle */}
                        <button
                          onClick={() => handleToggleFeature(car.id, car.is_featured)}
                          className={`p-1.5 rounded-lg transition-colors duration-200 ${
                            car.is_featured 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={car.is_featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <StarIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-lg font-semibold text-qatar-maroon">
                        QAR {car.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Posted by: {car.user?.full_name}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-end space-x-2">
                      <Link
                        href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEdit(car)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                      >
                        Edit
                      </button>
                      {activeStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(car.id, 'approved')}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(car.id, 'rejected')}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {activeStatus === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(car.id, 'sold')}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                        >
                          Set as Sold
                        </button>
                      )}
                      {activeStatus === 'rejected' && (
                        <>
                          <button
                            onClick={() => handleSetApproved(car.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleSetPending(car.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Set to Pending
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(car.id)}
                        className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Car</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-20 w-32 flex-shrink-0 mr-4 overflow-hidden rounded-lg">
                            {car.images && car.images.length > 0 ? (
                              <img
                                src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                                alt={`${car.brand.name} ${car.model.name}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {car.brand.name} {car.model.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {car.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{car.user.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{car.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>Mileage: {car.mileage.toLocaleString()} km</div>
                          <div>Color: {car.color}</div>
                          <div>Transmission: {car.transmission}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        QAR {car.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            car.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : car.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : car.status === 'sold'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : car.status === 'hidden'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : car.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }
                        `}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleEdit(car)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Edit
                          </button>
                          {activeStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(car.id, 'approved')}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(car.id, 'rejected')}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {activeStatus === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(car.id, 'sold')}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                            >
                              Set as Sold
                            </button>
                          )}
                          {activeStatus === 'rejected' && (
                            <>
                              <button
                                onClick={() => handleSetApproved(car.id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleSetPending(car.id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Set to Pending
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(car.id)}
                            className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                            title="Delete"
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
          )}

          {/* Edit Car Modal */}
          {editingCar && (
            <EditCarModal
              isOpen={!!editingCar}
              onClose={() => setEditingCar(null)}
              car={editingCar}
              onUpdate={fetchCars}
              onEditComplete={() => setEditingCar(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
