'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Garage, GarageService, GarageReview } from '@/types/garage';
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
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGarageDetails = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/garages/${id}`);
        // const data = await response.json();
        
        // Mock data for now
        const mockGarage: Garage = {
          id: id as string,
          name_en: 'Premium Auto Care',
          name_ar: 'مركز تأهيل السيارات الممتاز',
          description_en: 'Your trusted auto service center with over 10 years of experience in car maintenance and repair. We specialize in all types of vehicle services from routine maintenance to major repairs. Our certified technicians use only the highest quality parts and equipment to ensure your vehicle receives the best care possible.',
          description_ar: 'مركز تأهيل السيارات الممتاز هو مركز تأهيل السيارات الموثوق به مع أكثر من 10 سنوات من الخبرة في الصيانة والإصلاحات السيارات. نحن نخصص في جميع أنواع خدمات السيارات من الصيانة اليومية إلى الصيانة الكبيرة. نستخدم فقط أفضل جودة المكونات والآلات لضمان أن سيارتك تلبي أفضل الرعاية ممكنة.',
          address_en: '123 Main St, Business Bay',
          address_ar: 'شارع الرئيسي 123, بيزنس باي',
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
          services_en: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Diagnostics', 'AC Service', 'Battery Replacement', 'Car Wash'],
          services_ar: ['تغيير النفط', 'تمدد عجلات', 'خدمة العجلات', 'تشخيص المحرك', 'خدمة المكيف', 'استبدال البطارية', 'تنظيف السيارة'],
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
        };

        const mockServices: GarageService[] = [
          { id: '1', garage_id: id as string, name_en: 'Oil Change', name_ar: 'تغيير النفط', description_en: 'Complete oil and filter change with premium oil', description_ar: 'تغيير النفط الكامل مع ملوحة ممتازة', price: 200, duration: 30, is_available: true },
          { id: '2', garage_id: id as string, name_en: 'Tire Rotation', name_ar: 'تمدد عجلات', description_en: 'Rotate all four tires and check tire pressure', description_ar: 'تمدد جميع عجلات السيارة وتحقق من ضغط العجلات', price: 100, duration: 30, is_available: true },
          { id: '3', garage_id: id as string, name_en: 'Brake Service', name_ar: 'خدمة العجلات', description_en: 'Inspect and service brake system', description_ar: 'Inspect and service brake system', price: 300, duration: 60, is_available: true },
          { id: '4', garage_id: id as string, name_en: 'Engine Diagnostics', name_ar: 'تشخيص المحرك', description_en: 'Complete engine diagnostic check', description_ar: 'Complete engine diagnostic check', price: 150, duration: 45, is_available: true },
        ];

        const mockReviews: GarageReview[] = [
          { id: '1', garage_id: id as string, user_id: 'user1', user_name: 'Ahmed K.', user_avatar: null, rating: 5, comment: 'Excellent service! The team was very professional and completed the work on time.', created_at: '2025-03-15T10:30:00Z' },
          { id: '2', garage_id: id as string, user_id: 'user2', user_name: 'Sara M.', user_avatar: null, rating: 4, comment: 'Good service overall, but the waiting area could be more comfortable.', created_at: '2025-03-10T14:45:00Z' },
        ];

        setGarage(mockGarage);
        setServices(mockServices);
        setReviews(mockReviews);
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
  }, [id]);

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
    <div className="container mx-auto py-8 px-4">
      <Button 
        onClick={() => router.push(`/${countryCode}/garage`)} 
        variant="ghost" 
        className="mb-6 pl-0"
      >
        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Garages
      </Button>

      {/* Header Section */}
      <div className="relative rounded-lg overflow-hidden bg-muted mb-8">
        <div className="relative h-64 w-full">
          {garage.cover_image_url ? (
            <Image
              src={garage.cover_image_url}
              alt={language === 'ar' ? garage.name_ar : garage.name_en}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="text-muted-foreground">No cover image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-90"></div>
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
                {garage.is_verified && (
                  <Badge variant="secondary" className="text-xs text-black">
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{language === 'ar' ? garage.address_ar : garage.address_en}, {language === 'ar' ? garage.city_ar : garage.city_en}, {language === 'ar' ? garage.country_ar : garage.country_en}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span className="font-medium">{garage.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-muted-foreground text-sm ml-1">({garage.review_count} reviews)</span>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6 border border-gray-200 dark:border-gray-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'عن' : 'About'} {language === 'ar' ? garage.name_ar : garage.name_en}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{language === 'ar' ? garage.description_ar : garage.description_en}</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'ساعات العمل' : 'Opening Hours'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {garage.opening_hours.map((day, index) => (
                      <div key={index} className="flex justify-between">
                        <span className={day.day === currentDay ? 'font-medium' : ''}>
                          {day.day}
                          {day.day === currentDay && ' (Today)'}
                        </span>
                        <span className={day.is_closed ? 'text-destructive' : ''}>
                          {day.is_closed ? 'Closed' : `${day.open} - ${day.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-4">
              {services.length > 0 ? (
                services.map((service) => (
                  <Card className="border border-gray-200 dark:border-gray-800" key={service.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{language === 'ar' ? service.name_ar : service.name_en}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {language === 'ar' ? service.description_ar : service.description_en}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">QAR {service.price.toFixed(2)}</div>
                          <Button size="sm" className="mt-2 text-white">
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No services available at the moment.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-4">
              {reviews.length > 0 ? (
                <>
                  {reviews.map((review) => (
                    <Card key={review.id} className="border border-gray-200 dark:border-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            {review.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{review.user_name}</h4>
                              <div className="flex items-center text-amber-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="ml-1 text-foreground">{review.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                            <p className="mt-2">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex justify-center mt-6">
                    <Button variant="outline">Load More Reviews</Button>
                  </div>
                </>
              ) : (
                <Card className="border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No reviews yet. Be the first to review!
                  </CardContent>
                </Card>
              )}
              
              <Card className="mt-8 border border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                  <CardDescription>
                    Share your experience to help others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-6 w-6 text-amber-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Your Review</label>
                      <textarea 
                        className="w-full p-3 border rounded-md min-h-[100px]"
                        placeholder="Share details about your experience..."
                      />
                    </div>
                    <div className="flex justify-end text-white">
                      <Button>Submit Review</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {garage.address_en}, {garage.address_ar}, {garage.city_en || garage.city_ar}, {garage.country_en || garage.country_ar}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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
              
              <Separator className="my-4" />
              
              <div>
                <h4 className="font-medium mb-2">Share</h4>
                <div className="flex gap-3">
                  <Button variant="outline" size="icon">
                    <span className="sr-only">Share on Facebook</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon">
                    <span className="sr-only">Share on Twitter</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon">
                    <span className="sr-only">Share on WhatsApp</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.5 3.5a10 10 0 10-11.5 9.7V15h-2v4h4v-1.5c2.5-.8 5-2.4 6.4-5.1 1.4-2.8 1.4-6.1.1-8.9zM12 18.5c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm3-8.5h-2v-1h-2v3h3v-2z"/>
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon">
                    <span className="sr-only">Copy link</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </Button>
                </div>
              </div>
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
          
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Why Choose Us?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Certified Technicians</h4>
                  <p className="text-sm text-muted-foreground">Our team consists of certified and experienced professionals.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="4" rx="1" ry="1"></rect>
                    <path d="M5 3v5h14V3"></path>
                    <path d="M5 16v5h14v-5"></path>
                    <path d="M8 12h8"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Quick Service</h4>
                  <p className="text-sm text-muted-foreground">We value your time and provide efficient service.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Quality Parts</h4>
                  <p className="text-sm text-muted-foreground">We use only high-quality, genuine parts for all repairs.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
