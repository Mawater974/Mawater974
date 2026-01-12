import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getSpareParts, getBrands, getModels, getSparePartCategories, SparePartFilters, getFavorites } from '../services/dataService';
import { SparePart, Brand, Model, SparePartCategory } from '../types';
import { SparePartCard } from '../components/SparePartCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';
import { Settings, Search, Filter, X } from 'lucide-react';
import { SEO } from '../components/SEO';

export const SparePartsPage: React.FC = () => {
    const { t, language, selectedCountryId, selectedCountry, dir } = useAppContext();
    const { user } = useAuth();
    const [parts, setParts] = useState<SparePart[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Data for Filters
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [categories, setCategories] = useState<SparePartCategory[]>([]);

    // Filter State
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth >= 1024);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [filters, setFilters] = useState<SparePartFilters>({
        searchQuery: initialSearch || undefined
    });

    // Local Filter State
    const [searchTemp, setSearchTemp] = useState(initialSearch);
    const [selectedBrand, setSelectedBrand] = useState<number | ''>('');
    const [selectedModel, setSelectedModel] = useState<number | ''>('');
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');
    const [selectedPartType, setSelectedPartType] = useState('');

    const countryName = language === 'ar' ? selectedCountry?.name_ar : selectedCountry?.name;
    const isSearchActive = searchTemp.trim().length > 0;

    // Sync state if URL changes
    useEffect(() => {
        const q = searchParams.get('search') || '';
        if (q !== filters.searchQuery) {
            setSearchTemp(q);
            setFilters(prev => ({ ...prev, searchQuery: q || undefined }));
        }
    }, [searchParams]);

    // Load Initial Data (Brands, Categories, Favorites)
    useEffect(() => {
        getBrands().then(setBrands);
        getSparePartCategories().then(setCategories);
        if (user) {
            getFavorites(user.id).then(favs => {
                const partIds = favs
                    .filter(f => f.spare_part_id !== undefined && f.spare_part_id !== null)
                    .map(f => f.spare_part_id as string);
                setFavorites(partIds);
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
            categoryId: selectedCategory ? Number(selectedCategory) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            condition: selectedCondition || undefined,
            partType: selectedPartType || undefined,
            searchQuery: searchTemp || undefined
        }));
        // Update URL search params purely for visual sync if desired, or keep it local
        if (searchTemp) setSearchParams({ search: searchTemp });
        else setSearchParams({});

        if (window.innerWidth < 1024) setIsFiltersOpen(false);
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTemp('');
        setSelectedBrand('');
        setSelectedModel('');
        setSelectedCategory('');
        setMinPrice('');
        setMaxPrice('');
        setSelectedCondition('');
        setSelectedPartType('');
        setSearchParams({});
    };

    // Fetch Parts
    useEffect(() => {
        const fetch = async () => {
            if (!selectedCountryId) return;
            setLoading(true);
            const queryFilters = { ...filters, countryId: selectedCountryId };
            const data = await getSpareParts(queryFilters);
            setParts(data);
            setLoading(false);
        };
        fetch();
    }, [filters, selectedCountryId]);

    // Styles
    const filterInputClass = "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm outline-none transition";
    const filterLabelClass = "block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2";

    return (
        <div className="space-y-6 -my-6 mb-6">
            <SEO
                title={t('seo.parts.title', { country: countryName || 'Qatar' })}
                description={t('seo.parts.description', { country: countryName || 'Qatar' })}
            />

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

            <div className="flex flex-col lg:flex-row gap-8 relative items-start pt-6">

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
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 font-bold transition">
                                        {t('filter.clear')}
                                    </button>
                                    <button onClick={() => setIsFiltersOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 lg:hidden">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Search */}
                            {/* Note: Kept search in sidebar for consistency with previous CarsPage behavior if needed, but we also have top bar search */}

                            {/* Category */}
                            <div>
                                <label className={filterLabelClass}>{t('part.category')}</label>
                                <select className={filterInputClass} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}>
                                    <option value="">{t('filter.any')}</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand */}
                            <div>
                                <label className={filterLabelClass}>{t('form.brand')}</label>
                                <select className={filterInputClass} value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : '')}>
                                    <option value="">{t('filter.all_brands')}</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{language === 'ar' ? (b.name_ar || b.name) : b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Model */}
                            <div>
                                <label className={filterLabelClass}>{t('form.model')}</label>
                                <select className={filterInputClass} value={selectedModel} onChange={(e) => setSelectedModel(e.target.value ? Number(e.target.value) : '')} disabled={!selectedBrand}>
                                    <option value="">{t('filter.all_models')}</option>
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{language === 'ar' ? (m.name_ar || m.name) : m.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price */}
                            <div>
                                <label className={filterLabelClass}>{t('common.price')}</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder={t('filter.min_price')} className={filterInputClass} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                                    <input type="number" placeholder={t('filter.max_price')} className={filterInputClass} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                                </div>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className={filterLabelClass}>{t('car.condition')}</label>
                                <select className={filterInputClass} value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)}>
                                    <option value="">{t('filter.any')}</option>
                                    <option value="new">{t('condition.new')}</option>
                                    <option value="used">{t('condition.used')}</option>
                                    <option value="refurbished">{t('condition.refurbished')}</option>
                                </select>
                            </div>

                            {/* Part Type */}
                            <div>
                                <label className={filterLabelClass}>{t('part.type')}</label>
                                <select className={filterInputClass} value={selectedPartType} onChange={(e) => setSelectedPartType(e.target.value)}>
                                    <option value="">{t('filter.any')}</option>
                                    <option value="original">{t('part.original')}</option>
                                    <option value="aftermarket">{t('part.aftermarket')}</option>
                                </select>
                            </div>

                            <button onClick={applyFilters} className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition shadow-md hover:shadow-lg">
                                {t('filter.apply')}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Grid */}
                <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 flex-1 w-full">
                            {!isFiltersOpen && (
                                <button onClick={() => setIsFiltersOpen(true)} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 transition">
                                    <Filter className="w-4 h-4" /> {t('filter.show')}
                                </button>
                            )}

                            <div className="flex items-center gap-2 mb-0">
                                <Settings className="w-6 h-6 text-primary-600" />
                                <h1 className="text-xl font-bold dark:text-white whitespace-nowrap hidden md:block">{t('nav.parts')}</h1>
                            </div>

                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchTemp}
                                    onChange={(e) => setSearchTemp(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    placeholder={t('home.search_parts_placeholder')}
                                    className={`w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition px-4 ${dir === 'rtl' ? (isSearchActive ? 'pl-28' : 'pl-10') : (isSearchActive ? 'pr-28' : 'pr-10')}`}
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

                        <button onClick={() => setIsFiltersOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-white shadow-sm w-full justify-center sm:w-auto">
                            <Filter className="w-4 h-4" /> {t('filter.title')}
                        </button>
                    </div>

                    {searchParams.get('search') && (
                        <p className="mb-6 text-gray-500">
                            {t('parts.showing_results_for')} <span className="font-bold text-gray-900 dark:text-white">"{searchParams.get('search')}"</span>
                        </p>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner className="w-16 h-16" />
                        </div>
                    ) : (
                        parts.length > 0 ? (
                            <div className={`grid grid-cols-2 md:grid-cols-2 ${!isFiltersOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                                {parts.map(part => (
                                    <SparePartCard
                                        key={part.id}
                                        part={part}
                                        language={language}
                                        t={t}
                                        isFavorite={favorites.includes(part.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold dark:text-white">{t('common.no_results')}</h3>
                                <p className="text-gray-500 mt-1">{t('parts.try_adjusting')}</p>
                                <button onClick={clearFilters} className="mt-4 text-primary-600 font-bold hover:underline">{t('parts.clear_search')}</button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};