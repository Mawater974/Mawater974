
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getServices, getOptimizedImageUrl } from '../services/dataService';
import { Dealership } from '../types';
import { MapPin, Wrench, Phone, Star } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SEO } from '../components/SEO';

export const ServicesPage: React.FC = () => {
  const { t, selectedCountry } = useAppContext();
  const [services, setServices] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getServices();
      setServices(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <SEO 
        title={t('seo.services.title')}
        description={t('seo.services.description', { country: selectedCountry?.name || 'Qatar' })}
      />

      <div className="mb-8">
         <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
            <Wrench className="text-primary-600" /> {t('nav.services')}
         </h1>
         <p className="text-gray-500 mt-2">Find top-rated mechanics, detailing, and auto care services.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner className="w-16 h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.length > 0 ? services.map(service => (
             <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition">
                <div className="h-32 bg-gray-100 dark:bg-gray-700 relative">
                   {service.logo_url && (
                       <img src={getOptimizedImageUrl(service.logo_url, 400)} alt="" className="w-full h-full object-cover opacity-80" />
                   )}
                   <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center border-2 border-white">
                      <Wrench className="w-6 h-6 text-primary-600" />
                   </div>
                </div>
                <div className="pt-8 p-6">
                   <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{service.business_name}</h3>
                   <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1" /> {service.location}
                   </div>
                   <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
                      {service.description || "Comprehensive auto services for all car makes and models."}
                   </p>
                   <div className="flex gap-2">
                      <button className="flex-1 bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 flex items-center justify-center gap-2">
                         <Phone className="w-4 h-4" /> Call Now
                      </button>
                      <button className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
                         View Details
                      </button>
                   </div>
                </div>
             </div>
          )) : (
             <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No service providers listed yet.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
