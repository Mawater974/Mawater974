'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import LoginPopup from '@/components/LoginPopup';
import imageCompression from 'browser-image-compression';

type Brand = {
  id: number;
  name: string;
  name_ar?: string;
};

type CarModel = {
  id: number;
  name: string;
  name_ar?: string;
  brand_id: number;
};

type Category = {
  id: number;
  name_en: string;
  name_ar: string;
};

type City = {
  id: number;
  name: string;
  name_ar: string;
};

export default function AddSparePart() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentCountry, formatPrice } = useCountry();
  const router = useRouter();
  
  // Helper function to fetch cities by country code
  const fetchCitiesByCountryCode = async (countryCode: string) => {
    try {
      const { data: countryData } = await supabase
        .from('countries')
        .select('id')
        .eq('code', countryCode.toUpperCase())
        .single();
      
      if (countryData) {
        const { data: defaultCities, error } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', countryData.id)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        if (defaultCities && defaultCities.length > 0) {
          setCities(defaultCities);
        }
      }
    } catch (error) {
      console.error('Error in fetchCitiesByCountryCode:', error);
      toast.error(t('common.errorFetchingData'));
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, isPrimary: boolean}[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  type ConditionType = 'new' | 'used' | 'refurbished';
  type PartType = 'original' | 'aftermarket';

  interface FormData {
    title: string;
    title_ar: string;
    description: string;
    description_ar: string;
    part_type: PartType;
    brandId: string;
    modelId: string;
    categoryId: string;
    condition: ConditionType;
    price: string;
    isNegotiable: boolean;
    cityId: string;
    images: File[];
  }

  // Define initial form data with proper types
  const initialFormData: FormData = {
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    part_type: '',
    brandId: '',
    modelId: '',
    categoryId: '',
    condition: '',
    price: '',
    isNegotiable: false,
    cityId: '',
    images: [],
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);





  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        
        if (brandsData) setBrands(brandsData);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('spare_part_categories')
          .select('*')
          .order('name_en');
        
        if (categoriesData) setCategories(categoriesData);

        // Fetch cities for current country
        if (!currentCountry?.code) {
          console.warn('No country code available for fetching cities');
          return;
        }
        
        // First, get the country ID for the current country code
        const { data: countryData, error: countryError } = await supabase
          .from('countries')
          .select('id')
          .eq('code', currentCountry.code.toUpperCase())
          .single();
        
        if (countryError || !countryData) {
          console.error('Error fetching country:', countryError);
          // Fallback to Qatar if country not found
          await fetchCitiesByCountryCode('QA');
          return;
        }
        
        // Now fetch cities for this country ID
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', countryData.id)
          .eq('is_active', true)
          .order('name');
        
        if (citiesError) {
          console.error('Error fetching cities:', citiesError);
          toast.error(t('common.errorFetchingData'));
          return;
        }
        
        if (citiesData && citiesData.length > 0) {
          setCities(citiesData);
        } else {
          console.warn('No cities found for country:', currentCountry.code);
          // Fallback to Qatar cities if none found for current country
          await fetchCitiesByCountryCode('QA');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.errorFetchingData'));
      }
    };

    fetchData();
  }, [currentCountry, t]);

  // Fetch models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.brandId) {
        setModels([]);
        setFormData(prev => ({ ...prev, modelId: '' }));
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('brand_id', formData.brandId)
          .order('name');
        
        if (error) throw error;
        
        setModels(data || []);
        // Reset model selection when brand changes
        if (formData.modelId) {
          setFormData(prev => ({ ...prev, modelId: '' }));
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error(t('common.errorFetchingData'));
      }
    };

    fetchModels();
  }, [formData.brandId, t]);

  const compressImage = async (file: File): Promise<File> => {
    console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    const options = {
      maxSizeMB: 0.95,          // Maximum file size in MB (950KB)
      maxWidthOrHeight: 1200,   // Maximum width or height
      useWebWorker: true,       // Use web worker for better performance
      maxIteration: 10,         // Maximum number of iterations to compress
      fileType: file.type,      // Keep the original file type
      initialQuality: 0.9,      // Initial quality (0-1)
    };

    try {
      console.log('Starting compression...');
      const compressedFile = await imageCompression(file, options);
      
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compression ratio:', ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%');
      
      // Create a new file with the compressed content
      const resultFile = new File([compressedFile], file.name, { 
        type: file.type,
        lastModified: new Date().getTime()
      });
      
      return resultFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to compress image. Using original file.');
      return file; // Return original file if compression fails
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Check number of files
    if (files.length + selectedFiles.length > 10) {
      toast.error(t('spareParts.add.maxImagesError', { max: 10 }));
      return;
    }
    
    // Check if this is the first image being uploaded
    const isFirstUpload = selectedFiles.length === 0;
    
    // Process files in parallel
    const processFiles = files.map(async (file, i) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(t('spareParts.add.invalidFileType'));
        return null;
      }
      
      // Always compress images for consistency
      let fileToProcess = file;
      try {
        console.log('Processing file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        fileToProcess = await compressImage(file);
        
        // Check if the file is still too large after compression
        if (fileToProcess.size > maxSize) {
          console.error('File still too large after compression:', (fileToProcess.size / 1024 / 1024).toFixed(2), 'MB');
          toast.error(t('spareParts.add.fileTooLarge'));
          return null;
        }
        
        console.log('Successfully processed file:', file.name);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error(t('spareParts.add.uploadError'));
        return null;
      }
      
      // Only the first image in the first batch should be primary
      return { 
        file: fileToProcess, 
        isPrimary: isFirstUpload && i === 0 // Only true for the very first image in the first upload
      };
    });
    
    try {
      const processedFiles = (await Promise.all(processFiles)).filter(Boolean) as {file: File, isPrimary: boolean}[];
      
      if (processedFiles.length > 0) {
        setSelectedFiles(prev => {
          // If this is the first upload, just use the new files
          if (prev.length === 0) {
            return processedFiles;
          }
          // Otherwise, append new files (none of them will be primary)
          return [...prev, ...processedFiles];
        });
        
        // Create preview URLs
        const newPreviewUrls = processedFiles.map(({file}) => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(t('spareParts.add.uploadError'));
    } finally {
      // Reset the file input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Update both states
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // If we removed the primary image and there are other images, make the first one primary
      if (prev[index]?.isPrimary && newFiles.length > 0) {
        newFiles[0].isPrimary = true;
      }
      return newFiles;
    });
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const setPrimaryImage = (index: number) => {
    setSelectedFiles(prev => 
      prev.map((file, i) => ({
        ...file,
        isPrimary: i === index
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Basic validation
      if (!formData.title || !formData.description || !formData.categoryId) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Upload images first
      const imageUploads = selectedFiles.map(async ({ file, isPrimary }, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`;
        
        // Upload the file to storage
        const { error: uploadError } = await supabase.storage
          .from('spare-parts')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('spare-parts')
          .getPublicUrl(fileName);
          
        return { url: publicUrl, isPrimary };
      });
      
      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(imageUploads);
      
      // Insert the spare part
      const { data: sparePart, error: insertError } = await supabase
        .from('spare_parts')
        .insert({
          user_id: user.id,
          brand_id: formData.brandId ? parseInt(formData.brandId) : null,
          model_id: formData.modelId ? parseInt(formData.modelId) : null,
          category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
          title: formData.title,
          name_ar: formData.title_ar || null, // Map title_ar to name_ar for database
          description: formData.description,
          description_ar: formData.description_ar || null,
          part_type: formData.part_type,
          price: parseFloat(formData.price) || 0,
          currency: currentCountry?.currency_code || '',
          is_negotiable: formData.isNegotiable,
          condition: formData.condition,
          country_code: currentCountry?.code || '',
          city_id: formData.cityId ? parseInt(formData.cityId) : null,
          contact_phone: user?.phone || user?.email || '',
          contact_email: user?.email || '',
          status: 'pending',
        })
        .select('id')
        .single();
        
      if (insertError) throw insertError;
      
      // Insert images if any were uploaded
      if (uploadedImages.length > 0 && sparePart) {
        const { error: imageError } = await supabase
          .from('spare_part_images')
          .insert(
            uploadedImages.map(({ url, isPrimary }) => ({
              spare_part_id: sparePart.id,
              url: url,
              is_primary: isPrimary,
              created_at: new Date().toISOString()
            }))
          );
          
        if (imageError) {
          console.error('Error inserting images:', imageError);
          throw imageError;
        }
      }
      
      // After the successful insert of the spare part
      const notificationType = `spare_part_submitted`;
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          type: notificationType,
          title_en: 'Spare Part Ad Submitted',
          title_ar: 'تم رفع إعلان قطعة الغيار',
          message_en: `Your spare part ad for "${formData.title}" has been submitted and is pending approval. We will notify you once it is reviewed.`,
          message_ar: `إعلان قطعة الغيار "${formData.title}" تم نشره بنجاح وتم قبوله. سيتم إشعارك بمجرد مراجعته`,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select('*')
        .single();
      
      // Reset form
      setFormData(initialFormData);
      setPreviewUrls([]);
      
      toast.success('Spare part added successfully and is pending approval');
      
      // Redirect to my listings
      router.push(`/my-ads`);
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'An error occurred while submitting the form');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ConditionType;
    setFormData(prev => ({
      ...prev,
      condition: value
    }));
  };
  
  const handlePartTypeChange = (type: PartType) => {
    setFormData(prev => ({
      ...prev,
      part_type: type
    }));
  };

  if (!user) {
    return <LoginPopup />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('spareParts.add.title')}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">           
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.titleLabel')} (English) *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                    placeholder={t('spareParts.add.titlePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="title_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.titleLabel')} (العربية)
                  </label>
                  <input
                    type="text"
                    id="title_ar"
                    name="title_ar"
                    value={formData.title_ar}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white text-right"
                    placeholder={t('spareParts.add.titlePlaceholderAr')}
                    dir="rtl"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.descriptionLabel')} (English)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                    placeholder={t('spareParts.add.descriptionPlaceholder')}
                  />
                </div>
                
                <div>
                  <label htmlFor="description_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.descriptionLabel')} (العربية)
                  </label>
                  <textarea
                    id="description_ar"
                    name="description_ar"
                    rows={4}
                    value={formData.description_ar}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white text-right"
                    placeholder={t('spareParts.add.descriptionPlaceholderAr')}
                    dir="rtl"
                    />
                </div>
              </div>
              
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.categoryLabel')} *
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">{t('spareParts.add.selectCategory')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {currentLanguage === 'ar' && category.name_ar ? category.name_ar : category.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.priceLabel')} ({currentCountry?.currency_code || ''}) *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white`}
                      placeholder="0.00"
                      dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                      required
                    />
                    
                  </div>
                  <div className="mt-1 flex items-center">
                    <input
                      id="isNegotiable"
                      name="isNegotiable"
                      type="checkbox"
                      checked={formData.isNegotiable}
                      onChange={handleChange}
                      className="h-4 w-4 text-qatar-maroon focus:ring-qatar-maroon border-gray-300 rounded"
                    />
                    <label htmlFor="isNegotiable" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {t('spareParts.add.negotiable')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="part_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.partTypeLabel')} *
                  </label>
                  <select
                    id="part_type"
                    name="part_type"
                    value={formData.part_type}
                    onChange={(e) => handlePartTypeChange(e.target.value as PartType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">{t('spareParts.add.selectPartType')}</option>
                    <option value="original">{t('spareParts.add.original')}</option>
                    <option value="aftermarket">{t('spareParts.add.aftermarket')}</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.conditionLabel')}
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleConditionChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">{t('spareParts.add.selectCondition')}</option>
                    <option value="new">{t('spareParts.add.conditionNew')}</option>
                    <option value="used">{t('spareParts.add.conditionUsed')}</option>
                    <option value="refurbished">{t('spareParts.add.conditionRefurbished')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.brandLabel')}
                  </label>
                  <select
                    id="brandId"
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('spareParts.add.selectBrand')}</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {currentLanguage === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.modelLabel')}
                  </label>
                  <select
                    id="modelId"
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    disabled={!formData.brandId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{t('spareParts.add.selectModel')}</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {currentLanguage === 'ar' && model.name_ar ? model.name_ar : model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('spareParts.add.cityLabel')} *
                  </label>
                  <select
                    id="cityId"
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('spareParts.add.selectCity')}</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {currentLanguage === 'ar' && city.name_ar ? city.name_ar : city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('spareParts.add.photos')} *
              </h2>
              
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">{t('spareParts.add.clickToUpload')}</span> {t('or drag and drop')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('spareParts.add.imageRequirements')}
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              {/* Image previews */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {previewUrls.map((url, index) => {
                    const isPrimary = selectedFiles[index]?.isPrimary || false;
                    return (
                      <div key={index} className="relative group">
                        <div 
                          className={`aspect-square overflow-hidden rounded-lg cursor-pointer ${isPrimary ? 'ring-2 ring-qatar-maroon' : 'bg-gray-100 dark:bg-gray-700 hover:ring-1 hover:ring-gray-400'}`}
                          onClick={() => setPrimaryImage(index)}
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
                          {!isPrimary && (
                            <div 
                              className="self-start bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryImage(index);
                              }}
                              title={t('spareParts.add.setAsPrimary')}
                            >
                              {t('spareParts.add.primary')}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="self-end bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                            aria-label={t('common.remove')}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        {isPrimary && (
                          <span className="absolute bottom-2 left-2 bg-qatar-maroon text-white text-xs px-2 py-1 rounded">
                            {t('spareParts.add.primary')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.posting')}...
                  </>
                ) : (
                  t('spareParts.add.submitButton')
                )}
              </button>
              
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('spareParts.add.termsAndConditions', {
                  terms: t('common.termsOfService'),
                  privacy: t('common.privacyPolicy')
                })}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
