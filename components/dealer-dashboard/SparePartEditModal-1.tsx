'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import browserImageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Re-export types for use in other components
export type Condition = 'new' | 'used' | 'refurbished';
export type PartType = 'original' | 'aftermarket';

export interface SparePartImage {
  id?: string;
  url: string;
  is_primary?: boolean;
  is_main?: boolean;
  isNew?: boolean;
  file?: File;
}

export interface Brand {
  id: number;
  name: string;
  name_ar?: string | null;
}

export interface Model {
  id: number;
  name: string;
  name_ar?: string | null;
  brand_id?: number;
}

export interface Category {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
}

export interface Country {
  id: number;
  name: string;
  name_ar: string | null;
  code: string;
  currency_code?: string;
}

export interface City {
  id: number;
  name: string;
  name_ar: string | null;
  country_id?: number;
}

export interface SparePartFormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  price: string;
  condition: Condition;
  part_type: PartType;
  brand_id: string;
  model_id: string;
  category_id: string;
  city_id: string;
  country_id: string;
  part_number: string;
}

export interface SparePart {
  id: number;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  price: number | string;
  currency?: string;
  condition: Condition;
  part_type: PartType;
  brand_id: number | string;
  model_id?: number | string | null;
  category_id: number | string;
  city_id: number | string;
  country_id: number | string;
  status?: 'pending' | 'approved' | 'rejected' | 'sold' | 'hidden' | 'archived';
  featured?: boolean;
  favorite_count?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  part_number?: string;
  brand?: Brand | string;
  model?: Model | string | null;
  category?: Category | string;
  city?: City | string;
  country?: Country | string;
  images?: SparePartImage[];
}

interface SparePartEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sparePart: SparePart) => void;
  sparePart?: SparePart | null;
  brands: Brand[];
  models: Model[];
  categories: Category[];
  countries: Country[];
  cities: City[];
  selectedCountry: Country | null;
  language: string;
}

