import { Fragment, useEffect, useState, useRef, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ImageCarousel from './ImageCarousel';
import ImageUpload from './ImageUpload';
import Image from 'next/image';
import { DraggableImage } from './DraggableImage';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { ImageFile } from '@/types/image';
import { scrollToTop } from '@/utils/scrollToTop';

interface CarImage {
  url: string;
  is_main?: boolean;
}

interface Car {
  id: number;
  brand_id?: string | number;
  model_id?: string | number;
  year?: number;
  mileage?: string | number;
  price?: string | number;
  color?: string;
  description?: string;
  fuel_type?: string;
  gearbox_type?: string;
  body_type?: string;
  condition?: string;
  cylinders?: string;
  doors?: string;
  drive_type?: string;
  warranty?: string;
  exact_model?: string;
  city_id?: string | number;
  is_featured?: boolean;
  images?: Array<{ url: string; is_main?: boolean } | string>;
  country?: {
    currency_code?: string;
  };
  city?: {
    id: number;
    name: string;
    name_ar: string | null;
    country_id: number;
  };
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
}

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
  onUpdate: () => void;
  onEditComplete: (updatedCar: any) => void;
}

interface FormData {
  brand_id: string;
  model_id: string;
  year: number;
  mileage: string;
  price: string;
  color: string;
  description: string;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  cylinders: string;
  doors: string;
  drive_type: string;
  warranty: string;
  exact_model: string;
  city_id: string;
  is_featured: boolean;
}

