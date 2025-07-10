'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useLanguage } from '@/contexts/LanguageContext';
import imageCompression from 'browser-image-compression';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useCountry } from '@/contexts/CountryContext';

interface SparePartImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface SparePart {
  id: string;
  title: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price: string | number;
  currency?: string;
  condition?: 'new' | 'used' | 'refurbished';
  part_type?: 'original' | 'aftermarket';
  brand_id?: string | number;
  model_id?: string | number;
  category_id?: string | number;
  city_id?: string | number;
  country_id?: string | number;
  images?: SparePartImage[] | string[];
  brand?: {
    id: number;
    name: string;
    name_ar?: string | null;
  };
  model?: {
    id: number;
    name: string;
    name_ar?: string | null;
  };
  category?: {
    id: number;
    name_en: string;
    name_ar: string;
  };
  city?: {
    id: number;
    name: string;
    name_ar: string | null;
  };
  country?: {
    id: number;
    name: string;
    name_ar: string | null;
    currency_code?: string;
  };
}

interface EditSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart?: SparePart | null;
  onUpdate: () => void;
  onEditComplete: (updatedSparePart: SparePart) => void;
}

interface FormData {
  title: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: string;
  condition: 'new' | 'used' | 'refurbished';
  part_type: 'original' | 'aftermarket';
  brand_id: string;
  model_id: string;
  category_id: string;
  city_id: string;
  country_id: string;
}

interface DropdownOption {
  id: number;
  name: string;
  name_ar?: string | null;
  name_en?: string;
}

