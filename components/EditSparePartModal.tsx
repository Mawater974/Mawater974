'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useLanguage } from '@/contexts/LanguageContext';
import imageCompression from 'browser-image-compression';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCountry } from '@/contexts/CountryContext';
import toast from 'react-hot-toast';
import { SimpleImage } from '@/components/SimpleImage';

interface SparePartImage {
  id: string;
  url: string;
  is_primary: boolean;
  isNew?: boolean;
  file?: File;
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
    country_id?: number;
  };
  country?: {
    id: number;
    name: string;
    name_ar: string | null;
    currency_code?: string;
    code?: string;
  };
}

interface EditSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart?: SparePart | null;
  onUpdate: () => void;
  onEditComplete?: (updatedSparePart: SparePart) => void; // Made optional
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
  onEditComplete = () => {} // Default empty function
}: EditSparePartModalProps): JSX.Element | null => {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<SparePartImage[]>([]);
  const [originalImages, setOriginalImages] = useState<SparePartImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const { currentCountry } = useCountry();
  
  // State for dropdown options
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [models, setModels] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filteredModels, setFilteredModels] = useState<DropdownOption[]>([]);
  
const [formData, setFormData] = useState({
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

  // Helper function to safely get the first part of a URL path
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (e) {
      // If URL parsing fails, try to extract filename from path
      const pathParts = url.split('/');
      return pathParts[pathParts.length - 1].split('?')[0]; // Remove query params if any
    }
  };

  // Handle country change
  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    
    // Update form data immediately to show loading state
    setFormData(prev => ({ ...prev, country_id: countryId, city_id: '' }));

    if (countryId) {
      try {
        // Fetch cities for the selected country
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, name_ar')
          .eq('country_id', Number(countryId))
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        // Update cities and keep the form data in sync
        setCities(data || []);
        
        // If there's only one city, select it automatically
        if (data && data.length === 1) {
          setFormData(prev => ({
            ...prev,
            city_id: String(data[0].id)
          }));
        }
      } catch (error) {
        console.error('Error loading cities:', error);
        toast.error(t('common.errorLoadingCities'));
        setCities([]);
      }
    } else {
      setCities([]);
    }
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
        
        // Fetch all countries
        const { data: countriesData } = await supabase
          .from('countries')
          .select('id, name, name_ar, code')
          .order('name', { ascending: true });
        
        setCountries((countriesData || []).map(c => ({
          id: c.id,
          name: c.name,
          name_ar: c.name_ar,
          code: c.code
        })));
        
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
        
        // Load cities for the spare part's country
        const countryId = sparePart?.country_id || currentCountry?.id;
        if (countryId) {
          const { data: citiesData } = await supabase
            .from('cities')
            .select('id, name, name_ar')
            .eq('country_id', Number(countryId))
            .order('name', { ascending: true });
          
          setCities((citiesData || []).map(c => ({
            id: c.id,
            name: c.name,
            name_ar: c.name_ar
          })));
        } else if (currentCountry) {
          // Fallback to current country if no country is set on the spare part
          const { data: citiesData } = await supabase
            .from('cities')
            .select('id, name, name_ar')
            .eq('country_id', currentCountry.id)
            .order('name', { ascending: true });
          
          setCities((citiesData || []).map(c => ({
            id: c.id,
            name: c.name,
            name_ar: c.name_ar
          })));
        }
        
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
  }, [isOpen, supabase, t, sparePart, currentCountry]);
  
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
    
    // Initialize form data
    setFormData({
      title: sparePart.title || '',
      name_ar: sparePart.name_ar || '',
      description: sparePart.description || '',
      description_ar: sparePart.description_ar || '',
      price: sparePart.price ? String(sparePart.price) : '',
      condition: sparePart.condition || '',
      part_type: sparePart.part_type || '',
      brand_id: sparePart.brand_id ? String(sparePart.brand_id) : '',
      model_id: sparePart.model_id ? String(sparePart.model_id) : '',
      category_id: sparePart.category_id ? String(sparePart.category_id) : '',
      city_id: sparePart.city_id ? String(sparePart.city_id) : '',
      country_id: sparePart.country_id ? String(sparePart.country_id) : '',
    });
    
    // Initialize images with debug logging
    console.log('Initializing images from sparePart:', sparePart.images);
    
    if (sparePart.images && sparePart.images.length > 0) {
      // Convert all images to the correct format and sort them so primary is first
      const formattedImages = sparePart.images
        .map((img: any) => ({
          id: img.id || `img-${Math.random().toString(36).substr(2, 9)}`,
          url: typeof img === 'string' ? img : img.url,
          is_primary: typeof img === 'string' ? false : img.is_primary || false,
          isNew: false
        }))
        // Sort to ensure primary image is always first
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      
      console.log('Formatted images:', formattedImages);
      setImages(formattedImages);
      setOriginalImages([...formattedImages]);
    } else {
      console.log('No images found or invalid images format');
      setImages([]);
      setOriginalImages([]);
    }
    
    // First, ensure we have all the related data in our dropdowns
    const updateDropdowns = async () => {
      const updatedBrands = [...brands];
      const updatedCategories = [...categories];
      
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
      
      // Get the country ID from spare part or current country
      const countryId = sparePart.country_id || 
                       (sparePart.country ? sparePart.country.id : null);
      
      // If we have a country ID, ensure it's in the countries list and load its cities
      if (countryId) {
        // Add country if not in the list
        if (sparePart.country && !countries.some(c => c.id === sparePart.country?.id)) {
          setCountries(prev => [...prev, {
            id: sparePart.country!.id,
            name: sparePart.country!.name,
            name_ar: sparePart.country!.name_ar || null,
            code: sparePart.country!.code || ''
          }]);
        }
        
        // Always fetch cities for the country, even if we have some in state
        const { data: citiesData } = await supabase
          .from('cities')
          .select('id, name, name_ar')
          .eq('country_id', countryId)
          .order('name', { ascending: true });
        
        // Merge with any existing cities to avoid losing them
        setCities(prevCities => {
          const existingCityIds = new Set(prevCities.map(c => c.id));
          const newCities = citiesData?.filter(city => !existingCityIds.has(city.id)) || [];
          return [...prevCities, ...newCities];
        });
      }
      
      // Update brands and categories
      setBrands(updatedBrands);
      setCategories(updatedCategories);
      
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
    
    updateDropdowns();
  }, [sparePart, currentCountry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSetPrimary = async (index: number) => {
    if (!supabase || !sparePart?.id) {
      console.error('Missing supabase client or spare part ID');
      toast.error(t('common.error'));
      return;
    }
    
    setLoading(true);
    try {
      // Create a new array with the selected image moved to the first position
      const newImages = [...images];
      if (index === 0) {
        setLoading(false);
        return;
      }
      
      const [movedImage] = newImages.splice(index, 1);
      newImages.unshift(movedImage);

      // Update local state immediately for better UX
      const updatedImages = newImages.map((img, idx) => ({
        ...img,
        is_primary: idx === 0 // First image is always primary
      }));
      
      setImages(updatedImages);

      // Update the database to reflect the primary image change
      if (movedImage.id) {
        // First, unset all primary flags
        await supabase
          .from('spare_part_images')
          .update({ is_primary: false })
          .eq('spare_part_id', sparePart.id);

        // Then set the selected image as primary
        await supabase
          .from('spare_part_images')
          .update({ is_primary: true })
          .eq('id', movedImage.id);
      }

      toast.success(t('spareParts.images.primaryUpdated'));
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error(t('common.error'));
      // Revert to previous state on error
      setImages(images);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (imageIdOrUrl: string) => {
    if (!supabase || !sparePart?.id) {
      console.error('Missing supabase client or spare part ID');
      return;
    }

    // Find the image by URL or ID
    const imageToDelete = images.find(img => 
      img.url === imageIdOrUrl || img.id === imageIdOrUrl || img.url.includes(imageIdOrUrl)
    );
    
    if (!imageToDelete) {
      console.error('Image not found in state:', imageIdOrUrl);
      return;
    }

    try {
      // If it's a new unsaved image, just remove from state
      if (imageToDelete.isNew) {
        setImages(prev => {
          const updated = prev.filter(img => img.url !== imageToDelete.url);
          // If we deleted the primary image and there are other images, set a new primary
          if (imageToDelete.is_primary && updated.length > 0) {
            updated[0].is_primary = true;
          }
          return updated;
        });
        
        // Clean up blob URL
        if (imageToDelete.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageToDelete.url);
        }
        return;
      }

      // For existing images, use the full delete handler with the image object
      await handleDeleteImage(imageToDelete);
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(t('spareParts.images.deleteError'));
    }
  };

  const handleDeleteImage = async (imageToDelete: SparePartImage) => {
    if (!imageToDelete) {
      console.error('No image provided for deletion');
      return;
    }
    
    if (!supabase || !sparePart?.id) {
      console.error('Missing required parameters for delete - supabase:', !!supabase, 'sparePart.id:', sparePart?.id);
      return;
    }
    
    console.log('Starting image deletion for URL:', imageToDelete.url);
    setLoading(true);
    
    // Store the current images for potential rollback
    const currentImages = [...images];
    let wasPrimary = imageToDelete.is_primary;
    
    try {
      // For blob URLs, just remove from state and clean up
      if (imageToDelete.url.startsWith('blob:')) {
        console.log('Removing blob URL:', imageToDelete.url);
        setImages(prev => {
          const updated = prev.filter(img => img.url !== imageToDelete.url);
          // If we deleted the primary image and there are other images, set a new primary
          if (wasPrimary && updated.length > 0) {
            updated[0].is_primary = true;
          }
          return updated;
        });
        URL.revokeObjectURL(imageToDelete.url);
        return;
      }
      
      // For storage URLs, handle database and storage deletion
      if (imageToDelete.url.includes('spare-parts/')) {
        // Extract file path from URL
        const urlParts = imageToDelete.url.split('spare-parts/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]; // Remove query params if any
          console.log('Deleting from storage:', filePath);
          
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('spare-parts')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Storage deletion error:', storageError);
            toast.error(t('spareParts.images.storageDeletionError'));
          } else {
            console.log('Successfully deleted from storage');
          }
        }
      }
      
      // Delete from database if it has a valid ID
      if (imageToDelete.id && !imageToDelete.id.startsWith('new-')) {
        console.log('Attempting to delete from spare_part_images:', {
          imageId: imageToDelete.id,
          sparePartId: sparePart.id
        });

        const { error: deleteError } = await supabase
          .from('spare_part_images')
          .delete()
          .eq('id', imageToDelete.id);

        if (deleteError) {
          console.error('Error deleting from spare_part_images:', deleteError);
          throw deleteError;
        }
        
        console.log('Successfully deleted from spare_part_images table');
      }
      
      // Update local state
      setImages(prev => {
        const updated = prev.filter(img => img.id !== imageToDelete.id);
        
        // If we deleted the primary image and there are other images, set a new primary
        if (wasPrimary && updated.length > 0) {
          updated[0].is_primary = true;
          
          // Update the new primary in the database if it's not a new image
          if (updated[0].id && !updated[0].id.startsWith('new-')) {
            supabase
              .from('spare_part_images')
              .update({ is_primary: true })
              .eq('id', updated[0].id)
              .then(({ error }) => {
                if (error) console.error('Error updating primary image:', error);
              });
          }
        }
        
        return updated;
      });
      
      toast.success(t('spareParts.images.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('spareParts.images.deleteError'));
      
      // Revert state on error
      setImages(currentImages);
    }
  };

  // Convert HEIC/HEIF to JPEG if needed
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    if (!file.type.match(/heic|heif/i)) return file;
    
    try {
      const heic2any = (await import('heic2any')).default;
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      }) as Blob;
      
      return new File([jpegBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: new Date().getTime()
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      return file; // Return original if conversion fails
    }
  };

  // Compress image with better quality settings
  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1.0, // Maximum file size in MB
        maxWidthOrHeight: 1600, // Maximum width or height
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.8, // Higher quality
        maxIteration: 15, // More iterations for better quality
        alwaysKeepResolution: true
      };
      
      const compressedFile = await imageCompression(file, options);
      return new File([compressedFile], file.name, {
        type: 'image/jpeg',
        lastModified: new Date().getTime()
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original if compression fails
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !sparePart?.id) return;

    setUploading(true);

    try {
      // Process each file upload in parallel
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Convert HEIC/HEIF to JPEG first if needed
          const convertedFile = await convertHeicToJpeg(file);
          
          // Compress the image
          const compressedFile = await compressImage(convertedFile);
          
          // Generate a unique path for the file
          const fileExt = 'jpg'; // Always use jpg after conversion/compression
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${sparePart.id}/${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('spare-parts')
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('spare-parts')
            .getPublicUrl(filePath);

          return {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: publicUrl,
            is_primary: images.length === 0, // Mark as primary if it's the first image
            isNew: true,
            file: compressedFile
          };
        } catch (error) {
          console.error('Error processing image:', error);
          throw error;
        }
      });

      // Wait for all uploads to complete
      const newImageFiles = await Promise.all(uploadPromises);

      // Update state with new images
      setImages(prev => {
        const isFirstUpload = prev.length === 0;
        const updatedImages = [...prev, ...newImageFiles];

        // If these are the first images, make sure the first one is primary
        if (isFirstUpload && updatedImages.length > 0) {
          updatedImages[0].is_primary = true;
        }

        return updatedImages;
      });

    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t('spareParts.images.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!sparePart) {
    toast.error(t('common.missingRequiredFields'));
    return;
  }
  
  setLoading(true);

  try {
    // Ensure at least one image is marked as primary
    const hasPrimaryImage = images.some(img => img.is_primary);
    if (images.length > 0 && !hasPrimaryImage) {
      images[0].is_primary = true;
    }

    // 1. Update the spare part basic info
    const updateData: any = {
      title: formData.title,
      name_ar: formData.name_ar || null,
      description: formData.description || null,
      description_ar: formData.description_ar || null,
      price: parseFloat(formData.price) || 0,
      condition: formData.condition,
      part_type: formData.part_type,
      brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
      model_id: formData.model_id ? parseInt(formData.model_id) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      city_id: formData.city_id ? parseInt(formData.city_id) : null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('spare_parts')
      .update(updateData)
      .eq('id', sparePart.id);
      
    if (updateError) {
      console.error('Error updating spare part:', updateError);
      throw updateError;
    }
    
    // 2. Handle images
    const currentImages: SparePartImage[] = [...images];
    const originalImageUrls: string[] = originalImages.map(img => img.url);
    
    // 2.1. Identify new, existing, and removed images
    const newImages: SparePartImage[] = currentImages.filter(img => !originalImageUrls.includes(img.url));
    const existingImages: SparePartImage[] = currentImages.filter(img => 
      originalImages.some(oi => oi.url === img.url)
    );
    const removedImages: SparePartImage[] = originalImages.filter(img => 
      !currentImages.some(ci => ci.url === img.url)
    );

    // 2.2. Insert new images
    const insertedImages = await Promise.all(
      newImages.map(async (img) => {
        console.log('Inserting new image:', img);
        const { data, error: insertError } = await supabase
          .from('spare_part_images')
          .insert([{
            spare_part_id: sparePart.id,
            url: img.url,
            is_primary: img.is_primary
          }])
          .select('*')
          .single();
          
        if (insertError) {
          console.error('Error inserting image:', insertError);
          throw insertError;
        }
        
        console.log('Successfully inserted image:', data);
        // Ensure the returned data matches SparePartImage type
        const insertedImage = data as { id: string; url: string; is_primary: boolean };
        return {
          id: insertedImage.id,
          url: insertedImage.url,
          is_primary: insertedImage.is_primary
        };
      })
    );
    
    // 2.3. Update existing images (primary status)
    await Promise.all(
      existingImages.map(async (img) => {
        // Only update if the image has an ID (it's in the database)
        if (img.id && !img.id.startsWith('new-')) { // Skip temporary IDs
          // First, unset any existing primary images if this one is being set as primary
          if (img.is_primary) {
            await supabase
              .from('spare_part_images')
              .update({ is_primary: false })
              .eq('spare_part_id', sparePart.id)
              .neq('id', img.id);
          }
          
          // Then update this image's status
          const { error: updateError } = await supabase
            .from('spare_part_images')
            .update({ is_primary: img.is_primary })
            .eq('id', img.id);
            
          if (updateError) throw updateError;
        }
      })
    );
    
    // 2.4. Delete removed images
    await Promise.all(
      removedImages.map(async (img) => {
        // Delete from storage if it's a new image that was uploaded but not saved
        if (img.url.includes('spare-parts/') && !img.id) {
          const filePath = img.url.split('spare-parts/')[1].split('?')[0];
          await supabase.storage
            .from('spare-parts')
            .remove([filePath]);
        }
        
        // Delete from database if it has an ID
        if (img.id) {
          await supabase
            .from('spare_part_images')
            .delete()
            .eq('id', img.id);
            
          // Also delete from storage if it exists there
          if (img.url.includes('spare-parts/')) {
            const filePath = img.url.split('spare-parts/')[1].split('?')[0];
            await supabase.storage
              .from('spare-parts')
              .remove([filePath]);
          }
        }
      })
    );
    
    // 3. Ensure we have exactly one primary image
    const allImages = [...existingImages, ...insertedImages];
    const primaryImages = allImages.filter(img => img.is_primary);
    
    // If no primary image is set or multiple are set, fix it
    if (primaryImages.length !== 1) {
      // Find the first valid image to set as primary
      const imageToSetAsPrimary = allImages[0];
      
      if (imageToSetAsPrimary) {
        // First, unset all primary flags
        await supabase
          .from('spare_part_images')
          .update({ is_primary: false })
          .eq('spare_part_id', sparePart.id);
        
        // Then set the selected image as primary
        if (imageToSetAsPrimary.id && !imageToSetAsPrimary.id.startsWith('new-')) {
          await supabase
            .from('spare_part_images')
            .update({ is_primary: true })
            .eq('id', imageToSetAsPrimary.id);
        }
        
        // Update local state to reflect the change
        setImages(prev => 
          prev.map(img => ({
            ...img,
            is_primary: img.url === imageToSetAsPrimary.url
          }))
        );
      }
    }
    
    // 4. Fetch the complete updated spare part with all related data
    const { data: completeSparePart, error: fetchError } = await supabase
      .from('spare_parts')
      .select(`
        *,
        brand:brands(*),
        model:models(*),
        category:spare_part_categories(*),
        city:cities(*),
        ${formData.country_id ? 'country:countries(*),' : ''}
    images:spare_part_images!inner(
      *,
      spare_part_id
    ).order('is_primary', { ascending: false })
      `)
      .eq('id', sparePart.id)
      .single<SparePart>();
      
    if (fetchError) {
      console.error('Error fetching updated spare part:', fetchError);
      throw fetchError;
    }
    
    if (!completeSparePart) {
      throw new Error('Failed to fetch updated spare part data');
    }
    
    // Process images to ensure consistent format
    const processedSparePart: SparePart = {
      ...completeSparePart,
      images: Array.isArray(completeSparePart.images) 
        ? completeSparePart.images.map(img => ({
            id: img.id || '',
            url: img.url || '',
            is_primary: Boolean(img.is_primary),
            created_at: img.created_at || new Date().toISOString(),
            spare_part_id: img.spare_part_id || sparePart.id
          }))
        : []
    };
    
    // 5. Update UI and close modal
    toast.success(t('common.changesSaved'));
    onUpdate();
    
    // Call onEditComplete with processed data if it's a function
    if (typeof onEditComplete === 'function') {
      onEditComplete(processedSparePart);
    }
    
    onClose();
    
  } catch (error) {
    console.error('Error updating spare part:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating spare part';
    toast.error(t('common.errorSavingChanges') + ': ' + errorMessage);
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1 text-right"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1 text-right"
                            />
                          </div>
                        </div>
                        

                              {/* Country */}
                      {/*  <div>
                          <label htmlFor="country_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('spareParts.add.countryLabel')} *
                          </label>
                          <select
                            id="country_id"
                            name="country_id"
                            value={formData.country_id || (currentCountry?.id ? String(currentCountry.id) : '')}
                            onChange={handleCountryChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
                            required
                          >
                            <option value="">{t('spareParts.add.selectCountry')}</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id}>
                                {language === 'ar' && country.name_ar ? country.name_ar : country.name}
                              </option>
                            ))}
                          </select>
                        </div>*/}
                        
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
                            required
                            disabled={!formData.country_id && !cities.length}
                          >
                            <option value="">
                              {!formData.country_id ? t('spareParts.add.selectCountryFirst') : t('spareParts.add.selectCity')}
                            </option>
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
                            {t('spareParts.add.brandLabel')}
                          </label>
                          <select
                            id="brand_id"
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
                            
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                        
                        {/* Price */}
                        <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('spareParts.add.priceLabel')} ({sparePart?.country?.currency_code}) *
                        </label>
                        <div className="relative rounded-md shadow-sm"> 
                                  <input
                            type="number"
                            id="price"
                            name="price"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1`}
                            placeholder="0.00"
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                                  />
                                </div>
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white mt-1"
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
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
                            {images.map((image, index) => (
  <div 
    key={image.url} 
    className="relative"
    onClick={(e) => e.stopPropagation()}
  >
    <SimpleImage
      id={image.url}
      index={index}
      preview={image.url}
      isMain={image.is_primary}
      onRemove={handleRemoveImage}
      onSetMain={handleSetPrimary}
      t={t}
    />
  </div>
))}
                            {/* Add Image Button */}
                            <div className="aspect-[4/3] w-full">
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
                                  multiple
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
