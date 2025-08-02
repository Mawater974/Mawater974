'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '../../lib/supabase';
import { Tab } from '@headlessui/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingBagIcon,
  EyeIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';
import EditCarModal from '@/components/EditCarModal';
import EditSparePartModal from '@/components/EditSparePartModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import CarsTable from '@/components/dealer-dashboard/CarsTable';
import SparePartsTable from '@/components/dealer-dashboard/SparePartsTable-1';
import { SparePart } from '@/types/spare-parts';
import type { SparePartListing } from '@/components/dealer-dashboard/SparePartsTable-1';

interface DealershipData {
  id: number;
  business_name: string;
  business_name_ar?: string;
  business_type: string;
  dealership_type: string;
  status: string;
  user_id: string;
  country_id: number;
}

interface CarListing {
  id: number;
  brand: {
    id: number;
    name: string;
    name_ar?: string;
  };
  model: {
    id: number;
    name: string;
    name_ar?: string;
  };
  year: number;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  country_id: number;
  country: {
    id: number;
    name: string;
    name_ar?: string;
    code: string;
    currency_code?: string;
  };
  city_id: number;
  city: {
    id: number;
    name: string;
    name_ar?: string;
    country_id?: number;
  };
  views_count: number;
  favorite_count?: number;
  images?: { url: string; is_main?: boolean }[];
  description?: string;
  description_ar?: string;
  mileage?: number;
  fuel_type?: string;
  gearbox_type?: string;
  body_type?: string;
  condition?: string;
  featured?: boolean;
  expiration_date?: string;
  
}

interface DashboardStats {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  rejectedListings: number;
  soldListings: number;
  totalViews: number;
  expiredListings: number;
  totalFavorites: number;
}

interface City {
  id: number;
  name: string;
  name_ar?: string;
  country_id?: number;
}

interface Country {
  id: number;
  name: string;
  name_ar?: string;
  code: string;
  currency_code?: string;
}

interface sparePart {
  id: number;
  title: string;
  title_ar?: string;
  brand: string;
  brand_ar?: string;
  model: string;
  model_ar?: string;
  category: string;
  category_ar?: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  views_count: number;
  favorite_count?: number;
  images?: { url: string; is_primary?: boolean }[];
  description?: string;
  description_ar?: string;
}

