'use client'

import { Fragment, useEffect, useState, useRef, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Car } from '@/types/car';
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { DraggableImage } from './DraggableImage';
import { scrollToTop } from '@/utils/scrollToTop';
import ImageCarousel from './ImageCarousel';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';
// @ts-ignore - heic2any doesn't have proper TypeScript types
declare const heic2any: any;

// Dynamic import for heic2any to handle potential loading issues
let heic2anyPromise: Promise<any> | null = null;

async function getHeic2Any() {
  if (heic2any) return heic2any;
  if (!heic2anyPromise) {
    heic2anyPromise = import('heic2any').then(module => module.default || module);
  }
  return heic2anyPromise;
}

type ImageFile = {
  preview: string;
  isMain: boolean;
  id: string;
  type: 'new' | 'existing';
  raw?: File;
  name: string;
  size: number;
  lastModified: number;
  thumbnailUrl?: string;
  thumbnailRaw?: File;
  originalName?: string;
};

// Convert HEIC/HEIF to JPEG for better compatibility
const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    const heic2any = await getHeic2Any();
    if (!heic2any) {
      console.warn('HEIC conversion not available, returning original file');
      return file;
    }

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

// Generate optimized image with specific settings
const generateOptimizedImage = async (file: File, options: any): Promise<File> => {
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
    console.log(`Processing ${options.purpose} version: ${file.name}`);
    console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    const compressedBlob = await imageCompression(processedFile, options) as Blob;

    // Determine output format (convert all to webp for better compression, except for SVG)
    const outputFormat = fileType === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
    const extension = getFileExtension(outputFormat);

    // Create a new File object with the correct MIME type and extension
    const optimizedFile = new File(
      [compressedBlob],
      `${file.name.replace(/\.[^/.]+$/, '')}${options.suffix || ''}.${extension}`,
      {
        type: outputFormat,
        lastModified: Date.now()
      }
    );

    console.log(`Optimized ${options.purpose} file size:`, (optimizedFile.size / 1024).toFixed(2), 'KB');
    console.log(`Compression ratio (${options.purpose}):`, ((file.size - optimizedFile.size) / file.size * 100).toFixed(2) + '%');

    return optimizedFile;
  } catch (error) {
    console.error(`Error generating ${options.purpose} version:`, error);
    return file; // Return original if optimization fails
  }
};

// Generate both high-res and thumbnail versions of the image
const compressImage = async (file: File, isFeatured: boolean = false): Promise<{ original: File; thumbnail: File }> => {
  const fileType = file.type.toLowerCase();
  const isSvg = fileType === 'image/svg+xml';

  // Skip processing for SVGs or unsupported types
  if (isSvg || !fileType.startsWith('image/') || !SUPPORTED_IMAGE_TYPES.includes(fileType)) {
    return { original: file, thumbnail: file };
  }

  // High-res image settings
  const highResOptions = {
    maxSizeMB: isFeatured ? 1.0 : 0.8,
    maxWidthOrHeight: isFeatured ? 1920 : 1600,
    useWebWorker: true,
    maxIteration: 15,
    fileType: 'image/webp',
    initialQuality: isFeatured ? 0.85 : 0.80,
    alwaysKeepResolution: true,
    purpose: 'high-res',
    suffix: ''
  };

  // Thumbnail settings (for grid/list views)
  const thumbnailOptions = {
    maxSizeMB: 0.1, // Target ~80KB
    maxWidthOrHeight: 600, // Middle of 400-600px range
    useWebWorker: true,
    maxIteration: 10,
    fileType: 'image/webp',
    initialQuality: 0.80, // Slightly lower quality for faster loading
    alwaysKeepResolution: true,
    purpose: 'thumbnail',
    suffix: '_thumb'
  };

  try {
    // Process both versions in parallel
    const [highResFile, thumbnailFile] = await Promise.all([
      generateOptimizedImage(file, highResOptions),
      generateOptimizedImage(file, thumbnailOptions)
    ]);

    return { original: highResFile, thumbnail: thumbnailFile };
  } catch (error) {
    console.error('Error processing image versions:', error);
    // Fallback to original file if processing fails
    return { original: file, thumbnail: file };
  }
};

