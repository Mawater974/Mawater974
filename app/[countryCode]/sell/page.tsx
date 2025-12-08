'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Database } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlanSelection } from './components/PlanSelection';
import { PaymentStep } from './components/PaymentStep';
import BasicInfoStep from './components/BasicInfoStep';
import { DetailedInfoStep } from './components/DetailedInfoStep';
import MediaUploadStep from './components/MediaUploadStep';
import PreviewStep from './components/PreviewStep';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faChartLine, faHeadset, faSearch } from '@fortawesome/free-solid-svg-icons';

type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];
type City = Database['public']['Tables']['cities']['Row'];

import { ImageFile } from '@/types/image';
import { getCountryFromIP } from '@/utils/geoLocation';
import LoadingSpinner from '@/components/LoadingSpinner';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

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
    const options = isFeatured ? {
      // Higher quality settings for featured listings
      maxSizeMB: 1.0, // Larger max size for better quality
      maxWidthOrHeight: 2560, // Higher resolution for featured
      useWebWorker: true,
      maxIteration: 15,
      fileType: 'image/webp',
      initialQuality: 0.95, // Higher quality for featured
      alwaysKeepResolution: true,
      preserveExif: false,
    } : {
      // Standard compression for regular listings
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      maxIteration: 15,
      fileType: 'image/webp',
      initialQuality: 0.90,
      alwaysKeepResolution: true,
      preserveExif: false,
    };

    const compressedBlob = await imageCompression(processedFile, options);
    
    // Create a new File object with the correct MIME type and extension
    return new File(
      [compressedBlob],
      `${file.name.replace(/\.[^/.]+$/, '')}.webp`,
      { 
        type: 'image/webp',
        lastModified: Date.now()
      }
    );
  } catch (error) {
    console.error('Error compressing image:', error);
    // In case of error, return the original file
    return file;
  }
};


export type FormData = {
  is_featured?: boolean | null;
  brand_id: string;
  brand?: string;
  model_id: string;
  exact_model: string;
  year: string;
  mileage: string | number;
  price: string | number;
  description: string;
  images: ImageFile[];
  country_id: number | null;
  city_id: string | null;
  city: string;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  color: string;
  cylinders: string;
  doors: string;
  drive_type: string;
  warranty: string;
  warranty_months_remaining: string;
  mainPhotoIndex: number;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_intent_id?: string | null;
  payment_method_id?: string | null;
  payment_session_id?: string | null;
  payment_metadata?: Record<string, any> | null;
  payment_method?: {
    id: string;
    email: string;
    name: string;
    created: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    },
    client_attrabution_metadata:{
    client_session_id: string;
     
    }
  }

    

    
};

const initialFormData: FormData = {
  brand_id: '',
  model_id: '',
  exact_model: '',
  year: '',
  mileage: '',
  price: '',
  description: '',
  images: [],
  country_id: null,
  city_id: '',
  city: '', 
  fuel_type: '',
  gearbox_type: '',
  body_type: '',
  condition: '',
  color: '',
  cylinders: '',
  doors: '',
  drive_type: '',
  warranty: '',
  warranty_months_remaining: '',
  mainPhotoIndex: 0, 
  payment_intent_id: '',
  payment_method_id: '',
  payment_status: '',
  payment_amount: 0,
  payment_currency: '',
  payment_session_id: '',
  payment_metadata: {},
};

