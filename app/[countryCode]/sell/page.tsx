'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Database } from '@/types/supabase';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCarSide } from '@fortawesome/free-solid-svg-icons';
import { faSearch, faCamera, faChartLine, faHeadset } from '@fortawesome/free-solid-svg-icons';
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
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors =['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy', 'Bronze', 'Other'];
const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];

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
  const [currentStep, setCurrentStep] = useState<'plan-selection' | 'step1' | 'step2' | 'step3' | 'step4'>('plan-selection');
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number | null>(null);
  const totalSteps = 4; // Basic Info, Details, Images, Preview
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);


  const steps = [
    { 
      id: 'plan-selection', 
      name: t('sell.plan.title'), 
      description: t('sell.plan.subtitle')
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
    switch (currentStep) {
      case 'step1':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 0;
      case 'step2':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 1;
      case 'step3':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 2;
      case 'step4':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 3;
      default:
        return 0;
    }
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
    // Store the selected plan in localStorage or context
    localStorage.setItem('selectedListingPlan', selectedPlan);
    setStep('details');
  };

  // Add this useEffect after your data fetching effects
useEffect(() => {
  if (currentCountry?.code) {
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            countryCode: currentCountry.code,
            userId: user?.id,
            pageType: 'sell' // Change this to your page type
          })
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const renderBasicInfo = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t('sell.basic.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('sell.basic.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div>
            <label 
              htmlFor="brand" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.basic.brand')} *
            </label>
            <select
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.basic.brand.select')}</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {currentLanguage === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label 
              htmlFor="model" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.basic.model')} *
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={(e) => handleInputChange(e)}
              required
              disabled={!formData.brand}
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{t('sell.basic.model.select')}</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {currentLanguage === 'ar' && model.name_ar ? model.name_ar : model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exact Model */}
          <div>
            <label 
              htmlFor="exact_model" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.basic.exactModel') || 'Exact Model'} 
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({t('sell.basic.optional') || 'Optional'})</span>
            </label>
            <input
              type="text"
              id="exact_model"
              name="exact_model"
              value={formData.exact_model}
              onChange={(e) => handleInputChange(e)}
              placeholder={t('sell.basic.exactModel.placeholder') || 'Specify exact model (e.g., 320i, Camry SE)'}
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            />
          </div>

          {/* Year */}
          <div>
            <label 
              htmlFor="year" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.basic.year')} *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.basic.year.select')}</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label 
              htmlFor="price" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('sell.basic.price')} ({currentCountry?.currency_code || 'QAR'}) *
            </label>
            <div className="relative">
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={(e) => handleInputChange(e)}
                required
                min="0"
                max="999999999"
                placeholder={t('sell.basic.price.placeholder')}
                className={`w-full ${currentLanguage === 'en' ? 'pr-16' : 'pl-16'} px-4 py-2.5 border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg 
                           shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 focus:border-qatar-maroon 
                           transition duration-200 ease-in-out`}
              />
            </div>
          </div>

          {/* Mileage */}
          <div>
            <label 
              htmlFor="mileage"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.mileage')} *
            </label>
            <input
              type="text"
              id="mileage"
              name="mileage"
              value={formData.mileage}
              onChange={(e) => handleInputChange(e)}
              required
              min="0"
              max="9999999"
              placeholder={t('sell.details.mileage.placeholder')}
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarDetails = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t('sell.details.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('sell.details.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Fuel Type */}
          <div>
            <label 
              htmlFor="fuel_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.fuelType')} *
            </label>
            <select
              id="fuel_type"
              name="fuel_type"
              value={formData.fuel_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.fuelType.select')}</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.fuelType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Gearbox Type */}
          <div>
            <label 
              htmlFor="gearbox_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.gearboxType')} *
            </label>
            <select
              id="gearbox_type"
              name="gearbox_type"
              value={formData.gearbox_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.gearboxType.select')}</option>
              {gearboxTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.gearboxType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label 
              htmlFor="body_type" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.bodyType')} *
            </label>
            <select
              id="body_type"
              name="body_type"
              value={formData.body_type}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.bodyType.select')}</option>
              {bodyTypes.map(type => (
                <option key={type} value={type}>
                  {t(`car.bodyType.${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label 
              htmlFor="condition" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.condition')} *
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.condition.select')}</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {t(`car.condition.${condition?.toLowerCase().replace(' ', '_')}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label 
              htmlFor="color" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.color')} *
            </label>
            <select
              id="color"
              name="color"
              value={formData.color}
              onChange={(e) => handleInputChange(e)}
              required
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.color.select')}</option>
              {colors.map(color => (
                <option key={color} value={color}>
                  {t(`car.color.${color.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Cylinders */}
          <div>
            <label 
              htmlFor="cylinders" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.cylinders')} *
            </label>
            <select
              id="cylinders"
              name="cylinders"
              value={formData.cylinders}
              required
              onChange={(e) => handleInputChange(e)}
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('sell.details.cylinders.select')}</option>
              {cylinderOptions.map(cyl => (
                <option key={cyl} value={cyl}>
                  {cyl === 'Electric' 
                    ? t('sell.details.cylinders.electric')
                    : t('sell.details.cylinders.count', { count: Number(cyl) })}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label 
              htmlFor="location" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('common.location')} *
            </label>
            <select
              id="location"
              name="location"
              value={formData.city_id?.toString() || ''}
              required
              onChange={(e) => {
                const cityId = parseInt(e.target.value);
                const selectedCity = cities.find(city => city.id === cityId);
                if (selectedCity) {
                  setFormData(prev => ({
                    ...prev,
                    city_id: cityId,
                    location: selectedCity.name
                  }));
                  
                  // Remove error styling when a city is selected
                  const field = e.target;
                  field.classList.remove('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
                  const errorMessage = field.parentElement?.querySelector('.text-red-500');
                  if (errorMessage) {
                    errorMessage.remove();
                  }
                } else {
                  // Add error styling when no city is selected
                  const field = e.target;
                  field.classList.add('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
                  if (!field.parentElement?.querySelector('.text-red-500')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-red-500 text-sm mt-1';
                    errorDiv.textContent = t('common.required') || 'This field is required';
                    field.parentElement?.appendChild(errorDiv);
                  }
                }
              }}
              className="w-full h-[42px] px-3 sm:px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out text-sm sm:text-base appearance-none"
            >
              <option value="">{t('common.location.select')}</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {currentLanguage === 'ar' ? city.name_ar : city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('sell.details.description')} *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              required
              onChange={(e) => handleInputChange(e)}
              placeholder={t('sell.details.description.placeholder')}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-qatar-maroon/50 
                         focus:border-qatar-maroon transition duration-200 ease-in-out"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const allImages = useMemo(() => [
    ...existingImages
      .filter((_, idx) => !imagesToDelete.includes(existingImages[idx].id))
      .map(img => ({ url: img.url, type: 'existing' as const })),
    ...newImages.map(file => ({ 
      url: URL.createObjectURL(file), 
      type: 'new' as const 
    }))
  ], [existingImages, imagesToDelete, newImages]);

  useEffect(() => {
    return () => {
      allImages
        .filter(img => img.type === 'new')
        .forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [allImages]);

  const renderImageUpload = () => {
    const getNumberSuffix = (number: number) => {
      if (number === 1) return 'st';
      if (number === 2) return 'nd';
      if (number === 3) return 'rd';
      return 'th';
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('sell.images.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('sell.images.subtitle')}
          </p>
        </div>

        {/* Main Photo Guidance */}
        {(newImages.length > 0 || existingImages.length > 0) && (
          <div className="mt-8">             
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {mainPhotoIndex === null 
                  ? t('sell.images.selectMain')
                  : t('sell.images.mainSelected', { 
                      number: mainPhotoIndex + 1,
                      suffix: getNumberSuffix(mainPhotoIndex + 1)
                    })
                }
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {allImages.map((image, index) => (
                <div 
                  key={index} 
                  className={`relative border-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
                    index === mainPhotoIndex 
                      ? 'border-qatar-maroon shadow-lg scale-105' 
                      : 'border-[#2a3441] hover:border-gray-600'
                  }`}
                >
                  <img 
                    src={image.url} 
                    alt={`Car image ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  
                  {/* Main Photo Badge */}
                  {index === mainPhotoIndex && (
                    <div className="absolute top-2 left-2 bg-qatar-maroon text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 110 4v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 110-4V9a2 2 0 00-2-2h-6V7a5 5 0 00-5-5z" />
                      </svg>
                      {t('sell.images.mainPhoto')}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2 bg-[#1e2530]/90">
                    {/* Set as Main Photo Button */}
                    {index !== mainPhotoIndex && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(index)}
                        className="bg-qatar-maroon text-white px-3 py-1.5 rounded-md text-xs 
                          transition-all duration-300 ease-in-out 
                          transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 
                          focus:outline-none focus:ring-2 focus:ring-qatar-maroon/50"
                      >
                        <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t('sell.images.setMainBtn')}
                        </div>
                      </button>
                    )}

                    {/* Remove Image Button */}
                    <button
                      type="button"
                      onClick={() => 
                        image.type === 'existing' 
                          ? handleRemoveExistingImage(existingImages[index].id) 
                          : handleRemoveNewImage(index - (existingImages.length - imagesToDelete.length))
                      }
                      className="bg-[#2a3441] text-white px-3 py-1.5 rounded-md text-xs 
                        transition-all duration-300 ease-in-out 
                        transform hover:scale-105 hover:shadow-lg 
                        active:scale-95 
                        focus:outline-none focus:ring-2 focus:ring-gray-500/50 
                        hover:bg-[#323d4d] ml-auto rtl:mr-auto rtl:ml-0 flex items-center justify-center"
                    >
                      <div className="flex items-center justify-center gap-1 rtl:flex-row-reverse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1z"
                          />
                        </svg>
                        {t('sell.images.removeBtn')}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area when no images */}
        {(newImages.length === 0 && existingImages.length === 0) && (
          <div 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg bg-[#2a3441] hover:bg-[#323d4d] transition-colors group"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg 
                className="w-12 h-12 mb-4 text-gray-400 group-hover:text-qatar-maroon transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-400 group-hover:text-white transition-colors">
                <span className="font-semibold group-hover:text-qatar-maroon">{t('sell.images.drag')}</span>
              </p>
              <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                {t('sell.images.formats')}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        )}

        {/* Add More Photos Button */}
        <div className="mt-6 text-center">
          <label 
            htmlFor="file-upload" 
            className={`inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 01-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                />
              </svg>
                {allImages.length >= 10 ? t('sell.images.maxReached') : t('sell.images.addMore')}
              </div>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={allImages.length >= 10}
            />
        </div>

        {/* Photo Count */}
        <div className="text-center text-sm text-gray-400 mt-2">
          {t('sell.images.count', { current: allImages.length, max: 10 })}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const selectedBrand = brands.find(b => b.id.toString() === formData.brand);
    const selectedModel = models.find(m => m.id.toString() === formData.model);

    const previewItems = [
      { label: t('sell.basic.brand'), value: selectedBrand?.name },
      { label: t('sell.basic.model'), value: selectedModel?.name },
      { label: t('sell.basic.exactModel') || 'Exact Model', value: formData.exact_model || null },
      { label: t('sell.basic.year'), value: formData.year },
      { label: t('sell.basic.price'), value: formData.price ? `${formData.price} ${t(`common.currency.${currentCountry?.currency_code || 'QAR'}`)}` : null },
      { label: t('sell.details.mileage'), value: formData.mileage ? `${formData.mileage} ${t('car.km')}` : null },
      { label: t('sell.details.fuelType'), value: formData.fuel_type ? t(`car.fuelType.${formData.fuel_type.toLowerCase()}`) : null },
      { label: t('sell.details.gearboxType'), value: formData.gearbox_type ? t(`car.gearboxType.${formData.gearbox_type.toLowerCase()}`) : null },
      { label: t('sell.details.bodyType'), value: formData.body_type ? t(`car.bodyType.${formData.body_type.toLowerCase()}`) : null },
      { label: t('sell.details.condition'), value: formData.condition ? t(`car.condition.${formData.condition?.toLowerCase().replace(' ', '_')}`) : null },
      { label: t('sell.details.color'), value: formData.color ? t(`car.color.${formData.color.toLowerCase()}`) : null },
      { 
        label: t('sell.details.cylinders'), 
        value: formData.cylinders ? (formData.cylinders === 'Electric' ? t('sell.details.cylinders.electric') : t('sell.details.cylinders.count', { count: Number(formData.cylinders) })) : null 
      },
      { 
        label: t('sell.details.location'), 
        value: formData.location || null 
      },
      { label: t('sell.details.description'), value: formData.description },
    ];

    return (
      <div>
        {/* Preview Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('sell.review.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('sell.review.subtitle')}
          </p>
        </div>

        {/* Car Details */}
        <div className="space-y-6">
          <dl>
            {previewItems.map((item, index) => (
              <div key={item.label} className={`${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                <dt className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {item.value || t('sell.review.notSpecified')}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Images Preview */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('sell.review.images.title')} ({existingImages.length - imagesToDelete.length + newImages.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingImages
              .filter(img => !imagesToDelete.includes(img.id))
              .map((image, index) => (
                <div 
                  key={image.id}
                  className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={image.url}
                    alt="Car"
                    className="w-full h-full object-cover"
                  />
                  {image.is_main && (
                    <div className="absolute top-2 right-2 bg-qatar-maroon text-white px-2 py-1 rounded-md text-xs">
                      {t('sell.review.mainPhoto')}
                    </div>
                  )}
                </div>
              ))}
            
            {/* New Images */}
            {newImages.map((file, index) => (
              <div
                key={`new-${index}`}
                className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New car image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {mainPhotoIndex === existingImages.length + index && (
                  <div className="absolute top-2 right-2 bg-qatar-maroon text-white px-2 py-1 rounded-md text-xs">
                    {t('sell.review.mainPhoto')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="mt-6 mb-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="confirm"
                name="confirm"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="focus:ring-qatar-maroon h-4 w-4 text-qatar-maroon border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="confirm" className="font-medium text-gray-700 dark:text-gray-200">
                {t('sell.review.confirm.label')}
              </label>
              <p className="text-gray-500 dark:text-gray-400">
                {t('sell.review.confirm.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Status Notice */}
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
                {t('sell.review.notice.message')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const validateStep = () => {
    switch (currentStep) {
      case 'plan-selection':
        return selectedPlan !== null;
      case 'step1':
        return formData.brand && formData.model && formData.year && formData.price && formData.mileage;
      case 'step2':
        return (
          formData.fuel_type &&
          formData.gearbox_type &&
          formData.body_type &&
          formData.condition &&
          formData.color &&
          formData.cylinders &&
          formData.description &&
          formData.location
        );
      case 'step3':
        const totalImages = existingImages.length - imagesToDelete.length + newImages.length;
        return totalImages > 0 && totalImages <= 10 && mainPhotoIndex !== null;
      case 'step4':
        return isConfirmed;
      default:
        return false;
    }
  };

  // Function to show validation errors
  const showValidationErrors = () => {
    const currentForm = document.querySelector('form');
    if (currentForm) {
      const requiredFields = currentForm.querySelectorAll('[required]');
      let hasEmptyFields = false;
      let firstEmptyField: HTMLElement | null = null;

      requiredFields.forEach((field: Element) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
          if (!field.value) {
            hasEmptyFields = true;
            field.classList.add('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
            if (!firstEmptyField) firstEmptyField = field;

            // Remove any existing error message
            const existingError = field.parentElement?.querySelector('.text-red-500');
            if (existingError) {
              existingError.remove();
            }

            // Add error message below the field
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-red-500 text-sm mt-1';
            errorDiv.textContent = t('common.required') || 'This field is required';
            field.parentElement?.appendChild(errorDiv);
          } else {
            // Remove error styling and message if field is filled
            field.classList.remove('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
            const errorMessage = field.parentElement?.querySelector('.text-red-500');
            if (errorMessage) {
              errorMessage.remove();
            }
          }
        }
      });

      return { hasEmptyFields, firstEmptyField };
    }
    return { hasEmptyFields: false, firstEmptyField: null };
  };

  // Update error messages when language changes
  useEffect(() => {
    const currentForm = document.querySelector('form');
    if (currentForm) {
      const errorMessages = currentForm.querySelectorAll('.text-red-500');
      errorMessages.forEach(message => {
        if (message instanceof HTMLElement) {
          message.textContent = t('common.required') || 'This field is required';
        }
      });
    }
  }, [currentLanguage, t]);

  const handleNext = async () => {
    const { hasEmptyFields, firstEmptyField } = showValidationErrors();
    if (hasEmptyFields) {
      firstEmptyField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (validateStep()) {
      if (currentStep === 'plan-selection') {
        setCurrentStep('step1');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentStep === 'step3' && currentStepIndex < totalSteps - 1) {
        setCurrentStep('step4');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentStep === 'step2') {
        setCurrentStep('step3');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentStep === 'step1') {
        setCurrentStep('step2');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'step4') {
      setCurrentStep('step3');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'step3') {
      setCurrentStep('step2');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'step2') {
      setCurrentStep('step1');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'step1') {
      setCurrentStep('plan-selection');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!isConfirmed) {
      toast.error(t('sell.messages.confirmRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Preparing car data...');
      // Prepare the car data with correct field names
      const carSubmitData: any = {
        brand_id: parseInt(formData.brand),
        model_id: parseInt(formData.model),
        exact_model: formData.exact_model,
        year: parseInt(formData.year),
        price: parseInt(formData.price.replace(/[^0-9]/g, '')),
        mileage: parseInt(formData.mileage.replace(/[^0-9]/g, '')),
        fuel_type: formData.fuel_type,
        gearbox_type: formData.gearbox_type,
        body_type: formData.body_type,
        condition: formData.condition,
        color: formData.color,
        cylinders: formData.cylinders === 'Electric' ? 'Electric' : formData.cylinders,
        location: formData.location,
        description: formData.description,
        user_id: user.id,
        country_id: currentCountry.id,
        city_id: formData.city_id,
        status: 'Pending',
        is_featured: selectedPlan === 'featured'
      };

      // Only add currency_code if it exists in the database schema
      try {
        const { data: schemaCheck, error: schemaError } = await supabase
          .from('cars')
          .select('currency_code')
          .limit(1);
        
        if (!schemaError) {
          carSubmitData.currency_code = currentCountry.currency_code;
        }
      } catch (error) {
        console.log('Currency code field might not exist yet, continuing without it');
      }

      console.log('Submitting car data:', carSubmitData);

      // Insert the car data
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert([carSubmitData])
        .select()
        .single();

      if (carError) {
        console.error('Error inserting car data:', carError);
        throw carError;
      }

      console.log('Car data inserted successfully:', carData);

      // Handle image uploads
      if (newImages.length > 0) {
        console.log('Starting image uploads...');
        const imagePromises = newImages.map(async (file, index) => {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${carData.id}/${fileName}`;

            console.log('Uploading image:', filePath);

            // Upload the image
            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('car-images')
              .upload(filePath, file);

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

            console.log('Image uploaded successfully, public URL:', urlData.publicUrl);

            // Insert image record
            const { error: insertError } = await supabase
              .from('car_images')
              .insert([{
                car_id: carData.id,
                url: urlData.publicUrl,
                is_main: index === mainPhotoIndex
              }]);

            if (insertError) {
              console.error('Error inserting image record:', insertError);
              throw insertError;
            }

            return urlData.publicUrl;
          } catch (error) {
            console.error('Error processing image:', error);
            throw error;
          }
        });

        // Wait for all image uploads to complete
        await Promise.all(imagePromises);
      }

      // Handle existing images to delete
      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('car_images')
          .delete()
          .in('id', imagesToDelete);

        if (deleteError) {
          console.error('Error deleting images:', deleteError);
          throw deleteError;
        }
      }

      setIsSubmitted(true);
      toast.success(t('sell.messages.success'));
      } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || t('sell.messages.error'));
      toast.error(error.message || t('sell.messages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const field = e.target;
    
    // Handle real-time validation
    if (field.hasAttribute('required')) {
      if (value) {
        // Field is filled - remove error styling
        field.classList.remove('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
        const errorMessage = field.parentElement?.querySelector('.text-red-500');
        if (errorMessage) {
          errorMessage.remove();
        }
      } else {
        // Field is empty - add error styling
        field.classList.add('border-red-500', 'dark:border-red-500', 'focus:ring-red-500', 'dark:ring-red-500');
        
        // Only add error message if it doesn't exist
        if (!field.parentElement?.querySelector('.text-red-500')) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-red-500 text-sm mt-1';
          errorDiv.textContent = t('common.required') || 'This field is required';
          field.parentElement?.appendChild(errorDiv);
        }
      }
    }
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // If changing location, also update city_id and ensure location matches city name
      if (name === 'location' && value) {
        const selectedCity = cities.find(city => city.value === value);
        if (selectedCity) {
          updatedData.city_id = selectedCity.id;
          updatedData.location = selectedCity.label; // Use city name as location
        }
      }
      
      // Format price with commas
      if (name === 'price') {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue) {
          updatedData.price = new Intl.NumberFormat().format(parseInt(numericValue));
        }
      }

      // Format mileage with commas
      if (name === 'mileage') {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue) {
          updatedData.mileage = new Intl.NumberFormat().format(parseInt(numericValue));
        }
      }
        
      return updatedData;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      toast.error(t('sell.messages.maxImages'));
      return;
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('sell.messages.invalidImage'));
        return;
      }

      // Increased max size to 10MB per image
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('sell.messages.imageTooLarge'));
        return;
      }
    }

    setNewImages(prev => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId]);
    toast.success(t('sell.messages.deleted'));
  };

  const handleRemoveNewImage = (index: number) => {
    if (index === mainPhotoIndex) {
      toast.error(t('sell.messages.mainImageWarning'));
      return;
    }

    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetMainPhoto = (index: number) => {
    setMainPhotoIndex(index);
    // Update existing images is_main status
    setExistingImages(prev => prev.map((img, i) => ({
      ...img,
      is_main: i === index
    })));
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('sell.messages.login')}
        </h2>
        <button
          onClick={() => router.push('/login')}
          className="inline-block bg-qatar-maroon text-white px-6 py-3 rounded-md font-semibold hover:bg-qatar-maroon/90 transition-colors"
        >
          {t('sell.messages.loginButton')}
        </button>
      </div>
    );
  }

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
                      href="/"
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

  if (currentStep === 'plan-selection') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-qatar-maroon to-qatar-maroon/90 py-14 overflow-hidden">
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

          {/* Content Container */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Animated Title */}
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl animate-fade-in-up">
                {t('sell.plan.title')}
              </h1>

              {/* Subheading with Highlights */}
              <p className="mt-5 max-w-xl mx-auto text-xl text-white/80 leading-relaxed">
                {t('sell.plan.subtitle')}
                <span className="block text-white font-semibold mt-2">
                  {t('sell.plan.options')}
                </span>
              </p>

              {/* Quick Benefits */}
              <div className="mt-8 max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>



        {/* Pricing Section */} 
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
              {/* Free Plan */}
              <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
                selectedPlan === 'free' 
                  ? 'border-2 border-qatar-maroon' 
                  : 'border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                    {t('sell.plan.free.title')}
                  </h2>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                    {t('sell.plan.free.description')}
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {t('sell.plan.free.price')}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('free')}
                    className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                      selectedPlan === 'free'
                        ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                        : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                    }`}
                  >
                    {t('sell.plan.free.select')}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                    {t('sell.plan.free.includes')}
                  </h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {features.free.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Featured Plan */}
              <div className={`rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 ${
                selectedPlan === 'featured' 
                  ? 'border-2 border-qatar-maroon' 
                  : 'border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
                    {t('sell.plan.featured.title')}
                  </h2>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                    {t('sell.plan.featured.description')}
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {t(`sell.plan.featured.price.${currentCountry?.code?.toLowerCase() || '00'}`)} {t(`common.currency.${currentCountry?.currency_code || 'QAR'}`)}
                    </span>
                    <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                      {t('sell.plan.featured.period')}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('featured')}
                    className={`mt-8 block w-full py-2 px-3 text-sm font-semibold rounded-md text-center border-2 transition-all duration-300 ${
                      selectedPlan === 'featured'
                        ? 'bg-qatar-maroon text-white border-qatar-maroon hover:bg-qatar-maroon/90'
                        : 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon/50 hover:bg-qatar-maroon/20 hover:border-qatar-maroon'
                    }`}
                  >
                    {t('sell.plan.featured.select')}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">
                    {t('sell.plan.featured.includes')}
                  </h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {features.featured.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleNext}
                disabled={!selectedPlan}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedPlan 
                  ? t('sell.plan.continue', { plan: selectedPlan === 'free' ? t('sell.plan.free.title') : t('sell.plan.featured.title') })
                  : t('sell.plan.selectPlan')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  width: `${((['plan-selection', 'step1', 'step2', 'step3', 'step4'].indexOf(currentStep)) / 4) * 100}%`,
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
                {currentStep === 'step1' && renderBasicInfo()}
                {currentStep === 'step2' && renderCarDetails()}
                {currentStep === 'step3' && renderImageUpload()}
                {currentStep === 'step4' && renderPreview()}
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