interface CarImage {
  url: string;
  is_main?: boolean;
  thumbnail_url?: string;
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

  // Track pending changes (only applied on save)
  const [newImagesToUpload, setNewImagesToUpload] = useState<ImageFile[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // URLs of images to delete
  const [originalImages, setOriginalImages] = useState<CarImage[]>([]); // Backup for cancel
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

  // Initialize form data and images when car changes
  useEffect(() => {
    if (!car) return;



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
        thumbnail_url: typeof img === 'string' ? undefined : img?.thumbnail_url,
        is_main: typeof img === 'string' ? false : Boolean(img?.is_main)
      }))
      : [];
    setImages(initialImages);
    setOriginalImages(initialImages); // Backup for cancel

    // Reset pending changes
    setNewImagesToUpload([]);
    setImagesToDelete([]);
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

  // Handle image upload - store locally, don't upload yet (upload happens on save)
  const handleImageUpload = async (files: File[]): Promise<void> => {
    if (!car) return;

    setUploading(true);
    try {
      const processedFiles: ImageFile[] = [];

      for (const file of files) {
        try {
          // Generate both high-res and thumbnail versions
          const { original: highResFile, thumbnail: thumbnailFile } = await compressImage(file, formData.is_featured);

          // Create preview URLs for the UI (no upload yet)
          const previewUrl = URL.createObjectURL(highResFile);
          const thumbnailPreviewUrl = URL.createObjectURL(thumbnailFile);
          objectUrls.current.add(previewUrl);
          objectUrls.current.add(thumbnailPreviewUrl);

          // Create ImageFile object (will be uploaded on save)
          const imageFile: ImageFile = {
            preview: previewUrl,
            thumbnailUrl: thumbnailPreviewUrl,
            isMain: images.length + newImagesToUpload.length + processedFiles.length === 0,
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'new' as const,
            raw: highResFile,
            thumbnailRaw: thumbnailFile,
            name: highResFile.name.replace('_thumb', ''),
            size: highResFile.size,
            lastModified: highResFile.lastModified,
            originalName: file.name
          };

          processedFiles.push(imageFile);
        } catch (error) {
          console.error('Error processing image:', error);
          toast.error(t('car.images.uploadError'));
        }
      }

      if (processedFiles.length > 0) {
        // Add to pending uploads (will be uploaded on save)
        setNewImagesToUpload(prev => [...prev, ...processedFiles]);

        // Update display to show new images immediately
        const newCarImages: CarImage[] = processedFiles.map(file => ({
          url: file.preview,
          thumbnail_url: file.thumbnailUrl,
          is_main: file.isMain
        }));

        setImages(prev => [...prev, ...newCarImages]);

        // If this is the first image, set it as main
        if (images.length === 0 && newImagesToUpload.length === 0) {
          setMainPhotoIndex(0);
        }

        toast.success(t('car.images.addedLocally') || 'Images added. Click Save to upload.');
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error(t('car.images.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // Set an image as the main photo - local only
  const handleSetMainImage = (imageUrl: string) => {
    if (!car?.id) return;

    // Find the index of the image to set as main
    const imageIndex = images.findIndex(img => img.url === imageUrl);
    if (imageIndex === -1) return;

    // Reorder images to put the main one first locally
    const newImages = [...images];
    const [movedImage] = newImages.splice(imageIndex, 1);

    // Update is_main flags
    const updatedImages = [{ ...movedImage, is_main: true }, ...newImages.map(img => ({ ...img, is_main: false }))];

    setImages(updatedImages);
    setMainPhotoIndex(0);

    toast.success(t('car.images.setMainSuccess'));
  };

  // Move an image to a new position
  // Move an image to a new position - local only
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    if (!car?.id) return;

    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, movedImage);

      // Update is_main flags based on new order
      const updatedImages = newImages.map((img, idx) => ({
        ...img,
        is_main: idx === 0
      }));

      if (hoverIndex === 0 || dragIndex === 0) {
        setMainPhotoIndex(0);
      }

      return updatedImages;
    });
  };

  // Handle delete image - track locally, don't delete yet (deletion happens on save)
  const handleDeleteImage = (imageUrl: string) => {
    if (!car?.id) return;

    // Check if this is an existing image (has a URL starting with http)
    const isExistingImage = imageUrl.startsWith('http');

    if (isExistingImage) {
      // Track for deletion on save
      setImagesToDelete(prev => [...prev, imageUrl]);

      // Remove from display
      setImages(prev => prev.filter(img => img.url !== imageUrl));
    } else {
      // It's a new image (blob URL), remove from pending uploads
      setNewImagesToUpload(prev => {
        const imageToRemove = prev.find(img => img.preview === imageUrl);
        if (imageToRemove) {
          // Clean up object URLs
          if (imageToRemove.preview && objectUrls.current.has(imageToRemove.preview)) {
            URL.revokeObjectURL(imageToRemove.preview);
            objectUrls.current.delete(imageToRemove.preview);
          }
          if (imageToRemove.thumbnailUrl && objectUrls.current.has(imageToRemove.thumbnailUrl)) {
            URL.revokeObjectURL(imageToRemove.thumbnailUrl);
            objectUrls.current.delete(imageToRemove.thumbnailUrl);
          }
        }
        return prev.filter(img => img.preview !== imageUrl);
      });
    }

    // Update main photo index if needed
    const remainingExistingImages = images.filter(img => img.url !== imageUrl && !imagesToDelete.includes(img.url));
    const remainingNewImages = newImagesToUpload.filter(img => img.preview !== imageUrl);
    const totalRemaining = remainingExistingImages.length + remainingNewImages.length;

    if (totalRemaining === 0) {
      setMainPhotoIndex(null);
    } else if (mainPhotoIndex !== null && mainPhotoIndex >= totalRemaining) {
      setMainPhotoIndex(0);
    }

    toast.success(t('car.images.markedForDeletion') || 'Image will be removed on save');
  };

  // Handle cancel - revert all changes
  const handleCancel = () => {
    // Revert to original images
    setImages(originalImages);

    // Clean up object URLs for new images that won't be used
    newImagesToUpload.forEach(img => {
      if (img.preview && objectUrls.current.has(img.preview)) {
        URL.revokeObjectURL(img.preview);
        objectUrls.current.delete(img.preview);
      }
      if (img.thumbnailUrl && objectUrls.current.has(img.thumbnailUrl)) {
        URL.revokeObjectURL(img.thumbnailUrl);
        objectUrls.current.delete(img.thumbnailUrl);
      }
    });

    // Clear pending changes
    setNewImagesToUpload([]);
    setImagesToDelete([]);

    // Reset main photo index
    setMainPhotoIndex(originalImages.length > 0 ? 0 : null);

    // Close modal
    onClose();
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.current.forEach(url => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  // Ensure main photo index is always 0 when images are present
  useEffect(() => {
    if (images.length > 0 && mainPhotoIndex !== 0) {
      setMainPhotoIndex(0);
    }
  }, [images.length, mainPhotoIndex]);

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

      // 1. Delete images that were marked for deletion
      if (imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          try {
            // Extract filename from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // Delete from storage (both high-res and thumbnail)
            await supabase.storage
              .from('car-images')
              .remove([`cars/${car.id}/${fileName}`]);

            // Try to delete thumbnail too (may not exist for older images)
            const thumbFileName = fileName.replace('.webp', '_thumb.webp');
            await supabase.storage
              .from('car-images')
              .remove([`cars/${car.id}/${thumbFileName}`]);

            // Delete from database
            await supabase
              .from('car_images')
              .delete()
              .eq('car_id', car.id)
              .eq('image_url', imageUrl);
          } catch (deleteError) {
            console.error('Error deleting image:', imageUrl, deleteError);
            // Continue with other deletions even if one fails
          }
        }
      }

      // 2. Upload new images
      const uploadedMap = new Map<string, { url: string, thumbnail_url: string }>();

      if (newImagesToUpload.length > 0) {
        for (const imageFile of newImagesToUpload) {
          try {
            const highResFile = imageFile.raw!;
            const thumbnailFile = imageFile.thumbnailRaw || highResFile;

            const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const fileExt = 'webp';

            // Upload high-res version
            const highResPath = `${car.id}/${baseFileName}.${fileExt}`;
            const { error: highResError } = await supabase.storage
              .from('car-images')
              .upload(highResPath, highResFile, {
                contentType: 'image/webp',
                upsert: false
              });

            if (highResError) throw highResError;

            // Upload thumbnail version
            const thumbnailPath = `${car.id}/${baseFileName}_thumb.${fileExt}`;
            const { error: thumbnailError } = await supabase.storage
              .from('car-images')
              .upload(thumbnailPath, thumbnailFile, {
                contentType: 'image/webp',
                upsert: false
              });

            if (thumbnailError) throw thumbnailError;

            // Get public URLs
            const { data: { publicUrl: highResUrl } } = supabase.storage
              .from('car-images')
              .getPublicUrl(highResPath);

            const { data: { publicUrl: thumbnailUrl } } = supabase.storage
              .from('car-images')
              .getPublicUrl(thumbnailPath);

            if (imageFile.preview) {
              uploadedMap.set(imageFile.preview, { url: highResUrl, thumbnail_url: thumbnailUrl });
            }

            // Clean up object URLs
            if (imageFile.preview && objectUrls.current.has(imageFile.preview)) {
              objectUrls.current.delete(imageFile.preview); // Don't revoke yet, needed for map key
            }
            if (imageFile.thumbnailUrl && objectUrls.current.has(imageFile.thumbnailUrl)) {
              URL.revokeObjectURL(imageFile.thumbnailUrl);
              objectUrls.current.delete(imageFile.thumbnailUrl);
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            toast.error(t('car.images.uploadError'));
          }
        }
      }

      // 3. Update database for all images (Insert new, Update existing) preserving order
      if (images.length > 0) {
        // Reset all is_main flags first to prevent unique constraint violations
        await supabase
          .from('car_images')
          .update({ is_main: false })
          .eq('car_id', car.id);

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const isMain = i === 0;

          if (uploadedMap.has(img.url)) {
            // It's a newly uploaded image - INSERT
            const uploaded = uploadedMap.get(img.url)!;
            const { error: insertError } = await supabase.from('car_images').insert({
              car_id: car.id,
              image_url: uploaded.url,
              thumbnail_url: uploaded.thumbnail_url,
              is_main: isMain,
              display_order: i
            });

            if (insertError) {
              console.error('Error inserting new image:', insertError);
              throw insertError;
            }

            // Now safe to revoke blob
            URL.revokeObjectURL(img.url);
          } else if (!imagesToDelete.includes(img.url) && !img.url.startsWith('blob:')) {
            // It's an existing image - UPDATE
            const { error: updateError } = await supabase.from('car_images').update({
              display_order: i,
              is_main: isMain
            })
              .eq('car_id', car.id)
              .eq('image_url', img.url);

            if (updateError) {
              console.error('Error updating existing image:', updateError);
              throw updateError;
            }
          }
        }
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
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.brand')} *
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
                        {t('car.model')} *
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
                        {t('car.year')} *
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.mileage')} *
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
                        {t('car.color')} *
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

                    {/* <div>
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
                    </div> */}
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.city')} *
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
                        {t('car.fuelType.label')} *
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
                        {t('car.gearboxType')} *
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
                        {t('car.condition')} *
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

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('common.images')} <span className="text-sm text-gray-500 font-normal">({images.length}/{formData.is_featured ? 15 : 10})</span>
                      </h3>
                      {images.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('car.images.dragToReorder')}
                        </div>
                      )}
                    </div>

