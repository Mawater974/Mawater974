import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getCarById, getOptimizedImageUrl, getSimilarCars, toggleFavorite, getFavorites } from '../services/dataService';
import { Car } from '../types';
import { MapPin, Calendar, Gauge, Fuel, Settings, Layers, User, Phone, ChevronLeft, ChevronRight, Tag, CheckCircle, MessageCircle, AlertCircle, Heart } from 'lucide-react';
import { ImageCarousel } from '../components/ImageCarousel';
import { CommentSection } from '../components/CommentSection';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ImageViewer } from '../components/ImageViewer';
import { SimilarAdsCarousel } from '../components/SimilarAdsCarousel';
import { parsePhoneNumber } from 'libphonenumber-js';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export const CarDetailsPage: React.FC = () => {
   const { id, countryCode } = useParams<{ id: string, countryCode: string }>();
   const { t, language, dir, currency } = useAppContext();
   const { user } = useAuth();
   const [car, setCar] = useState<Car | null>(null);
   const [similarCars, setSimilarCars] = useState<Car[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeImageIndex, setActiveImageIndex] = useState(0);
   const [isViewerOpen, setIsViewerOpen] = useState(false);
   const [isFavorite, setIsFavorite] = useState(false);

   useEffect(() => {
      const fetchCar = async () => {
         if (!id) return;
         setLoading(true);
         const data = await getCarById(id);
         setCar(data);
         setLoading(false);

         if (data && data.brand_id) {
            const similar = await getSimilarCars(data.id, data.brand_id, data.country_id);
            setSimilarCars(similar);
         }
      };
      fetchCar();
   }, [id]);

   useEffect(() => {
      if (user && car) {
         getFavorites(user.id).then(favs => {
            const isFav = favs.some(f => f.car_id === car.id);
            setIsFavorite(isFav);
         });
      }
   }, [user, car]);

   const handleToggleFavorite = async () => {
      if (!user) {
         alert(t('comments.login_prompt'));
         return;
      }
      setIsFavorite(!isFavorite);
      await toggleFavorite(user.id, car!.id, 'car');
   };

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

   if (loading) return (
      <div className="flex justify-center items-center py-40">
         <LoadingSpinner className="w-16 h-16" />
      </div>
   );
   if (!car) return <div className="text-center py-20">{t('common.no_results')}</div>;

   const brandName = language === 'ar' ? (car.brands?.name_ar || car.brands?.name) : car.brands?.name;
   const modelName = language === 'ar' ? (car.models?.name_ar || car.models?.name) : car.models?.name;
   const cityName = language === 'ar' ? (car.cities?.name_ar || car.cities?.name) : car.cities?.name;
   const countryName = language === 'ar' ? (car.countries?.name_ar || car.countries?.name) : car.countries?.name;

   const imageUrls = car.car_images?.map(img => img.image_url) || [];
   const mainImage = imageUrls.length > 0 ? getOptimizedImageUrl(imageUrls[0], 800) : undefined;

   // SEO Text
   const title = `${brandName} ${modelName} ${car.year} - ${cityName} | Mawater974`;
   const desc = car.description ? car.description.substring(0, 160) : `${t('car.details')}: ${brandName} ${modelName}, ${car.year}, ${car.price} ${currency}.`;

   return (
      <div className="pb-12 relative">
         <SEO
            title={title}
            description={desc}
            image={mainImage}
            type="article"
         />

         {/* Status Watermark */}
         {car.status && car.status !== 'approved' && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden h-[60vh] mt-20">
               <div className="transform -rotate-12 border-4 border-dashed border-red-500/50 text-red-500/50 text-4xl sm:text-4xl md:text-8xl font-black uppercase px-12 py-4 tracking-widest bg-white/30 backdrop-blur-sm rounded-xl">
                  {car.status}
               </div>
            </div>
         )}

         {/* ImageViewer Modal */}
         {isViewerOpen && (
            <ImageViewer
               images={imageUrls}
               initialIndex={activeImageIndex}
               onClose={() => setIsViewerOpen(false)}
            />
         )}

         {/* Breadcrumb */}
         <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to={`/${countryCode}`} className="hover:text-primary-600">{t('nav.home')}</Link>
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Link to={`/${countryCode}/cars`} className="hover:text-primary-600">{t('nav.cars')}</Link>
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-semibold text-gray-900 dark:text-gray-200">{brandName} {modelName}</span>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* 1. Images Section */}
            <div className="lg:col-span-2 space-y-4">
               <div className="relative group rounded-2xl overflow-hidden shadow-sm bg-black">
                  <ImageCarousel
                     images={imageUrls}
                     alt={`${brandName} ${modelName}`}
                     aspectRatio="aspect-[4/3] md:aspect-[16/9]"
                     showArrows={true}
                     showCounter={true}
                     activeIndex={activeImageIndex}
                     onIndexChange={setActiveImageIndex}
                     onClick={() => setIsViewerOpen(true)}
                     className="bg-gray-900 cursor-zoom-in"
                     priority={true}
                  />

                  {/* Condition Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm z-20 pointer-events-none">
                     {car.condition ? t(`condition.${car.condition.toLowerCase().replace(' ', '_')}`) : car.condition}
                  </div>
               </div>

               {/* Thumbnails */}
               {car.car_images && car.car_images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                     {car.car_images.map((img, idx) => (
                        <button
                           key={idx}
                           onClick={() => setActiveImageIndex(idx)}
                           className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition relative ${activeImageIndex === idx ? 'border-primary-600 ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-gray-900' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        >
                           <img
                              src={getOptimizedImageUrl(img.thumbnail_url || img.image_url, 150)}
                              alt={`Thumbnail ${idx}`}
                              className="w-full h-full object-cover"
                           />
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* 2. Key Info & CTA (Placed here to appear 2nd on mobile, Right side on Desktop) */}
            <div className="lg:col-span-1 lg:row-span-2 space-y-6">
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                  <div className="mb-2 flex justify-between items-start gap-4">
                     <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                           {brandName} {modelName}
                        </h1>
                        {car.exact_model && <span className="block text-xl font-normal text-gray-500 mt-1">{car.exact_model}</span>}
                     </div>
                     <button
                        onClick={handleToggleFavorite}
                        className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${isFavorite
                              ? 'bg-red-50 border-red-100 text-red-500'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-100'
                           }`}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                     >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                     </button>
                  </div>
                  <p className="text-gray-500 flex items-center gap-1 mt-2">
                     <MapPin className="w-4 h-4" />
                     {cityName}, {countryName}
                  </p>

                  <div className="my-6">
                     <span className="text-4xl font-bold text-primary-600">{car.price.toLocaleString()}</span>
                     <span className="text-lg text-gray-500 font-medium ml-1">{car.countries?.currency_code || currency}</span>
                  </div>

                  {car.profiles?.phone_number ? (
                     <>
                        <a
                           href={`tel:${car.profiles.phone_number}`}
                           className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition mb-3"
                        >
                           <Phone className="w-5 h-5" />
                           {t('car.contact_seller')}
                        </a>
                        <a
                           href={`https://wa.me/${car.profiles.phone_number.replace(/\D/g, '')}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition mb-3"
                        >
                           <MessageCircle className="w-5 h-5" />
                           {t('parts.whatsapp')}
                        </a>
                     </>
                  ) : (
                     <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        {t('parts.no_phone')}
                     </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mt-6 border border-gray-100 dark:border-gray-700">
                     <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                     </div>
                     <div>
                        <p className="font-bold text-sm dark:text-white">{car.profiles?.full_name || t('car.seller_info')}</p>

                        {/* Verification Badge - Only for Dealers */}
                        {car.profiles?.role === 'dealer' ? (
                           <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {t('car.verified_seller')}
                           </p>
                        ) : (
                           <p className="text-xs text-gray-500 mb-1">Private Seller</p>
                        )}

                        {car.profiles?.phone_number && (
                           <a href={`tel:${car.profiles.phone_number}`} className="block text-primary-600 font-bold text-lg hover:underline" dir="ltr">
                              {formatPhone(car.profiles.phone_number)}
                           </a>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. Details & Specs Section */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h2 className="text-2xl font-bold mb-4 dark:text-white">{t('car.details')}</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><Calendar className="w-4 h-4" /> {t('common.year')}</span>
                        <span className="font-semibold dark:text-gray-200">{car.year}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><Gauge className="w-4 h-4" /> {t('common.mileage')}</span>
                        <span className="font-semibold dark:text-gray-200">{car.mileage.toLocaleString()} km</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><Fuel className="w-4 h-4" /> {t('car.fuel')}</span>
                        <span className="font-semibold dark:text-gray-200 capitalize">{car.fuel_type ? t(`fuel.${car.fuel_type.toLowerCase()}`) : '-'}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><Settings className="w-4 h-4" /> {t('car.gearbox')}</span>
                        <span className="font-semibold dark:text-gray-200 capitalize">{car.gearbox_type ? t(`gearbox.${car.gearbox_type.toLowerCase()}`) : '-'}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><Layers className="w-4 h-4" /> {t('car.body_type')}</span>
                        <span className="font-semibold dark:text-gray-200 capitalize">{car.body_type ? t(`body.${car.body_type.toLowerCase()}`) : '-'}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm">{t('car.color')}</span>
                        <span className="font-semibold dark:text-gray-200 flex items-center gap-2">
                           <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: car.color }}></span>
                           {car.color ? t(`color.${car.color.toLowerCase()}`) : '-'}
                        </span>
                     </div>
                     {car.drive_type && (
                        <div className="flex flex-col gap-1">
                           <span className="text-gray-500 text-sm flex items-center gap-1"><Settings className="w-4 h-4" /> {t('car.drive_type')}</span>
                           <span className="font-semibold dark:text-gray-200 capitalize">{t(`drive.${car.drive_type.toLowerCase()}`) || car.drive_type}</span>
                        </div>
                     )}
                     {car.exact_model && (
                        <div className="flex flex-col gap-1">
                           <span className="text-gray-500 text-sm flex items-center gap-1"><Tag className="w-4 h-4" /> Exact Model</span>
                           <span className="font-semibold dark:text-gray-200">{car.exact_model}</span>
                        </div>
                     )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                     <h3 className="text-xl font-bold mb-3 dark:text-white">{t('car.description')}</h3>
                     <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {car.description || "No description provided."}
                     </p>
                  </div>
               </div>

               {/* Comments Section */}
               <CommentSection entityId={car.id} entityType="car" />
            </div>

         </div>

         {/* Similar Ads Section */}
         <SimilarAdsCarousel items={similarCars} type="car" title="Similar Cars" />
      </div>
   );
};