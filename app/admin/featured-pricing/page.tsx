'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { FeaturedAdPricing } from '@/types/featured-ad';
import { Country } from '@/types/supabase';

interface PricingFormData {
  country_id: number;
  price: number;
  currency_code: string;
  created_at?: string;
  updated_at?: string;
}

const FeaturedPricingPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [formData, setFormData] = useState<PricingFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchCountries();
    fetchPricingData();
  }, [user?.id]);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to fetch countries');
    }
  };

  const fetchPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_ad_pricing')
        .select(`
          id,
          country_id,
          price,
          currency_code,
          country:countries(*)
        `)
        .order('country_id');

      if (error) throw error;
      setPricingData(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Failed to fetch pricing data');
      setLoading(false);
    }
  };

  const handleEdit = (pricing: FeaturedAdPricing) => {
    setEditingId(pricing.id);
    setFormData({
      country_id: pricing.country_id,
      price: pricing.price,
      currency_code: pricing.currency_code,
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      country_id: countries[0]?.id || 0,
      price: 0,
      currency_code: 'USD',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    try {
      setLoading(true);

      if (editingId) {
        // Update existing pricing
        const { error } = await supabase
          .from('featured_ad_pricing')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Pricing updated successfully');
      } else {
        // Create new pricing
        const { error } = await supabase
          .from('featured_ad_pricing')
          .insert([formData]);

        if (error) throw error;
        toast.success('Pricing added successfully');
      }

      setFormData(null);
      setEditingId(null);
      await fetchPricingData();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('Failed to save pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return;

    try {
      const { error } = await supabase
        .from('featured_ad_pricing')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Pricing deleted successfully');
      await fetchPricingData();
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast.error('Failed to delete pricing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Featured Ad Pricing Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Pricing
        </button>
      </div>

      {formData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Pricing' : 'Add New Pricing'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  value={formData.country_id}
                  onChange={(e) => {
                    const selectedCountry = countries.find((c) => c.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      country_id: parseInt(e.target.value),
                      currency_code: selectedCountry?.currency_code || 'USD',
                    });
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  disabled
                >
                  {countries
                    .filter((country) => country.id === formData.country_id)
                    .map((country) => (
                      <option key={country.currency_code} value={country.currency_code}>
                        {country.currency_code}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormData(null);
                  setEditingId(null);
                }}
                className="mr-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">Country</th>

              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Currency</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pricingData.map((pricing) => (
              <tr key={pricing.id} className="border-b">
                <td className="px-6 py-4">{pricing.country.name}</td>

                <td className="px-6 py-4">
                  {pricing.price.toLocaleString(undefined, {
                    style: 'currency',
                    currency: pricing.currency_code,
                  })}
                </td>
                <td className="px-6 py-4">{pricing.currency_code}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm`}>
                    {pricing.country?.name || pricing.country_code}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(pricing)}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pricing.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeaturedPricingPage;
