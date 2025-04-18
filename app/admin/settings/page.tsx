'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MapPinIcon, ClockIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface WebsiteSetting {
  id: number;
  key: string;
  value: string;
  value_ar?: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

type SettingCategory = 'contact' | 'social' | 'maps' | 'seo' | 'general';

export default function WebsiteSettingsPage() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>('contact');

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/');
    }
  }, [profile, router]);

  // Fetch website settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('website_settings')
          .select('*')
          .order('category')
          .order('key');
        
        if (error) throw error;
        
        // If no settings exist, create default ones
        if (!data || data.length === 0) {
          await createDefaultSettings();
          const { data: newData, error: newError } = await supabase
            .from('website_settings')
            .select('*')
            .order('category')
            .order('key');
          
          if (newError) throw newError;
          setSettings(newData || []);
        } else {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching website settings:', error);
        toast.error('Failed to load website settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const createDefaultSettings = async () => {
    const defaultSettings = [
      // Contact settings
      { key: 'email', value: 'contact@mawater974.com', description: 'Primary contact email', category: 'contact' },
      { key: 'phone', value: '+974 1234 5678', description: 'Primary contact phone number', category: 'contact' },
      { key: 'address', value: 'Doha, Qatar', value_ar: 'الدوحة، قطر', description: 'Office address', category: 'contact' },
      { key: 'working_hours', value: 'Mon-Fri: 9am-5pm', value_ar: 'الإثنين-الجمعة: 9 صباحًا - 5 مساءً', description: 'Working hours', category: 'contact' },
      
      // Social media settings
      { key: 'facebook', value: 'https://facebook.com/mawater974', description: 'Facebook page URL', category: 'social' },
      { key: 'instagram', value: 'https://instagram.com/mawater974', description: 'Instagram profile URL', category: 'social' },
      { key: 'twitter', value: 'https://twitter.com/mawater974', description: 'Twitter profile URL', category: 'social' },
      { key: 'youtube', value: 'https://youtube.com/mawater974', description: 'YouTube channel URL', category: 'social' },
      { key: 'linkedin', value: 'https://linkedin.com/company/mawater974', description: 'LinkedIn company URL', category: 'social' },
      
      // Maps settings
      { key: 'google_maps_api_key', value: '', description: 'Google Maps API Key', category: 'maps' },
      { key: 'default_latitude', value: '25.2854', description: 'Default map latitude', category: 'maps' },
      { key: 'default_longitude', value: '51.5310', description: 'Default map longitude', category: 'maps' },
      { key: 'default_zoom', value: '12', description: 'Default map zoom level', category: 'maps' },
      
      // SEO settings
      { key: 'site_title', value: 'Mawater974 - Qatar\'s Premier Car Marketplace', value_ar: 'ماواتر974 - سوق السيارات الرائد في قطر', description: 'Website title for SEO', category: 'seo' },
      { key: 'site_description', value: 'Find new and used cars for sale in Qatar. Browse cars from dealerships and private sellers.', value_ar: 'ابحث عن سيارات جديدة ومستعملة للبيع في قطر. تصفح السيارات من الوكلاء والبائعين الخاصين.', description: 'Website description for SEO', category: 'seo' },
      { key: 'site_keywords', value: 'cars, qatar, doha, used cars, new cars, buy cars, sell cars', value_ar: 'سيارات، قطر، الدوحة، سيارات مستعملة، سيارات جديدة، شراء سيارات، بيع سيارات', description: 'Website keywords for SEO', category: 'seo' },
      
      // General settings
      { key: 'site_logo', value: '/logo.png', description: 'Website logo path', category: 'general' },
      { key: 'favicon', value: '/favicon.ico', description: 'Website favicon path', category: 'general' },
      { key: 'currency_default', value: 'QAR', description: 'Default currency', category: 'general' },
      { key: 'items_per_page', value: '12', description: 'Number of items to show per page', category: 'general' },
      { key: 'enable_comments', value: 'true', description: 'Enable comments on car listings', category: 'general' },
      { key: 'require_approval', value: 'true', description: 'Require admin approval for new car listings', category: 'general' }
    ];
    
    try {
      const { error } = await supabase
        .from('website_settings')
        .insert(defaultSettings);
      
      if (error) throw error;
      
      toast.success('Default settings created');
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast.error('Failed to create default settings');
    }
  };

  const handleSettingChange = (id: number, field: 'value' | 'value_ar', value: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, [field]: value } : setting
    ));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Update each setting one by one
      for (const setting of settings) {
        const { error } = await supabase
          .from('website_settings')
          .update({
            value: setting.value,
            value_ar: setting.value_ar,
            updated_at: new Date().toISOString()
          })
          .eq('id', setting.id);
        
        if (error) throw error;
      }
      
      toast.success(t('admin.settings.saveSuccess'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('admin.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const getSettingsByCategory = (category: SettingCategory) => {
    return settings.filter(setting => setting.category === category);
  };

  const getCategoryIcon = (category: SettingCategory) => {
    switch (category) {
      case 'contact':
        return <EnvelopeIcon className="h-5 w-5" />;
      case 'social':
        return <GlobeAltIcon className="h-5 w-5" />;
      case 'maps':
        return <MapPinIcon className="h-5 w-5" />;
      case 'seo':
        return <GlobeAltIcon className="h-5 w-5" />;
      case 'general':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('admin.settings.title')}</h1>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-qatar-maroon hover:bg-qatar-maroon-dark text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <LoadingSpinner />
                  </div>
                  {t('admin.settings.saving')}
                </>
              ) : (
                t('admin.settings.saveAll')
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="flex flex-col items-center justify-center">
                <LoadingSpinner />
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading')}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <Tab.Group>
                <Tab.List className="flex border-b border-gray-200 dark:border-gray-700">
                  {['contact', 'social', 'maps', 'seo', 'general'].map((category) => (
                    <Tab
                      key={category}
                      className={({ selected }) =>
                        `py-4 px-6 text-sm font-medium flex items-center space-x-2 focus:outline-none ${
                          selected
                            ? 'text-qatar-maroon border-b-2 border-qatar-maroon'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`
                      }
                      onClick={() => setSelectedCategory(category as SettingCategory)}
                    >
                      {getCategoryIcon(category as SettingCategory)}
                      <span>{t(`admin.settings.categories.${category}`)}</span>
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="p-6">
                  {['contact', 'social', 'maps', 'seo', 'general'].map((category) => (
                    <Tab.Panel key={category}>
                      <div className="space-y-6">
                        {getSettingsByCategory(category as SettingCategory).map((setting) => (
                          <div key={setting.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </label>
                              {setting.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                              )}
                            </div>
                            
                            <div className={setting.value_ar !== undefined ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
                              <div>
                                {setting.key.includes('enable') || setting.key.includes('require') ? (
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                                    value={setting.value}
                                    onChange={(e) => handleSettingChange(setting.id, 'value', e.target.value)}
                                  >
                                    <option value="true">{t('yes')}</option>
                                    <option value="false">{t('no')}</option>
                                  </select>
                                ) : (
                                  <input
                                    type={setting.key.includes('password') || setting.key.includes('api_key') ? 'password' : 'text'}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                                    value={setting.value}
                                    onChange={(e) => handleSettingChange(setting.id, 'value', e.target.value)}
                                    placeholder={`Enter ${setting.key.replace(/_/g, ' ')}`}
                                  />
                                )}
                              </div>
                              
                              {setting.value_ar !== undefined && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Arabic)
                                  </label>
                                  <input
                                    type="text"
                                    dir="rtl"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                                    value={setting.value_ar || ''}
                                    onChange={(e) => handleSettingChange(setting.id, 'value_ar', e.target.value)}
                                    placeholder={`أدخل ${setting.key.replace(/_/g, ' ')}`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
