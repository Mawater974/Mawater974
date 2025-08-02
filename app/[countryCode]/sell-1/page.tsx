'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Database } from '@/types/supabase';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';
import { getCountryFromIP } from '@/utils/geoLocation';
import { CheckIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide } from '@fortawesome/free-solid-svg-icons';
import { faSearch, faCamera, faChartLine, faHeadset, faCompress } from '@fortawesome/free-solid-svg-icons';
import imageCompression from 'browser-image-compression';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import LoadingSpinner from '@/components/LoadingSpinner';

type Car = Database['public']['Tables']['cars']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];
type Model = Database['public']['Tables']['models']['Row'];

interface ExtendedCar extends Car {
  brand: Brand;
  model: Model;
  images: { url: string }[];
}

interface FormData {
  description: string;
  price: string;
  brand: string;  // Brand ID as string
  model: string;  // Model ID as string
  exact_model: string; // Exact model text field
  year: string;
  mileage: string;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  color: string;
  cylinders: string;
  location: string;
  city_id: number | null;
  country_id: number | null; // Added country_id field
  images: File[];
  doors: string;
  drive_type: string;
  warranty: string;
  warranty_months_remaining: string;
  is_featured: boolean; // Whether this is a featured ad
}

const initialFormData: FormData = {
  description: '',
  price: '',
  brand: '',
  model: '',
  exact_model: '',
  year: '',
  mileage: '',
  fuel_type: '',
  gearbox_type: '',
  body_type: '',
  condition: '',
  color: '',
  cylinders: '',
  location: '',
  city_id: null,
  country_id: null, // Initialize country_id as null
  images: [],
  doors: '',
  drive_type: '',
  warranty: '',
  warranty_months_remaining: '',
  is_featured: false, // Default to non-featured
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors =['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy', 'Bronze', 'Other'];
const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];
const doorOptions = ['2', '3', '4', '5', '6+'];
const driveTypeOptions = ['FWD', 'RWD', 'AWD', '4WD'];
const warrantyOptions = ['Yes', 'No'];

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { t, currentLanguage } = useLanguage();
  const { currentCountry, getCitiesByCountry } = useCountry();
  const cities = currentCountry ? getCitiesByCountry(currentCountry.id) : [];

  const features = useMemo(() => ({
    free: [
      t('sell.features.basic.visibility'),
      t('sell.features.basic.photos'),
      t('sell.features.basic.search'),
      t('sell.features.basic.details'),
      t('sell.features.basic.duration'),
      t('sell.features.basic.support')
    ],
    featured: [
      t('sell.features.featured.visibility'),
      t('sell.features.featured.photos'),
      t('sell.features.featured.search'),
      t('sell.features.featured.details'),
      t('sell.features.featured.duration'),
      t('sell.features.featured.support'),
      t('sell.features.featured.badge'),
      t('sell.features.featured.social'),
      t('sell.features.featured.analytics')
    ]
  }), [t]);

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'featured' | null>(null);
  const [step, setStep] = useState<'plan' | 'details'>('plan');
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [carData, setCarData] = useState({
    brand_id: '',
    model_id: '',
    exact_model: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    description: '',
    fuel_type: '',
    gearbox_type: '',
    body_type: '',
    cylinders: '',
    drive_type: '',
    doors: '',
    warranty: '',
    warranty_months_remaining: '',
    location: '',
    condition: '',
    color: '',
  });
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string; is_main: boolean }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<'plan-selection' | 'payment' | 'step1' | 'step2' | 'step3' | 'step4'>('plan-selection');
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const totalSteps = 4; // Basic Info, Details, Images, Preview


  const steps = [
    { 
      id: 'plan-selection', 
      name: t('sell.plan.title'), 
      description: t('sell.plan.subtitle')
    },
    { 
      id: 'payment', 
      name: t('payment.title'), 
      description: t('payment.description')
    },
    { 
      id: 'step1', 
      name: t('sell.steps.basicInfo'), 
      description: t('sell.steps.basicInfo.desc')
    },
    { 
      id: 'step2', 
      name: t('sell.steps.details'), 
      description: t('sell.steps.details.desc')
    },
    { 
      id: 'step3', 
      name: t('sell.steps.images'), 
      description: t('sell.steps.images.desc')
    },
    { 
      id: 'step4', 
      name: t('sell.steps.review'), 
      description: t('sell.steps.review.desc')
    }
  ];

  const currentStepIndex = useMemo(() => {
    const stepOrder = ['plan-selection', 'payment', 'step1', 'step2', 'step3', 'step4'];
    const index = stepOrder.indexOf(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return index >= 0 ? index : 0;
  }, [currentStep]);

  const renderProgressLine = () => (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} ${index !== 0 ? 'pl-8 sm:pl-20' : ''} flex-1`}>
              <div className="flex items-center justify-center">
                <div
                  className={`${
                    index <= currentStepIndex ? 'bg-qatar-maroon' : 'bg-gray-200 dark:bg-gray-600'
                  } h-8 w-8 rounded-full flex items-center justify-center`}
                >
                  <span className={`${
                    index <= currentStepIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  } text-sm font-medium`}>
                    {index + 1}
                  </span>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={`${
                      index < currentStepIndex ? 'bg-qatar-maroon' : 'bg-gray-200 dark:bg-gray-600'
                    } h-0.5 absolute top-4 left-0 -right-0.5 w-full`}
                  />
                )}
              </div>
              <div className="mt-3 text-center">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {step.name}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.description}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      toast.error('Failed to fetch brands');
      console.error(err);
    }
  };

  const fetchModels = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      toast.error('Failed to fetch models');
      console.error(err);
    }
  };

  const fetchCarDetails = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, brand:brands(*), model:models(*), images(url, is_main)')
        .eq('id', carId)
        .single();

      if (error) throw error;

      // Populate form data with existing car details
      setCarData({
        brand_id: data.brand_id,
        model_id: data.model_id,
        exact_model: data.exact_model,
        year: data.year,
        mileage: data.mileage,
        price: data.price,
        description: data.description,
        fuel_type: data.fuel_type,
        gearbox_type: data.gearbox_type,
        body_type: data.body_type,
        cylinders: data.cylinders,
        drive_type: data.drive_type,
        doors: data.doors,
        warranty: data.warranty,
        warranty_months_remaining: data.warranty_months_remaining,
        location: data.location,
        condition: data.condition,
        color: data.color,
      });

      // Populate existing images
      setExistingImages(data.images.map((img: { url: string; is_main: boolean }, index: number) => ({
        id: index,
        url: img.url,
        is_main: img.is_main
      })));

      setIsEditing(true);
    } catch (err) {
      toast.error('Failed to fetch car details');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrands();
    if (editId) {
      fetchCarDetails(editId);
    }
  }, [editId]);

  useEffect(() => {
    if (formData.brand) {
      fetchModels(formData.brand);
    }
  }, [formData.brand]);

  const handleContinue = () => {
    if (!selectedPlan) return;
    
    // Store the selected plan in localStorage
    localStorage.setItem('selectedListingPlan', selectedPlan);
    
    // If featured plan is selected, go to payment step
    if (selectedPlan === 'featured') {
      setCurrentStep('payment');
    } else {
      // For free plan, set is_featured to false and go to step1
      setFormData(prev => ({ ...prev, is_featured: false }));
      setCurrentStep('step1');
    }
  };

    // Track page view effect
  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          const response = await fetch('/api/track-page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              page: '/sell-1',
              country: currentCountry.code,
              user_id: user?.id || null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to track page view:', error);
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };

      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Handle form submission logic here
      // This will be implemented based on your form requirements
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // BasicInfoStep component
  const BasicInfoStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      {/* Add your form fields here */}
    </div>
  );

  // CarDetailsStep component
  const CarDetailsStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Car Details</h2>
      {/* Add your form fields here */}
    </div>
  );
  
  // ImageUploadStep component
  const ImageUploadStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Images</h2>
      {/* Add your image upload component here */}
    </div>
  );
  
  // PreviewStep component
  const PreviewStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Review Your Listing</h2>
      {/* Add your preview component here */}
    </div>
  );

  // PaymentStep component
  const PaymentStep = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('payment.title')}
      </h2>
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('payment.featured_listing')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {t('payment.amount')}: <span className="font-semibold">QAR 99.00</span>
          </p>
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={handlePaymentSuccess}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
          >
            {t('payment.proceed_to_payment')}
          </button>
        </div>
      </div>
    </div>
  );

  // Handle next step
  const handleNext = () => {
    const stepOrder = ['plan-selection', 'payment', 'step1', 'step2', 'step3', 'step4'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1] as typeof currentStep);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    const stepOrder = ['plan-selection', 'payment', 'step1', 'step2', 'step3', 'step4'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      // If going back from step1 and payment was completed, go to payment step
      if (currentStep === 'step1' && selectedPlan === 'featured' && formData.is_featured) {
        setCurrentStep('payment');
      } 
      // If going back from payment, go to plan selection
      else if (currentStep === 'payment') {
        setCurrentStep('plan-selection');
      }
      // For all other cases, go to the previous step
      else {
        setCurrentStep(stepOrder[currentIndex - 1] as typeof currentStep);
      }
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setFormData(prev => ({
      ...prev,
      is_featured: true
    }));
    setCurrentStep('step1');
  };

  // Main component render
  return (
  <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? t('sell.edit.title') : t('sell.title')}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          {t('sell.subtitle')}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-4 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
            {/* Active Progress Bar */}
            <div 
              className={`absolute top-4 ${currentLanguage === 'ar' ? 'right-0' : 'left-0'} h-1 bg-qatar-maroon rounded-full transition-all duration-500 ease-in-out`} 
              style={{ 
                width: `${((['plan-selection', 'payment', 'step1', 'step2', 'step3', 'step4'].indexOf(currentStep)) / 5) * 100}%`,
                boxShadow: '0 0 10px rgba(158, 27, 52, 0.3)',
                transform: currentLanguage === 'ar' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center mb-2
                      ${currentStep === step.id 
                        ? 'bg-qatar-maroon text-white' 
                        : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                      }
                    `}
                  >
                    {step.id === 'plan-selection' ? 'P' : step.id.replace('step', '')}
                  </div>

                  {/* Step Label */}
                  <span className={`
                    text-sm font-medium mb-1
                    ${currentStep === step.id 
                      ? 'text-qatar-maroon' 
                      : currentStep > step.id
                        ? 'text-qatar-maroon'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {step.name}
                  </span>

                  {/* Step Description */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[120px]">
                    {step.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Form Content */}
            <div className="space-y-8">
              {currentStep === 'payment' && <PaymentStep />}
              {currentStep === 'step1' && <BasicInfoStep />}
              {currentStep === 'step2' && <CarDetailsStep />}
              {currentStep === 'step3' && <ImageUploadStep />}
              {currentStep === 'step4' && <PreviewStep />}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 
                  text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white 
                  dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                {t('common.back')}
              </button>

              {currentStep === 'step4' ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isConfirmed || isSubmitting}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base 
                    font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon
                    ${(!isConfirmed || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? t('common.submitting') : t('sell.review.submit')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base 
                    font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
                >
                  {t('common.next')}
                </button>
              )}
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 