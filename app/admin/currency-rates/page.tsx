'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CurrencyRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export default function CurrencyRatesPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentRate, setCurrentRate] = useState<CurrencyRate | null>(null);
  const [newRate, setNewRate] = useState({
    from_currency: '',
    to_currency: '',
    rate: 0
  });

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/');
    }
  }, [profile, router]);

  // Fetch currency rates
  useEffect(() => {
    const fetchCurrencyRates = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('currency_rates')
          .select('*')
          .order('from_currency');
        
        if (error) throw error;
        
        setCurrencyRates(data || []);
      } catch (error) {
        console.error('Error fetching currency rates:', error);
        toast.error('Failed to load currency rates');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyRates();
  }, []);

  const handleEditRate = (rate: CurrencyRate) => {
    setCurrentRate(rate);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAddRate = () => {
    setCurrentRate(null);
    setIsAdding(true);
    setIsEditing(false);
    setNewRate({
      from_currency: '',
      to_currency: '',
      rate: 0
    });
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    
    try {
      const { error } = await supabase
        .from('currency_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCurrencyRates(currencyRates.filter(rate => rate.id !== id));
      toast.success(t('admin.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting currency rate:', error);
      toast.error(t('admin.deleteError'));
    }
  };

  const handleSaveEdit = async () => {
    if (!currentRate) return;
    
    try {
      const { error } = await supabase
        .from('currency_rates')
        .update({
          rate: currentRate.rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRate.id);
      
      if (error) throw error;
      
      setCurrencyRates(currencyRates.map(rate => 
        rate.id === currentRate.id ? { ...rate, rate: currentRate.rate, updated_at: new Date().toISOString() } : rate
      ));
      
      setIsEditing(false);
      setCurrentRate(null);
      toast.success(t('admin.updateSuccess'));
    } catch (error) {
      console.error('Error updating currency rate:', error);
      toast.error(t('admin.updateError'));
    }
  };

  const handleSaveNew = async () => {
    if (!newRate.from_currency || !newRate.to_currency || newRate.rate <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('currency_rates')
        .insert({
          from_currency: newRate.from_currency.toUpperCase(),
          to_currency: newRate.to_currency.toUpperCase(),
          rate: newRate.rate
        })
        .select();
      
      if (error) throw error;
      
      setCurrencyRates([...currencyRates, data[0]]);
      setIsAdding(false);
      setNewRate({
        from_currency: '',
        to_currency: '',
        rate: 0
      });
      toast.success(t('admin.createSuccess'));
    } catch (error: any) {
      console.error('Error adding currency rate:', error);
      if (error.code === '23505') {
        toast.error('This currency pair already exists');
      } else {
        toast.error(t('admin.createError'));
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('admin.currencyRates.title')}</h1>
            <button
              onClick={handleAddRate}
              className="bg-qatar-maroon hover:bg-qatar-maroon-dark text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('admin.currencyRates.addNew')}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-qatar-maroon"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading')}</p>
            </div>
          ) : (
            <>
              {isAdding && (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6 p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('admin.currencyRates.addNew')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.currencyRates.fromCurrency')}
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                        value={newRate.from_currency}
                        onChange={(e) => setNewRate({ ...newRate, from_currency: e.target.value })}
                        placeholder="QAR"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.currencyRates.toCurrency')}
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                        value={newRate.to_currency}
                        onChange={(e) => setNewRate({ ...newRate, to_currency: e.target.value })}
                        placeholder="USD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('admin.currencyRates.rate')}
                      </label>
                      <input
                        type="number"
                        step="0.0000000001"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                        value={newRate.rate}
                        onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSaveNew}
                      className="px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon-dark"
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              )}

              {isEditing && currentRate && (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6 p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {t('admin.currencyRates.edit')} {currentRate.from_currency} → {currentRate.to_currency}
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('admin.currencyRates.rate')}
                    </label>
                    <input
                      type="number"
                      step="0.0000000001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                      value={currentRate.rate}
                      onChange={(e) => setCurrentRate({ ...currentRate, rate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon-dark"
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('admin.currencyRates.fromCurrency')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('admin.currencyRates.toCurrency')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('admin.currencyRates.rate')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('admin.currencyRates.lastUpdated')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currencyRates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            {t('admin.currencyRates.noRates')}
                          </td>
                        </tr>
                      ) : (
                        currencyRates.map((rate) => (
                          <tr key={rate.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {rate.from_currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {rate.to_currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {rate.rate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatDate(rate.last_updated || rate.updated_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditRate(rate)}
                                className="text-qatar-maroon hover:text-qatar-maroon-dark mr-3"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRate(rate.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
