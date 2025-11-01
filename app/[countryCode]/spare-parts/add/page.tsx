'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import LoginPopup from '@/components/LoginPopup';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { SimpleImage } from '@/components/SimpleImage';
import { Trash2, Upload, Image as ImageIcon, Star, Check, Loader2 } from 'lucide-react';

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, isPrimary: boolean, id: string, preview: string}[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  
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

  // Form data state
  const [formData, setFormData] = useState<FormData>({
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
  });

  // Fetch initial data
  // Scroll to top when form is submitted
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

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

  // Supported image MIME types
  const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/avif',
    'image/apng',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
    'image/x-heic',
    'image/x-heif'
  ];

  // Get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
      'image/apng': 'apng',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/heic-sequence': 'heic',
      'image/heif-sequence': 'heif',
      'image/x-heic': 'heic',
      'image/x-heif': 'heif'
    };
    return extensionMap[mimeType.toLowerCase()] || 'jpg';
  };

  // Convert HEIC/HEIF to JPEG for better compatibility
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      }) as Blob;
      
      return new File(
        [jpegBlob],
        file.name.replace(/\.[^/.]+$/, '.jpg'),
        { type: 'image/jpeg', lastModified: Date.now() }
      );
    } catch (error) {
      console.error('Error converting HEIC/HEIF to JPEG:', error);
      return file; // Return original if conversion fails
    }
  };

  // Compress image with optimized settings
  const compressImage = async (file: File): Promise<File> => {
    const fileType = file.type.toLowerCase();
    
    // Skip non-image files or unsupported image types
    if (!fileType.startsWith('image/') || !SUPPORTED_IMAGE_TYPES.includes(fileType)) {
      console.warn(`Unsupported file type: ${fileType}. File will be uploaded as-is.`);
      return file;
    }
    
    // Convert HEIC/HEIF to JPEG first
    let processedFile = file;
    if (fileType.includes('heic') || fileType.includes('heif')) {
      processedFile = await convertHeicToJpeg(file);
    }

    try {
      const options = {
        // Standard compression for spare parts listings
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        maxIteration: 15,
        fileType: 'image/webp', // Convert to WebP for better compression (except SVGs)
        initialQuality: 0.90,
        alwaysKeepResolution: true,
        onProgress: (progress: number) => {
          console.log(`Image compression progress: ${Math.round(progress)}%`);
        },
        preserveExif: false,
      };
      
      console.log('Original file name:', file.name);
      console.log('Original file type:', file.type);
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      const compressedBlob = await imageCompression(processedFile, options) as Blob;
      
      // Determine output format (convert all to webp for better compression, except for SVG)
      const outputFormat = fileType === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
      const extension = getFileExtension(outputFormat);
      
      // Create a new File object with the correct MIME type and extension
      const compressedFile = new File(
        [compressedBlob],
        `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`, // Preserve original name, update extension
        { 
          type: outputFormat,
          lastModified: Date.now()
        }
      );
      
      console.log('Compressed file type:', compressedFile.type);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compression ratio:', ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%');
      
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      // In case of error, return the original file
      return file;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    // Check number of files
    if (files.length + selectedFiles.length > 10) {
      toast.error(t('spareParts.add.maxImagesError', { max: 10 }));
      setIsUploading(false);
      return;
    }
    
    try {
      // Process files in parallel
      const processFiles = files.map(async (file, i) => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Skip non-image files
        if (!file.type.startsWith('image/')) {
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
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(fileToProcess);
        objectUrls.current.add(previewUrl);
        
        return { 
          file: fileToProcess, 
          isPrimary: false, // Will be set based on position
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          preview: previewUrl
        };
      });
      
      const processedFiles = (await Promise.all(processFiles)).filter(Boolean) as {file: File, isPrimary: boolean, id: string, preview: string}[];
      
      if (processedFiles.length > 0) {
        setSelectedFiles(prev => {
          const newFiles = [...prev, ...processedFiles];
          // Always make the first photo the primary photo
          return newFiles.map((file, i) => ({
            ...file,
            isPrimary: i === 0
          }));
        });
        
        // Create preview URLs
        const newPreviewUrls = processedFiles.map(({preview}) => preview);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(t('spareParts.add.uploadError'));
    } finally {
      setIsUploading(false);
      // Reset the file input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(selectedFiles[index].preview);
    objectUrls.current.delete(selectedFiles[index].preview);

    // Update both states
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // If we removed the primary image and there are other images, make the first remaining one primary
      if (prev[index]?.isPrimary && newFiles.length > 0) {
        newFiles[0].isPrimary = true;
      }
      return newFiles;
    });
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const setPrimaryImage = (index: number) => {
    // Update the primary status without reordering
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
      
      setIsSubmitted(true);
      
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">
                  {t('spareParts.add.messages.submitted')}
                </h3>
                <div className="mt-8 space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">  
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                          {t('spareParts.add.messages.review')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Link
                      href="/my-ads"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      {t('spareParts.add.messages.viewListings')}
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      {t('spareParts.add.messages.returnHome')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <LoginPopup />
      </div>
    );
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
                  {/*<div className="mt-1 flex items-center">
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
                  </div>*/}  
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
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Loader2 className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('spareParts.add.uploading')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{t('spareParts.add.clickToUpload')}</span> {t('spareParts.add.orDragDrop')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('spareParts.add.imageRequirements')}
                      </p>
                    </div>
                  )}
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              {/* Image previews */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
                  {selectedFiles.map((file, index) => (
                    <SimpleImage
                      key={file.id}
                      id={file.id}
                      index={index}
                      preview={file.preview}
                      isMain={file.isPrimary}
                      onRemove={(id) => {
                        const removeIndex = selectedFiles.findIndex(f => f.id === id);
                        removeImage(removeIndex);
                      }}
                      onSetMain={(index) => setPrimaryImage(index)}
                      t={t}
                    />
                  ))}
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
