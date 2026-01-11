
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getDealershipById, getDealershipCars, getOptimizedImageUrl } from '../services/dataService';
import { Dealership, Car } from '../types';
import { CarCard } from '../components/CarCard';
import { MapPin, Clock, Phone, Building2, CheckCircle, ChevronLeft, ChevronRight, Globe, Share2, Mail, ExternalLink, Warehouse } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { parsePhoneNumber } from 'libphonenumber-js';
import { SEO } from '../components/SEO';

export const ShowroomDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language, dir } = useAppContext();
  const [dealer, setDealer] = useState<Dealership | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      const dealerData = await getDealershipById(Number(id));
      if (dealerData) {
          setDealer(dealerData);
          // Assuming user_id links cars to the dealer
          const dealerCars = await getDealershipCars(dealerData.user_id);
          setCars(dealerCars);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center py-40">
        <LoadingSpinner className="w-16 h-16" />
    </div>
  );

  if (!dealer) return <div className="text-center py-20 text-gray-500">{t('dealers.no_results')}</div>;

  const name = language === 'ar' ? dealer.business_name_ar : dealer.business_name;
  const desc = language === 'ar' ? dealer.description_ar : dealer.description;
  const location = language === 'ar' ? (dealer.location_ar || dealer.location) : dealer.location;
  const hours = language === 'ar' ? (dealer.opening_hours_ar || dealer.opening_hours) : dealer.opening_hours;

  // Helper to format phone numbers for display
  const formatPhone = (num: string | undefined) => {
      if (!num) return "";
      try {
          const p = parsePhoneNumber(num);
          if (p) return p.formatInternational();
          return num;
      } catch (e) {
          return num;
      }
  };

  const mainContact = dealer.contact_number_1 || "";
  const logo = dealer.logo_url ? getOptimizedImageUrl(dealer.logo_url, 400) : undefined;

  // SEO
  const title = `${name} - ${location} | Mawater974`;
  const metaDesc = desc ? desc.substring(0, 160) : `Visit ${name} in ${location}. View inventory, contact details, and more.`;

  return (
    <div className="pb-12">
        <SEO 
            title={title}
            description={metaDesc}
            image={logo}
            type="profile"
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-primary-600">{t('nav.home')}</Link>
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Link to="/dealers" className="hover:text-primary-600">{t('nav.dealers')}</Link>
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-semibold text-gray-900 dark:text-gray-200">{name}</span>
        </div>

        {/* Header Banner */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden h-64 md:h-96 mb-8 shadow-md group">
            {/* Full Image Background */}
            <div className="absolute inset-0 bg-gray-800">
               {dealer.logo_url ? (
                   <img 
                    src={getOptimizedImageUrl(dealer.logo_url, 1200)} 
                    alt={name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   />
               ) : (
                   <div className="w-full h-full flex items-center justify-center opacity-10">
                       <Warehouse className="w-32 h-32" />
                   </div>
               )}
            </div>

            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="flex-grow text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{name}</h1>
                        {dealer.featured && <CheckCircle className="w-8 h-8 text-blue-400 fill-current" />}
                        <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                            {dealer.dealership_type}
                        </span>
                        {dealer.business_type && (
                            <span className="bg-primary-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {dealer.business_type.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-200 flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-primary-500" /> {location}
                    </p>
                </div>
                <div className="flex gap-3">
                   <button className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition">
                      <Share2 className="w-5 h-5" /> {t('common.share')}
                   </button>
                   {mainContact && (
                       <a href={`tel:${mainContact}`} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                          <Phone className="w-5 h-5" /> {t('contact.title')}
                       </a>
                   )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                    <h3 className="font-bold text-lg mb-4 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('showroom.info')}</h3>
                    <div className="space-y-5 text-sm">
                        <div>
                            <p className="text-gray-500 mb-1 text-xs font-bold uppercase tracking-wider">{t('showroom.about')}</p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{desc || "Welcome to our showroom. We offer a wide range of premium vehicles."}</p>
                        </div>
                        {hours && (
                            <div>
                                <p className="text-gray-500 mb-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {t('showroom.hours')}</p>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{hours}</p>
                            </div>
                        )}
                        
                        {/* Contacts */}
                        <div>
                             <p className="text-gray-500 mb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> {t('showroom.contact_numbers')}</p>
                             <div className="space-y-2">
                                {dealer.contact_number_1 && (
                                    <a href={`tel:${dealer.contact_number_1}`} className="block text-primary-600 font-bold text-lg hover:underline" dir="ltr">
                                        {formatPhone(dealer.contact_number_1)}
                                    </a>
                                )}
                                {dealer.contact_number_2 && (
                                    <a href={`tel:${dealer.contact_number_2}`} className="block text-gray-700 dark:text-gray-300 font-medium hover:text-primary-600" dir="ltr">
                                        {formatPhone(dealer.contact_number_2)}
                                    </a>
                                )}
                                {dealer.contact_number_3 && (
                                    <a href={`tel:${dealer.contact_number_3}`} className="block text-gray-700 dark:text-gray-300 font-medium hover:text-primary-600" dir="ltr">
                                        {formatPhone(dealer.contact_number_3)}
                                    </a>
                                )}
                             </div>
                        </div>

                        {(dealer.email || dealer.website) && (
                            <div className="space-y-3 pt-2">
                                {dealer.email && (
                                    <div>
                                        <p className="text-gray-500 mb-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> {t('showroom.email')}</p>
                                        <a href={`mailto:${dealer.email}`} className="text-blue-500 hover:underline font-medium break-all">{dealer.email}</a>
                                    </div>
                                )}
                                {dealer.website && (
                                    <div>
                                        <p className="text-gray-500 mb-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> {t('showroom.website')}</p>
                                        <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium flex items-center gap-1">
                                            {t('showroom.visit_website')} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inventory */}
            <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold dark:text-white">{t('showroom.inventory')} <span className="text-gray-400 text-lg font-normal">({cars.length})</span></h2>
                    
                    {/* Simple Filter (Visual only for now) */}
                    <div className="flex gap-2">
                        <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                            <option>{t('sort.label')}: {t('sort.newest')}</option>
                            <option>{t('sort.label')}: {t('sort.price_asc')}</option>
                            <option>{t('sort.label')}: {t('sort.price_desc')}</option>
                        </select>
                    </div>
                </div>

                {cars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map(car => (
                            <CarCard key={car.id} car={car} language={language} t={t} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('showroom.no_vehicles')}</h3>
                        <p className="text-gray-500 mt-1">{t('showroom.no_vehicles_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