const EditCarModal = ({ isOpen, onClose, car, onUpdate, onEditComplete }: EditCarModalProps): JSX.Element | null => {
  // Don't render anything if car is not provided
  if (!car) return null;
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  // State for form data and UI
  const [selectedCountry, setSelectedCountry] = useState<string | number | null>(null);
  const [cities, setCities] = useState<Array<{ id: number; name: string; name_ar: string | null; country_id: number }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string; name_ar: string | null }>>([]);
  const [models, setModels] = useState<Array<{ id: number; name: string; name_ar: string | null; brand_id: number }>>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string; name_ar: string | null; code: string; currency_code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<CarImage[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number | null>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    brand_id: '',
    model_id: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    color: '',
    description: '',
    fuel_type: '',
    gearbox_type: '',
    body_type: '',
    condition: '',
    cylinders: '',
    doors: '',
    drive_type: '',
    warranty: '',
    exact_model: '',
    city_id: '',
    is_featured: false,
  });

  // Helper function to safely convert values to strings for form fields
  const safeString = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };
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
        maxSizeMB: 1.0,
        maxWidthOrHeight: 2560,
        useWebWorker: true,
        maxIteration: 15,
        fileType: 'image/webp',
        initialQuality: 0.95,
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
        `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`,
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

  // Initialize form data and images when car changes
  useEffect(() => {
    if (!car) return;
    
    // Reset form when car is null/undefined
    setFormData({
      brand_id: safeString(car.brand_id),
      model_id: safeString(car.model_id),
      year: car.year || new Date().getFullYear(),
      mileage: safeString(car.mileage),
      price: safeString(car.price),
      color: car.color || '',
      description: car.description || '',
      
      fuel_type: car.fuel_type || '',
      gearbox_type: car.gearbox_type || '',
      body_type: car.body_type || '',
      condition: car.condition || '',
      cylinders: car.cylinders || '',
      doors: car.doors || '',
      drive_type: car.drive_type || '',
      warranty: car.warranty || '',
      exact_model: car.exact_model || '',
      city_id: safeString(car.city_id),
      is_featured: car.is_featured || false,
    });
    
    // Set initial images
    if (Array.isArray(car.images)) {
      setImages(car.images.map(img => ({
        url: typeof img === 'string' ? img : img?.url || '',
        is_main: typeof img === 'string' ? false : Boolean(img?.is_main)
      })));

      // Initialize image files for existing images
      const initialImageFiles = car.images.map((img, index) => ({
        preview: typeof img === 'string' ? img : img?.url || '',
        isMain: typeof img === 'string' ? false : Boolean(img?.is_main),
        id: `existing-${index}`,
        type: 'existing' as const,
        raw: new File([], 'temp.jpg', { type: 'image/jpeg' }),
        name: `image-${index}.jpg`,
        size: 0,
        lastModified: Date.now()
      }));
      setImageFiles(initialImageFiles);

      // Set main photo index (always 0)
      const mainIndex = initialImageFiles.findIndex(img => img.isMain);
      setMainPhotoIndex(mainIndex >= 0 ? mainIndex : (initialImageFiles.length > 0 ? 0 : null));
    } else {
      setImages([]);
      setImageFiles([]);
      setMainPhotoIndex(null);
    }

    // Initialize form data
    setFormData({
      brand_id: safeString(car.brand_id),
      model_id: safeString(car.model_id),
      year: car.year || new Date().getFullYear(),
      mileage: safeString(car.mileage),
      price: safeString(car.price),
      color: car.color || '',
      description: car.description || '',
      fuel_type: car.fuel_type || '',
      gearbox_type: car.gearbox_type || '',
      body_type: car.body_type || '',
      condition: car.condition || '',
      cylinders: car.cylinders || '',
      doors: car.doors || '',
      drive_type: car.drive_type || '',
      warranty: car.warranty || '',
      exact_model: car.exact_model || '',
      city_id: safeString(car.city_id),
      is_featured: car.is_featured || false,
    });

    // Initialize images
    const initialImages = Array.isArray(car.images) 
      ? car.images.map((img) => ({
          url: typeof img === 'string' ? img : img?.url || '',
          is_main: typeof img === 'string' ? false : Boolean(img?.is_main)
        }))
      : [];
    setImages(initialImages);
  }, [car]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!car) return;
      
      setLoading(true);
      try {
        // Fetch brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        setBrands(brandsData || []);

        // Fetch countries
        const { data: countriesData } = await supabase
          .from('countries')
          .select('*')
          .order('name');
        setCountries(countriesData || []);

        // If we have city data with country_id, use that
        if (car.city?.country_id) {
          setSelectedCountry(car.city.country_id);
          
          // Fetch cities for the car's country
          const { data: citiesData } = await supabase
            .from('cities')
            .select('*')
            .eq('country_id', car.city.country_id)
            .order('name');
          setCities(citiesData || []);
        } 
        // If we only have city_id, fetch the city first to get country_id
        else if (car.city_id) {
          const { data: cityData } = await supabase
            .from('cities')
            .select('*')
            .eq('id', car.city_id)
            .single();
            
          if (cityData) {
            setSelectedCountry(cityData.country_id);
            
            // Fetch cities for the country
            const { data: citiesData } = await supabase
              .from('cities')
              .select('*')
              .eq('country_id', cityData.country_id)
              .order('name');
            setCities(citiesData || []);
          }
        }

        // If we have a brand_id, fetch models
        if (car.brand?.id) {
          const { data: modelsData } = await supabase
            .from('models')
            .select('*')
            .eq('brand_id', car.brand.id)
            .order('name');
          setModels(modelsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [car, supabase, t]);

  // Ensure main photo index is always 0 when images are present
  useEffect(() => {
    if (images.length > 0 && mainPhotoIndex !== 0) {
      setMainPhotoIndex(0);
    }
  }, [images.length, mainPhotoIndex]);

  // Handle country change
  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);
    setFormData(prev => ({ ...prev, city_id: '' }));

    if (countryId) {
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('country_id', Number(countryId))
        .order('name');
      setCities(data || []);
    } else {
      setCities([]);
    }
  };

  // Fetch models when brand changes
  useEffect(() => {
    if (formData.brand_id) {
      fetchModels(parseInt(formData.brand_id));
    }
  }, [formData.brand_id]);

  // Fetch models
  const fetchModels = async (brandId: number) => {
    try {
      const { data } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  // Handle brand change
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setFormData(prev => ({ ...prev, brand_id: brandId, model_id: '' }));

    if (brandId) {
      const { data } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', Number(brandId))
        .order('name');
      setModels(data || []);
    } else {
      setModels([]);
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: File[]): Promise<void> => {
    if (!car) return;

    setUploading(true);
    try {
      const uploadedImages: CarImage[] = [];

      for (const file of files) {
        // Compress the image first
        const compressedFile = await compressImage(file);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `cars/${car.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        uploadedImages.push({
          url: publicUrl,
          is_main: images.length === 0 // Set as main only if no other images exist
        });
      }

      setImages(prev => [...prev, ...uploadedImages]);

      // Update image files for new uploads
      const newImageFiles = files.map((file, index) => ({
        preview: URL.createObjectURL(file),
        isMain: images.length === 0 && index === 0,
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'new' as const,
        raw: file,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      }));

      setImageFiles(prev => [...prev, ...newImageFiles]);

      // Update main photo index
      if (images.length === 0) {
        // If no images existed before, set the first new image as main
        setMainPhotoIndex(0);
      }
      // If images already existed, main photo stays at index 0

      toast.success(t('car.images.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t('car.images.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSetMainImage = async (imageUrl: string) => {
    if (!car?.id) return;

    setLoading(true);
    try {
      // Update all images to set is_main = false
      await supabase
        .from('car_images')
        .update({ is_main: false })
        .eq('car_id', car.id);

      // Set the selected image as main
      await supabase
        .from('car_images')
        .update({ is_main: true })
        .eq('car_id', car.id)
        .eq('url', imageUrl);

      // Update local state
      setImages(prev =>
        prev.map(img => ({
          ...img,
          is_main: img.url === imageUrl
        }))
      );

      // Update main photo index
      const imageIndex = images.findIndex(img => img.url === imageUrl);
      if (imageIndex >= 0) {
        setMainPhotoIndex(imageIndex);
      }

      toast.success(t('car.images.setMainSuccess'));
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error(t('car.images.setMainError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle delete image
  const handleDeleteImage = async (imageUrl: string) => {
    if (!car?.id) return;

    setLoading(true);
    try {
      // Delete from storage
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error: storageError } = await supabase.storage
        .from('car-images')
        .remove([`cars/${car.id}/${fileName}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('car_images')
        .delete()
        .eq('car_id', car.id)
        .eq('url', imageUrl);

      if (dbError) throw dbError;

      // Update local state
      const imageIndex = images.findIndex(img => img.url === imageUrl);
      setImages(prev => prev.filter(img => img.url !== imageUrl));

      // Update image files
      setImageFiles(prev => prev.filter(img => img.preview !== imageUrl));

      // Update main photo index (always stays at 0 if images remain)
      if (images.length > 1) {
        // If multiple images remain, main photo stays at index 0
        setMainPhotoIndex(0);
      } else if (images.length === 1) {
        // If only one image remains, it's automatically the main photo at index 0
        setMainPhotoIndex(0);
      } else {
        // No images left
        setMainPhotoIndex(null);
      }

      toast.success(t('car.images.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('car.images.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!car?.id) return;
    
    setLoading(true);
    try {
      // Prepare update data with proper type conversions
      const updateData: Record<string, any> = {
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
        model_id: formData.model_id ? parseInt(formData.model_id) : null,
        year: formData.year ? parseInt(formData.year.toString()) : null,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        color: formData.color || null,
        description: formData.description || null,
        fuel_type: formData.fuel_type || null,
        gearbox_type: formData.gearbox_type || null,
        body_type: formData.body_type || null,
        
        condition: formData.condition || null,
        cylinders: formData.cylinders || null,
        doors: formData.doors || null,
        drive_type: formData.drive_type || null,
        warranty: formData.warranty || null,
        exact_model: formData.exact_model || null,
        city_id: formData.city_id ? parseInt(formData.city_id) : null,
        is_featured: formData.is_featured || false,
        updated_at: new Date().toISOString()
      };

      // Remove null values to avoid overwriting existing data with null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null) {
          delete updateData[key];
        }
      });

      // Update car data
      const { error } = await supabase
        .from('cars')
        .update(updateData)
        .eq('id', car.id);
      
      if (error) throw error;
      
      // Update images if any
      if (images.length > 0) {
        // First, delete all existing images for this car
        await supabase
          .from('car_images')
          .delete()
          .eq('car_id', car.id);
        
        // Then insert the new ones
        const imagesToInsert = images.map(img => ({
          car_id: car.id,
          url: img.url,
          is_main: img.is_main || false
        }));
        
        const { error: imagesError } = await supabase
          .from('car_images')
          .insert(imagesToInsert);
        
        if (imagesError) throw imagesError;
      }
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }
      
      // Call the onEditComplete callback with the updated car data
      if (onEditComplete) {
        onEditComplete({
          ...car,
          ...formData,
          images: images
        });
      }
      
      toast.success(t('car.updateSuccess'));
      onClose();
    } catch (error) {
      console.error('Error updating car:', error);
      toast.error(t('car.updateError'));
    } finally {
      setLoading(false);
    }
  };

// ...
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl xl:max-w-7xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('myAds.edit.title')}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.brand')}
                      </label>
                      <select
                        value={formData.brand_id}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            brand_id: e.target.value,
                            model_id: '' // Reset model when brand changes
                          }));
                        }}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>
                            {language === 'ar' ? brand.name_ar : brand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.model')}
                      </label>
                      <select
                        value={formData.model_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {language === 'ar' ? model.name_ar : model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.exactModel')}
                      </label>
                      <input
                        type="text"
                        value={formData.exact_model}
                        onChange={(e) => setFormData(prev => ({ ...prev, exact_model: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.year')}
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.mileage')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.mileage}
                        onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.price')} ({car?.country?.currency_code}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.color')}
                      </label>
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="White">{t('car.color.white')}</option>
                        <option value="Black">{t('car.color.black')}</option>
                        <option value="Silver">{t('car.color.silver')}</option>
                        <option value="Gray">{t('car.color.gray')}</option>
                        <option value="Red">{t('car.color.red')}</option>
                        <option value="Blue">{t('car.color.blue')}</option>
                        <option value="Green">{t('car.color.green')}</option>
                        <option value="Gold">{t('car.color.gold')}</option>
                        <option value="Beige">{t('car.color.beige')}</option>
                        <option value="Maroon">{t('car.color.maroon')}</option>
                        <option value="Navy">{t('car.color.navy')}</option>
                        <option value="Bronze">{t('car.color.bronze')}</option>
                        <option value="Brown">{t('car.color.brown')}</option>
                        <option value="Yellow">{t('car.color.yellow')}</option>
                        <option value="Purple">{t('car.color.purple')}</option>
                        <option value="Other">{t('car.color.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.cylinders')}
                      </label>
                      <select
                        value={formData.cylinders}
                        onChange={(e) => setFormData(prev => ({ ...prev, cylinders: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="3">{t('car.cylinders.3')}</option>
                        <option value="4">{t('car.cylinders.4')}</option>
                        <option value="6">{t('car.cylinders.6')}</option>
                        <option value="8">{t('car.cylinders.8')}</option>
                        <option value="10">{t('car.cylinders.10')}</option>
                        <option value="12">{t('car.cylinders.12')}</option>
                        <option value="16">{t('car.cylinders.16')}</option>
                        <option value="Electric">{t('car.cylinders.electric')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.country')}
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>
                            {language === 'ar' ? country.name_ar : country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.city')}
                      </label>
                      <select
                        value={formData.city_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {language === 'ar' ? city.name_ar : city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.fuelType.label')}
                      </label>
                      <select
                        value={formData.fuel_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="Petrol">{t('car.fuelType.petrol')}</option>
                        <option value="Diesel">{t('car.fuelType.diesel')}</option>
                        <option value="Electric">{t('car.fuelType.electric')}</option>
                        <option value="Hybrid">{t('car.fuelType.hybrid')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.gearboxType')}
                      </label>
                      <select
                        value={formData.gearbox_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, gearbox_type: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="Automatic">{t('car.gearboxType.automatic')}</option>
                        <option value="Manual">{t('car.gearboxType.manual')}</option>
                      </select>
                    </div>

                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.bodyType')}
                      </label>
                      <select
                        value={formData.body_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, body_type: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="Sedan">{t('car.bodyType.sedan')}</option>
                        <option value="SUV">{t('car.bodyType.suv')}</option>
                        <option value="Hatchback">{t('car.bodyType.hatchback')}</option>
                        <option value="Coupe">{t('car.bodyType.coupe')}</option>
                        <option value="Pickup">{t('car.bodyType.pickup')}</option>
                        <option value="Van">{t('car.bodyType.van')}</option>
                        <option value="Wagon">{t('car.bodyType.wagon')}</option>
                        <option value="Truck">{t('car.bodyType.truck')}</option>
                        <option value="Convertible">{t('car.bodyType.convertible')}</option>
                        <option value="Other">{t('car.bodyType.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.condition')}
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="New">{t('car.condition.new')}</option>
                        <option value="Excellent">{t('car.condition.excellent')}</option>
                        <option value="Good">{t('car.condition.good')}</option>
                        <option value="Not Working">{t('car.condition.not_working')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.doors')}
                      </label>
                      <select
                        value={formData.doors}
                        onChange={(e) => setFormData(prev => ({ ...prev, doors: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="2">{t('car.doors.2')}</option>
                        <option value="3">{t('car.doors.3')}</option>
                        <option value="4">{t('car.doors.4')}</option>
                        <option value="5">{t('car.doors.5')}</option>
                        <option value="6+">{t('car.doors.6+')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.driveType')}
                      </label>
                      <select
                        value={formData.drive_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, drive_type: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="FWD">{t('car.driveType.fwd')}</option>
                        <option value="RWD">{t('car.driveType.rwd')}</option>
                        <option value="AWD">{t('car.driveType.awd')}</option>
                        <option value="4WD">{t('car.driveType.4wd')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.warranty')}
                      </label>
                      <select
                        value={formData.warranty}
                        onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      >
                        <option value="">{t('car.select')}</option>
                        <option value="Yes">{t('car.warranty.yes')}</option>
                        <option value="No">{t('car.warranty.no')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="w-full col-span-2 mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.description')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 col-span-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {t('common.images')}
                    </h3>
                    {images.length > 0 ? (
                      <>
                        {/* Main Photo Guidance */}
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {t('myAds.edit.images.guidance')}
                          </p>
                        </div>

                        <DndProvider backend={HTML5Backend}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                            {images.map((image, index) => (
                              <DraggableImage
                                key={image.url}
                                id={image.url}
                                index={index}
                                preview={image.url}
                                isMain={index === 0} // Main photo is always at index 0
                                onRemove={(id, idx) => handleDeleteImage(id)}
                                onSetMain={(idx) => {
                                  // Move the selected image to be main by updating both state and database
                                  if (idx !== 0) {
                                    // Move image to first position in array
                                    const newImages = [...images];
                                    const [movedImage] = newImages.splice(idx, 1);
                                    newImages.unshift(movedImage);
                                    setImages(newImages);

                                    // Update main photo index (always 0)
                                    setMainPhotoIndex(0);

                                    // Update database
                                    handleSetMainImage(movedImage.url);
                                  }
                                }}
                                moveImage={(dragIndex, hoverIndex) => {
                                  // Move image in array
                                  const newImages = [...images];
                                  const [movedImage] = newImages.splice(dragIndex, 1);
                                  newImages.splice(hoverIndex, 0, movedImage);
                                  setImages(newImages);

                                  // Handle main photo logic - main photo is always at index 0
                                  if (hoverIndex === 0) {
                                    // If moved to first position, set as main
                                    setMainPhotoIndex(0);
                                    handleSetMainImage(movedImage.url);
                                  } else if (dragIndex === 0) {
                                    // If main photo was moved away from first position, set new first photo as main
                                    setMainPhotoIndex(0);
                                    handleSetMainImage(newImages[0].url);
                                  }
                                }}
                                t={(key: string) => {
                                  // Use proper translation function with fallback
                                  return t(key) || key;
                                }}
                                totalImages={images.length}
                              />
                            ))}
                          </div>
                        </DndProvider>
                      </>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                        {t('common.noImages')}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <ImageUpload onUpload={handleImageUpload} loading={loading} />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon border border-transparent rounded-md shadow-sm hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
                    >
                      {loading ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default EditCarModal;
