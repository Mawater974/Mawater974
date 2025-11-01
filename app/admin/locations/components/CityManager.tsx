'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { City, Country } from '@/types/supabase';
import toast from 'react-hot-toast';

interface CityManagerProps {
  cities: City[];
  countries: Country[];
  onAddCity: (city: Omit<City, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateCity: (city: City) => Promise<void>;
}

export default function CityManager({ cities, countries, onAddCity, onUpdateCity }: CityManagerProps) {
  const { t, currentLanguage } = useLanguage();
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    country_id: 0,
    name: '',
    name_ar: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      country_id: 0,
      name: '',
      name_ar: '',
      is_active: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === 'country_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10)
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onAddCity(formData);
      setIsAddingCity(false);
      resetForm();
      toast.success(t('admin.locations.success.cityAdded') || 'City added successfully');
    } catch (error) {
      console.error('Error adding city:', error);
      toast.error(t('admin.locations.error.general') || 'An error occurred. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCity) return;
    
    try {
      await onUpdateCity({
        ...formData,
        id: editingCity.id,
        created_at: editingCity.created_at,
        updated_at: editingCity.updated_at
      });
      setEditingCity(null);
      resetForm();
      toast.success(t('admin.locations.success.cityUpdated') || 'City updated successfully');
    } catch (error) {
      console.error('Error updating city:', error);
      toast.error(t('admin.locations.error.general') || 'An error occurred. Please try again.');
    }
  };

  const startEditing = (city: City) => {
    setEditingCity(city);
    setFormData({
      country_id: city.country_id,
      name: city.name,
      name_ar: city.name_ar || '',
      is_active: city.is_active
    });
  };

  const cancelEditing = () => {
    setEditingCity(null);
    resetForm();
  };

  const cancelAdding = () => {
    setIsAddingCity(false);
    resetForm();
  };

  const filteredCities = selectedCountryId
    ? cities.filter(city => city.country_id === selectedCountryId)
    : cities;

  return (
    <div>
      {/* Header with Add Button and Country Filter */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('admin.locations.cities') || 'Cities'}
        </h2>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 rtl:space-x-reverse">
          {/* Country Filter */}
          <select
            value={selectedCountryId || ''}
            onChange={(e) => setSelectedCountryId(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
          >
            <option value="">{t('admin.locations.filterByCountry') || 'All Countries'}</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {currentLanguage === 'ar' && country.name_ar ? country.name_ar : country.name}
              </option>
            ))}
          </select>
          
          {/* Add Button */}
          {!isAddingCity && !editingCity && (
            <button
              onClick={() => setIsAddingCity(true)}
              className="px-4 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors"
            >
              {t('admin.locations.addCity') || 'Add City'}
            </button>
          )}
        </div>
      </div>
      
      {/* Add/Edit Form */}
      {(isAddingCity || editingCity) && (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            {editingCity 
              ? (t('admin.locations.editCity') || 'Edit City') 
              : (t('admin.locations.addCity') || 'Add City')}
          </h3>
          
          <form onSubmit={editingCity ? handleEditSubmit : handleAddSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.selectCountry') || 'Select Country'}
                </label>
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('admin.locations.selectCountry') || 'Select Country'}</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {currentLanguage === 'ar' && country.name_ar ? country.name_ar : country.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* City Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.cityName') || 'City Name'}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* City Name (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.cityNameAr') || 'City Name (Arabic)'}
                </label>
                <input
                  type="text"
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleInputChange}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.locations.isActive') || 'Active'}
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={editingCity ? cancelEditing : cancelAdding}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('admin.locations.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon/90"
              >
                {t('admin.locations.save') || 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Cities List */}
      {!isAddingCity && !editingCity && (
        <div className="overflow-x-auto">
          {filteredCities.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.cityName') || 'City Name'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.countryName') || 'Country'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.isActive') || 'Status'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCities.map((city) => {
                  const country = countries.find(c => c.id === city.country_id);
                  return (
                    <tr key={city.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {currentLanguage === 'ar' && city.name_ar ? city.name_ar : city.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {country ? (currentLanguage === 'ar' && country.name_ar ? country.name_ar : country.name) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          city.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {city.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEditing(city)}
                          className="text-qatar-maroon hover:text-qatar-maroon/80 mr-3"
                        >
                          {t('admin.locations.edit') || 'Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('admin.locations.noCities') || 'No cities found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
