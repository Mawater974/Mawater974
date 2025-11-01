'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { Brand } from '../../../types/supabase';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PlaceholderCar from '../../../components/PlaceholderCar';

export default function BrandsManagement() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState({ name: '', name_ar: '', logo_url: '' });

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login?redirect=/admin/brands');
        return;
      }

      try {
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile || profile.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .order('name');

        if (brandsError) throw brandsError;

        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        toast.error('Failed to load brands');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user, authLoading, router]);

  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([{
          name: newBrand.name.trim(),
          name_ar: newBrand.name_ar.trim(),
          logo_url: newBrand.logo_url.trim()
        }])
        .select();

      if (error) throw error;

      setBrands([...brands, data[0]]);
      setNewBrand({ name: '', name_ar: '', logo_url: '' });
      toast.success('Brand added successfully');
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand');
    }
  };

  const handleUpdateBrand = async (brand: Brand) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({
          name: brand.name,
          name_ar: brand.name_ar,
          logo_url: brand.logo_url
        })
        .eq('id', brand.id);

      if (error) throw error;

      setBrands(brands.map((b) => (b.id === brand.id ? brand : b)));
      setEditingBrand(null);
      toast.success('Brand updated successfully');
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand');
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm('Are you sure you want to delete this brand? This will also delete all associated models.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      setBrands(brands.filter((brand) => brand.id !== brandId));
      toast.success('Brand deleted successfully');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-qatar-maroon text-white px-4 py-2 rounded hover:bg-qatar-maroon-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Brands</h1>

        {/* Add New Brand Form */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Brand</h2>
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Brand Name (English)"
              value={newBrand.name}
              onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
              className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Brand Name (Arabic)"
              value={newBrand.name_ar}
              onChange={(e) => setNewBrand({ ...newBrand, name_ar: e.target.value })}
              className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Logo URL"
              value={newBrand.logo_url}
              onChange={(e) => setNewBrand({ ...newBrand, logo_url: e.target.value })}
              className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light min-w-[200px]"
            />
            <button
              onClick={handleAddBrand}
              className="bg-qatar-maroon hover:bg-qatar-maroon-dark dark:bg-qatar-maroon-light dark:hover:bg-qatar-maroon text-white px-4 py-2 rounded transition-colors duration-200"
            >
              Add Brand
            </button>
          </div>
        </div>

        {/* Brands Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Brand Name (English)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Brand Name (Arabic)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Logo URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {editingBrand?.id === brand.id ? (
                      <input
                        type="text"
                        value={editingBrand.name}
                        onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                        className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
                      />
                    ) : (
                      <span>{brand.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {editingBrand?.id === brand.id ? (
                      <input
                        type="text"
                        value={editingBrand.name_ar || ''}
                        onChange={(e) => setEditingBrand({ ...editingBrand, name_ar: e.target.value })}
                        className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
                      />
                    ) : (
                      <span className="font-arabic">{brand.name_ar || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingBrand?.id === brand.id ? (
                      <input
                        type="text"
                        value={editingBrand.logo_url}
                        onChange={(e) => setEditingBrand({ ...editingBrand, logo_url: e.target.value })}
                        className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
                      />
                    ) : (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <PlaceholderCar className="h-10 w-10" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{brand.logo_url}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingBrand?.id === brand.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateBrand(editingBrand)}
                          className="bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBrand(null)}
                          className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingBrand(brand)}
                          className="bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="bg-red-500 dark:bg-red-600 text-white px-2 py-1 rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
