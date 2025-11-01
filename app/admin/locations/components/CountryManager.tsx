'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Country } from '@/types/supabase';
import toast from 'react-hot-toast';

interface CountryManagerProps {
  countries: Country[];
  onAddCountry: (country: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateCountry: (country: Country) => Promise<void>;
}

export default function CountryManager({ countries, onAddCountry, onUpdateCountry }: CountryManagerProps) {
  const { t, currentLanguage } = useLanguage();
  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    currency_code: '',
    currency_symbol: '',
    currency_name: '',
    currency_name_ar: '',
    phone_code: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      name_ar: '',
      currency_code: '',
      currency_symbol: '',
      currency_name: '',
      currency_name_ar: '',
      phone_code: '',
      is_active: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onAddCountry(formData);
      setIsAddingCountry(false);
      resetForm();
      toast.success(t('admin.locations.success.countryAdded') || 'Country added successfully');
    } catch (error) {
      console.error('Error adding country:', error);
      toast.error(t('admin.locations.error.general') || 'An error occurred. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCountry) return;
    
    try {
      await onUpdateCountry({
        ...formData,
        id: editingCountry.id,
        created_at: editingCountry.created_at,
        updated_at: editingCountry.updated_at
      });
      setEditingCountry(null);
      resetForm();
      toast.success(t('admin.locations.success.countryUpdated') || 'Country updated successfully');
    } catch (error) {
      console.error('Error updating country:', error);
      toast.error(t('admin.locations.error.general') || 'An error occurred. Please try again.');
    }
  };

  const startEditing = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      name_ar: country.name_ar || '',
      currency_code: country.currency_code || '',
      currency_symbol: country.currency_symbol || '',
      currency_name: country.currency_name || '',
      currency_name_ar: country.currency_name_ar || '',
      phone_code: country.phone_code || '',
      is_active: country.is_active
    });
  };

  const cancelEditing = () => {
    setEditingCountry(null);
    resetForm();
  };

  const cancelAdding = () => {
    setIsAddingCountry(false);
    resetForm();
  };

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('admin.locations.countries') || 'Countries'}
        </h2>
        {!isAddingCountry && !editingCountry && (
          <button
            onClick={() => setIsAddingCountry(true)}
            className="px-4 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors"
          >
            {t('admin.locations.addCountry') || 'Add Country'}
          </button>
        )}
      </div>
      
      {/* Add/Edit Form */}
      {(isAddingCountry || editingCountry) && (
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            {editingCountry 
              ? (t('admin.locations.editCountry') || 'Edit Country') 
              : (t('admin.locations.addCountry') || 'Add Country')}
          </h3>
          
          <form onSubmit={editingCountry ? handleEditSubmit : handleAddSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.countryCode') || 'Country Code'}
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Country Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.countryName') || 'Country Name'}
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
              
              {/* Country Name (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.countryNameAr') || 'Country Name (Arabic)'}
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
              
              {/* Currency Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.currencyCode') || 'Currency Code'}
                </label>
                <input
                  type="text"
                  name="currency_code"
                  value={formData.currency_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Currency Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.currencySymbol') || 'Currency Symbol'}
                </label>
                <input
                  type="text"
                  name="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Currency Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.currencyName') || 'Currency Name'}
                </label>
                <input
                  type="text"
                  name="currency_name"
                  value={formData.currency_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Currency Name (Arabic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.currencyNameAr') || 'Currency Name (Arabic)'}
                </label>
                <input
                  type="text"
                  name="currency_name_ar"
                  value={formData.currency_name_ar}
                  onChange={handleInputChange}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              {/* Phone Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.locations.phoneCode') || 'Phone Code'}
                </label>
                <input
                  type="text"
                  name="phone_code"
                  value={formData.phone_code}
                  onChange={handleInputChange}
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
                onClick={editingCountry ? cancelEditing : cancelAdding}
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
      
      {/* Countries List */}
      {!isAddingCountry && !editingCountry && (
        <div className="overflow-x-auto">
          {countries.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.countryCode') || 'Code'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {currentLanguage === 'ar' ? 
                      (t('admin.locations.countryNameAr') || 'Name (Arabic)') : 
                      (t('admin.locations.countryName') || 'Name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.locations.currencyCode') || 'Currency'}
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
                {countries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {country.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {currentLanguage === 'ar' && country.name_ar ? country.name_ar : country.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {country.currency_code} {country.currency_symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        country.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {country.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEditing(country)}
                        className="text-qatar-maroon hover:text-qatar-maroon/80 mr-3"
                      >
                        {t('admin.locations.edit') || 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('admin.locations.noCountries') || 'No countries found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
