'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '@/lib/supabase';
import { Database, Car, Brand, Profile, Country, City, CarImage } from '@/types/supabase';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { 
  HeartIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon, 
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import CarCard from '@/components/CarCard';
import CarCompareModal from '@/components/CarCompareModal';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginPopup from '@/components/LoginPopup';

type CarCondition = 'Good' | 'Excellent' | 'New' | 'Not Working';
type BodyType = 'Sedan' | 'SUV' | 'Coupe' | 'Hatchback' | 'Wagon' | 'Van' | 'Truck' | 'Convertible' | 'Other';
type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
type SellerType = 'dealer' | 'private';

interface ExtendedCar extends Omit<Car, 'brand_id' | 'model_id'> {
  brand: Brand;
  model: {
    id: number;
    name: string;
  };
  images: CarImage[];
  city: {
    id: number;
    name: string;
  };
  country: Country;
  color: string;
  is_featured: boolean;
}

interface CarWithLocation extends Omit<ExtendedCar, 'user' | 'country' | 'city' | 'images'> {
  location?: string;
  brand_id: number;
  model_id: number;
  user_id: string;
  user: Profile;
  country: Country;
  city: City;
  images: CarImage[];
  name: string;
  exact_model?: string;
  favorite: boolean;
}

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  brand_id?: number;
  model?: string;
  exact_model?: string;
  condition?: CarCondition[];
  body_type?: BodyType[];
  fuel_type?: FuelType[];
  gearbox_type?: string[];
  seller_type?: SellerType[];
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc';
}

