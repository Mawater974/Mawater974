
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getFeaturedCars, getBrands } from '../services/dataService';
import { Car, Brand } from '../types';
import { CarCard } from '../components/CarCard';
import { Search, ChevronRight, ChevronLeft, Car as CarIcon, Settings, Filter, Building2, Store, CheckCircle, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Home: React.FC = () => {
  const { t, language, dir, selectedCountryId, countries, selectedCountryCode } = useAppContext();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchTab, setSearchTab] = useState<'cars' | 'parts'>('cars');
  const [searchQuery, setSearchQuery] = useState('');

  const heroBackgrounds = {
    qa: '/qatar-bg.jpg',
    ae: '/uae-bg.jpg',
    sa: '/saudi-bg.jpg',
    kw: '/kuwait-bg.jpg',
    bh: '/bahrain-bg.jpg',
    om: '/oman-bg.jpg',
    sy: '/syria-bg.jpg',
    eg: '/egypt-bg.jpg',
  };
  const heroBg = heroBackgrounds[selectedCountryCode as keyof typeof heroBackgrounds] || '/hero-qa.jpg';

  useEffect(() => {
    const loadData = async () => {
      // Prevent fetching until country ID is resolved
      if (!selectedCountryId) return;

      setLoading(true);
      const [cars, brandsData] = await Promise.all([
        getFeaturedCars(selectedCountryId), 
        getBrands()
      ]);
      setFeaturedCars(cars);
      setBrands(brandsData);
      setLoading(false);
    };
    loadData();
  }, [selectedCountryId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Use selectedCountryCode from context to ensure valid path even if URL param is missing
    const targetCode = selectedCountryCode || 'qa';
    
    if (searchTab === 'cars') {
      navigate(`/${targetCode}/cars?search=${searchQuery}`);
    } else {
      navigate(`/${targetCode}/parts?search=${searchQuery}`);
    }
  };

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  
  const currentCountry = countries.find(c => c.id === selectedCountryId);
  const countryName = language === 'ar' 
    ? (currentCountry?.name_ar || 'قطر') 
    : (currentCountry?.name || 'Qatar');

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative h-[600px] -mt-6 -mx-[calc(50vw-50%)] w-[100vw] overflow-hidden dark:shadow-none shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroBg} 
            alt="Luxury Car Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/60"></div>
        </div>
         {/* Arabic Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm0 10L10 30l20 20 20-20L30 10z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'repeat',
              backgroundSize: '60px 60px'
            }}
          ></div>
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center z-10 space-y-8">
          <div className="max-w-3xl space-y-4 animate-fade-in-up">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 flex flex-col items-center leading-tight">
              <span className="font-cursive text-3xl lg:text-5xl text-white mb-3 drop-shadow-md">{t('hero.badge')}</span>
              <span className="text-white drop-shadow-lg">{t('hero.title1')}</span>
              <span className="text-primary-600 mt-2 drop-shadow-lg">
                {t('hero.title2', { country: countryName })}
              </span>
            </h1>
            <p className="text-xl text-center text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-md font-medium leading-relaxed">
              {t('hero.description', { country: countryName })}
            </p>
          </div>

          {/* Search Widget - Glassmorphism */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl mt-8">
            {/* Tabs */}
            <div className="flex gap-4 mb-2 border-b border-white/10 pb-2">
              <button 
                onClick={() => setSearchTab('cars')}
                className={`flex-1 font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all relative ${
                    searchTab === 'cars' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CarIcon className={`w-5 h-5 ${searchTab === 'cars' ? 'text-primary-400 drop-shadow-[0_0_8px_rgba(168,70,94,0.8)]' : ''}`} />
                <span className="tracking-wide drop-shadow-sm">{t('nav.cars')}</span>
                {searchTab === 'cars' && (
                    <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,70,94,0.5)]"></div>
                )}
              </button>
              <button 
                onClick={() => setSearchTab('parts')}
                className={`flex-1 font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all relative ${
                    searchTab === 'parts' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className={`w-5 h-5 ${searchTab === 'parts' ? 'text-primary-400 drop-shadow-[0_0_8px_rgba(168,70,94,0.8)]' : ''}`} />
                <span className="tracking-wide drop-shadow-sm">{t('nav.parts')}</span>
                {searchTab === 'parts' && (
                    <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,70,94,0.5)]"></div>
                )}
              </button>
            </div>

            {/* Inputs */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative group">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
                <input 
                  type="text" 
                  placeholder={searchTab === 'cars' ? t('search.placeholder') : t('home.search_parts_placeholder')} 
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder-gray-400 focus:bg-black/40 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="h-12 px-8 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/40 transition-all transform hover:-translate-y-0.5 active:scale-95 border border-primary-500/20 backdrop-blur-sm">
                 {t('hero.search').toUpperCase()}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Brand Logos Strip (Optional common feature) */}
      <section className="container mx-auto px-4">
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-bold dark:text-white">{t('home.browse_brand')}</h3>
             <Link to={`/${countryCode}/cars`} className="text-sm text-primary-600 font-semibold hover:underline">{t('home.view_all')}</Link>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {brands.map(brand => (
               <Link 
                 to={`/${countryCode}/cars?brandId=${brand.id}`} 
                 key={brand.id}
                 className="flex flex-col items-center justify-center min-w-[100px] h-[100px] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500 hover:shadow-md transition group"
               >
                  {/* Placeholder for Logo if url missing */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400 group-hover:text-primary-600 transition-colors">
                     {brand.name[0]}
                  </div>
                  <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary-700">
                    {language === 'ar' ? (brand.name_ar || brand.name) : brand.name}
                  </span>
               </Link>
            ))}
         </div>
      </section>

      {/* Featured Cars */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('featured.cars')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('home.latest_listings')}</p>
          </div>
          <Link to={`/${countryCode}/cars`} className="group flex items-center gap-1 text-primary-700 font-bold hover:text-primary-800 transition bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-full">
            {t('common.view_details')} 
            <ChevronIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
             <LoadingSpinner className="w-12 h-12" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.length > 0 ? (
                featuredCars.map(car => (
                <CarCard key={car.id} car={car} language={language} t={t} />
                ))
            ) : (
                <div className="col-span-4 flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Filter className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
                </div>
            )}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-3xl p-8 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">{t('home.cta.title')}</h2>
            <p className="text-primary-100 text-lg">
              {t('home.cta.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to={`/${countryCode}/my-ads`} className="bg-white text-primary-700 hover:bg-gray-50 font-bold py-3.5 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1">
                {t('home.cta.post_ad')}
              </Link>
              <Link to={`/${countryCode}/dealers`} className="bg-primary-700/50 hover:bg-primary-700/70 text-white font-bold py-3.5 px-8 rounded-xl backdrop-blur-sm border border-white/20 transition">
                {t('home.cta.find_dealer')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dealer Registration Promo Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-gray-900 dark:bg-gray-800 rounded-3xl p-8 md:p-12 overflow-hidden relative">
          {/* Background Pattern/Gradient */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-800 to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/50 border border-primary-700 text-primary-400 text-xs font-bold uppercase tracking-wider">
                 <Building2 className="w-3 h-3" /> Dealer Program
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {t('home.dealer_section.title')}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                {t('home.dealer_section.desc')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                 {/* Steps visual */}
                 <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold">1</div>
                    <span className="text-sm text-gray-300 font-medium">{t('home.dealer_section.step1')}</span>
                 </div>
                 <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold">2</div>
                    <span className="text-sm text-gray-300 font-medium">{t('home.dealer_section.step2')}</span>
                 </div>
                 <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold">3</div>
                    <span className="text-sm text-gray-300 font-medium">{t('home.dealer_section.step3')}</span>
                 </div>
              </div>

              <div className="pt-4">
                 <Link to={`/${countryCode}/signup`} className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-xl font-bold transition">
                    {t('home.dealer_section.cta')} <ChevronIcon className="w-4 h-4" />
                 </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center md:justify-end">
                {/* Illustration or Icon */}
                <div className="relative">
                   <div className="absolute inset-0 bg-primary-600 blur-3xl opacity-20 rounded-full"></div>
                   <Store className="w-48 h-48 text-gray-700 dark:text-gray-600 relative z-10" strokeWidth={1} />
                   
                   {/* Floating Elements */}
                   <div className="absolute -top-4 -left-4 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl z-20">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                   </div>
                   <div className="absolute -bottom-4 -right-4 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl z-20">
                      <Users className="w-8 h-8 text-blue-500" />
                   </div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
