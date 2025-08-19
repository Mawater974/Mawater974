'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import SparePartCard from '@/components/spare-parts/SparePartCard';
import toast from 'react-hot-toast';

type SparePart = {
  id: string;
  title: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  is_negotiable: boolean;
  condition: 'new' | 'used' | 'refurbished';
  status: string;
  created_at: string;
  brand: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  model: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
  } | null;
  city: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  images: Array<{
    id: string;
    url: string;
    is_primary: boolean;
  }>;
  is_favorite?: boolean;
};

export default function SpareParts() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentCountry, formatPrice } = useCountry();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [categories, setCategories] = useState<Array<{id: number, name_en: string, name_ar: string}>>([]);
  const [brands, setBrands] = useState<Array<{id: number, name: string, name_ar: string | null}>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    condition: '' as '' | 'new' | 'used' | 'refurbished',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest' as 'newest' | 'price_low' | 'price_high'
  });
  
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
            countryCode: currentCountry?.code || '--',
            userId: user?.id,
            pageType: 'spareParts'
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
    fetchSpareParts();
    fetchCategories();
    fetchBrands();
  }, [user?.id, currentCountry?.code]);*/
  
  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await buildQuery(filters);
      
      if (error) throw error;
      if (!data) return;
      
      // Process the data (combine with user data, etc.)
      const processedData = await processSparePartsData(data);
      
      if (error) throw error;
      
      // Check favorites if user is logged in
      if (user && data && data.length > 0) {
        try {
          // First, filter out any invalid UUIDs
          const validSparePartIds = data
            .map(item => item.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0);

          let favoriteIds = new Set<string>();
          
          // Only make the favorites query if we have valid IDs
          if (validSparePartIds.length > 0) {
            const { data: favorites, error: favoritesError } = await supabase
              .from('favorites')
              .select('spare_part_id')
              .eq('user_id', user.id)
              .in('spare_part_id', validSparePartIds);
              
            if (favoritesError) throw favoritesError;
            
            // Create a Set of favorite spare part IDs
            favoriteIds = new Set(favorites?.map(fav => fav.spare_part_id) || []);
          }
          
          // Map the data and set favorites
          const sparePartsWithFavorites = data.map(part => ({
            ...part,
            is_favorite: favoriteIds.has(part.id)
          }));
          
          setSpareParts(sparePartsWithFavorites);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          // If there's an error fetching favorites, still show the parts but without favorites
          setSpareParts(data || []);
        }
      } else {
        // Set is_favorite to false for all parts if user is not logged in
        setSpareParts((data || []).map(part => ({
          ...part,
          is_favorite: false
        })));
      }
      
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast.error(t('common.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('spare_part_categories')
        .select('*')
        .order('name_en');
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error(t('common.errorFetchingData'));
    }
  };

  const toggleFavorite = async (partId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('common.signInToSaveFavorites'));
      return;
    }
    
    try {
      const part = spareParts.find(p => p.id === partId);
      if (!part) return;
      
      const isFavorite = part.is_favorite;
      
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('spare_part_id', partId);
          
        if (error) throw error;
        toast.success(t('common.removedFromFavorites'));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: user.id,
            spare_part_id: partId,
            car_id: null,  // Explicitly set car_id to null
            created_at: new Date().toISOString()
          }]);
          
        if (error) throw error;
        toast.success(t('common.addedToFavorites'));
      }
      
      // Update local state
      setSpareParts(prev => 
        prev.map(p => 
          p.id === partId 
            ? { ...p, is_favorite: !isFavorite } 
            : p
        )
      );
      
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error(t('common.errorUpdatingFavorite'));
    }
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const fetchSparePartsWithFilters = async (customFilters = filters) => {
    // This is a helper function to fetch with custom filters
    const query = buildQuery(customFilters);
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching spare parts:', error);
      toast.error(t('common.errorFetchingData'));
      return;
    }
    
    // Process the data and update state
    const processedData = await processSparePartsData(data);
    setSpareParts(processedData);
    setLoading(false);
  };

  const buildQuery = (filters: any) => {
    let query = supabase
      .from('spare_parts')
      .select(`
        *,
        is_featured,
        brand:brands(id, name, name_ar),
        model:models(id, name, name_ar),
        category:spare_part_categories(id, name_en, name_ar),
        city:cities(id, name, name_ar),
        images:spare_part_images(id, url, is_primary),
        country_code,
        user_id
      `)
      .eq('status', 'approved');
    
    // Apply filters
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.category) query = query.eq('category_id', filters.category);
    if (filters.brand) query = query.eq('brand_id', filters.brand);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    
    // Apply sorting
    if (filters.sortBy === 'price_low') {
      query = query.order('is_featured', { ascending: false }).order('price', { ascending: true });
    } else if (filters.sortBy === 'price_high') {
      query = query.order('is_featured', { ascending: false }).order('price', { ascending: false });
    } else {
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    }
    
    // Filter by country
    if (currentCountry?.code) {
      query = query.eq('country_code', currentCountry.code);
    }
    
    return query;
  };
  
  const processSparePartsData = async (data: any[]) => {
    if (!data) return [];
    
    // Get unique user IDs from spare parts
    const userIds = Array.from(new Set(data.map(part => part.user_id)));
    
    // Fetch user data for these IDs if we have any
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);
      
      if (usersData) {
        usersMap = new Map(usersData.map(user => [user.id, user]));
      }
    }
    
    // Combine spare parts with user data
    return data.map(part => ({
      ...part,
      user: usersMap.get(part.user_id) || null,
      is_favorite: false // Will be updated in the main fetch
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Close filters on mobile after search
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowFilters(false);
    }
    fetchSpareParts();
  };
  
  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      category: '',
      brand: '',
      condition: '' as '' | 'new' | 'used' | 'refurbished',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest' as 'newest' | 'price_low' | 'price_high'
    };
    setFilters(resetFilters);
    // Close filters on mobile after reset
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowFilters(false);
    }
    // Trigger search with reset filters
    fetchSparePartsWithFilters(resetFilters);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(currentLanguage, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return t('spareParts.condition.new');
      case 'used': return t('spareParts.condition.used');
      case 'refurbished': return t('spareParts.condition.refurbished');
      default: return condition;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
            {t('spareParts.title')}
          </h1>
          
          <Link 
            href={`/${currentCountry?.code?.toLowerCase()}/spare-parts/add`}
            className="bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('spareParts.addSparePart')}
          </Link>
        </div>
        
        {/* Search and Filters Toggle Button - Mobile Only */}
        <div className="md:hidden mb-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-qatar-maroon text-white rounded-lg"
          >
            <span>{t('common.filters')}</span>
            <svg
              className={`h-5 w-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filters Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${showFilters ? 'block' : 'hidden md:block'}`}>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.search')}
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder={t('spareParts.search.placeholder')}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                            placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 
                            focus:ring-qatar-maroon focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.category')}
                </label>
                <select 
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                            focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                >
                  <option value="">{t('spareParts.filters.allCategories')}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {currentLanguage === 'ar' && category.name_ar ? category.name_ar : category.name_en}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.brand')}
                </label>
                <select 
                  id="brand"
                  name="brand"
                  value={filters.brand}
                  onChange={handleFilterChange}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                            focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                >
                  <option value="">{t('spareParts.filters.allBrands')}</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {currentLanguage === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.condition')}
                </label>
                <select 
                  id="condition"
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                            focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                >
                  <option value="">{t('spareParts.filters.allConditions')}</option>
                  <option value="new">{t('spareParts.condition.new')}</option>
                  <option value="used">{t('spareParts.condition.used')}</option>
                  <option value="refurbished">{t('spareParts.condition.refurbished')}</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.minPrice')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{t(`common.currency.${currentCountry?.currency_code}`)}</span>
                  </div>
                  <input
                    type="number"
                    id="minPrice"
                    name="minPrice"
                    min="0"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder={t('spareParts.filters.price')}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                              focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.maxPrice')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{t(`common.currency.${currentCountry?.currency_code}`)}</span>
                  </div>
                  <input
                    type="number"
                    id="maxPrice"
                    name="maxPrice"
                    min={filters.minPrice || '0'}
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder={t('spareParts.filters.price')}
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                              focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('spareParts.filters.sortBy')}
                </label>
                <select 
                  id="sortBy"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                            focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
                >
                  <option value="newest">{t('spareParts.filters.newest')}</option>
                  <option value="price_low">{t('spareParts.filters.priceLowToHigh')}</option>
                  <option value="price_high">{t('spareParts.filters.priceHighToLow')}</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-6">
              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full text-gray-700 dark:text-gray-300 px-6 py-2.5 border border-gray-300 dark:border-gray-600 
                            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.resetFilters')}
                </button>
              </div>
              
              <button
                type="submit"
                className="w-full sm:w-auto bg-qatar-maroon text-white px-6 py-2.5 rounded-lg hover:bg-qatar-maroon/90 
                          transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>

        {/* Spare Parts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
          </div>
        ) : spareParts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spareParts.map((part) => (
              <SparePartCard 
                key={part.id}
                part={part}
                countryCode={currentCountry?.code?.toLowerCase() || 'qa'}
                onToggleFavorite={toggleFavorite}
                isFavorite={part.is_favorite || false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              {t('spareParts.noResults.title')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('spareParts.noResults.description')}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                {t('spareParts.noResults.resetFilters')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
