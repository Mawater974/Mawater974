'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Car, CarImage } from '@/types/car';
import { ImageFile } from '@/types/image';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { DraggableImage } from '@/components/DraggableImage';
import { Loader2, Upload } from 'lucide-react';

// Car type options - matching the sell page
const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];
const doorOptions = ['2', '3', '4', '5', '6+'];
const driveTypeOptions = ['FWD', 'RWD', 'AWD', '4WD'];
const warrantyOptions = ['Yes', 'No'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy', 'Bronze', 'Other'];

interface AdminCarFormProps {
  car?: Car & { images?: CarImage[] };
  onSuccess?: () => void;
  onCancel?: () => void;
}


interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'normal_user' | 'dealer' | 'admin';
}

interface Brand {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
  brand_id: number;
}

interface Dealership {
  id: number;
  business_name: string;
  user_id: string;
}

export default function AdminCarForm({ car, onSuccess, onCancel }: AdminCarFormProps) {
  const { user } = useAuth();
  const { currentCountry, getCitiesByCountry } = useCountry();
  const { t } = useLanguage();
  const router = useRouter();

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);

  // Car form data
  const [formData, setFormData] = useState({
    brand_id: car?.brand_id || '',
    model_id: car?.model_id || '',
    year: car?.year || new Date().getFullYear(),
    mileage: car?.mileage || 0,
    price: car?.price || 0,
    description: car?.description || '',
    fuel_type: car?.fuel_type || 'Petrol',
    gearbox_type: car?.gearbox_type || 'Automatic',
    body_type: car?.body_type || 'Sedan',
    condition: car?.condition || 'New',
    color: car?.color || 'Black',
    exact_model: car?.exact_model || '',
    cylinders: car?.cylinders || '4',
    drive_type: car?.drive_type || 'FWD',
    doors: car?.doors ? car.doors.toString() : '4',
    warranty: car?.warranty_months_remaining ? 'Yes' : 'No',
    warranty_months_remaining: car?.warranty_months_remaining || 0,
    city_id: car?.city_id || null,
    is_featured: car?.is_featured || false,
    status: car?.status || 'approved',
  });

  // Image upload limits
  const MAX_IMAGES = 15; // Increased limit for admin

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

  // Helper function to get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    });
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
  const compressImage = async (file: File, isFeatured: boolean = false): Promise<File> => {
    const fileType = file.type.toLowerCase();

    // Skip non-image files or unsupported image types
    if (!fileType.startsWith('image/') ||
        (fileType !== 'image/jpeg' &&
         fileType !== 'image/png' &&
         fileType !== 'image/webp' &&
         !fileType.includes('heic') &&
         !fileType.includes('heif'))) {
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
        // Higher quality settings for admin
        maxSizeMB: 1.5, // Slightly larger max size for better quality
        maxWidthOrHeight: 2560, // Higher resolution for admin
        useWebWorker: true,
        maxIteration: 15,
        fileType: 'image/webp' as const,
        initialQuality: 0.95, // Higher quality for admin
        alwaysKeepResolution: true,
        preserveExif: false,
      };

      console.log('Original file name:', file.name);
      console.log('Original file type:', file.type);
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      const compressedBlob = await imageCompression(processedFile, options);

      // Create a new File object with the compressed image
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: 'image/webp', lastModified: Date.now() }
      );

      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return processedFile; // Return original if compression fails
    }
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  // State for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Image handling
  const [images, setImages] = useState<ImageFile[]>(
    car?.images?.map(img => ({
      id: img.id || `existing-${uuidv4()}`,
      preview: img.url,
      isMain: img.is_main || false,
      type: 'existing' as const,
      raw: new File([], img.url.split('/').pop() || 'image.jpg', { type: 'image/jpeg' }),
      name: img.url.split('/').pop() || 'image.jpg',
      size: 0,
      lastModified: Date.now()
    })) || []
  );

  const [mainPhotoIndex, setMainPhotoIndex] = useState<number | null>(
    car?.images?.findIndex(img => img.is_main) ?? 0
  );

  // Ensure main photo is always set to the first image
  useEffect(() => {
    if (images.length > 0 && mainPhotoIndex === null) {
      setMainPhotoIndex(0);
    }
  }, [images, mainPhotoIndex]);

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchBrands();
    fetchDealerships();

    if (car) {
      setSelectedUserId(car.user_id || '');
      setSelectedDealershipId(car.dealership_id || null);
      if (car.brand_id) {
        fetchModels(Number(car.brand_id));
      }
    }
  }, []);

  // Fetch all users for the dropdown
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    }
  };

  // Fetch all brands
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
      toast.error('Failed to load brands');
    }
  };

  // Fetch models for selected brand
  const fetchModels = async (brandId: number) => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('id, name, brand_id')
        .eq('brand_id', brandId)
        .order('name', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error fetching models:', err);
      toast.error('Failed to load models');
    }
  };

  // Fetch dealerships for the current user
  const fetchDealerships = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .eq('user_id', user.id)
        .order('business_name', { ascending: true });

      if (error) throw error;
      setDealerships(data || []);
    } catch (err) {
      console.error('Error fetching dealerships:', err);
      toast.error('Failed to load dealerships');
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? Number(value) : value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

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

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    // Check if adding these files would exceed the limit
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images`);
      return;
    }

    setLoading(true);

    try {
      const newImages: ImageFile[] = [];

      for (const file of files) {
        try {
          // Check file type
          if (!SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
            console.warn(`Skipping unsupported file type: ${file.type}`);
            continue;
          }

          // Compress the image
          const compressedFile = await compressImage(file, formData.is_featured || false);

          // Create a preview URL
          const preview = URL.createObjectURL(compressedFile);
          objectUrls.current.add(preview);

          // Create image object
          const imageObj: ImageFile = {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            preview,
            raw: compressedFile,
            name: compressedFile.name,
            size: compressedFile.size,
            type: compressedFile.type,
            lastModified: compressedFile.lastModified,
            isMain: false
          };

          newImages.push(imageObj);

          // Update UI progressively
          setImages(prev => [imageObj, ...prev]);

        } catch (error) {
          console.error('Error processing file:', file.name, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Error processing ${file.name}: ${errorMessage}`);
        }
      }

      // If this is the first image, set it as main
      if (images.length === 0 && newImages.length > 0) {
        setMainPhotoIndex(0);
      }

      if (newImages.length > 0) {
        toast.success(`Successfully added ${newImages.length} images`);
      }

    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      toast.error('Error processing images');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  // Move image in the array - Using MediaUploadStep implementation
  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setImages((prevImages) => {
      const newImages = [...prevImages];
      const [movedImage] = newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, movedImage);

      // Update main photo index if needed
      if (dragIndex === 0 || hoverIndex === 0) {
        newImages[0].isMain = true;
        if (dragIndex !== 0) {
          newImages[1].isMain = false;
        }
        setMainPhotoIndex(0);
      }

      return newImages;
    });
  }, []);

  // Set image as main - Using MediaUploadStep implementation
  // Set as main image - always set to first photo
  const setAsMain = (index: number) => {
    if (index !== 0) {
      // Move the selected photo to the first position
      moveImage(index, 0);
    }
    setMainPhotoIndex(0);
  };

  // Remove image
  const removeImage = (id: string, index: number) => {
    setImages(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== id);

      // Get the preview URL to revoke
      const fileToRemove = prevFiles.find(file => file.id === id);
      if (fileToRemove?.preview && typeof fileToRemove.preview === 'string' &&
          (fileToRemove.preview.startsWith('blob:') || fileToRemove.preview.startsWith('data:'))) {
        URL.revokeObjectURL(fileToRemove.preview);
        objectUrls.current.delete(fileToRemove.preview);
      }

      // If the removed image was the main photo, set the first image as main
      if (index === mainPhotoIndex) {
        setMainPhotoIndex(0);
      } else if (index < (mainPhotoIndex || 0)) {
        // Adjust main photo index if needed
        setMainPhotoIndex((mainPhotoIndex || 0) - 1);
      }

      return updatedFiles;
    });
  };

  // Combine existing and new images with proper main photo flag
  const allImages = useMemo(() => {
    return images.map((file, index) => ({
      ...file,
      isMain: index === 0 // Always make the first photo the main one
    }));
  }, [images]);

  // Ensure first image is always set as main
  useEffect(() => {
    if (allImages.length > 0 && mainPhotoIndex !== 0) {
      setMainPhotoIndex(0);
    }
  }, [allImages.length, mainPhotoIndex]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      objectUrls.current.forEach(url => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  // Helper function to convert any file-like object to a proper File
  const convertToFile = async (file: File | ImageFile): Promise<File> => {
    // If it's already a File object, return it
    if (file instanceof File) {
      return file;
    }
    
    // If it's an ImageFile with a raw file object, return that
    if ('raw' in file && file.raw instanceof File) {
      return file.raw;
    }
    
    // If it's an ImageFile with a preview URL, create a new File object
    if (file.preview) {
      try {
        // Get the file name from the preview URL if possible
        const fileName = file.preview.split('/').pop() || `image-${Date.now()}.jpg`;
        const response = await fetch(file.preview);
        const blob = await response.blob();
        return new File(
          [blob],
          fileName,
          { type: file.type || 'image/jpeg' }
        );
      } catch (error) {
        console.error('Error converting file:', error);
        throw new Error('Failed to process image');
      }
    }
    
    throw new Error('Unsupported file format');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (allImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare car data
      const carData = {
        ...formData,
        user_id: selectedUserId,
        dealership_id: selectedDealershipId,
        city_id: formData.city_id ? Number(formData.city_id) : null,
        brand_id: Number(formData.brand_id),
        model_id: Number(formData.model_id),
        year: Number(formData.year),
        mileage: Number(formData.mileage),
        price: Number(formData.price),
        doors: Number(formData.doors),
        warranty_months_remaining: formData.warranty === 'Yes' ? Number(formData.warranty_months_remaining) : 0,
        country_id: currentCountry?.id,
        status: formData.status as 'pending' | 'approved' | 'rejected' | 'sold' | 'expired',
        is_featured: formData.is_featured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let carId: number;

      if (car) {
        // Update existing car
        const { data, error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', car.id)
          .select('id')
          .single();

        if (error) throw error;
        carId = data.id;
      } else {
        // Create new car
        const { data, error } = await supabase
          .from('cars')
          .insert([carData])
          .select('id')
          .single();

        if (error) throw error;
        carId = data.id;
      }

      // Upload images to storage and save to car_images table
      if (allImages.length > 0) {
        console.log('Starting image uploads...');
        const imagePromises = allImages.map(async (img, index) => {
          try {
            // Convert to a proper File object and compress
            const fileToUpload = await convertToFile(img);
            const compressedFile = await compressImage(fileToUpload, Boolean(formData.is_featured));
            
            // Generate consistent file name with WebP extension
            const fileExt = 'webp';
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const fileName = `${timestamp}-${randomStr}.${fileExt}`;
            const filePath = `${carId}/${fileName}`;

            console.log('Uploading image:', filePath, 'Type:', compressedFile.type, 'Size:', (compressedFile.size / 1024).toFixed(2) + 'KB');

            // Upload the compressed image with WebP format
            const { error: uploadError } = await supabase.storage
              .from('car-images')
              .upload(filePath, compressedFile, {
                contentType: 'image/webp',
                upsert: false,
                cacheControl: '3600'
              });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              throw uploadError;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('car-images')
              .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
              throw new Error('Failed to get public URL for uploaded image');
            }

            const imageUrl = urlData.publicUrl;
            const imageDimensions = await getImageDimensions(compressedFile);
            
            console.log('Image uploaded successfully:', {
              url: imageUrl,
              size: (compressedFile.size / 1024).toFixed(2) + 'KB',
              dimensions: imageDimensions
            });

            // For admin operations, we'll use a direct database function call
            // that bypasses RLS but enforces proper ownership
            const { data: insertData, error: insertError } = await supabaseAdmin.rpc(
              'admin_insert_car_image',
              {
                p_car_id: carId,
                p_url: imageUrl,
                p_is_main: index === 0,
                p_display_order: index
              }
            );

            if (insertError) {
              console.error('Error calling admin_insert_car_image:', insertError);
              throw insertError;
            }

            if (insertError) {
              console.error('Error inserting image record:', insertError);
              throw insertError;
            }

            return imageUrl;
          } catch (error) {
            console.error('Error processing image:', error);
            throw error;
          }
        });

        // Wait for all image uploads to complete
        await Promise.all(imagePromises);
      }

      // Create notification for the user
      if (user) {
        // Get brand and model names from the form data
        const brandId = parseInt(formData.brand_id.toString());
        const modelId = parseInt(formData.model_id.toString());
        const brandName = brands.find(b => b.id === brandId)?.name || formData.brand_id.toString();
        const modelName = models.find(m => m.id === modelId)?.name || formData.model_id.toString();
        
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: selectedUserId.toString(), // Ensure user_id is a string
            type: 'carSubmitted',
            title_en: 'Car Listing Submitted',
            title_ar: 'تم إضافة إعلان السيارة',
            message_en: `Your ${brandName} ${modelName} has been ${car ? 'updated' : 'submitted'} successfully`,
            message_ar: `تم ${car ? 'تحديث' : 'إضافة'} ${brandName} ${modelName} بنجاح`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error creating notification:', err);
          // Don't fail the whole submission if notification fails
        }
      }

      toast.success(car ? 'Car updated successfully' : 'Car created successfully');
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error saving car:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Error saving car: ${errorMessage}`);
      toast.error(`Error saving car: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {car ? 'Edit Car Listing' : 'Create New Car Listing'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Selection */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User *
            </label>
            <select
              name="user_id"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* Dealership Selection (optional) */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Dealership (Optional)
            </label>
            <select
              name="dealership_id"
              value={selectedDealershipId || ''}
              onChange={(e) => setSelectedDealershipId(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">None (Private Seller)</option>
              {dealerships.map(dealership => (
                <option key={dealership.id} value={dealership.id}>
                  {dealership.business_name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <select
                name="city_id"
                value={formData.city_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a city</option>
                {currentCountry && getCitiesByCountry(currentCountry.id).map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand *
            </label>
            <select
              name="brand_id"
              value={formData.brand_id}
              onChange={(e) => {
                const brandId = Number(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  brand_id: brandId,
                  model_id: '' // Reset model when brand changes
                }));
                if (brandId) {
                  fetchModels(brandId);
                } else {
                  setModels([]);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <select
              name="model_id"
              value={formData.model_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={!formData.brand_id}
            >
              <option value="">Select a model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              name="year"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage (km) *
            </label>
            <input
              type="number"
              name="mileage"
              min="0"
              value={formData.mileage}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (QAR) *
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.fuelType')} *
            </label>
            <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectFuelType')}</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.fuelType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Gearbox Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.gearboxType')} *
            </label>
            <select
              name="gearbox_type"
              value={formData.gearbox_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectGearboxType')}</option>
              {gearboxTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.gearboxType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.bodyType')} *
            </label>
            <select
              name="body_type"
              value={formData.body_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectBodyType')}</option>
              {bodyTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.bodyType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.condition')} *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectCondition')}</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {t(`car.condition.${condition.toLowerCase().replace(' ', '_')}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.color')} *
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectColor')}</option>
              {colors.map(color => (
                <option key={color} value={color}>
                  {t(`car.color.${color.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Cylinders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.cylinders')} *
            </label>
            <select
              name="cylinders"
              value={formData.cylinders}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectCylinders')}</option>
              {cylinderOptions.map(cyl => (
                <option key={cyl} value={cyl}>
                  {cyl === 'Electric' 
                    ? t('sell.details.cylinders.electric')
                    : t('sell.details.cylinders.count', { count: cyl })}
                </option>
              ))}
            </select>
          </div>

          {/* Drive Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.driveType')} *
            </label>
            <select
              name="drive_type"
              value={formData.drive_type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectDriveType')}</option>
              {driveTypeOptions.map(type => (
                <option key={type} value={type}>
                  {t(`car.driveType.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Doors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.doors')} *
            </label>
            <select
              name="doors"
              value={formData.doors}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">{t('admin.cars.selectDoors')}</option>
              {doorOptions.map(doors => (
                <option key={doors} value={doors}>
                  {t(`car.doors.${doors}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.cars.warranty')}
            </label>
            <select
              name="warranty"
              value={formData.warranty}
              onChange={(e) => {
                handleInputChange(e);
                if (e.target.value === 'No') {
                  setFormData(prev => ({ ...prev, warranty_months_remaining: 0 }));
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {warrantyOptions.map(option => (
                <option key={option} value={option}>
                  {t(`car.warranty.${option.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty Months Remaining */}
          {formData.warranty === 'Yes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.cars.warrantyMonths')}
              </label>
              <input
                type="number"
                name="warranty_months_remaining"
                value={formData.warranty_months_remaining}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={formData.warranty === 'Yes'}
              />
            </div>
          )}

          {/* Exact Model */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exact Model (e.g., 330i, Mustang GT)
            </label>
            <input
              type="text"
              name="exact_model"
              value={formData.exact_model}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., 330i, Mustang GT"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
              Feature this listing
            </label>
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter a detailed description of the car..."
            />
          </div>
          
          {/* Images Section */}
          <div className="mb-6 col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (First image will be the main photo)
            </label>
            
            <DndProvider backend={HTML5Backend}>
              <div className="space-y-4">
                {/* Image Grid */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[200px] p-4 rounded-lg border-2 border-dashed ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } transition-colors`}
                >
                  {allImages.map((file, index) => {
                    const preview = typeof file.preview === 'string' ? file.preview : '';
                    return (
                      <DraggableImage
                        key={file.id}
                        id={file.id}
                        preview={preview}
                        isMain={index === 0}
                        index={index}
                        moveImage={moveImage}
                        onRemove={() => removeImage(file.id, index)}
                        onSetMain={() => setAsMain(index)}
                        t={t}
                        totalImages={allImages.length}
                      />
                    );
                  })}

                  {/* Upload Area - Only show if under max images */}
                  {allImages.length < MAX_IMAGES && (
                    <div 
                      className={`flex flex-col items-center justify-center h-full min-h-[150px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, WEBP, GIF, HEIC/HEIF (MAX. 10MB)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {allImages.length}/{MAX_IMAGES} images
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept={SUPPORTED_IMAGE_TYPES.join(',')}
                        onChange={handleFileSelect}
                        disabled={isLoading || allImages.length >= MAX_IMAGES}
                      />
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  The first photo is always the main photo. Drag photos to reorder them.
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing images...
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </DndProvider>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel || (() => router.push('/admin/cars'))}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isLoading ? 'Processing Images...' : car ? 'Update Car' : 'Create Car'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
