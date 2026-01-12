import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCars, getBrands, getModels, SortOption, CarFilters, getFavorites } from '../services/dataService';
import { Car, Brand, Model } from '../types';
import { CarCard } from '../components/CarCard';
import { CompareModal } from '../components/CompareModal';
import { Filter, ChevronLeft, ChevronRight, SlidersHorizontal, X, Search, Scale, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const CarsPage: React.FC = () => {
  const { t, language, selectedCountryId, dir, selectedCountry } = useAppContext();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Visibility State 
  const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth >= 1024);

  // Filters & Pagination State
  const [filters, setFilters] = useState<CarFilters>({
    searchQuery: initialSearch || undefined
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 12;

  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Car[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Temporary State for inputs
  const [searchTemp, setSearchTemp] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');

  const [selectedBrand, setSelectedBrand] = useState<number | ''>('');
  const [selectedModel, setSelectedModel] = useState<number | ''>('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('');
  const [selectedGearbox, setSelectedGearbox] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  // Constants
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
  const gearboxTypes = ['Manual', 'Automatic'];
  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
  const conditions = ['New', 'Excellent', 'Good', 'Not Working'];

  // Styles
  const filterInputClass = "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm outline-none transition";
  const filterLabelClass = "block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2";

  const isSearchActive = searchTemp.trim().length > 0;

  // Sync state if URL changes (e.g. back button)
  useEffect(() => {
    const q = searchParams.get('search') || '';
    if (q !== filters.searchQuery) {
      setSearchTemp(q);
      setFilters(prev => ({ ...prev, searchQuery: q || undefined }));
    }
  }, [searchParams]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      // Reset to default behavior if crossing breakpoint to avoid layout issues
      if (window.innerWidth >= 1024) {
        if (!isFiltersOpen) setIsFiltersOpen(true);
      } else {
        if (isFiltersOpen) setIsFiltersOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Initial Data
  useEffect(() => {
    getBrands().then(setBrands);
    if (user) {
      getFavorites(user.id).then(favs => {
        const carIds = favs
          .filter(f => f.car_id !== undefined && f.car_id !== null)
          .map(f => f.car_id as number);
        setFavorites(carIds);
      });
    }
  }, [user]);

  // Load Models when Brand changes
  useEffect(() => {
    if (selectedBrand) {
      getModels(Number(selectedBrand)).then(setModels);
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedBrand]);

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      brandId: selectedBrand ? Number(selectedBrand) : undefined,
      modelId: selectedModel ? Number(selectedModel) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minYear: minYear ? Number(minYear) : undefined,
      maxYear: maxYear ? Number(maxYear) : undefined,
      searchQuery: searchTemp || undefined,
      bodyType: selectedBodyType || undefined,
      fuelType: selectedFuelType || undefined,
      gearboxType: selectedGearbox || undefined,
      condition: selectedCondition || undefined
    }));
    setPage(1);

    // On mobile, automatically close filters after applying to see results
    if (window.innerWidth < 1024) setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
    setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear(''); setSearchTemp('');
    setSelectedBrand(''); setSelectedModel(''); setSelectedBodyType(''); setSelectedFuelType(''); setSelectedGearbox(''); setSelectedCondition('');
    setPage(1);
  };

  // Fetch Cars
  useEffect(() => {
    const fetchData = async () => {
      // Prevent fetching until country ID is resolved to avoid showing all cars
      if (!selectedCountryId) return;

      setLoading(true);
      const queryFilters = { ...filters, countryId: selectedCountryId };
      const { data, count } = await getCars(
        queryFilters,
        page,
        LIMIT,
        sortBy
      );
      setCars(data);
      setTotalCount(count);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    fetchData();
  }, [filters, selectedCountryId, page, sortBy]);

  // Compare Logic
  const toggleCompareSelection = (car: Car) => {
    setCompareList(prev => {
      if (prev.find(c => c.id === car.id)) {
        return prev.filter(c => c.id !== car.id);
      } else {
        if (prev.length >= 3) {
          alert("You can only compare up to 3 cars.");
          return prev;
        }
        return [...prev, car];
      }
    });
  };

  const handleCompareModeToggle = () => {
    setIsCompareMode(!isCompareMode);
    if (isCompareMode) {
      setCompareList([]);
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page < 4) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page > totalPages - 3) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const ChevronPrev = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const ChevronNext = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const countryName = language === 'ar' ? selectedCountry?.name_ar : selectedCountry?.name;

  return (
    <div className="space-y-6 -my-6 mb-6">
      <SEO
        title={t('seo.cars.title', { country: countryName || 'Qatar' })}
        description={t('seo.cars.description', { country: countryName || 'Qatar' })}
      />

      {/* Hero Section */}
      <div className="relative h-auto min-h-[300px] md:h-[450px] -mx-[calc(50vw-50%)] w-[100vw] overflow-hidden dark:shadow-none shadow-[0_25px_50px_rgba(0,0,0,0.15)]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img
            src="/hero.gif"
            alt="Luxury Cars Collection"
            className="w-full h-full object-cover object-center md:object-[center_60%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        </div>
        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center z-10 pt-20 md:pt-0">
          <div className="max-w-3xl space-y-4 animate-fade-in-up px-4">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-sm">
              {t('cars.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-medium max-w-2xl">
              {t('cars.hero.subtitle', { country: countryName || 'Qatar' })}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 relative items-start">
        <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

        {/* Backdrop for Mobile */}
        {isFiltersOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden animate-fade-in"
            onClick={() => setIsFiltersOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Filters */}
        <aside className={`
          fixed inset-y-0 left-0 z-[100] w-[85vw] sm:w-[350px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isFiltersOpen ? 'translate-x-0' : '-translate-x-full'}
          
          lg:translate-x-0 lg:transform-none lg:transition-none
          lg:static lg:h-fit lg:z-30 
          lg:bg-white lg:dark:bg-gray-800 lg:shadow-md lg:rounded-xl lg:border lg:border-gray-200 lg:dark:border-gray-700
          
          ${!isFiltersOpen ? 'lg:hidden' : 'lg:block lg:w-80 lg:flex-shrink-0'}
          
          overflow-y-auto lg:overflow-visible scrollbar-hide
      `}>
          <div className="p-6 pb-20 lg:pb-6">
            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 pt-2 lg:static lg:bg-transparent lg:pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-black text-xl">
                  <Filter className="w-5 h-5 text-primary-600" />
                  <span>{t('filter.title')}</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1 mt-1">({totalCount})</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-red-500 font-bold transition"
                  >
                    {t('filter.clear')}
                  </button>
                  {/* Close Button - Hide on Desktop */}
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition lg:hidden"
                    title={t('filter.hide')}
                  >
                    <X className="w-6 h-6 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Brand */}
              <div>
                <label className={filterLabelClass}>{t('filter.brand')}</label>
                <select
                  className={filterInputClass}
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">{t('filter.all_brands')}</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {language === 'ar' ? (brand.name_ar || brand.name) : brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model (Dependent) */}
              <div>
                <label className={filterLabelClass}>{t('filter.model')}</label>
                <select
                  className={filterInputClass}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value ? Number(e.target.value) : '')}
                  disabled={!selectedBrand}
                >
                  <option value="">{t('filter.all_models')}</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {language === 'ar' ? (model.name_ar || model.name) : model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className={filterLabelClass}>{t('common.price')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t('filter.min_price')}
                    className={filterInputClass}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t('filter.max_price')}
                    className={filterInputClass}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Year Range */}
              <div>
                <label className={filterLabelClass}>{t('common.year')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t('filter.min_year')}
                    className={filterInputClass}
                    value={minYear}
                    onChange={(e) => setMinYear(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t('filter.max_year')}
                    className={filterInputClass}
                    value={maxYear}
                    onChange={(e) => setMaxYear(e.target.value)}
                  />
                </div>
              </div>

              {/* New Filters with Translations */}
              <div>
                <label className={filterLabelClass}>{t('car.body_type')}</label>
                <select
                  className={filterInputClass}
                  value={selectedBodyType}
                  onChange={(e) => setSelectedBodyType(e.target.value)}
                >
                  <option value="">{t('filter.any')}</option>
                  {bodyTypes.map(b => (
                    <option key={b} value={b}>{t(`body.${b.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={filterLabelClass}>{t('car.fuel')}</label>
                <select
                  className={filterInputClass}
                  value={selectedFuelType}
                  onChange={(e) => setSelectedFuelType(e.target.value)}
                >
                  <option value="">{t('filter.any')}</option>
                  {fuelTypes.map(f => (
                    <option key={f} value={f}>{t(`fuel.${f.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={filterLabelClass}>{t('car.gearbox')}</label>
                <select
                  className={filterInputClass}
                  value={selectedGearbox}
                  onChange={(e) => setSelectedGearbox(e.target.value)}
                >
                  <option value="">{t('filter.any')}</option>
                  {gearboxTypes.map(g => (
                    <option key={g} value={g}>{t(`gearbox.${g.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={filterLabelClass}>{t('car.condition')}</label>
                <select
                  className={filterInputClass}
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                >
                  <option value="">{t('filter.any')}</option>
                  {conditions.map(c => (
                    <option key={c} value={c}>{t(`condition.${c.toLowerCase().replace(' ', '_')}`)}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition shadow-md hover:shadow-lg"
              >
                {t('filter.apply')}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 flex-1 w-full">
              {/* Desktop Show Filters Button */}
              {!isFiltersOpen && (
                <button
                  onClick={() => setIsFiltersOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 transition"
                >
                  <Filter className="w-4 h-4" />
                  {t('filter.show')}
                </button>
              )}

              {/* Search Bar in Header */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  className={`w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition px-4 ${dir === 'rtl' ? (isSearchActive ? 'pl-28' : 'pl-10') : (isSearchActive ? 'pr-28' : 'pr-10')}`}
                  value={searchTemp}
                  onChange={(e) => setSearchTemp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
                <button
                  onClick={applyFilters}
                  className={`absolute top-1/2 -translate-y-1/2 transition-all flex items-center justify-center gap-2
                      ${dir === 'rtl' ? 'left-1.5' : 'right-1.5'}
                      ${isSearchActive
                      ? 'bg-primary-600 text-white px-4 py-1.5 rounded-md shadow-sm hover:bg-primary-700'
                      : 'p-2 text-gray-400 hover:text-primary-600'
                    }
                    `}
                  title={t('hero.search')}
                >
                  <Search className={`w-4 h-4 ${isSearchActive ? 'text-white' : ''}`} />
                  {isSearchActive && <span className="text-xs font-bold uppercase tracking-wider">{t('hero.search').replace('...', '')}</span>}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {/* Mobile Filter Toggle - In Action Bar */}
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-white transition border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <Filter className="w-4 h-4" />
                {t('filter.title')}
              </button>

              {/* Compare Toggle Button */}
              <button
                onClick={handleCompareModeToggle}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm border ${isCompareMode
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
              >
                {isCompareMode ? <CheckCircle2 className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                {isCompareMode ? t('cars.done') : t('cars.compare')}
              </button>

              <div className="flex-1 sm:flex-none flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 shadow-sm min-w-[140px]">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="newest">{t('sort.newest')}</option>
                  <option value="oldest">Oldest Listed</option>
                  <option value="price_asc">{t('sort.price_asc')}</option>
                  <option value="price_desc">{t('sort.price_desc')}</option>
                  <option value="mileage_asc">{t('sort.mileage_asc')}</option>
                  <option value="year_desc">{t('sort.year_desc')}</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner className="w-16 h-16" />
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${!isFiltersOpen ? 'xl:grid-cols-4 lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-6 min-h-[400px]`}>
                {cars.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    language={language}
                    t={t}
                    isFavorite={favorites.includes(car.id)}
                    onCompare={toggleCompareSelection}
                    isSelectedForCompare={!!compareList.find(c => c.id === car.id)}
                    isCompareMode={isCompareMode}
                  />
                ))}
                {cars.length === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Filter className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('common.no_results')}</h3>
                    <p className="text-gray-500">{t('common.try_adjusting')}</p>
                    <button onClick={clearFilters} className="mt-4 text-primary-600 font-bold hover:underline">Clear all filters</button>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalCount > LIMIT && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <ChevronPrev className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => (
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition shadow-sm border ${page === p
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="w-10 text-center text-gray-400">...</span>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <ChevronNext className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Compare Bar */}
        {isCompareMode && compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-fade-in-up w-[90%] md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary-400" />
              <span className="font-bold whitespace-nowrap">{t('cars.compare_selected', { count: compareList.length })}</span>
            </div>
            <div className="h-6 w-px bg-gray-700 hidden md:block"></div>
            <div className="flex gap-3">
              <button
                onClick={() => setCompareList([])}
                className="text-sm text-gray-400 hover:text-white font-medium"
              >
                {t('filter.clear')}
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={compareList.length < 2}
              >
                {t('cars.compare_now')}
              </button>
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showCompareModal && (
          <CompareModal
            cars={compareList}
            onClose={() => {
              setShowCompareModal(false);
              // Close floating compare bar and clear selection when done
              setIsCompareMode(false);
              setCompareList([]);
            }}
            onRemove={(id) => {
              setCompareList(prev => prev.filter(c => c.id !== id));
              if (compareList.length <= 1) setShowCompareModal(false);
            }}
            language={language}
          />
        )}
      </div>
    </div>
  );
};