export default function SparePartEditModal1({
  isOpen,
  onClose,
  sparePart,
  onSave,
  brands = [],
  models = [],
  categories = [],
  countries = [],
  cities = [],
  selectedCountry,
  language = 'en',
}: SparePartEditModalProps) {
  const { t } = useLanguage();
  const { supabase } = useSupabase();

  // Form state with proper type
  const [formData, setFormData] = useState<SparePartFormData & { currency?: string }>({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    price: '',
    condition: '',
    part_type: '',
    brand_id: '',
    model_id: '',
    category_id: '',
    city_id: '',
    country_id: selectedCountry ? selectedCountry.id.toString() : '',
    part_number: '',
    currency: selectedCountry?.currency_code,
  });

  // Component state - consolidated to avoid duplicates
  const [images, setImages] = useState<SparePartImage[]>([]);
  const [originalImages, setOriginalImages] = useState<SparePartImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  // Initialize form data when sparePart changes
  useEffect(() => {
    if (sparePart) {
      // Initialize form data from sparePart
      setFormData({
        title: sparePart.title || '',
        title_ar: sparePart.title_ar || '',
        description: sparePart.description || '',
        description_ar: sparePart.description_ar || '',
        price: sparePart.price ? String(sparePart.price) : '',
        condition: sparePart.condition || 'new',
        part_type: sparePart.part_type || 'original',
        brand_id: sparePart.brand_id ? String(sparePart.brand_id) : '',
        model_id: sparePart.model_id ? String(sparePart.model_id) : '',
        category_id: sparePart.category_id ? String(sparePart.category_id) : '',
        city_id: sparePart.city_id ? String(sparePart.city_id) : '',
        country_id: sparePart.country_id ? String(sparePart.country_id) : '',
        part_number: sparePart.part_number || '',
      });

      // Initialize images
      if (sparePart.images?.length) {
        const formattedImages = sparePart.images.map(img => ({
          id: img.id || `img-${uuidv4()}`,
          url: img.url,
          is_primary: img.is_primary || false,
          is_main: img.is_main || false,
        }));
        setImages(formattedImages);
        setOriginalImages(formattedImages);
      } else {
        setImages([]);
        setOriginalImages([]);
      }
    } else {
      // Reset form for new spare part
      setFormData({
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        price: '',
        condition: 'new',
        part_type: 'original',
        brand_id: '',
        model_id: '',
        category_id: '',
        city_id: '',
        country_id: '',
        part_number: '',
      });
      setImages([]);
    }
  }, [sparePart, selectedCountry]);

  const [isLoading, setIsLoading] = useState(false);

  // Update filtered models when brand changes
  useEffect(() => {
    if (formData.brand_id) {
      const brandId = Number(formData.brand_id);
      const filtered = models.filter(model => model.brand_id === brandId);
      setFilteredModels(filtered);
      
      // Reset model_id if the current selection is not in the filtered list
      if (formData.model_id && !filtered.some(m => m.id === Number(formData.model_id))) {
        setFormData(prev => ({ ...prev, model_id: '' }));
      }
    } else {
      setFilteredModels([]);
      setFormData(prev => ({ ...prev, model_id: '' }));
    }
  }, [formData.brand_id, formData.model_id, models]);
  
  // Update filtered cities when country changes
  useEffect(() => {
    if (formData.country_id) {
      const countryId = Number(formData.country_id);
      const filtered = cities.filter(city => city.country_id === countryId);
      setFilteredCities(filtered);
      
      // Reset city_id if the current selection is not in the filtered list
      if (formData.city_id && !filtered.some(c => c.id === Number(formData.city_id))) {
        setFormData(prev => ({ ...prev, city_id: '' }));
      }
      
      // Update currency based on selected country
      const selectedCountry = countries.find(c => c.id === countryId);
      if (selectedCountry?.currency_code) {
        setFormData(prev => ({
          ...prev,
          currency: selectedCountry.currency_code
        }));
      }
    } else {
      setFilteredCities([]);
      setFormData(prev => ({
        ...prev,
        city_id: '',
        currency: ''
      }));
    }
  }, [formData.country_id, formData.city_id, cities, countries]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newImages: SparePartImage[] = [];
    
    setIsUploading(true);
    
    try {
      for (const file of files) {
        // Compress image if it's larger than 1MB
        let processedFile = file;
        if (file.size > 1024 * 1024) { // 1MB
          processedFile = await browserImageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        }
        
        // Create a preview URL
        const previewUrl = URL.createObjectURL(processedFile);
        
        newImages.push({
          id: `new-${uuidv4()}`,
          url: previewUrl,
          is_primary: images.length === 0 && newImages.length === 0, // First image is primary by default
          file: processedFile,
          isNew: true,
        });
      }
      
      // Add new images to the existing ones
      setImages(prev => [...prev, ...newImages]);
      
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error(t('spareParts.errors.imageUploadError'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteImage = (index: number) => {
    const imageToDelete = images[index];
    const newImages = images.filter((_, i) => i !== index);
    
    // If we're deleting the primary image and there are other images, set the first one as primary
    if (imageToDelete.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    setImages(newImages);
    
    // Revoke the object URL to avoid memory leaks
    if (imageToDelete.isNew && imageToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.url);
    }
  };
  
  const handleSetPrimary = (index: number) => {
    setImages(prev =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.brand_id || !formData.category_id || !formData.country_id || !formData.city_id) {
      toast.error(t('spareParts.errors.fillRequiredFields'));
      return;
    }
    
    if (images.length === 0) {
      toast.error(t('spareParts.errors.uploadAtLeastOneImage'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Upload new images to storage
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (img.isNew && img.file) {
            const fileExt = img.file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `spare-parts/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('spare-parts')
              .upload(filePath, img.file);
              
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('spare-parts')
              .getPublicUrl(filePath);
              
            return {
              ...img,
              url: publicUrl,
              isNew: false,
            };
          }
          return img;
        })
      );
      
      // 2. Prepare the spare part data
      const sparePartData: Partial<SparePart> = {
        title: formData.title,
        title_ar: formData.title_ar,
        description: formData.description,
        description_ar: formData.description_ar,
        price: Number(formData.price),
        condition: formData.condition,
        part_type: formData.part_type,
        brand_id: Number(formData.brand_id),
        model_id: formData.model_id ? Number(formData.model_id) : null,
        category_id: Number(formData.category_id),
        city_id: Number(formData.city_id),
        country_id: Number(formData.country_id),
        part_number: formData.part_number,
        status: sparePart?.status || 'pending',
      };
      
      let result;
      
      // 3. Create or update the spare part
      if (sparePart) {
        // Update existing spare part
        const { data, error } = await supabase
          .from('spare_parts')
          .update(sparePartData)
          .eq('id', sparePart.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Delete removed images from storage
        const existingImageUrls = sparePart.images?.map(img => img.url) || [];
        const currentImageUrls = uploadedImages.map(img => img.url);
        const imagesToDelete = existingImageUrls.filter(url => !currentImageUrls.includes(url));
        
        if (imagesToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('spare_part_images')
            .delete()
            .in('url', imagesToDelete);
            
          if (deleteError) console.error('Error deleting images:', deleteError);
        }
      } else {
        // Create new spare part
        const { data, error } = await supabase
          .from('spare_parts')
          .insert([sparePartData])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      if (!result) throw new Error('Failed to save spare part');
      
      // 4. Handle images
      const imageRecords = uploadedImages.map((img, index) => ({
        spare_part_id: result.id,
        url: img.url,
        is_primary: img.is_primary || index === 0,
        position: index,
      }));
      
      // First, delete all existing image records for this spare part
      await supabase
        .from('spare_part_images')
        .delete()
        .eq('spare_part_id', result.id);
      
      // Then insert the new image records
      if (imageRecords.length > 0) {
        const { error: imageError } = await supabase
          .from('spare_part_images')
          .insert(imageRecords);
          
        if (imageError) throw imageError;
      }
      
      // 5. Get the updated spare part with all relations
      const { data: updatedSparePart, error: fetchError } = await supabase
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
        .eq('id', result.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // 6. Clean up object URLs
      images.forEach(img => {
        if (img.isNew && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      
      // 7. Call the onSave callback with the updated spare part
      onSave(updatedSparePart);
      
      // 8. Show success message and close the modal
      toast.success(t('spareParts.success.saved'));
      onClose();
      
    } catch (error) {
      console.error('Error saving spare part:', error);
      toast.error(t('spareParts.errors.saveError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCurrencySymbol = () => {
    if (!selectedCountry) return 'QAR';
    return selectedCountry.currency_code || 'QAR';
  };

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
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      {sparePart ? t('spareParts.editSparePart') : t('spareParts.addSparePart')}
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Title - English */}
                        <div className="sm:col-span-2">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.title')} (English) *
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        
                        {/* Title - Arabic */}
                        <div className="sm:col-span-2">
                          <label htmlFor="title_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.title')} (العربية) *
                          </label>
                          <input
                            type="text"
                            name="title_ar"
                            id="title_ar"
                            dir="rtl"
                            value={formData.title_ar}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        
                        {/* Description - English */}
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.description')} (English)
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        
                        {/* Description - Arabic */}
                        <div className="sm:col-span-2">
                          <label htmlFor="description_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.description')} (العربية)
                          </label>
                          <textarea
                            id="description_ar"
                            name="description_ar"
                            dir="rtl"
                            rows={3}
                            value={formData.description_ar}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        
                        {/* Part Number */}
                        <div>
                          <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.partNumber')}
                          </label>
                          <input
                            type="text"
                            name="part_number"
                            id="part_number"
                            value={formData.part_number}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        
                        {/* Price */}
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.price')} *
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">{getCurrencySymbol()}</span>
                            </div>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              min="0"
                              step="0.01"
                              required
                              value={formData.price}
                              onChange={handleInputChange}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Condition */}
                        <div>
                          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.condition')} *
                          </label>
                          <select
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            <option value="new">{t('spareParts.conditions.new')}</option>
                            <option value="used">{t('spareParts.conditions.used')}</option>
                            <option value="refurbished">{t('spareParts.conditions.refurbished')}</option>
                          </select>
                        </div>
                        
                        {/* Part Type */}
                        <div>
                          <label htmlFor="part_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.partType')} *
                          </label>
                          <select
                            id="part_type"
                            name="part_type"
                            value={formData.part_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            <option value="original">{t('spareParts.partTypes.original')}</option>
                            <option value="aftermarket">{t('spareParts.partTypes.aftermarket')}</option>
                          </select>
                        </div>
                        
                        {/* Brand */}
                        <div>
                          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.brand')} *
                          </label>
                          <select
                            id="brand_id"
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            <option value="">{t('spareParts.selectBrand')}</option>
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
                            {t('spareParts.fields.model')}
                          </label>
                          <select
                            id="model_id"
                            name="model_id"
                            value={formData.model_id}
                            onChange={handleInputChange}
                            disabled={!formData.brand_id}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm disabled:opacity-70"
                          >
                            <option value="">{t('spareParts.selectModel')}</option>
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
                            {t('spareParts.fields.category')} *
                          </label>
                          <select
                            id="category_id"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            <option value="">{t('spareParts.selectCategory')}</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {language === 'ar' ? category.name_ar : category.name_en || category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Country */}
                        <div>
                          <label htmlFor="country_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.country')} *
                          </label>
                          <select
                            id="country_id"
                            name="country_id"
                            value={formData.country_id}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            <option value="">{t('spareParts.selectCountry')}</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id}>
                                {language === 'ar' && country.name_ar ? country.name_ar : country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* City */}
                        <div>
                          <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.fields.city')} *
                          </label>
                          <select
                            id="city_id"
                            name="city_id"
                            value={formData.city_id}
                            onChange={handleInputChange}
                            required
                            disabled={!formData.country_id}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm disabled:opacity-70"
                          >
                            <option value="">
                              {!formData.country_id 
                                ? t('spareParts.selectCountryFirst') 
                                : t('spareParts.selectCity')}
                            </option>
                            {filteredCities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {language === 'ar' && city.name_ar ? city.name_ar : city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Images */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('spareParts.fields.images')} *
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              ({t('spareParts.images.primaryHint')})
                            </span>
                          </label>
                          
                          {/* Image upload area */}
                          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 pt-5 pb-6">
                            <div className="space-y-1 text-center">
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600 dark:text-gray-300">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
                                >
                                  <span>{t('spareParts.images.upload')}</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading || isLoading}
                                  />
                                </label>
                                <p className="pl-1">
                                  {t('spareParts.images.dragAndDrop')}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('spareParts.images.supportedFormats')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Image preview grid */}
                          {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {images.map((image, index) => (
                                <div key={image.id || index} className="relative group">
                                  <div className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg ${image.is_primary ? 'ring-2 ring-indigo-500' : ''}`}>
                                    <Image
                                      src={image.url}
                                      alt={`Spare part image ${index + 1}`}
                                      width={200}
                                      height={200}
                                      className="h-full w-full object-cover object-center"
                                      onLoad={() => {}}
                                      onError={() => {}}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSetPrimary(index)}
                                          className="rounded-full bg-white p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                          title={t('spareParts.images.setAsPrimary')}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteImage(index)}
                                          className="rounded-full bg-white p-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                          title={t('common.delete')}
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {image.is_primary && (
                                    <span className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                                      {t('spareParts.images.primary')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Form actions */}
                      <div className="mt-8 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={isLoading}
                          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || isUploading}
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              {t('common.saving')}...
                            </>
                          ) : (
                            t('common.save')
                          )}
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
