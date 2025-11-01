'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Garage, GarageFilters } from '@/types/garage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, Phone, Mail, ExternalLink, Search, Filter, Grid, List } from 'lucide-react';
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
            name: 'Premium Auto Care',
            description: 'Your trusted auto service center with over 10 years of experience in car maintenance and repair.',
            address: '123 Main St',
            city: 'Doha',
            country: 'Qatar',
            phone: '+97450123456',
            email: 'info@premiumautocare.qa',
            website: 'https://premiumautocare.qa',
            logo_url: '/default-garage-logo.png',
            cover_image_url: '/default-garage-cover.jpg',
            rating: 4.8,
            review_count: 124,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            services: ['Oil Change', 'Tire Rotation', 'Brake Service'],
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
            <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-gray-50 dark:border-gray-800">
              <div className="relative h-40 bg-muted">
                {garage.cover_image_url ? (
                  <Image
                    src={garage.cover_image_url}
                    alt={garage.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                    <span className="text-muted-foreground">No cover image</span>
                  </div>
                )}
                {garage.is_featured && (
                  <Badge className="absolute top-2 right-2 bg-qatar-maroon hover:bg-qatar-maroon text-white">
                    Featured
                  </Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{garage.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {garage.city}, {garage.country}
                    </CardDescription>
                  </div>
                  {garage.logo_url && (
                    <div className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-800 shadow-md -mt-12 bg-white p-1">
                      <Image
                        src={garage.logo_url}
                        alt={`${garage.name} logo`}
                        width={64}
                        height={64}
                        className="rounded-full w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {garage.description}
                </p>
                <div className="flex items-center mb-2">
                  <div className="flex items-center text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-medium text-foreground">
                      {garage.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      ({garage.review_count} reviews)
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {garage.services.slice(0, 3).map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs text-black dark:text-gray-800">
                        {service}
                      </Badge>
                    ))}
                    {garage.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{garage.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border border-gray-50 dark:border-gray-800 border-t pt-4 ">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {garage.opening_hours[new Date().getDay()]?.is_closed
                    ? 'Closed today'
                    : `Open until ${garage.opening_hours[new Date().getDay()]?.close || '18:00'}`}
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </CardFooter>
            </Card>
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
