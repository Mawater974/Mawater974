'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Garage, GarageService, OpeningHour } from '../../../../types/garage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Phone, Mail, ExternalLink, Clock, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {useLanguage} from '@/contexts/LanguageContext';
import {useCountry} from '@/contexts/CountryContext';

export default function GarageDetailPage() {
  const { countryCode, id } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currentCountry, formatPrice } = useCountry();
  const [garage, setGarage] = useState<Garage | null>(null);
  const [services, setServices] = useState<GarageService[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGarageDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/garages/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch garage details');
        }
        
        const data = await response.json();
        
        // Transform the data to match our Garage type
        const garageData = {
          ...data,
          services_en: data.services?.map((s: any) => s.name_en) || [],
          services_ar: data.services?.map((s: any) => s.name_ar) || [],
          opening_hours: data.opening_hours || []
        };
        
        setGarage(garageData);
        setServices(data.services || []);
      } catch (err) {
        console.error('Error fetching garage details:', err);
        setError('Failed to load garage details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGarageDetails();
    }
  }, [id, countryCode]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-block">
          <p>{error}</p>
        </div>
        <Button onClick={() => router.push(`/${countryCode}/garage`)} className="mt-4" variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Garages
        </Button>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Garage not found</p>
        <Button onClick={() => router.push(`/${countryCode}/garage`)} className="mt-4" variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Garages
        </Button>
      </div>
    );
  }

  const currentDay = new Date().toLocaleString('en-US', { weekday: 'long' });
  const todaySchedule = garage.opening_hours.find(day => 
    day.day.toLowerCase() === currentDay.toLowerCase()
  );

  return (
    <div className="container mx-auto py-4 px-4">
      <Button 
        onClick={() => router.push(`/${countryCode}/garage`)} 
        variant="ghost" 
        className="mb-2 pl-0"
      >
        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Garages
      </Button>

      {/* Header Section */}
      <div className="relative rounded-lg overflow-hidden bg-muted mb-8">
        <div className="relative h-72 w-full bg-gray-200 dark:bg-gray-800">
        {garage?.cover_image_url && (
          <>
            <Image
              src={garage.cover_image_url}
              alt={language === 'ar' ? garage.name_ar : garage.name_en}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </>
        )}
        </div>
        
        <div className="relative z-10 p-6 md:p-8 -mt-16">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-background shadow-lg overflow-hidden">
              {garage.logo_url ? (
                <Image
                  src={garage.logo_url}
                  alt={`${language === 'ar' ? garage.name_ar : garage.name_en } logo`}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No logo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{language === 'ar' ? garage.name_ar : garage.name_en }</h1>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Featured
                </Badge>
              </div>
              
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{language === 'ar' ? garage.address_ar : garage.address_en}, {language === 'ar' ? garage.city_ar : garage.city_en}, {language === 'ar' ? garage.country_ar : garage.country_en}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                {todaySchedule?.is_closed ? (
                  <span className="text-destructive">Closed today</span>
                ) : (
                  <>
                    <span className="text-green-600 font-medium">Open now</span>
                    <span className="text-muted-foreground ml-1">until {todaySchedule?.close || '18:00'}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <Button className="w-full sm:w-auto text-white">
                <Phone className="h-4 w-4 mr-2 text-white" />
                Call Now
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Combined Overview and Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'عن' : 'About'} {language === 'ar' ? garage.name_ar : garage.name_en}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{language === 'ar' ? garage.description_ar : garage.description_en}</p>
            </CardContent>
          </Card>
          
          {/* Services Section */}
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {language === 'ar' ? service.name_ar : service.name_en}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'ar' ? service.description_ar : service.description_en}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">QAR {service.price.toFixed(2)}</div>
                        <Button size="sm" className="mt-2 text-white">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No services available at the moment.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opening Hours Moved Here */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-medium mb-3">{language === 'ar' ? 'ساعات العمل' : 'Opening Hours'}</h4>
                <div className="space-y-2">
                  {garage.opening_hours.map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={day.day === currentDay ? 'font-medium' : 'text-muted-foreground'}>
                        {day.day}
                        {day.day === currentDay && ' (Today)'}
                      </span>
                      <span className={day.is_closed ? 'text-destructive' : 'text-foreground'}>
                        {day.is_closed ? 'Closed' : `${day.open} - ${day.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Phone</h4>
                  <p className="text-sm text-muted-foreground">
                    {garage.phone}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-sm text-muted-foreground">
                    {garage.email}
                  </p>
                </div>
              </div>
              
              {garage.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Website</h4>
                    <a 
                      href={garage.website.startsWith('http') ? garage.website : `https://${garage.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {garage.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {garage.social_links?.instagram && (
                <div className="flex items-center gap-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <div>
                    <h4 className="font-medium">Instagram</h4>
                    <a 
                      href={garage.social_links.instagram.startsWith('http') ? garage.social_links.instagram : `https://${garage.social_links.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      @{garage.social_links.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                </div>
              )}
              
              <Separator className="my-4" />
             
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Map will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