                    {images.length > 0 ? (
                      <>
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                          <div className="flex items-start">
                            <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {t('myAds.edit.images.guidance')}
                            </p>
                          </div>
                        </div>

                        <DndProvider backend={HTML5Backend}>
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
                            {images.map((image, index) => (
                              <DraggableImage
                                key={image.url}
                                id={image.url}
                                index={index}
                                preview={image.url}
                                isMain={index === 0}
                                onRemove={handleDeleteImage}
                                onSetMain={() => handleSetMainImage(image.url)}
                                moveImage={moveImage}
                                t={t}
                                totalImages={images.length}
                              />
                            ))}
                            {images.length < (formData.is_featured ? 15 : 10) && (
                              <label
                                className="relative group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-qatar-maroon/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.add('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleImageUpload(Array.from(e.dataTransfer.files));
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-2 group-hover:bg-qatar-maroon/10 dark:group-hover:bg-qatar-maroon/20 transition-colors">
                                    <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-qatar-maroon transition-colors" />
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-qatar-maroon dark:group-hover:text-qatar-maroon transition-colors">
                                    {t('car.images.addMore')}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {(formData.is_featured ? 15 : 10) - images.length} {t('car.images.remaining')}
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      const maxImages = formData.is_featured ? 15 : 10;
                                      const remainingSlots = maxImages - images.length;
                                      const filesToUpload = Array.from(e.target.files).slice(0, remainingSlots);
                                      if (filesToUpload.length > 0) {
                                        handleImageUpload(filesToUpload);
                                      }
                                      if (filesToUpload.length < e.target.files.length) {
                                        toast.error(t('car.images.maxReached', { max: maxImages }));
                                      }
                                    }
                                  }}
                                  disabled={uploading || images.length >= (formData.is_featured ? 15 : 10)}
                                />
                              </label>
                            )}
                          </div>
                        </DndProvider>
                      </>
                    ) : (
                      <div
                        className="relative w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:border-qatar-maroon/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('ring-2', 'ring-qatar-maroon/50', 'border-qatar-maroon');
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const maxImages = formData.is_featured ? 15 : 10;
                            const remainingSlots = maxImages - images.length;
                            const filesToUpload = Array.from(e.dataTransfer.files).slice(0, remainingSlots);
                            if (filesToUpload.length > 0) {
                              handleImageUpload(filesToUpload);
                            }
                            if (filesToUpload.length < e.dataTransfer.files.length) {
                              toast.error(t('car.images.maxReached', { max: maxImages }));
                            }
                          }
                        }}
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            {t('car.images.dragAndDrop')}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {t('car.images.or')}
                          </p>
                          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon cursor-pointer transition-colors">
                            <Upload className="h-4 w-4 mr-2" />
                            {t('car.images.uploadButton')}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  const maxImages = formData.is_featured ? 15 : 10;
                                  const remainingSlots = Math.max(0, maxImages - images.length);
                                  const filesToUpload = Array.from(e.target.files).slice(0, remainingSlots);

                                  if (filesToUpload.length > 0) {
                                    handleImageUpload(filesToUpload);
                                  }

                                  if (e.target.files.length > remainingSlots) {
                                    toast.error(t('car.images.maxReached', { max: maxImages }));
                                  }
                                }
                              }}
                              disabled={uploading || images.length >= (formData.is_featured ? 15 : 10)}
                            />
                          </label>
                          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            {t('car.images.supportedFormats')} • {t('car.images.maxSize')}
                          </p>
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t('car.images.uploading')}...
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon border border-transparent rounded-md shadow-sm hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t('common.saving')}
                        </span>
                      ) : (
                        t('common.save')
                      )}
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