const EditSparePartModal = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onUpdate, 
  onEditComplete 
}: EditSparePartModalProps): JSX.Element | null => {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<SparePartImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const { currentCountry } = useCountry();
  
  // State for dropdown options
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filteredModels, setFilteredModels] = useState<DropdownOption[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: '',
    condition: '',
    part_type: '',
    brand_id: '',
    model_id: '',
    category_id: '',
    city_id: '',
    country_id: '',
  });

  // Helper function to safely convert values to strings for form fields
  const safeString = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('id, name, name_ar')
          .order('name', { ascending: true });
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('spare_part_categories')
          .select('id, name_en, name_ar')
          .order('name_en', { ascending: true });
        
        // Fetch cities for the current country
      let citiesQuery = supabase
        .from('cities')
        .select('id, name, name_ar');
      
      // Only filter by country_id if currentCountry is available
      if (currentCountry) {
        citiesQuery = citiesQuery.eq('country_id', currentCountry.id);
      }
      
      const { data: citiesData } = await citiesQuery.order('name', { ascending: true });
        
        // Map data to match DropdownOption interface
        setBrands((brandsData || []).map(b => ({
          id: b.id,
          name: b.name,
          name_ar: b.name_ar
        })));
        
        setCategories((categoriesData || []).map(c => ({
          id: c.id,
          name: c.name_en,
          name_ar: c.name_ar
        })));
        
        setCities((citiesData || []).map(c => ({
          id: c.id,
          name: c.name,
          name_ar: c.name_ar
        })));
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.errorLoadingData'));
      } finally {
        setLoadingData(false);
      }
    };
    
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, supabase, t]);
  
  // Filter models based on selected brand
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.brand_id) {
        setModels([]);
        setFilteredModels([]);
        return;
      }
      
      try {
        const { data: modelsData } = await supabase
          .from('models')
          .select('id, name, name_ar, brand_id')
          .eq('brand_id', formData.brand_id)
          .order('name', { ascending: true });
        
        setModels(modelsData || []);
        setFilteredModels(modelsData || []);
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error(t('common.errorLoadingModels'));
      }
    };
    
    fetchModels();
  }, [formData.brand_id, supabase, t]);
  
  // Initialize form data and images when sparePart changes
  useEffect(() => {
    if (!sparePart) return;
    
    // First, ensure we have all the related data in our dropdowns
    const updateDropdowns = () => {
      const updatedBrands = [...brands];
      const updatedCategories = [...categories];
      const updatedCities = [...cities];
      
      // Add brand if it exists in sparePart but not in brands
      if (sparePart.brand && !brands.some(b => b.id === sparePart.brand_id)) {
        updatedBrands.push({
          id: sparePart.brand.id,
          name: sparePart.brand.name,
          name_ar: sparePart.brand.name_ar || null
        });
      }
      
      // Add category if it exists in sparePart but not in categories
      if (sparePart.category && !categories.some(c => c.id === sparePart.category_id)) {
        updatedCategories.push({
          id: sparePart.category.id,
          name: sparePart.category.name_en,
          name_ar: sparePart.category.name_ar,
          name_en: sparePart.category.name_en
        });
      }
      
      // Add city if it exists in sparePart but not in cities
      if (sparePart.city && !cities.some(c => c.id === sparePart.city_id)) {
        updatedCities.push({
          id: sparePart.city.id,
          name: sparePart.city.name,
          name_ar: sparePart.city.name_ar
        });
      }
      
      setBrands(updatedBrands);
      setCategories(updatedCategories);
      setCities(updatedCities);
      
      // Set models after ensuring brand is available
      if (sparePart.model) {
        setModels(prevModels => {
          const modelExists = prevModels.some(m => m.id === sparePart.model_id);
          if (modelExists) return prevModels;
          
          return [{
            id: sparePart.model!.id,
            name: sparePart.model!.name,
            name_ar: sparePart.model!.name_ar || null,
            brand_id: Number(sparePart.brand_id)
          }, ...prevModels];
        });
      }
    };
    
    // Set form data with all fields from sparePart
    const formData: FormData = {
      title: sparePart.title ?? '',
      name_ar: sparePart.name_ar ?? '',
      description: sparePart.description ?? '',
      description_ar: sparePart.description_ar ?? '',
      price: safeString(sparePart.price) || '0',
      condition: (sparePart.condition as 'new' | 'used' | 'refurbished') || '',
      part_type: (sparePart.part_type as 'original' | 'aftermarket') || '',
      brand_id: safeString(sparePart.brand_id) || '',
      model_id: safeString(sparePart.model_id) || '',
      category_id: safeString(sparePart.category_id) || '',
      city_id: safeString(sparePart.city_id) || '',
      country_id: safeString(sparePart.country_id ?? currentCountry?.id?.toString()) || '',
    };
    
    setFormData(formData);
    updateDropdowns();
    
    // Set initial images
    if (Array.isArray(sparePart.images)) {
      setImages(
        sparePart.images.map(img => ({
          id: typeof img === 'string' ? '' : img.id || '',
          url: typeof img === 'string' ? img : img?.url || '',
          is_primary: typeof img === 'string' ? false : Boolean(img?.is_primary)
        }))
      );
    } else {
      setImages([]);
    }
  }, [sparePart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.5, // Maximum file size in MB (500KB)
      maxWidthOrHeight: 1200, // Maximum width or height
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new File([compressedFile], file.name, { type: file.type });
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original file if compression fails
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !sparePart) return;
    
    setUploading(true);
    
    try {
      // Create a mutable copy of the file
      let fileToUpload = e.target.files[0];
      
      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(fileToUpload.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }
      
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (fileToUpload.size > maxSize) {
        // Compress the image if it's too large
        const compressedFile = await compressImage(fileToUpload);
        if (compressedFile.size > maxSize) {
          throw new Error('Image is too large after compression. Please choose a smaller image.');
        }
        fileToUpload = compressedFile;
      }
      
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${sparePart.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `spare-parts/${sparePart.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spare-parts')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('spare-parts')
        .getPublicUrl(filePath);
      
      // Add the new image to the images array
      const newImage = {
        id: '', // Will be set after saving to the database
        url: publicUrl,
        is_primary: images.length === 0 // Set as primary if it's the first image
      };
      
      setImages(prev => [...prev, newImage]);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('common.errorUploadingImage'));
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimaryImage = (imageUrl: string) => {
    setImages(prev => 
      prev.map(img => ({
        ...img,
        is_primary: img.url === imageUrl
      }))
    );
  };

  const handleDeleteImage = async (imageUrl: string, imageId?: string) => {
    if (!sparePart) return;
    
    try {
      // Delete from storage if it's not a placeholder
      if (imageUrl.includes('spare-parts/')) {
        const filePath = imageUrl.split('spare-parts/')[1].split('?')[0];
        await supabase.storage
          .from('spare-parts')
          .remove([filePath]);
      }
      
      // If the image has an ID, delete it from the database
      if (imageId) {
        await supabase
          .from('spare_part_images')
          .delete()
          .eq('id', imageId);
      }
      
      // Update local state
      setImages(prev => prev.filter(img => img.url !== imageUrl));
      
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('common.errorDeletingImage'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sparePart) return;
    
    setLoading(true);
    
    try {
      // Update the spare part
      const updateData: any = {
        title: formData.title,
        name_ar: formData.name_ar,
        description: formData.description,
        description_ar: formData.description_ar,
        price: parseFloat(formData.price) || 0,
        condition: formData.condition,
        part_type: formData.part_type,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
        model_id: formData.model_id ? parseInt(formData.model_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        city_id: formData.city_id ? parseInt(formData.city_id) : null,
      };
      
      const { data: updatedSparePart, error } = await supabase
        .from('spare_parts')
        .update(updateData)
        .eq('id', sparePart.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update images in the database
      await Promise.all(
        images.map(async (img, index) => {
          if (!img.id) {
            // New image, insert it
            const { error: imgError } = await supabase
              .from('spare_part_images')
              .insert([
                {
                  spare_part_id: sparePart.id,
                  url: img.url,
                  is_primary: img.is_primary || false
                }
              ]);
              
            if (imgError) throw imgError;
          } else if (img.is_primary) {
            // Update primary status if needed
            const { error: imgError } = await supabase
              .from('spare_part_images')
              .update({ is_primary: true })
              .eq('id', img.id);
              
            if (imgError) throw imgError;
          }
        })
      );
      
      // Fetch the updated spare part with all relations
      const { data: completeSparePart, error: fetchError } = await supabase
        .from('spare_parts')
        .select(`
          *,
          brand:brands(*),
          model:models(*),
          category:spare_part_categories(*),
          city:cities(*),
          country:countries(*),
          images:spare_part_images(*)
        `)
        .eq('id', sparePart.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      toast.success(t('common.changesSaved'));
      onUpdate();
      onEditComplete(completeSparePart);
      onClose();
      
    } catch (error) {
      console.error('Error updating spare part:', error);
      toast.error(t('common.errorSavingChanges'));
    } finally {
      setLoading(false);
    }
  };

  if (!sparePart) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      {t('spareParts.editSparePart')}
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Title - English & Arabic Side by Side */}
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* English Title */}
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('spareParts.add.titleLabel')} (English) *
                            </label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              required
                              value={formData.title}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          
                          {/* Arabic Title */}
                          <div>
                            <label htmlFor="name_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('spareParts.add.titleLabel')} (العربية) *
                            </label>
                            <input
                              type="text"
                              name="name_ar"
                              id="name_ar"
                              required
                              dir="rtl"
                              value={formData.name_ar}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white text-right"
                            />
                          </div>
                        </div>
                        
                        {/* Description - English & Arabic Side by Side */}
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* English Description */}
                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('spareParts.add.descriptionLabel')} (English)
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              rows={3}
                              value={formData.description}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          
                          {/* Arabic Description */}
                          <div>
                            <label htmlFor="description_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('spareParts.add.descriptionLabel')} (العربية)
                            </label>
                            <textarea
                              id="description_ar"
                              name="description_ar"
                              rows={3}
                              dir="rtl"
                              value={formData.description_ar}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('spareParts.add.priceLabel')} ({currentCountry?.currency_code || 'QAR'}) *
                  </label>
                  <div className="relative rounded-md shadow-sm"> 
                            <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white`}
                      placeholder="0.00"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                            />
                          </div>
                        </div>
                        {/* City */}
                        <div>
                          <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.cityLabel')} *
                          </label>
                          <select
                            id="city_id"
                            name="city_id"
                            value={formData.city_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            required
                          >
                            <option value="">{t('spareParts.add.cityLabel')}</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {language === 'ar' && city.name_ar ? city.name_ar : city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Brand */}
                        <div>
                          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.brandLabel')} *
                          </label>
                          <select
                            id="brand_id"
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            required
                          >
                            <option value="">{t('spareParts.add.selectBrand')}</option>
                            {brands.map((brand) => (
                              <option key={brand.id} value={brand.id}>
                                {language === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Model */}
                        <div>
                          <label htmlFor="model_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.modelLabel')}
                          </label>
                          <select
                            id="model_id"
                            name="model_id"
                            value={formData.model_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            disabled={!formData.brand_id}
                          >
                            <option value="">{t('spareParts.add.selectModel')}</option>
                            {filteredModels.map((model) => (
                              <option key={model.id} value={model.id}>
                                {language === 'ar' && model.name_ar ? model.name_ar : model.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Category */}
                        <div>
                          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.categoryLabel')} *
                          </label>
                          <select
                            id="category_id"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                            required
                          >
                            <option value="">{t('spareParts.add.selectCategory')}</option>
                            {categories.map((category) => {
                              const displayName = language === 'ar' && category.name_ar 
                                ? category.name_ar 
                                : category.name;
                              return (
                                <option key={category.id} value={category.id}>
                                  {displayName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        
                        
                        {/* Condition */}
                        <div>
                          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.conditionLabel')} *
                          </label>
                          <select
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">{t('spareParts.add.selectCondition')}</option>
                            <option value="new">{t('spareParts.conditions.new')}</option>
                            <option value="used">{t('spareParts.conditions.used')}</option>
                            <option value="refurbished">{t('spareParts.conditions.refurbished')}</option>
                          </select>
                        </div>
                        
                        {/* Part Type */}
                        <div>
                          <label htmlFor="part_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.partTypeLabel')} *
                          </label>
                          <select
                            id="part_type"
                            name="part_type"
                            value={formData.part_type}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">{t('spareParts.add.selectPartType')}</option>
                            <option value="original">{t('spareParts.add.original')}</option>
                            <option value="aftermarket">{t('spareParts.add.aftermarket')}</option>
                          </select>
                        </div>
                        
                        {/* Images */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('spareParts.images')}
                          </label>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg ${image.is_primary ? 'ring-2 ring-qatar-maroon' : ''}`}>
                                  <Image
                                    src={image.url}
                                    alt={`Spare part ${index + 1}`}
                                    width={200}
                                    height={200}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!image.is_primary && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryImage(image.url)}
                                      className="p-1 rounded-full bg-white text-qatar-maroon hover:bg-gray-100"
                                      title={t('spareParts.setAsPrimary')}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(image.url, image.id)}
                                    className="p-1 rounded-full bg-white text-red-600 hover:bg-gray-100"
                                    title={t('common.delete')}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                                {image.is_primary && (
                                  <span className="absolute top-1 left-1 bg-qatar-maroon text-white text-xs px-1.5 py-0.5 rounded">
                                    {t('spareParts.add.primary')}
                                  </span>
                                )}
                              </div>
                            ))}
                            
                            {/* Add Image Button */}
                            <div className="aspect-w-1 aspect-h-1">
                              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg className="mb-2 h-8 w-8 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">{t('spareParts.add.clickToUpload')}</span>
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP</p>
                                </div>
                                <input 
                                  id="image-upload" 
                                  name="image-upload" 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                          </div>
                          {uploading && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {t('common.uploading')}...
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-qatar-maroon px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-qatar-maroon/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qatar-maroon disabled:opacity-50 sm:col-start-2"
                        >
                          {loading ? t('common.saving') : t('common.saveChanges')}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 sm:col-start-1 sm:mt-0"
                          onClick={onClose}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default EditSparePartModal;
