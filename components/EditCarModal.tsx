import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ImageCarousel from './ImageCarousel';
import ImageUpload from './ImageUpload';
import Image from 'next/image';

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
  warranty_months_remaining?: string;
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
  warranty_months_remaining: string;
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
    warranty_months_remaining: '',
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
      warranty_months_remaining: car.warranty_months_remaining || '',
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
    } else {
      setImages([]);
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
      warranty_months_remaining: car.warranty_months_remaining || '',
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

        // Set initial selected country from car data
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

  // Handle image upload
  const handleImageUpload = async (files: File[]): Promise<void> => {
    if (!car) return;
    
    setUploading(true);
    try {
      const uploadedImages: CarImage[] = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `cars/${car.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);
        
        uploadedImages.push({
          url: publicUrl,
          is_main: images.length === 0 // Set as main if no other images
        });
      }
      
      setImages(prev => [...prev, ...uploadedImages]);
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
      setImages(prev => prev.filter(img => img.url !== imageUrl));
      
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
      // Update car data
      const { error } = await supabase
        .from('cars')
        .update({
          brand_id: formData.brand_id,
          model_id: formData.model_id,
          year: formData.year,
          mileage: formData.mileage,
          price: formData.price,
          color: formData.color,
          description: formData.description,
          fuel_type: formData.fuel_type,
          gearbox_type: formData.gearbox_type,
          body_type: formData.body_type,
          condition: formData.condition,
          cylinders: formData.cylinders,
          doors: formData.doors,
          drive_type: formData.drive_type,
          warranty: formData.warranty,
          warranty_months_remaining: formData.warranty_months_remaining,
          exact_model: formData.exact_model,
          city_id: formData.city_id,
          is_featured: formData.is_featured,
          updated_at: new Date().toISOString()
        })
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
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('car.warrantyMonthsRemaining')}
                      </label>
                      <input
                        type="number"
                        value={formData.warranty_months_remaining}
                        onChange={(e) => setFormData(prev => ({ ...prev, warranty_months_remaining: e.target.value }))}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                        
                      />
                    </div>
                    <div>
                      <label className="w-full mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        <div className="rounded-md mt-4 grid grid-cols-4 gap-4">
                          {images.map((image, index) => (
                            <div key={image.url} className="relative group">
                              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
                                <Image
                                  src={image.url}
                                  alt="Car"
                                  width={128}
                                  height={160}
                                  className={`w-full h-full object-cover ${
                                    image.is_main ? 'ring-2 ring-qatar-maroon' : ''
                                  }`}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                  {!image.is_main && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMainImage(image.url)}
                                      className="p-1 bg-white rounded-full hover:bg-qatar-maroon hover:text-white transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(image.url)}
                                    className="p-1 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
