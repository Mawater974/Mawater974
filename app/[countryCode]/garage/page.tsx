'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Garage, GarageFilters } from '@/types/garage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, ArrowRight, MapPin, Phone, Mail, ExternalLink, Search, Filter, Grid, List } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FunnelIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function GarageListPage() {
  const { countryCode } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currentCountry, formatPrice } = useCountry();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GarageFilters>({
    search: '',
    city: '',
    sort_by: 'rating',
    sort_order: 'desc',
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchGarages = async () => {
      try {
        setLoading(true);
        // Mock data for now
        const mockGarages: Garage[] = [
          {
            id: '1',
            name_en: 'Premium Auto Care',
            name_ar: 'مركز تأهيل السيارات الممتاز',
            description_en: 'Your trusted auto service center with over 10 years of experience in car maintenance and repair.',
            description_ar: 'مركز تأهيل السيارات الممتاز هو مركز تأهيل السيارات الموثوق به مع أكثر من 10 سنوات من الخبرة في الصيانة والإصلاحات السيارات. نحن نخصص في جميع أنواع خدمات السيارات من الصيانة اليومية إلى الصيانة الكبيرة. نستخدم فقط أفضل جودة المكونات والآلات لضمان أن سيارتك تلبي أفضل الرعاية ممكنة.',
            address_en: '123 Main St',
            address_ar: 'شارع الرئيسي 123',
            city_en: 'Doha',
            city_ar: 'الدوحة',
            country_en: 'Qatar',
            country_ar: 'القطر',
            phone: '+97450123456',
            email: 'info@premiumautocare.qa',
            website: 'https://premiumautocare.qa',
            logo_url: '/default-garage-logo.png',
            cover_image_url: '/default-garage-cover.jpg',
            rating: 4.8,
            review_count: 124,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            services_en: ['Oil Change', 'Tire Rotation', 'Brake Service'],
            services_ar: ['تغيير النفط', 'تمدد عجلات', 'خدمة العجلات'],
            opening_hours: [
              { day: 'Monday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Tuesday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Wednesday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Thursday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Friday', open: '14:00', close: '20:00', is_closed: false },
              { day: 'Saturday', open: '10:00', close: '16:00', is_closed: false },
              { day: 'Sunday', open: '09:00', close: '18:00', is_closed: false },
            ],
            social_links: {
              facebook: 'https://facebook.com/premiumautocare',
              instagram: 'https://instagram.com/premiumautocare',
            },
            is_featured: true,
            is_verified: true,
          },
          {
            id: '2',
            name_en: 'First Choise Garage',
            name_ar: 'فيرست تشويس جراج',
            description_en: 'Your trusted auto service center with over 10 years of experience in car maintenance and repair.',
            description_ar: 'مركز تأهيل السيارات الممتاز هو مركز تأهيل السيارات الموثوق به مع أكثر من 10 سنوات من الخبرة في الصيانة والإصلاحات السيارات. نحن نخصص في جميع أنواع خدمات السيارات من الصيانة اليومية إلى الصيانة الكبيرة. نستخدم فقط أفضل جودة المكونات والآلات لضمان أن سيارتك تلبي أفضل الرعاية ممكنة.',
            address_en: '123 Main St',
            address_ar: 'شارع الرئيسي 123',
            city_en: 'Doha',
            city_ar: 'الدوحة',
            country_en: 'Qatar',
            country_ar: 'القطر',
            phone: '+97450123456',
            email: 'info@premiumautocare.qa',
            website: 'https://premiumautocare.qa',
            logo_url: '/default-garage-logo.png',
            cover_image_url: '/default-garage-cover.jpg',
            rating: 4.8,
            review_count: 124,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            services_en: ['Oil Change', 'Tire Rotation', 'Brake Service'],
            services_ar: ['تغيير النفط', 'تمدد عجلات', 'خدمة العجلات'],
            opening_hours: [
              { day: 'Monday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Tuesday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Wednesday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Thursday', open: '09:00', close: '18:00', is_closed: false },
              { day: 'Friday', open: '14:00', close: '20:00', is_closed: false },
              { day: 'Saturday', open: '10:00', close: '16:00', is_closed: false },
              { day: 'Sunday', open: '09:00', close: '18:00', is_closed: false },
            ],
            social_links: {
              facebook: 'https://facebook.com/premiumautocare',
              instagram: 'https://instagram.com/premiumautocare',
            },
            is_featured: true,
            is_verified: true,
          },
          // Add more mock garages as needed
        ];
        
        setGarages(mockGarages);
      } catch (error) {
        console.error('Error fetching garages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarages();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find the Best Garages</h1>
        <p className="text-muted-foreground">Discover top-rated garages in your area</p>
      </div>

      <div className="mb-8 py-2 px-2 border border-gray-50 dark:border-gray-800 rounded-lg">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search garages..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="h-12 text-base border border-gray-50 dark:border-gray-800"
            />
          </div>
          <Button type="submit" className="h-12 px-6 text-white">
            Search
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {garages.map((garage) => (
          <Link key={garage.id} href={`/${countryCode}/garage/${garage.id}`} className="block h-full">
            <div className="relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01]">
              {garage.is_featured && (
                <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
                  {language === 'ar' ? 'مميز' : 'Featured'}
                </div>
              )}
              
              {/* Cover Image */}
              <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
                {garage.cover_image_url ? (
                  <Image
                    src={garage.cover_image_url}
                    alt={garage.name_en}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>

              {/* Garage Info */}
              <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' ? garage.name_ar : garage.name_en}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <MapPin className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'} flex-shrink-0`} />
                      <span className="truncate">
                        {language === 'ar' ? (
                          <>{garage.city_ar}، {garage.country_ar}</>
                        ) : (
                          <>{garage.city_en}, {garage.country_en}</>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {garage.logo_url && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 shadow-md bg-white p-0.5">
                        <Image
                          src={garage.logo_url}
                          alt={`${garage.name_en} logo`}
                          width={48}
                          height={48}
                          className="rounded-full object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                      {garage.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({garage.review_count} {language === 'ar' ? 'تقييمات' : 'reviews'})
                    </span>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(language === 'ar' ? garage.services_ar : garage.services_en).slice(0, 3).map((service, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      >
                        {service}
                      </span>
                    ))}
                    {garage.services_en.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        {language === 'ar' ? `+${garage.services_ar.length - 3} المزيد` : `+${garage.services_en.length - 3} more`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hours & CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate max-w-[140px] md:max-w-[180px]">
                      {garage.opening_hours[new Date().getDay()]?.is_closed
                      ? language === 'ar' ? 'مغلق اليوم' : 'Closed today'
                      : language === 'ar' 
                        ? `مفتوح ${garage.opening_hours[new Date().getDay()]?.open} - ${garage.opening_hours[new Date().getDay()]?.close}`
                        : `Open ${garage.opening_hours[new Date().getDay()]?.open} - ${garage.opening_hours[new Date().getDay()]?.close}`}
                    </span>
                  </div>
                  <button 
                    className="text-sm font-medium text-qatar-maroon hover:text-qatar-maroon/90 flex items-center"
                    onClick={(e) => e.preventDefault()}
                  >
                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                    {language === 'ar' ? (
                      <ArrowRight className="mr-1 h-4 w-4 transform rotate-180" />
                    ) : (
                      <ArrowRight className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {garages.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No garages found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