export default function CarsPage() {
  const [cars, setCars] = useState<CarWithLocation[]>([]);
  const [featuredCars, setFeaturedCars] = useState<CarWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryLoading, setCountryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ sort: 'newest' });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCars, setSelectedCars] = useState<CarWithLocation[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const { user } = useAuth();
  const { t, language, currentLanguage } = useLanguage();
  const { currentCountry, formatPrice } = useCountry();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sortOptions = [
    { value: 'newest', label: t('car.sort.newest') },
    { value: 'oldest', label: t('car.sort.oldest') },
    { value: 'price_asc', label: t('car.sort.priceLow') },
    { value: 'price_desc', label: t('car.sort.priceHigh') },
    { value: 'year_asc', label: t('car.sort.yearOld') },
    { value: 'year_desc', label: t('car.sort.yearNew') },
  ];

  useEffect(() => {
    fetchBrands();
    fetchCars();
 
    if (user) {
      fetchUserFavorites();
    }
  }, [user, filters, searchInput, currentCountry]);

  useEffect(() => {
    setShowCompareBar(selectedCars.length > 0);
  }, [selectedCars]);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const isLaptopOrLarger = screenWidth > 768;
      setShowFilters(isLaptopOrLarger);
      setIsMobile(screenWidth <= 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!countryLoading) {
      fetchCars();
    }
  }, [currentCountry, countryLoading, filters]);

  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          const response = await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: currentCountry.code,
              userId: user?.id,
              pageType: 'cars'
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to track page view:', error);
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };

      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching brands:', error);
      return;
    }
    setBrands(data);
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: carsData, error } = await supabase
        .from('cars')
        .select(`*, brand:brands(*), model:models(*), user:profiles!user_id(*), city:cities(*), country:countries(*), images:car_images(url, is_main)`)
        .eq('status', 'Approved')
        .eq('country_id', currentCountry?.id || 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!carsData) {
        setCars([]);
        setFeaturedCars([]);
        return;
      }

      const transformedCars: CarWithLocation[] = carsData.map(car => {
        // Handle potentially null relationships
        const cityName = car.city?.name || 'Unknown City';
        const countryName = car.country?.name || 'Unknown Country';
        const brandName = car.brand?.name || 'Unknown Brand';
        const modelName = car.model?.name || 'Unknown Model';

        return {
          ...car,
          brand: car.brand || { id: 0, name: 'Unknown Brand', created_at: new Date().toISOString() },
          model: car.model || { id: 0, name: 'Unknown Model', brand_id: 0, created_at: new Date().toISOString() },
          user: car.user || null,
          brand_id: car.brand_id,
          model_id: car.model_id,
          user_id: car.user_id,
          city: car.city || { id: 0, name: 'Unknown City', country_id: 0, created_at: new Date().toISOString() },
          country: car.country || { id: 0, name: 'Unknown Country', code: 'XX', created_at: new Date().toISOString() },
          images: car.images || [],
          location: `${cityName}, ${countryName}`,
          name: `${brandName} ${modelName}`,
          exact_model: car.exact_model || '',
          favorite: favorites.includes(car.id),
          color: car.color || '',
          is_featured: car.is_featured || false
        };
      });

      // Apply filters and sorting
      const filteredCars = filterCars(transformedCars);
      const sortedCars = sortCars(filteredCars);

      // Update state
      setCars(sortedCars);
      setFeaturedCars(sortedCars.filter(car => car.is_featured));
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching cars');
    } finally {
      setLoading(false);
      setCountryLoading(false);
    }
  };

  const filterCars = (cars: CarWithLocation[]) => {
    // First, separate featured and non-featured cars
    const featured = cars.filter(car => car.is_featured);
    const nonFeatured = cars.filter(car => !car.is_featured);

    // Apply filters to both featured and non-featured cars
    const filterFunction = (car: CarWithLocation) => {
      const matchesCondition = !filters.condition?.length || filters.condition.includes(car.condition);
      const matchesBodyType = !filters.body_type?.length || filters.body_type.includes(car.body_type);
      const matchesFuelType = !filters.fuel_type?.length || filters.fuel_type.includes(car.fuel_type);
      const matchesGearbox = !filters.gearbox_type?.length || filters.gearbox_type.includes(car.gearbox_type);
      const matchesSellerType = !filters.seller_type?.length || (
        filters.seller_type.includes('dealer') && car.user?.role === 'dealer' ||
        filters.seller_type.includes('private') && car.user?.role !== 'dealer'
      );
      
      const matchesBrand = !filters.brand_id || car.brand_id === filters.brand_id;
      const matchesModel = !filters.model || car.model.name.toLowerCase().includes(filters.model.toLowerCase());
      const matchesExactModel = !filters.exact_model || car.exact_model?.toLowerCase().includes(filters.exact_model.toLowerCase());
      const matchesSearch = !searchInput || 
        car.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        car.brand.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        car.model.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        (car.exact_model && car.exact_model.toLowerCase().includes(searchInput.toLowerCase())) ||
        (car.color && car.color.toLowerCase().includes(searchInput.toLowerCase())) ||
        car.year.toString().includes(searchInput);
      
      const matchesPrice = (!filters.minPrice || car.price >= filters.minPrice) &&
        (!filters.maxPrice || car.price <= filters.maxPrice);
      
      const matchesYear = (!filters.minYear || car.year >= filters.minYear) &&
        (!filters.maxYear || car.year <= filters.maxYear);
      
      const matchesMileage = (!filters.minMileage || car.mileage >= filters.minMileage) &&
        (!filters.maxMileage || car.mileage <= filters.maxMileage);

      return matchesCondition && matchesBodyType && matchesFuelType && matchesGearbox &&
        matchesSellerType && matchesBrand && matchesModel && matchesExactModel && matchesSearch &&
        matchesPrice && matchesYear && matchesMileage;
    };

    // Filter both featured and non-featured cars
    const filteredFeatured = featured.filter(filterFunction);
    const filteredNonFeatured = nonFeatured.filter(filterFunction);

    // Return filtered featured cars first, followed by filtered non-featured cars
    return [...filteredFeatured, ...filteredNonFeatured];
  };

  const sortCars = (cars: CarWithLocation[]) => {
    // First, separate featured and non-featured cars
    const featured = cars.filter(car => car.is_featured);
    const nonFeatured = cars.filter(car => !car.is_featured);

    // Sort both featured and non-featured cars based on the selected sort option
    const sortFunction = (a: CarWithLocation, b: CarWithLocation) => {
      switch (filters.sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_asc':
          return a.year - b.year;
        case 'year_desc':
          return b.year - a.year;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    };

    // Sort both groups independently
    const sortedFeatured = [...featured].sort(sortFunction);
    const sortedNonFeatured = [...nonFeatured].sort(sortFunction);

    // Return sorted featured cars first, followed by sorted non-featured cars
    return [...sortedFeatured, ...sortedNonFeatured];
  };

  const fetchUserFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('car_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFavorites(data.map(fav => fav.car_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavoriteToggle = async (carId: number) => {
    if (!user) {
      toast.error(t('car.favorite.login'));
      router.push('/login');
      return;
    }

    try {
      const isFavorited = favorites.includes(carId);
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== carId));
        toast.success(t('car.favorite.remove'), {
          icon: '💔',
          position: 'bottom-right',
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, car_id: carId }
          ]);

        if (error) throw error;

        setFavorites(prev => [...prev, carId]);
        toast.success(t('car.favorite.add'), {
          icon: '❤️',
          position: 'bottom-right',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('car.error.load'));
    }
  };

  const handleCompareToggle = (car: CarWithLocation) => {
    setSelectedCars((prev) => {
      const isSelected = prev.some((c) => c.id === car.id);
      if (isSelected) {
        const newSelection = prev.filter((c) => c.id !== car.id);
        if (newSelection.length === 0) {
          setCompareMode(false);
        }
        return newSelection;
      }
      if (prev.length >= 2) {
        toast.error(t('car.compare.limit'));
        return prev;
      }
      return [...prev, car];
    });
  };

  const handleCompareClick = () => {
    if (compareMode) {
      if (selectedCars.length >= 2) {
        setShowCompareModal(true);
      } else {
        toast.error(t('car.compare.minimum'));
      }
    } else {
      setCompareMode(true);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedCars([]);
  };

  const handleCompareCancel = () => {
    setShowCompareModal(false);
    setSelectedCars([]);
  };

  const handleCompareClose = () => {
    setShowCompareModal(false);
    setCompareMode(false);
    setSelectedCars([]);
  };

  const resetFilters = () => {
    setFilters({ sort: 'newest' });
    toast.success(t('car.filters.clear'));
  };

  const toggleCondition = (condition: CarCondition) => {
    setFilters(prev => {
      const currentConditions = prev.condition || [];
      const isSelected = currentConditions.includes(condition);
      const newConditions = isSelected 
        ? currentConditions.filter(c => c !== condition)
        : [...currentConditions, condition];
      
      return {
        ...prev,
        condition: newConditions.length > 0 ? newConditions : undefined
      };
    });
  };

  const toggleBodyType = (bodyType: BodyType) => {
    setFilters(prev => {
      const currentTypes = prev.body_type || [];
      const isSelected = currentTypes.includes(bodyType);
      const newTypes = isSelected 
        ? currentTypes.filter(type => type !== bodyType)
        : [...currentTypes, bodyType];
      
      return {
        ...prev,
        body_type: newTypes.length > 0 ? newTypes : undefined
      };
    });
  };

  const toggleFuelType = (fuelType: FuelType) => {
    setFilters(prev => {
      const currentTypes = prev.fuel_type || [];
      const isSelected = currentTypes.includes(fuelType);
      const newTypes = isSelected 
        ? currentTypes.filter(type => type !== fuelType)
        : [...currentTypes, fuelType];
      
      return {
        ...prev,
        fuel_type: newTypes.length > 0 ? newTypes : undefined
      };
    });
  };

  const handleGearboxChange = (types: string[]) => {
    setFilters(prev => ({ ...prev, gearbox_type: types }));
  };

  const handleSellerTypeChange = (type: SellerType) => {
    setFilters(prev => {
      const currentTypes = prev.seller_type || [];
      const isSelected = currentTypes.includes(type);
      
      const newTypes = isSelected 
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      return {
        ...prev,
        seller_type: newTypes.length > 0 ? newTypes : undefined
      };
    });
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      // Add search term to active filters if not already present
      if (!activeFilters.includes(searchInput.trim())) {
        setActiveFilters(prev => [...prev, searchInput.trim()]);
      }
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filterOptions = {
    brand: Array.from(new Set(cars.map(car => car.brand.name))).sort(),
    model: Array.from(new Set(cars.map(car => car.model.name))).sort(),
    year: Array.from(new Set(cars.map(car => car.year))).sort((a, b) => b - a),
    condition: Array.from(new Set(cars.filter(car => car.condition).map(car => car.condition))).sort(),
    body_type: Array.from(new Set(cars.filter(car => car.body_type).map(car => car.body_type))).sort(),
    fuel_type: Array.from(new Set(cars.filter(car => car.fuel_type).map(car => car.fuel_type))).sort(),
    gearbox_type: Array.from(new Set(cars.filter(car => car.gearbox_type).map(car => car.gearbox_type))).sort(),
    color: Array.from(new Set(cars.filter(car => car.color).map(car => car.color))).sort(),
    location: Array.from(new Set(cars.filter(car => car.location).map(car => car.location))).sort(),
  };

  const filterConfigs = [
    { name: 'brand', label: t('car.filters.brand'), options: filterOptions.brand },
    { name: 'model', label: t('car.filters.model'), options: filterOptions.model },
    { name: 'year', label: t('car.filters.year'), options: filterOptions.year },
    { name: 'condition', label: t('car.filters.condition'), options: filterOptions.condition },
    { name: 'fuel_type', label: t('car.filters.fuelType'), options: filterOptions.fuel_type },
    { name: 'gearbox_type', label: t('car.filters.gearboxType'), options: filterOptions.gearbox_type },
    { name: 'color', label: t('car.filters.color'), options: filterOptions.color },
    { name: 'location', label: t('car.filters.location'), options: filterOptions.location },
  ].filter(filter => filter.options.length > 0);

  const priceRanges = [
    { min: 0, max: 50000 },
    { min: 50000, max: 100000 },
    { min: 100000, max: 200000 },
    { min: 200000, max: 500000 },
    { min: 500000, max: null },
  ];

  const mileageRanges = [
    { min: 0, max: 50000 },
    { min: 50000, max: 100000 },
    { min: 100000, max: 150000 },
    { min: 150000, max: 200000 },
    { min: 200000, max: null },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.brand_id) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.minMileage !== undefined || filters.maxMileage !== undefined) count++;
    if (filters.body_type?.length) count++;
    if (filters.fuel_type?.length) count++;
    if (filters.condition?.length) count++;
    if (filters.seller_type?.length) count++;
    if (filters.minYear !== undefined || filters.maxYear !== undefined) count++;
    if (filters.gearbox_type && filters.gearbox_type.length > 0) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({ sort: filters.sort });
    setActiveFilters([]);
    setSearchInput('');
  };

  useEffect(() => {
    const newActiveFilters = [];
    if (filters.brand_id) {
      const brand = brands.find(b => b.id === filters.brand_id);
      if (brand) newActiveFilters.push(`${t('car.filters.brand')}: ${brand.name}`);
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      newActiveFilters.push(t('car.filters.priceRange'));
    }
    if (filters.minMileage !== undefined || filters.maxMileage !== undefined) {
      newActiveFilters.push(t('car.filters.mileageRange'));
    }
    filters.body_type?.forEach(type => newActiveFilters.push(`${t('car.filters.bodyType')}: ${type}`));
    filters.fuel_type?.forEach(type => newActiveFilters.push(`${t('car.filters.fuelType')}: ${type}`));
    filters.condition?.forEach(condition => newActiveFilters.push(`${t('car.filters.condition')}: ${condition}`));
    filters.seller_type?.forEach(type => newActiveFilters.push(`${t('car.filters.sellerType')}: ${type}`));
    if (filters.minYear !== undefined || filters.maxYear !== undefined) {
      newActiveFilters.push(t('car.filters.yearRange'));
    }
    if (filters.gearbox_type && filters.gearbox_type.length > 0) {
      newActiveFilters.push(t('car.filters.gearboxType'));
    }
    setActiveFilters(newActiveFilters);
  }, [filters, brands]);

  const handleSortChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      sort: value as Filters['sort']
    }));
  };

  const handlePriceRangeChange = (min: number | undefined, max: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max
    }));
  };

  const handleYearRangeChange = (min: number | undefined, max: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minYear: min,
      maxYear: max
    }));
  };

  const handleMileageRangeChange = (min: number | undefined, max: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minMileage: min,
      maxMileage: max
    }));
  };

  const handleBrandChange = (brandId: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      brand_id: brandId,
      model: undefined, // Reset model when brand changes
      exact_model: undefined // Reset exact model when brand changes
    }));
    
    // Update active filters
    if (brandId) {
      const brand = brands.find(b => b.id === brandId);
      const brandName = currentLanguage === 'ar' && brand?.name_ar ? brand.name_ar : brand?.name;
      if (!activeFilters.includes(brandName)) {
        setActiveFilters(prev => [...prev, brandName]);
      }
    }
  };

  const handleModelChange = (modelName: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      model: modelName,
      exact_model: undefined // Reset exact model when model changes
    }));
    
    // Update active filters
    if (modelName && !activeFilters.includes(modelName)) {
      setActiveFilters(prev => [...prev, modelName]);
    }
  };

  const handleExactModelChange = (exactModel: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      exact_model: exactModel
    }));
    
    // Update active filters
    if (exactModel && !activeFilters.includes(exactModel)) {
      setActiveFilters(prev => [...prev, exactModel]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
    
    if (filter === searchInput) {
      setSearchInput('');
    } else {
      const brand = brands.find(b => 
        (currentLanguage === 'ar' && b.name_ar === filter) || b.name === filter
      );
      
      if (brand) {
        setFilters(prev => ({ ...prev, brand_id: undefined }));
      } else if (filter === filters.model) {
        setFilters(prev => ({ ...prev, model: undefined }));
      } else if (filter === filters.exact_model) {
        setFilters(prev => ({ ...prev, exact_model: undefined }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-0 to-white dark:from-gray-900 dark:to-gray-800 pt-5">
      <div className="container mx-auto px-1 pb-16">
        {/* Welcome Header */}
        <div className="relative overflow-hidden mb-8 rounded-2xl mx-4">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-sm"></div>
          <div className="absolute inset-0">
            <Image
              src="/hero-cars.jpg"
              alt="Luxury Cars"
              fill
              className="object-cover brightness-75"
              priority
            />
          </div>
          <div className="relative max-w-4xl mx-auto text-center py-20 px-4">
            <h1 className="text-4xl font-bold text-gray-100 mb-4 tracking-tight drop-shadow-lg">
              {t('car.welcome.title')}
            </h1>
            <p className="text-lg font-normal text-gray-100 max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow">
              {t('car.welcome.description', { country: currentCountry ? (language === 'ar' ? currentCountry.name_ar : currentCountry.name) : '' })}
            </p>
          </div>
        </div>

        <main className="px-4">
          {/* Top Bar */}
          <div className="top-0 z-30 bg-white/80 dark:bg-gray-900/80 p-4 mb-6 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg backdrop-blur-md">
            <div className="flex flex-col gap-4">
              {/* Search and Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 flex gap-4 w-full">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={t('car.search.placeholder')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-qatar-maroon text-white rounded-xl hover:bg-qatar-maroon/90 transition-all duration-200 flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span className="md:hidden lg:inline">{t('car.search.button')}</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      !showFilters
                        ? 'bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transform hover:scale-105'
                        : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50 hover:border-qatar-maroon hover:shadow-md'
                    }`}
                  >
                    <FunnelIcon className="h-5 w-5" />
                    <span className="hidden sm:hidden md:inline ">{t('car.filters.title')}</span>
                    {getActiveFilterCount() > 0 && (
                      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                        !showFilters 
                          ? 'bg-white text-qatar-maroon' 
                          : 'bg-qatar-maroon text-white'
                      }`}>
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative group">
                    <select
                      value={filters.sort || 'newest'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        sort: e.target.value as Filters['sort'] 
                      }))}
                      className="appearance-none w-full md:w-28 px-4 py-2 pr-8 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50  hover:border-qatar-maroon hover:shadow-md"
                    >
                      {sortOptions.map((option) => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Compare Button */}
                  <button
                    onClick={handleCompareClick}
                    className={`px-3 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 border border-gray-200 dark:border-gray-700/50 ${
                      compareMode
                        ? 'bg-qatar-maroon text-white hover:bg-qatar-maroon/90 transform '
                        : 'bg-white dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-50 hover:border-qatar-maroon dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                    {compareMode ? (
                      selectedCars.length > 0 
                        ? `${t('car.compare.selected', {count: selectedCars.length })}/2` 
                        : t('car.compare.select')
                    ) : (
                      t('car.compare.button')
                    )}
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(activeFilters.length > 0 || searchInput) && (
                <div className="flex flex-wrap gap-2 items-center">
                  {activeFilters.map((filter, index) => (
                    <button
                      key={index}
                      onClick={() => removeFilter(filter)}
                      className="px-3 py-1 bg-qatar-maroon/10 text-qatar-maroon dark:text-qatar-maroon rounded-lg text-sm font-medium flex items-center gap-1 group hover:bg-qatar-maroon hover:text-white transition-colors"
                    >
                      {filter}
                      <XMarkIcon className="h-4 w-4 group-hover:text-white" />
                    </button>
                  ))}
                  {searchInput && !activeFilters.includes(searchInput) && (
                    <button
                      onClick={() => removeFilter(searchInput)}
                      className="px-3 py-1 bg-qatar-maroon/10 text-qatar-maroon dark:text-qatar-maroon rounded-lg text-sm font-medium flex items-center gap-1 group hover:bg-qatar-maroon hover:text-white transition-colors"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      {searchInput}
                      <XMarkIcon className="h-4 w-4 group-hover:text-white" />
                    </button>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1 text-xs font-medium text-qatar-maroon hover:text-white border border-qatar-maroon hover:bg-qatar-maroon rounded-lg transition-colors"
                  >
                    {t('car.filters.clear')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Panel - Desktop */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full md:w-80 md:relative fixed inset-0 z-50 md:z-0 rounded-xl bg-white/95 dark:bg-gray-900/95 md:bg-transparent md:dark:bg-transparent overflow-auto shadow-lg "
                >
                  <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-6 rounded-xl space-y-4">
                    {/* Mobile Close Button */}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                    
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('car.filters.title')}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{cars.length} {t('car.filters.cars')}</span>
                    </div>        
                  
                    {/* Brand */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.brand')}
                      </label>
                      <div className="relative">
                        <select
                          value={filters.brand_id || ''}
                          onChange={(e) => handleBrandChange(e.target.value ? Number(e.target.value) : undefined)}
                          className="appearance-none w-full px-4 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-qatar-maroon hover:shadow-md"
                        >
                          <option value="">{t('car.filters.all')}</option>
                          {brands.map((brand) => (
                            <option 
                              key={brand.id} 
                              value={brand.id}
                              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              {currentLanguage === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Model */}
                    {filters.brand_id && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('car.filters.model')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('car.filters.modelPlaceholder')}
                          value={filters.model || ''}
                          onChange={(e) => handleModelChange(e.target.value || undefined)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                      </div>
                    )}

                    {/* Exact Model */}
                    {filters.model && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('car.filters.exactModel')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('car.filters.exactModelPlaceholder')}
                          value={filters.exact_model || ''}
                          onChange={(e) => handleExactModelChange(e.target.value || undefined)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                      </div>
                    )}

                    {/* Price Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.price')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder={t('car.filters.priceMin')}
                          value={filters.minPrice || ''}
                          onChange={(e) => handlePriceRangeChange(Number(e.target.value), filters.maxPrice)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                        <input
                          type="number"
                          placeholder={t('car.filters.priceMax')}
                          value={filters.maxPrice || ''}
                          onChange={(e) => handlePriceRangeChange(filters.minPrice, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                      </div>
                    </div>

                    {/* Mileage Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.mileage')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder={t('car.filters.mileageMin')}
                          value={filters.minMileage || ''}
                          onChange={(e) => handleMileageRangeChange(Number(e.target.value), filters.maxMileage)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                        <input
                          type="number"
                          placeholder={t('car.filters.mileageMax')}
                          value={filters.maxMileage || ''}
                          onChange={(e) => handleMileageRangeChange(filters.minMileage, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon"
                        />
                      </div>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.year')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative group">
                          <select
                            value={filters.minYear || ''}
                            onChange={(e) => handleYearRangeChange(Number(e.target.value), filters.maxYear)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none pr-8 hover:border-qatar-maroon hover:shadow-sm transition-all duration-300 ease-in-out"
                          >
                            <option value="">{t('car.filters.yearMin')}</option>
                            {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 group-hover:text-qatar-maroon transition-colors duration-300">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                        <div className="relative group">
                          <select
                            value={filters.maxYear || ''}
                            onChange={(e) => handleYearRangeChange(filters.minYear, Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none pr-8 hover:border-qatar-maroon hover:shadow-sm transition-all duration-300 ease-in-out"
                          >
                            <option value="">{t('car.filters.yearMax')}</option>
                            {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 group-hover:text-qatar-maroon transition-colors duration-300">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seller Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.sellerType') || 'Seller Type'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['dealer', 'private'] as SellerType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleSellerTypeChange(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border 
                              ${
                              filters.seller_type?.includes(type)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon font-bold hover:bg-qatar-maroon/90'
                                : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-qatar-maroon/50'
                            }`}
                          >
                            {t(`car.sellerType.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Condition */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.condition')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['New', 'Good', 'Excellent', 'Not Working'] as CarCondition[]).map((condition) => (
                          
                          <button
                            key={condition}
                            onClick={() => toggleCondition(condition)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border 
                              ${
                              filters.condition?.includes(condition)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon font-bold hover:bg-qatar-maroon/90'
                                : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-qatar-maroon/50'
                            }`}
                          >
                            {t(`car.condition.${condition.toLowerCase().replace(' ', '_')}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gearbox Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.gearboxType')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['automatic', 'manual'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              if (filters.gearbox_type && filters.gearbox_type.includes(type.charAt(0).toUpperCase() + type.slice(1))) {
                                handleGearboxChange(filters.gearbox_type.filter(t => t !== type.charAt(0).toUpperCase() + type.slice(1)));
                              } else {
                                handleGearboxChange([...(filters.gearbox_type || []), type.charAt(0).toUpperCase() + type.slice(1)]);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border 
                              ${
                              (filters.gearbox_type || []).includes(type.charAt(0).toUpperCase() + type.slice(1))
                                ? 'bg-qatar-maroon text-white border-qatar-maroon font-bold hover:bg-qatar-maroon/90'
                                : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-qatar-maroon/50'
                            }`}
                          >
                            {t(`car.gearboxType.${type}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('car.filters.fuelType')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Petrol', 'Diesel', 'Electric', 'Hybrid'] as FuelType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => toggleFuelType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border 
                              ${
                              filters.fuel_type?.includes(type)
                                ? 'bg-qatar-maroon text-white border-qatar-maroon font-bold hover:bg-qatar-maroon/90'
                                : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-qatar-maroon/50'
                            }`}
                          >
                            {t(`car.fuelType.${type.toLowerCase()}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-qatar-maroon dark:hover:text-qatar-maroon transition-colors flex items-center gap-2"
                        aria-label={filtersExpanded ? "Collapse filters" : "Expand filters"}
                      >
                        {filtersExpanded ? (
                          <>
                            {t('car.filters.showLess') || 'Show Less'}
                            <ChevronUpIcon className="h-5 w-5" />
                          </>
                        ) : (
                          <>
                            {t('car.filters.showMore') || 'Show More'}
                            <ChevronDownIcon className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Filters Section */}
                    {filtersExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Body Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('car.filters.bodyType')}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Wagon', 'Van', 'Truck', 'Convertible', 'Other'] as BodyType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => toggleBodyType(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border 
                                  ${
                                  filters.body_type?.includes(type)
                                    ? 'bg-qatar-maroon text-white border-qatar-maroon font-bold hover:bg-qatar-maroon/90'
                                    : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-qatar-maroon/50'
                                }`}
                              >
                                {t(`car.bodyType.${type.toLowerCase()}`)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Clear Filters Button */}
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 text-sm font-medium text-qatar-maroon hover:text-white border border-qatar-maroon hover:bg-qatar-maroon rounded-lg transition-colors"
                    >
                      {t('car.filters.clear')}
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1">
              {/* Compare Mode Banner */}
              {compareMode && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 mb-6 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-qatar-maroon/10">
                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                          {t('car.compare.title')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCars.length} of 2 {t('car.compare.cars')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-qatar-maroon transition-all duration-300"
                          style={{ width: `${(selectedCars.length / 2) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() => setCompareMode(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Car Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-24">
                {loading ? (
                  <div className="flex col-span-full items-center justify-center min-h-[400px]">
                    <LoadingSpinner />
                  </div>
                ) : countryLoading ? (
                  <div className="text-center py-10">
                    <div className="mx-auto max-w-md">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {t('loading')}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('loadingCarsForCountry', { country: currentCountry ? (language === 'ar' ? currentCountry.name_ar : currentCountry.name) : '' })}
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="col-span-full text-center text-red-500">{error}</div>
                ) : cars.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                    {currentCountry ? (
                      <p>
                        {t('car.noResultsForCountry', { country: currentCountry ? (language === 'ar' ? currentCountry.name_ar : currentCountry.name) : '' })}
                      </p>
                    ) : (
                      <p>
                        {t('car.noResults')}
                      </p>
                    )}
                  </div>
                ) : (
                  cars.map((car) => (
                    <div
                      key={car.id}
                      className="relative"
                    >
                      <CarCard 
                        car={car} 
                        onFavoriteToggle={handleFavoriteToggle} 
                        isFavorite={favorites.includes(car.id)}
                        featured={car.is_featured}
                      />
                      {compareMode && (
                        <button
                          onClick={() => handleCompareToggle(car)}
                          className={`absolute top-2 left-2 p-2 rounded-lg z-10 transition-all border-2 border-gray-400 dark:border-gray-400 ${
                            selectedCars.some(c => c.id === car.id)
                              ? 'bg-qatar-maroon text-white border-qatar-maroon '
                              : 'bg-white/80 hover:bg-qatar-maroon hover:text-white'
                          }`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {selectedCars.some(c => c.id === car.id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 bg-white rounded-sm"
                              />
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Compare Modal */}
          {showCompareModal && (
            <CarCompareModal
              isOpen={showCompareModal}
              onClose={handleCompareClose}
              cars={selectedCars}
            />
          )}
        </main>
      </div>
      <LoginPopup delay={5000} />
    </div>
  );
}