export default function DealerDashboard() {
  const { supabase } = useSupabase();
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { language, t, dir } = useLanguage();
  const { currentCountry, isLoading: countryLoading } = useCountry();
  const [city, setCity] = useState<City | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | number | null>(null);
  const [cities, setCities] = useState<Array<{ id: number; name: string; name_ar: string | null; country_id: number }>>([]);
  const [dealership, setDealership] = useState<DealershipData | null>(null);
  const [carListings, setCarListings] = useState<Omit<CarListing, 'favorite_count'>[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectedSparePart, setSelectedSparePart] = useState<SparePartListing | null>(null);
  const [isEditCarModalOpen, setIsEditCarModalOpen] = useState(false);
  const [isEditSparePartModalOpen, setIsEditSparePartModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'car' | 'sparePart'>('car');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cars' | 'spare-parts'>('cars');
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    totalViews: 0,
    approvedListings: 0,
    pendingListings: 0,
    rejectedListings: 0,
    soldListings: 0,
    expiredListings: 0,
    totalFavorites: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  function formatPrice(price: number, currencyCode?: string): string {
    // If no price is provided, return a placeholder
    if (price === null || price === undefined) return '-';
    
    // If no currency code is provided or it's just a dash, format as a plain number
    if (!currencyCode || currencyCode.trim() === '' || currencyCode === '-') {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    
    // Try to format with the provided currency code
    try {
      // Check if the currency code is valid
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode.trim().toUpperCase(),
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
      });
      
      // Test if the formatter works by formatting a small number
      formatter.format(1);
      
      // If we get here, the currency code is valid
      return formatter.format(price);
    } catch (error) {
      console.warn(`Invalid currency code: ${currencyCode}. Falling back to plain number format.`);
      // Fallback to simple formatting if currency is invalid
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price) + ' ' + currencyCode;
    }
  }

  // Function to export car listings to CSV with bilingual support
  const exportToCSV = () => {
    if (!carListings.length) return;
    
    setIsExporting(true);
    
    try {
      // Define CSV headers with proper order - including both English and Arabic versions
      const headers = [
        'ID',
        'Brand (EN)',
        'Brand (AR)',
        'Model (EN)',
        'Model (AR)',
        'Year',
        'Price',
        'Currency',
        'Status',
        'Created At',
        'Expiration Date',
        'Views',
        'Mileage (km)',
        'Fuel Type',
        'Gearbox',
        'Body Type',
        'Condition',
        'Featured',
        'Description (EN)',
        'Description (AR)'
      ];
      
      // Convert car listings to CSV rows with proper data mapping
      const rows = carListings.map(car => {
        // Format price without currency symbol for cleaner export
        const priceValue = car.price ? car.price.toString() : '';
        const currencyCode = car.currency || country?.currency_code;
        
        // Format dates
        const createdAt = car.created_at ? new Date(car.created_at).toISOString().split('T')[0] : '';
        const expiryDate = car.expiration_date ? new Date(car.expiration_date).toISOString().split('T')[0] : '';
        
        // Helper function to get translations with fallback
        const getTranslation = (enValue: string | undefined, arValue: string | undefined) => ({
          en: enValue || '',
          ar: arValue || enValue || '' // Fallback to English if Arabic not available
        });

        // Get all fields with both English and Arabic versions
        const brand = getTranslation(car.brand?.name, car.brand?.name_ar);
        const model = getTranslation(car.model?.name, car.model?.name_ar);
        
        // Get translations for other fields (assuming these might have translations in the future)
        const fuelType = getTranslation(car.fuel_type, '');
        const gearbox = getTranslation(car.gearbox_type, '');
        const bodyType = getTranslation(car.body_type, '');
        const condition = getTranslation(car.condition, '');
        const city = getTranslation(car.city?.name, car.city?.name_ar);
        const country = getTranslation(car.country?.name, car.country?.name_ar);
        
        
        // Prepare the row with proper column mapping for both languages
        const row = {
          'ID': car.id,
          'Brand (EN)': brand.en,
          'Brand (AR)': brand.ar,
          'Model (EN)': model.en,
          'Model (AR)': model.ar,
          'Country (EN)': country.en,
          'Country (AR)': country.ar,
          'City (EN)': city.en,
          'City (AR)': city.ar,
          'Year': car.year || '',
          'Price': priceValue,
          'Currency': currencyCode,
          'Status': car.status || '',
          'Created At': createdAt,
          'Expiration Date': expiryDate,
          'Views': car.views_count?.toString() || '0',
          'Mileage (km)': car.mileage?.toString() || '',
          'Fuel Type': fuelType.en,
          'Gearbox': gearbox.en,
          'Body Type': bodyType.en,
          'Condition': condition.en,
          'Featured': car.featured ? 'Yes' : 'No',
          'Description (EN)': `"${(car.description || '').replace(/"/g, '""')}"`,
          'Description (AR)': `"${(car.description_ar || '').replace(/"/g, '""')}"`
        };
        
        // Return the row in the same order as headers
        return headers.map(header => row[header as keyof typeof row]);
      });
      
      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `car-listings-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('dealer.exportSuccess') || 'Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('dealer.exportError') || 'Error exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    // Wait for both auth and country to be initialized
    if (authLoading || countryLoading) return;

    // Check auth and role
    if (!user || !profile || profile.role !== 'dealer') {
      router.push(`/${currentCountry?.code.toLowerCase()}`);
      return;
    }
    const fetchDealerData = async () => {
      try {
        setLoading(true);
        // Fetch dealership data
        const { data: dealershipData, error: dealershipError } = await supabase
          .from('dealerships')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (dealershipError) throw dealershipError;
        if (!dealershipData) {
          router.push(`/${currentCountry?.code.toLowerCase()}`);
          return;
        }

        setDealership(dealershipData);

        // Fetch spare parts first
        const { data: sparePartsList, error: sparePartsError } = await supabase
          .from('spare_parts')
          .select(`
            *,
            brand:brands(id, name, name_ar),
            images:spare_part_images(url, is_primary),
            country:countries(id, name, name_ar, currency_code)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch car listings
        const { data: carListings, error: carListingsError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(id, name, name_ar),
            model:models(id, name, name_ar),
            images:car_images(url, is_main),
            city:cities(id, name, name_ar),
            country:countries(id, name, name_ar, currency_code)
          `)
          .eq('dealership_id', dealershipData.id)
          .order('created_at', { ascending: false });

        if (carListingsError) throw carListingsError;
        if (sparePartsError) throw sparePartsError;

        setCarListings(carListings || []);
        
        // Ensure spare parts have all required fields and proper structure
        const processedSpareParts = (sparePartsList || []).map(part => ({
          ...part,
          // Ensure brand is an object with name and name_ar
          brand: typeof part.brand === 'string' 
            ? { name: part.brand, name_ar: part.brand_ar }
            : part.brand || { name: 'Unknown', name_ar: 'غير معروف' },
          // Ensure images is always an array
          images: part.images || [],
          // Ensure required fields have defaults
          title: part.title || 'Untitled',
          description: part.description || '',
          part_number: part.part_number || '',
          condition: part.condition || 'New',
          price: part.price || 0,
          country: part.country || { currency_code: part.currency_code || '' },
          city: part.city || { name: 'Unknown', name_ar: 'غير معروف' },
          quantity: part.quantity || 0,
          status: part.status || 'Pending',
          created_at: part.created_at || new Date().toISOString(),
          updated_at: part.updated_at || new Date().toISOString(),
          views_count: part.views_count || 0,
          currency_code: part.currency_code || part.country?.currency_code || '',
        }));
        
        setSpareParts(processedSpareParts);

        // Calculate total favorites from cars and spare parts
        const carFavorites = carListings?.reduce((sum, car) => sum + (car.favorite_count || 0), 0) || 0;
        const sparePartFavorites = sparePartsList?.reduce((sum, part) => sum + (part.favorite_count || 0), 0) || 0;
        
        // Update stats
        const totalListings = carListings.length + sparePartsList.length;
        const totalViews = carListings.reduce((sum, car) => sum + (car.views_count || 0), 0) + 
                         sparePartsList.reduce((sum, part) => sum + (part.views_count || 0), 0);
        const approvedListings = carListings.filter(car => car.status === 'approved').length + 
                               sparePartsList.filter(part => part.status === 'approved').length;
        const pendingListings = carListings.filter(car => car.status === 'pending').length + 
                              sparePartsList.filter(part => part.status === 'pending').length;
        const rejectedListings = carListings.filter(car => car.status === 'rejected').length + 
                                sparePartsList.filter(part => part.status === 'rejected').length;
        const soldListings = carListings.filter(car => car.status === 'sold').length + 
                           sparePartsList.filter(part => part.status === 'sold').length;
        const expiredListings = carListings.filter(car => car.status === 'expired').length + 
                              sparePartsList.filter(part => part.status === 'expired').length;
        const totalFavorites = carFavorites + sparePartFavorites;

        setStats({
          totalListings,
          totalViews,
          approvedListings,
          pendingListings,
          rejectedListings,
          soldListings,
          expiredListings,
          totalFavorites,
        });

      } catch (error) {
        console.error('Error fetching dealer data:', error);
        setError('Error fetching dealer data');
      } finally {
        setLoading(false);
      }
    };

    fetchDealerData();
  }, [supabase, user?.id, profile?.role, authLoading, countryLoading, currentCountry?.code, country?.currency_code, router]);

  useEffect(() => {
    const viewCountSubscription = supabase
      .channel('view_count_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.views_count !== payload.old.views_count) {
            // Update the specific car's view count in the local state
            setCarListings(prev => 
              prev.map(car => 
                car.id === payload.new.id 
                  ? { ...car, views_count: payload.new.views_count } 
                  : car
              )
            );

            // Recalculate total views
            const updatedTotalViews = carListings.reduce((sum, car) => 
              sum + (car.views_count || 0), 0
            );

            setStats(prev => ({
              ...prev,
              totalViews: updatedTotalViews
            }));
          }
        }
      )
      .subscribe();

    return () => {
      viewCountSubscription.unsubscribe();
    };
  }, [user, carListings]);

  const handleDeleteClick = (car: CarListing) => {
    setSelectedCar(car);
    setShowDeleteModal(true);
    setDeleteItemType('car');
  };

  const handleDeleteSparePart = (part: ExtendedSparePart) => {
    setSelectedSparePart(part);
    setDeleteItemType('sparePart');
    setShowDeleteModal(true);
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
        
        // Refresh cars data
        await fetchCars();
      } else if (deleteItemType === 'sparePart' && selectedSparePart) {
        const { error } = await supabase
          .from('spare_parts')
          .update({ status: 'archived' })
          .eq('id', selectedSparePart.id);
           
        if (error) throw error;
        
        // Refresh spare parts data
        await fetchSpareParts();
      }

      setShowDeleteModal(false);
      toast.success(t('myAds.adDeleted'));
    } catch (error) {
      console.error('Error archiving item:', error);
      toast.error(t('myAds.error.delete'));
    } finally {
      setActionLoading(false);
      setSelectedCar(null);
      setSelectedSparePart(null);
    }
  };

  const handleEditCar = (car: CarListing) => {
    setSelectedCar(car);
    setIsEditCarModalOpen(true);
  };

  const handleCloseEditCarModal = () => {
    setIsEditCarModalOpen(false);
    setSelectedCar(null);
  };

  const handleEditSparePart = (part: SparePartListing) => {
    setSelectedSparePart(part);
    setIsEditSparePartModalOpen(true);
  };

  const handleCloseEditSparePartModal = () => {
    setIsEditSparePartModalOpen(false);
    setSelectedSparePart(null);
  };

  const handleUpdateCar = async (updatedCar: CarListing) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update(updatedCar)
        .eq('id', updatedCar.id);

      if (error) throw error;

      // Refresh the cars list
      await fetchCars();
      toast.success(t('cars.updateSuccess'));
      setIsEditCarModalOpen(false);
    } catch (error) {
      console.error('Error updating car:', error);
      toast.error(t('common.updateError'));
    }
  };

  const fetchSpareParts = async () => {
    if (!user) return;
    
    try {
      // First, fetch the basic spare parts data
      const { data: sparePartsData, error: partsError } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (partsError) throw partsError;
      if (!sparePartsData || sparePartsData.length === 0) {
        setSpareParts([]);
        return;
      }

      // Fetch related data in parallel
      const [brands, models, categories, countries, images] = await Promise.all([
        supabase.from('brands').select('id, name, name_ar'),
        supabase.from('models').select('id, name, name_ar'),
        supabase.from('spare_part_categories').select('id, name_en, name_ar'),
        supabase.from('countries').select('id, name, name_ar, code, currency_code'),
        supabase.from('spare_part_images')
          .select('id, spare_part_id, url, is_primary')
          .in('spare_part_id', sparePartsData.map(p => p.id))
      ]);

      // Check for errors in any of the queries
      if (brands.error || models.error || categories.error || countries.error || images.error) {
        throw new Error('Error fetching related data');
      }

      // Transform the data to match SparePartListing type
      const formattedData = sparePartsData.map(part => {
        // Find related data
        const partBrand = brands.data?.find(b => b.id === part.brand_id);
        const partModel = models.data?.find(m => m.id === part.model_id);
        const partCategory = categories.data?.find(c => c.id === part.category_id);
        const partCountry = countries.data?.find(c => c.id === part.country_id);
        const partImages = images.data?.filter(img => img.spare_part_id === part.id) || [];

        // Handle country data
        let countryData: SparePartListing['country'] | undefined;
        if (partCountry) {
          countryData = {
            id: partCountry.id,
            name: partCountry.name || '',
            name_ar: partCountry.name_ar,
            code: partCountry.code || '',
            currency_code: partCountry.currency_code
          };
        }

        // Handle category data
        let categoryData: SparePartListing['category'] | undefined;
        if (partCategory) {
          categoryData = {
            id: partCategory.id,
            name: partCategory.name_en || '',
            name_ar: partCategory.name_ar
          };
        }

        // Handle brand data
        let brandData: SparePartListing['brand'] | undefined;
        if (partBrand) {
          brandData = {
            id: partBrand.id,
            name: partBrand.name || '',
            name_ar: partBrand.name_ar
          };
        }

        // Handle model data
        let modelData: SparePartListing['model'] | undefined;
        if (partModel) {
          modelData = {
            id: partModel.id,
            name: partModel.name || '',
            name_ar: partModel.name_ar
          };
        }

        // Format images
        const formattedImages = partImages.map(img => ({
          id: img.id,
          url: img.url,
          is_primary: Boolean(img.is_primary)
        }));

        // Return the formatted spare part
        return {
          ...part,
          brand: brandData || { id: 0, name: '' },
          model: modelData,
          category: categoryData || { id: 0, name: '' },
          country: countryData,
          images: formattedImages
        } as SparePartListing;
      });
      
      setSpareParts(formattedData);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast.error(t('common.fetchError'));
    }
  };

  const handleUpdateSparePart = async (updatedPart: SparePartListing) => {
    try {
      const { error } = await supabase
        .from('spare_parts')
        .update(updatedPart)
        .eq('id', updatedPart.id);

      if (error) throw error;

      // Refresh the spare parts list
      await fetchSpareParts();
      toast.success(t('spareParts.updateSuccess'));
      setIsEditSparePartModalOpen(false);
    } catch (error) {
      console.error('Error updating spare part:', error);
      toast.error(t('common.updateError'));
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'sold':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
      case 'expired':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  };

  const getTabClass = (isSelected: boolean): string => {
    return `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ring-white/60 ring-offset-2 ring-offset-qatar-maroon focus:outline-none focus:ring-2 ${
      isSelected 
        ? 'bg-white text-qatar-maroon shadow-md transform scale-105 dark:bg-gray-700 dark:text-white' 
        : 'text-gray-700 hover:bg-white/[0.12] hover:text-qatar-maroon dark:text-gray-300 dark:hover:text-white'
    }`;
  };

  const getButtonClass = (variant: 'primary' | 'close'): string => {
    if (variant === 'primary') {
      return 'flex items-center gap-2 bg-qatar-maroon text-white px-6 py-2.5 rounded-lg hover:bg-qatar-maroon/90 transition-all hover:scale-105 shadow-md hover:shadow-lg';
    }
    return 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
  };

  const formatCarTitle = (brand: { name: string; name_ar?: string }, model: { name: string; name_ar?: string }, year: number, language: string): string => {
    const brandName = language === 'ar' && brand.name_ar ? brand.name_ar : brand.name;
    const modelName = language === 'ar' && model.name_ar ? model.name_ar : model.name;
    return `${brandName} ${modelName} ${year}`;
  };

  const handleEditClick = (car: any) => {
    setSelectedCar(car);
    setIsEditCarModalOpen(true);
  };

  const fetchCars = async () => {
    try {
      const { data: carListings, error } = await supabase
        .from('cars')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          city:cities(*),
          images:car_images(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no cars, set empty array and return
      if (!carListings || carListings.length === 0) {
        setCarListings([]);
        return;
      }

      setCarListings(carListings);

      // Update stats
      const stats = {
        totalListings: carListings?.length || 0,
        totalViews: carListings?.reduce((sum, car) => sum + (car.views_count || 0), 0) || 0,
        approvedListings: carListings?.filter(car => car.status.toLowerCase() === 'approved').length || 0,
        pendingListings: carListings?.filter(car => car.status.toLowerCase() === 'pending').length || 0,
        rejectedListings: carListings?.filter(car => car.status.toLowerCase() === 'rejected').length || 0,
        soldListings: carListings?.filter(car => car.status.toLowerCase() === 'sold').length || 0,
        expiredListings: carListings?.filter(car => car.status.toLowerCase() === 'expired').length || 0,
        totalFavorites: carListings?.reduce((sum, car) => sum + (car.favorite_count || 0), 0) || 0
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError('Error fetching cars');
      toast.error(t('myAds.error.loadListings'));
      
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
            pageType: 'dealer-dashboard'
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

  const filteredListings = selectedStatus === 'all' 
    ? carListings 
    : carListings.filter(car => car.status.toLowerCase() === selectedStatus);

  // Show loading state while initializing
  if (authLoading || countryLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            {t('dashboard.error.loading')}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Show the no dealership message if the user is a dealer but has no dealership
  if (!loading && user && profile?.role === 'dealer' && !dealership) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('dashboard.noDealership')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('dashboard.noDealershipDesc')}
          </p>
          <button
            onClick={() => router.push(`/${currentCountry?.code.toLowerCase()}/showrooms/register`)}
            className="bg-qatar-maroon text-white px-6 py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors"
          >
            {t('dashboard.registerShowroom')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4" dir={dir}>
      <div className="container mx-auto">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'dashboard.totalListings', 
              value: stats.totalListings, 
              icon: <ShoppingBagIcon className="h-8 w-8 text-qatar-maroon dark:text-qatar-maroon/80" />,
              bgGradient: 'from-qatar-maroon/10 to-qatar-maroon/5'
            },
            { 
              label: 'dashboard.approvedListings', 
              value: stats.approvedListings, 
              icon: <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />,
              bgGradient: 'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10'
            },
            { 
              label: 'dashboard.pendingListings', 
              value: stats.pendingListings, 
              icon: <ClockIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />,
              bgGradient: 'from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10'
            },
            { 
              label: 'dashboard.totalFavorites', 
              value: stats.totalFavorites, 
              icon: <HeartIcon className="h-8 w-8 text-pink-500 dark:text-pink-400" />,
              bgGradient: 'from-pink-100 to-pink-50 dark:from-pink-900/20 dark:to-pink-900/10'
            },
            { 
              label: 'dashboard.rejectedListings', 
              value: stats.rejectedListings, 
              icon: <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />,
              bgGradient: 'from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10'
            },
            { 
              label: 'dashboard.soldListings', 
              value: stats.soldListings, 
              icon: <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />,
              bgGradient: 'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10'
            },
            { 
              label: 'dashboard.expiredListings', 
              value: stats.expiredListings, 
              icon: <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />,
              bgGradient: 'from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10'
            },
            { 
              label: 'dashboard.totalViews', 
              value: stats.totalViews, 
              icon: <EyeIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />,
              bgGradient: 'from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10'
            }
          ].map((stat, index) => (
            <div 
              key={index} 
              className={`bg-gradient-to-br ${stat.bgGradient} dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all hover:shadow-xl hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t(stat.label)}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'ar' && dealership?.business_name_ar
                    ? dealership.business_name_ar
                    : dealership?.business_name}
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    disabled={isExporting || (activeTab === 'cars' ? carListings.length === 0 : spareParts.length === 0)}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-1 ml-1" />
                    {isExporting ? (language === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (language === 'ar' ? 'تصدير البيانات' : 'Export Data')}
                  </button>
                  <button
                    onClick={() => router.push(`/${currentCountry?.code.toLowerCase()}/${activeTab === 'cars' ? 'sell' : 'spare-parts/add'}`)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon`}
                  >
                    <PlusIcon className="h-5 w-5 mr-1 ml-1" />
                    {activeTab === 'cars' ? t('myAds.createListing') : t('spareParts.addSparePart')}
                  </button>
                </div>
              </div>
              
              {/* Main Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('cars')}
                    className={`${activeTab === 'cars' 
                      ? 'border-qatar-maroon text-qatar-maroon dark:border-qatar-maroon/80 dark:text-qatar-maroon/80' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} 
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <TruckIcon className="h-5 w-5 inline-block mr-2 ml-2" />
                    {t('dashboard.cars')} ({carListings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('spare-parts')}
                    className={`${activeTab === 'spare-parts' 
                      ? 'border-qatar-maroon text-qatar-maroon dark:border-qatar-maroon/80 dark:text-qatar-maroon/80' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} 
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <WrenchScrewdriverIcon className="h-5 w-5 inline-block mr-2 ml-2" />
                    {t('dashboard.spareParts')} ({spareParts.length})
                  </button>
                </nav>
              </div>
              
              {/* Status Filter Tabs */}
              <div className="w-full mb-6">
                <Tab.Group>
                  <Tab.List className="flex flex-wrap gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                    {['all', 'approved', 'pending', 'rejected', 'expired', 'sold'].map((status) => (
                      <Tab
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={({ selected }) =>
                          `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            selected 
                              ? 'bg-white dark:bg-gray-800 shadow text-qatar-maroon dark:text-qatar-maroon/80' 
                              : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-600/50'
                          }`
                        }
                      >
                        {t(`dashboard.${status}`)}
                      </Tab>
                    ))}
                  </Tab.List>
                </Tab.Group>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'cars' ? (
            <CarsTable 
              cars={filteredListings} 
              language={language}
              onEdit={handleEditCar}
              onDelete={(id) => {
                const car = filteredListings.find(c => c.id === id);
                if (car) handleDeleteClick(car);
              }}
              onView={(car) => router.push(`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`)}
              formatPrice={formatPrice}
              t={t}
            />
          ) : (
            <SparePartsTable
              spareParts={spareParts.filter(part => {
                if (selectedStatus === 'all') return true;
                if (!part.status) return false;
                return part.status.toLowerCase() === selectedStatus;
              }).map(part => ({
                ...part,
                // Ensure required fields have default values
                title: part.title || 'Untitled',
                description: part.description || '',
                part_number: part.part_number || '',
                brand: part.brand || 'Unknown',
                condition: part.condition || '',
                category: part.category || '',
                price: part.price || 0,
                quantity: part.quantity || 0,
                status: part.status || 'Pending',
                created_at: part.created_at || new Date().toISOString(),
                updated_at: part.updated_at || new Date().toISOString(),
                views_count: part.views_count || 0,
                currency_code: part.currency_code || '-',
                // Add country with currency_code if needed by the component
                ...(part.country_id ? {
                  country: {
                    currency_code: part.currency_code || '-'
                  }
                } : {})
              }))} 
              onEdit={handleEditSparePart}
              onDelete={(id) => {
                const part = spareParts.find(p => p.id === id);
                if (part) handleDeleteSparePart(part);
              }}
              onView={(part) => {
                router.push(`/${currentCountry?.code.toLowerCase()}/spare-parts/${part.id}`);
              }}
              formatPrice={formatPrice}
              t={t}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('myAds.delete.title')}
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCar(null);
                    setSelectedSparePart(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('myAds.delete.message')}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCar(null);
                    setSelectedSparePart(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={actionLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    actionLoading
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Car Modal */}
        {isEditCarModalOpen && selectedCar && (
          <EditCarModal
            isOpen={isEditCarModalOpen}
            onClose={handleCloseEditCarModal}
            car={selectedCar}
            onUpdate={() => {
              fetchCars();
              handleCloseEditCarModal();
            }}
          />
        )}
        {isEditSparePartModalOpen && selectedSparePart && (
          <EditSparePartModal
            isOpen={isEditSparePartModalOpen}
            onClose={handleCloseEditSparePartModal}
            sparePart={selectedSparePart as any}
            onUpdate={() => {
              fetchSpareParts();
              handleCloseEditSparePartModal();
            }}
          />
        )}
      </div>
    </div>
  );
}
