'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import type { CarBrand, CarModel } from '@/types/supabase';
import { useCountry } from '@/contexts/CountryContext';

const priceRanges = [
  { label: 'Any Price', value: '' },
  { label: 'Under 50,000 QAR', value: '0-50000' },
  { label: '50,000 - 100,000 QAR', value: '50000-100000' },
  { label: '100,000 - 200,000 QAR', value: '100000-200000' },
  { label: 'Over 200,000 QAR', value: '200000-' },
];

const years = [
  { label: 'Any Year', value: '' },
  ...Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => ({
    label: String(new Date().getFullYear() - i),
    value: String(new Date().getFullYear() - i),
  })),
];

export default function SearchBar() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const { currentCountry } = useCountry();
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    query: '',
    priceRange: '',
    year: '',
    brand: '',
    model: '',
  });

  useEffect(() => {
    async function fetchBrands() {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setBrands(data || []);
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  useEffect(() => {
    async function fetchModels() {
      if (!searchParams.brand) {
        setModels([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('brand_id', (brands.find(b => b.name === searchParams.brand) || {}).id)
          .order('name');
        
        if (error) throw error;
        setModels(data || []);
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    }

    fetchModels();
  }, [searchParams.brand, brands]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    router.push(`/${currentCountry?.code.toLowerCase()}/cars?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search cars by make, model, or keywords..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-transparent"
              value={searchParams.query}
              onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors"
          >
            Search
          </button>
        </div>

        {showFilters && (
          <div className="absolute z-20 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand
              </label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={searchParams.brand}
                onChange={(e) => setSearchParams({ ...searchParams, brand: e.target.value, model: '' })}
              >
                <option value="">Any Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {searchParams.brand && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={searchParams.model}
                  onChange={(e) => setSearchParams({ ...searchParams, model: e.target.value })}
                >
                  <option value="">Any Model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={searchParams.year}
                onChange={(e) => setSearchParams({ ...searchParams, year: e.target.value })}
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price Range
              </label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={searchParams.priceRange}
                onChange={(e) => setSearchParams({ ...searchParams, priceRange: e.target.value })}
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