const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];
const doorOptions = ['2', '3', '4', '5', '6+'];
const driveTypeOptions = ['FWD', 'RWD', 'AWD', '4WD'];
const warrantyOptions = ['Yes', 'No'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors =['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy', 'Bronze', 'Other'];

export default function NewSellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const { t, currentLanguage } = useLanguage();
  const { currentCountry } = useCountry();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    country_id: currentCountry?.id || null,
  });
  
  // Main photo state
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number | null>(null);
  
  // State for tracking payment completion
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // Check if current step is complete
  const isStepComplete = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return false;
    
    // Special handling for payment step
    if (step.id === 'payment') {
      return paymentCompleted;
    }
    
    // Default validation for other steps
    return true;
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // UI state - Initialize with step from URL if provided
  const [currentStep, setCurrentStep] = useState(0);
  
  // Handle step parameter from URL
  useEffect(() => {
    if (stepParam) {
      const stepIndex = steps.findIndex(step => step.id === stepParam);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [stepParam]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  
  // Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setBrands(data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error('Failed to load brands');
      }
    };

    fetchBrands();
  }, []);

  // Fetch models when brand changes
  const handleBrandChange = async (brandId: string) => {
    // Update the form data first
    setFormData(prev => ({
      ...prev,
      brand_id: brandId,
      model_id: '' // Reset model when brand changes
    }));

    if (!brandId) {
      setModels([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    }
  };
  
  // Function to handle moving to the next step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Steps configuration
  const steps = [
    { 
      id: 'plan', 
      title: t('sell.plan.title'),
      component: (
        <PlanSelection 
          onSelectPlan={(isFeatured) => {
            setFormData(prev => ({ ...prev, is_featured: isFeatured }));
          }}
          onContinue={goToNextStep}
          t={t}
          currentPlan={formData.is_featured === true ? 'featured' : formData.is_featured === false ? 'free' : null}
        />
      )
    },
    { 
      id: 'payment', 
      title: t('sell.payment.title'),
      condition: () => formData.is_featured === true && !paymentCompleted,
      component: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-black dark:text-white">{t('sell.payment.title')}</h2>
          <p className="text-gray-600 text-center text-black dark:text-white">{t('sell.payment.description')}</p>
          
          <PaymentStep 
            formData={formData}
            onPaymentSuccess={(data) => {
              // Update form data with payment details
              setFormData(prev => ({
                ...prev,
                payment_status: data.payment_status,
                payment_amount: data.payment_amount,
                payment_currency: data.payment_currency,
                payment_intent_id: data.payment_intent_id || null,
                payment_method_id: data.payment_method_id || null,
                payment_session_id: data.payment_session_id || null,
                payment_metadata: data.payment_metadata || null,
                is_featured: data.is_featured
              }));
              // Store payment data and mark payment as completed
              setPaymentData(data);
              setIsPaymentCompleted(true);
              // Show success message
              toast.success(t('sell.payment.success') || 'Payment successful!');
              // Just show success message, don't auto-navigate
              // User will need to click next to proceed
            }}
            onPaymentError={(error) => {
              console.error('Payment error:', error);
              toast.error(t('sell.payment.error') || `Payment failed: ${error}`);
            }}
            onContinue={() => setPaymentCompleted(true)}
          />
          
          
        </div>
      )
    },
    { 
      id: 'basic-info', 
      title: t('sell.basic.title'),
      component: (
        <BasicInfoStep 
          formData={formData}
          onFormChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          onNext={goToNextStep}
          onBack={() => setCurrentStep(prev => prev - 1)}
          t={t}
          errors={{}}
          brands={brands}
          onBrandChange={handleBrandChange}
          currentCountry={currentCountry}
        />
      )
    },
    { 
      id: 'detailed-info', 
      title: t('sell.details.title'),
      component: (
        <DetailedInfoStep 
          formData={formData}
          onFormChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          onNext={goToNextStep}
          onBack={() => setCurrentStep(prev => prev - 1)}
          t={t}
          errors={{}}
          cities={cities}
          currentLanguage={currentLanguage}
          fields={[
            // Car Details
            { id: 'fuel_type', name: t('sell.details.fuelType'), type: 'select', options: fuelTypes.map(type => t(`car.fuelType.${type.toLowerCase()}`)), required: true },
            { id: 'gearbox_type', name: t('sell.details.gearboxType'), type: 'select', options: gearboxTypes.map(type => t(`car.gearboxType.${type.toLowerCase()}`)), required: true },
            { id: 'body_type', name: t('sell.details.bodyType'), type: 'select', options: bodyTypes.map(type => t(`car.bodyType.${type.toLowerCase()}`)), required: true },
            { id: 'color', name: t('sell.details.color'), type: 'select', options: colors.map(type => t(`car.color.${type.toLowerCase()}`)), required: true },
            { id: 'condition', name: t('sell.details.condition'), type: 'select', options:conditions.map(type => t(`car.condition.${type.toLowerCase().replace(' ', '_')}`)), required: true }, 
            { id: 'cylinders', name: t('sell.details.cylinders'), type: 'select', options: cylinderOptions.map(type => t(`car.cylinders.${type.toLowerCase()}`)), required: true },
            { id: 'doors', name: t('sell.details.doors'), type: 'select', options: doorOptions.map(type => t(`car.doors.${type.toLowerCase()}`)), required: false },
            { id: 'drive_type', name: t('sell.details.driveType'), type: 'select', options: driveTypeOptions.map(type => t(`car.driveType.${type.toLowerCase()}`)), required: false },
            { id: 'warranty', name: t('sell.details.warranty'), type: 'select', options: warrantyOptions.map(type => t(`car.warranty.${type.toLowerCase()}`)), required: false },
            { 
              id: 'city_id', 
              name: t('sell.details.city'), 
              type: 'select', 
              options: cities, 
              optionValueKey: 'id',
              optionLabelKey: currentLanguage === 'ar' ? 'name_ar' : 'name',
              required: true 
            },
            /*}...(formData.warranty === 'Yes' ? [{
              id: 'warranty_months_remaining',
              name: t('sell.details.warrantyMonthsRemaining'),
              type: 'number',
              required: false
            }] : []),*/
            { id: 'description', name: t('sell.details.description'), type: 'textarea', required: true, colSpan: 2 },
          ]}
        />
      )
    },
    { 
      id: 'media', 
      title: t('sell.steps.images'),
      component: (
        <MediaUploadStep 
          onFilesChange={(files) => {
            // Store both high-res and thumbnail versions in the form data
            setFormData(prev => ({ ...prev, images: files }));
          }}
          onNext={goToNextStep}
          onBack={() => setCurrentStep(prev => prev - 1)}
          t={t}
          errors={{}}
          initialFiles={formData.images}
          mainPhotoIndex={formData.mainPhotoIndex}
          onSetMainPhoto={(index) => {
            setFormData(prev => ({ ...prev, mainPhotoIndex: index }));
          }}
          onRemoveExistingImage={(id) => {
            // Handle removal of existing images if needed
          }}
          isFeatured={formData.is_featured === true}
        />
      )
    },
    { 
      id: 'preview', 
      title: t('sell.steps.review'),
      component: (
        <PreviewStep 
          formData={formData}
          onSubmit={handleSubmit}
          onBack={() => setCurrentStep(prev => prev - 1)}
          onEditStep={(step) => setCurrentStep(step)}
          t={t}
          isSubmitting={isSubmitting}
          brands={brands}
          models={models}
          cities={cities}
          currentLanguage={currentLanguage}
          currentCountry={currentCountry}
          mainPhotoIndex={formData.mainPhotoIndex || 0}
        />
      )
    },
  ];
  
  // Filter steps based on conditions (e.g., skip payment for free plan)
  const visibleSteps = useMemo(() => {
    return steps.filter(step => {
      if (step.condition === undefined) return true;
      return step.condition();
    });
  }, [steps, formData.is_featured, formData.payment_intent_id, formData.payment_session_id]);

  // Handle form submission
  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      const requiredFields = [
        { field: 'brand_id', message: t('errors.brand_required') },
        { field: 'model_id', message: t('errors.model_required') },
        { field: 'year', message: t('errors.year_required') },
        { field: 'mileage', message: t('errors.mileage_required') },
        { field: 'price', message: t('errors.price_required') },
        { field: 'description', message: t('errors.description_required') },
        { field: 'city_id', message: t('errors.city_id_required') },
      ];
      
      for (const { field, message } of requiredFields) {
        if (!formData[field as keyof FormData]) {
          throw new Error(message);
        }
      }
      
      // Validate images
      if (!formData.images || formData.images.length === 0) {
        throw new Error(t('errors.images_required'));
      }
      
      // Helper function to safely parse numeric values
      const parseNumber = (value: string | number | undefined | null): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(Number(value));
        return isNaN(num) ? null : num;
      };

      // Helper function to safely parse float values
      const parseFloatValue = (value: string | number | undefined | null): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? null : num;
      };

      // Prepare listing data for database (without images)
      const listingData = {
        user_id: user?.id,
        brand_id: formData.brand_id || null,
        model_id: formData.model_id || null,
        exact_model: formData.exact_model || null,
        year: parseNumber(formData.year),
        mileage: parseNumber(formData.mileage),
        price: parseFloatValue(formData.price),
        description: formData.description || null,
        country_id: formData.country_id || currentCountry?.id,
        city_id: formData.city_id || null,
        fuel_type: formData.fuel_type || null,
        gearbox_type: formData.gearbox_type || null,
        body_type: formData.body_type || null,
        condition: formData.condition || null,
        color: formData.color || null,
        cylinders: formData.cylinders || null,
        doors: formData.doors ? parseInt(formData.doors) : null,
        drive_type: formData.drive_type || null,
        warranty: formData.warranty || null,
        warranty_months_remaining: formData.warranty_months_remaining ? parseInt(formData.warranty_months_remaining) : null,
        is_featured: Boolean(formData.is_featured),
        payment_intent_id: formData.payment_intent_id || null,
        payment_method_id: formData.payment_method_id || null,
        payment_status: formData.payment_status || null,
        payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount.toString()) : null,
        payment_currency: formData.payment_currency || null,
        payment_session_id: formData.payment_session_id || null,
        payment_metadata: formData.payment_metadata || null,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save listing to database first to get the car ID
      // Ensure is_featured is included in the initial listing data
      const listingDataWithFeatured = {
        ...listingData,
        is_featured: formData.is_featured || false,
        status: 'approved'
      };

      const { data: listing, error: listingError } = await supabase
        .from('cars')
        .insert([listingDataWithFeatured])
        .select()
        .single();
        
      if (listingError) throw listingError;
      
      // If this is a featured listing, update the car record with payment information
      if (formData.is_featured && formData.payment_intent_id && formData.payment_method_id) {
        const paymentData = {
          payment_status: 'succeeded',
          payment_intent_id: formData.payment_intent_id,
          payment_method_id: formData.payment_method_id,
          payment_amount: formData.payment_amount,
          payment_currency: formData.payment_currency,
          payment_session_id: formData.payment_session_id,
          payment_metadata: {
            payment_method: 'stripe',
            listing_type: 'car',
            payment_amount: formData.payment_amount,
            payment_currency: formData.payment_currency,
            payment_intent: formData.payment_intent_id,
            payment_method_id: formData.payment_method_id,
            payment_session_id: formData.payment_session_id,
            payment_metadata: formData.payment_metadata,
          },
          is_featured: true,
          status: 'approved'
        };

        const { error: updateError } = await supabase
          .from('cars')
          .update(paymentData)
          .eq('id', listing.id);

        if (updateError) {
          console.error('Error updating car with payment information:', updateError);
          throw updateError;
        }
      }
      
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
            return new File(
              [await fetch(file.preview).then(r => r.blob())],
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
      
      // Upload images to storage and save to car_images table
      if (formData.images && formData.images.length > 0) {
        console.log('Starting image uploads...');
        const imagePromises = formData.images.map(async (file, index) => {
          try {
            // Get both high-res and thumbnail files
            const highResFile = file.raw;
            const thumbnailFile = file.thumbnailRaw || file.raw; // Fallback to original if no thumbnail
            
            // Generate consistent file names with WebP extension
            const fileExt = 'webp';
            const timestamp = new Date().getTime();
            const randomStr = Math.random().toString(36).substring(2, 8);
            
            // High-res file details
            const highResFileName = `${timestamp}-${randomStr}.${fileExt}`;
            const highResFilePath = `${listing.id}/${highResFileName}`;
            
            // Thumbnail file details
            const thumbFileName = `${timestamp}-${randomStr}-thumb.${fileExt}`;
            const thumbFilePath = `${listing.id}/${thumbFileName}`;

            console.log('Uploading high-res image:', highResFilePath, 'Size:', (highResFile.size / 1024).toFixed(2) + 'KB');
            console.log('Uploading thumbnail image:', thumbFilePath, 'Size:', (thumbnailFile.size / 1024).toFixed(2) + 'KB');

            // Upload high-res image
            const { error: highResUploadError } = await supabase.storage
              .from('car-images')
              .upload(highResFilePath, highResFile, {
                contentType: 'image/webp',
                upsert: false,
                cacheControl: '3600'
              });

            if (highResUploadError) {
              console.error('Error uploading high-res image:', highResUploadError);
              throw highResUploadError;
            }

            // Upload thumbnail image
            const { error: thumbUploadError } = await supabase.storage
              .from('car-images')
              .upload(thumbFilePath, thumbnailFile, {
                contentType: 'image/webp',
                upsert: false,
                cacheControl: '3600'
              });

            if (thumbUploadError) {
              console.error('Error uploading thumbnail image:', thumbUploadError);
              throw thumbUploadError;
            }

            // Get public URLs
            const { data: highResUrlData } = supabase.storage
              .from('car-images')
              .getPublicUrl(highResFilePath);

            const { data: thumbUrlData } = supabase.storage
              .from('car-images')
              .getPublicUrl(thumbFilePath);

            if (!highResUrlData?.publicUrl) {
              throw new Error('Failed to get public URL for high-res image');
            }

            if (!thumbUrlData?.publicUrl) {
              console.warn('Failed to get public URL for thumbnail image, using high-res as fallback');
            }

            const imageUrl = highResUrlData.publicUrl;
            const thumbnailUrl = thumbUrlData?.publicUrl || imageUrl; // Fallback to high-res if thumbnail fails
            
            const imageDimensions = await getImageDimensions(highResFile);
            
            console.log('Images uploaded successfully:', {
              highResUrl: imageUrl,
              thumbnailUrl: thumbnailUrl,
              size: (highResFile.size / 1024).toFixed(2) + 'KB',
              dimensions: imageDimensions
            });

            // Save to car_images table with both URLs
            const { data: imageData, error: imageError } = await supabase
              .from('car_images')
              .insert({
                car_id: listing.id,
                image_url: imageUrl,
                thumbnail_url: thumbnailUrl,
                is_main: index === 0, // First image is main
                display_order: index
              })
              .select()
              .single();

            if (imageError) {
              console.error('Error saving image to database:', imageError);
              throw imageError;
            }

            return { imageUrl, thumbnailUrl };
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
        const brandId = parseInt(formData.brand_id);
        const modelId = parseInt(formData.model_id);
        const brandName = brands.find(b => b.id === brandId)?.name || formData.brand_id;
        const modelName = models.find(m => m.id === modelId)?.name || formData.model_id;
        
        try {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'carSubmitted',
            title_en: t('notifications.carSubmitted.title_en'),
            title_ar: t('notifications.carSubmitted.title_ar'),
            message_en: t('notifications.carSubmitted.message_en', {
              brand: brandName,
              model: modelName
            }),
            message_ar: t('notifications.carSubmitted.message_ar', {
              brand: brandName,
              model: modelName
            })
          });
        } catch (err) {
          console.error('Error creating notification:', err);
          // Don't fail the whole submission if notification fails
        }
      }
      
      // Show success message and display success component
      toast.success(t('sell.listing_created'));
      setShowSuccess(true);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error: any) {
      console.error('Error creating listing:', error);
      setError(error.message || t('errors.general'));
      toast.error(error.message || t('errors.general'));
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle move to next step event from PaymentStep
  useEffect(() => {
    const handleMoveToNextStep = () => {
      setCurrentStep(prev => {
        const nextStep = Math.min(prev + 1, steps.length - 1);
        // Update URL to reflect the current step
        const url = new URL(window.location.href);
        url.searchParams.set('step', steps[nextStep]?.id || 'plan');
        window.history.pushState({}, '', url.toString());
        return nextStep;
      });
    };

    window.addEventListener('moveToNextStep', handleMoveToNextStep);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('moveToNextStep', handleMoveToNextStep);
    };
  }, [steps]);

  // On mount, sync step and featured state from URL if redirected from Stripe payment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    const paymentSuccess = urlParams.get('payment_success');

    // If redirected from Stripe and on payment step
    if (stepParam === 'payment' && paymentSuccess === 'true') {
      // Extract payment data from URL
      const sessionId = urlParams.get('session_id');
      const paymentIntent = urlParams.get('payment_intent');
      const paymentIntentId = paymentIntent || sessionId;
      const paymentMethodId = urlParams.get('payment_method_id');
      // Save payment info to formData
      setFormData(prev => ({
        ...prev,
        is_featured: true,
        payment_intent_id: paymentIntentId || undefined,
        payment_status: 'succeeded',
        payment_method_id: paymentMethodId || undefined,
        payment_session_id: sessionId || undefined,
      }));
      // Move to payment step
      const paymentStepIndex = steps.findIndex(step => step.id === 'payment');
      if (paymentStepIndex !== -1) {
        setCurrentStep(paymentStepIndex);
      }
      // Clean up payment params from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_success');
      newUrl.searchParams.delete('session_id');
      newUrl.searchParams.delete('payment_intent');
      newUrl.searchParams.delete('payment_intent_client_secret');
      newUrl.searchParams.delete('redirect_status');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [steps]);

  // Check for successful payment in localStorage when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPaymentStatus = () => {
      const paymentSuccess = localStorage.getItem('paymentSuccess');
      if (!paymentSuccess) return;

      try {
        const paymentData = JSON.parse(paymentSuccess);
        
        // Check if the payment was recent (within last 30 minutes)
        const paymentTime = new Date(paymentData.timestamp).getTime();
        const currentTime = new Date().getTime();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (currentTime - paymentTime < thirtyMinutes) {
          // Update form data with payment details
          setFormData(prev => ({
            ...prev,
            ...paymentData,
            is_featured: true,
            payment_status: 'succeeded',
            payment_method_id: paymentData.payment_method_id,
          }));
          
          // Move to the next step
          const currentStepIndex = steps.findIndex(step => step.id === 'payment');
          if (currentStepIndex !== -1) {
            setCurrentStep(Math.min(currentStepIndex + 1, steps.length - 1));
          }
          
          // Clean up
          localStorage.removeItem('paymentSuccess');
        } else {
          // Payment data is too old, clean it up
          localStorage.removeItem('paymentSuccess');
        }
      } catch (error) {
        console.error('Error processing payment success data:', error);
        localStorage.removeItem('paymentSuccess');
      }
    };
    
    checkPaymentStatus();
    
    // Also check when the page becomes visible again (in case of mobile browser tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPaymentStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [steps]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .order('name');
          
        if (brandsError) throw brandsError;
        setBrands(brandsData || []);
        
        // Fetch cities for current country
        if (currentCountry?.id) {
          const { data: citiesData, error: citiesError } = await supabase
            .from('cities')
            .select('*')
            .eq('country_id', currentCountry.id)
            .order('name');
            
          if (citiesError) throw citiesError;
          setCities(citiesData || []);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('errors.loading_data'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentCountry?.id, t]);
  
  // Fetch models when brand changes
  useEffect(() => {
    async function fetchModels() {
      if (!formData.brand_id) return;
      
      try {
        setLoading(true);
        
        const { data: modelsData, error: modelsError } = await supabase
          .from('models')
          .select('*')
          .eq('brand_id', formData.brand)
          .order('name');
          
        if (modelsError) throw modelsError;
        setModels(modelsData || []);
        
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error(t('errors.loading_models'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchModels();
  }, [formData.brand, t]);

  // Add this useEffect after your data fetching effects
  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          // Get the current URL and referrer
          const currentUrl = window.location.pathname;
          const referrer = document.referrer;
          const referrerUrl = referrer ? new URL(referrer) : null;
          
          // Only track if:
          // 1. This is a direct visit (no referrer)
          // 2. Referrer is not our root page
          // 3. Referrer is from a different site
          const shouldTrack = !referrer || 
            (referrerUrl && referrerUrl.pathname !== '/') || 
            (referrerUrl && referrerUrl.origin !== window.location.origin);
          
          if (shouldTrack) {
            // Get real location from IP
            const geoInfo = await getCountryFromIP();
            
            const response = await fetch('/api/analytics/page-view', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                countryCode: currentCountry?.code || '--',
                countryName: geoInfo?.name || '--', // Default to -- if no geo
                userId: user?.id,
                pageType: 'sell',
                page_path: currentUrl,
                is_direct_visit: !referrer,
                referrer_domain: referrerUrl ? referrerUrl.hostname : null
              })
            });
  
            if (!response.ok) {
              const error = await response.json();
              console.error('Failed to track page view:', error);
            }
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };
  
      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  const [showSuccess, setShowSuccess] = useState(false);

  // Show success message after form submission
  if (showSuccess) {
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
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  {t('sell.messages.submitted')}
                </h3>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sell.messages.review')}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('sell.messages.wait')}
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">  
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                          {t('sell.messages.reviewTime')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Link
                      href="/my-ads"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      {t('sell.messages.viewListings')}
                    </Link>
                    <Link
                      href={`/${currentCountry?.code.toLowerCase()}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                    >
                      {t('sell.messages.returnHome')}
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

  // Render loading state
 if (loading) {
     return (
       <div className="flex col-span-full items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
         <LoadingSpinner />
       </div>
     );
   }

  // Check if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 transform hover:shadow-2xl">
            {/* Header */}
            <div className="bg-qatar-maroon p-6 text-center">
             
              <h2 className="text-2xl font-bold text-white">
                {t('sell.login_required')}
              </h2>
              <p className="text-white/80 mt-2 text-sm">
                {t('sell.login_subtitle')}
              </p>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(`/login`)}
                  className="w-full py-3 bg-qatar-maroon hover:bg-qatar-maroon/90 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>{t('auth.login')}</span>
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {t('common.or')}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => router.push(`/signup`)}
                  variant="outline"
                  className="w-full py-3 border-qatar-maroon text-qatar-maroon hover:bg-qatar-maroon/5 dark:hover:bg-qatar-maroon/10 font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{t('auth.signup')}</span>
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('sell.by_continuing')}{' '}
                  <a href="/privacy" className="text-qatar-maroon hover:underline font-medium">
                    {t('common.privacy_policy')}
                  </a>{' '}
                  {t('common.and')}{' '}
                  <a href="/terms" className="text-qatar-maroon hover:underline font-medium">
                    {t('common.terms_of_service')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-qatar-maroon to-qatar-maroon/90 py-14 overflow-hidden">
        {/* Progress Steps - Only show after first step */}
        {currentStep > 0 && (
          <div className="w-full bg-white/10 backdrop-blur-sm p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center">
              {visibleSteps.slice(1).map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                
                return (
                  <React.Fragment key={step.id}>
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        isActive || isCompleted 
                          ? 'border-qatar-gold bg-qatar-gold' 
                          : 'border-white/30'
                      }`}>
                        {isCompleted ? (
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={`text-sm font-medium ${
                            isActive ? 'text-white' : 'text-white/70'
                          }`}>
                            {stepNumber}
                          </span>
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-white' : 'text-white/70'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    
                    {/* Connector line */}
                    {index < visibleSteps.length - 2 && (
                      <div className="h-0.5 w-16 bg-white/30 mx-2">
                        {isCompleted && (
                          <div className="h-full bg-qatar-gold transition-all duration-500" />
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg 
            className="h-full w-full"
            width="404"
            height="404"
            fill="none"
            viewBox="0 0 404 404"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="pattern-squares"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-white/20" 
                  fill="currentColor" 
                />
              </pattern>
            </defs>
            <rect width="404" height="404" fill="url(#pattern-squares)" />
          </svg>
        </div>
        
        {/* Hero Section - Only show on first step */}
        {currentStep === 0 && (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl animate-fade-in-up">
                {t('sell.plan.title')}
              </h1>
              <p className="mt-5 max-w-xl mx-auto text-xl text-white/80 leading-relaxed">
                {t('sell.plan.subtitle')}
              </p>
            </div>
            
            {/* Quick Benefits */}
            <div className="text-center mt-8">
              <span className="block text-white font-semibold mt-2">
                {t('sell.plan.options')}
              </span>
              <div className="mt-4 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">{t('sell.plan.benefits.reach')}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faCamera} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">{t('sell.plan.benefits.photos')}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faChartLine} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">{t('sell.plan.benefits.insights')}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center hover:bg-white/20 transition">
                  <FontAwesomeIcon 
                    icon={faHeadset} 
                    className="h-6 w-6 mx-auto text-white mb-2" 
                  />
                  <span className="text-xs text-white">{t('sell.plan.benefits.support')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-8">
        {/* Current Step Content */}
        <div className="mx-auto max-w-6xl w-full">
          <div className="mb-6 text-center">
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {visibleSteps[currentStep].description || ''}
            </p>
          </div>
          
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {visibleSteps[currentStep].component}
          </div>
          
          {/* Navigation Buttons - Only show for steps that don't have their own navigation */}
          {currentStep > 0 && !['basic-info', 'detailed-info', 'media'].includes(visibleSteps[currentStep].id) && (
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 0 || isSubmitting}
                className="hover:shadow-md"
              >
                {t('common.back')}
              </Button>
            
              {currentStep < visibleSteps.length - 1 && !['basic-info', 'detailed-info', 'media', 'preview'].includes(visibleSteps[currentStep].id) && (
                <Button
                  type="button"
                  onClick={() => {
                    // If we're on the payment step, check if payment is completed
                    if (visibleSteps[currentStep].id === 'payment' && !isPaymentCompleted) {
                      toast.error(t('sell.payment.complete_payment_first') || 'Please complete the payment first');
                      return;
                    }
                    setCurrentStep(prev => prev + 1);
                  }}
                  disabled={isSubmitting || (visibleSteps[currentStep].id === 'payment' && !isPaymentCompleted)}
                  className={`bg-qatar-maroon text-white hover:bg-qatar-maroon/90 hover:shadow-md ${
                    visibleSteps[currentStep].id === 'payment' && !isPaymentCompleted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t('common.next')}
                </Button>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
