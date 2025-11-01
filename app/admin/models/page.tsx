'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { Brand, Model } from '../../../types/supabase';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function ModelsManagement() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [newModel, setNewModel] = useState({ name: '', name_ar: '', brand_id: '' });

  useEffect(() => {
    const checkAdminAndFetchBrands = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login?redirect=/admin/models');
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

    checkAdminAndFetchBrands();
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrand) {
        setModels([]);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('brand_id', selectedBrand)
          .order('name');

        if (error) throw error;

        setModels(data || []);
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error('Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [selectedBrand]);

  const handleAddModel = async () => {
    if (!selectedBrand) {
      toast.error('Please select a brand first');
      return;
    }

    if (!newModel.name.trim()) {
      toast.error('Model name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('models')
        .insert([{
          name: newModel.name.trim(),
          name_ar: newModel.name_ar.trim(),
          brand_id: selectedBrand
        }])
        .select();

      if (error) throw error;

      setModels([...models, data[0]]);
      setNewModel({ name: '', name_ar: '', brand_id: '' });
      toast.success('Model added successfully');
    } catch (error) {
      console.error('Error adding model:', error);
      toast.error('Failed to add model');
    }
  };

  const handleUpdateModel = async (model: Model) => {
    try {
      const { error } = await supabase
        .from('models')
        .update({ 
          name: model.name,
          name_ar: model.name_ar
        })
        .eq('id', model.id);

      if (error) throw error;

      setModels(models.map((m) => (m.id === model.id ? model : m)));
      setEditingModel(null);
      toast.success('Model updated successfully');
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Failed to update model');
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', modelId);

      if (error) throw error;

      setModels(models.filter((model) => model.id !== modelId));
      toast.success('Model deleted successfully');
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  };

  if (loading && !selectedBrand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="container mx-auto py-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Models</h1>

          {/* Brand Selection */}
          <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Brand
          </label>
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
          >
            <option value="">Select a brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBrand && (
          <>
            {/* Add New Model Form */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Model</h2>
              <div className="flex gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="Model Name (English)"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light min-w-[200px]"
                />
                <input
                  type="text"
                  placeholder="Model Name (Arabic)"
                  value={newModel.name_ar}
                  onChange={(e) => setNewModel({ ...newModel, name_ar: e.target.value })}
                  className="flex-1 border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light min-w-[200px]"
                />
                <button
                  onClick={handleAddModel}
                  className="bg-qatar-maroon hover:bg-qatar-maroon-dark dark:bg-qatar-maroon-light dark:hover:bg-qatar-maroon text-white px-4 py-2 rounded transition-colors duration-200"
                >
                  Add Model
                </button>
              </div>
            </div>

            {/* Models Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No models found for this brand
                  </td>
                </tr>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Model Name (English)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Model Name (Arabic)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {models.map((model) => (
                      <tr key={model.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {editingModel?.id === model.id ? (
                            <input
                              type="text"
                              value={editingModel.name}
                              onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                              className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <span>{model.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {editingModel?.id === model.id ? (
                            <input
                              type="text"
                              value={editingModel.name_ar || ''}
                              onChange={(e) => setEditingModel({ ...editingModel, name_ar: e.target.value })}
                              className="w-full border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <span className="font-arabic">{model.name_ar || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingModel?.id === model.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateModel(editingModel)}
                                className="bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingModel(null)}
                                className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingModel(model)}
                                className="bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteModel(model.id)}
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
              )}
            </div>
          </>
        )}
      </div>
      </main>
    </div>
  );
}
