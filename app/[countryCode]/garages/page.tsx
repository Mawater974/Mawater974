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
import GarageCard from '@/components/garage/GarageCard';

export default function GarageListPage() {
  const { countryCode } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currentCountry, formatPrice } = useCountry();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
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
    const fetchGarages = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.city) params.append('city', filters.city);
        params.append('sort_by', filters.sort_by || 'rating');
        params.append('sort_order', filters.sort_order || 'desc');
        params.append('page', String(filters.page || 1));
        params.append('limit', String(filters.limit || 12));
        if (filters.is_featured !== undefined) params.append('is_featured', String(filters.is_featured));
        if (filters.is_verified !== undefined) params.append('is_verified', String(filters.is_verified));

        const response = await fetch(`/api/garages?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch garages');
        }

        const data = await response.json();
        setGarages(data.data || []);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error('Error fetching garages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarages();
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchQuery = formData.get('search') as string;
    
    setFilters(prev => ({
      ...prev,
      page: 1,
      search: searchQuery
    }));
  };

  const handleFilterChange = (newFilters: Partial<GarageFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  if (loading && garages.length === 0) {
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
          <GarageCard 
            key={garage.id} 
            garage={garage} 
            countryCode={countryCode as string} 
          />
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
