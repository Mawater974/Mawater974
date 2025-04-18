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

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onUpdate: () => void;
  onEditComplete: () => void;
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
  exact_model: string;
  city_id: string;
  is_featured: boolean;
}

export default function EditCarModal({ isOpen, onClose, car, onUpdate, onEditComplete }: EditCarModalProps) {
  const { t, language } = useLanguage();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
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
    exact_model: '',
    city_id: '',
    is_featured: false,
  });

  const [images, setImages] = useState<CarImage[]>(
    (car.images || []).map((img: any) => ({
      url: typeof img === 'string' ? img : img.url,
      is_main: typeof img === 'string' ? false : img.is_main
    }))
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
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
        if (car?.city?.country_id) {
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
        if (car?.brand?.id) {
          const { data: modelsData } = await supabase
            .from('models')
            .select('*')
            .eq('brand_id', car.brand.id)
            .order('name');
          setModels(modelsData || []);
        }

        // Set initial form data
        if (car) {
          setFormData({
            brand_id: car.brand?.id || '',
            model_id: car.model?.id || '',
            year: car.year || new Date().getFullYear(),
            mileage: car.mileage || '',
            price: car.price || '',
            color: car.color || '',
            description: car.description || '',
            fuel_type: car.fuel_type || '',
            gearbox_type: car.gearbox_type || '',
            body_type: car.body_type || '',
            condition: car.condition || '',
            cylinders: car.cylinders || '',
            exact_model: car.exact_model || '',
            city_id: car.city?.id || '',
            is_featured: car.is_featured || false
          });
        }

        // Fetch images
        if (car?.id) {
          const { data: imagesData } = await supabase
            .from('car_images')
            .select('*')
            .eq('car_id', car.id)
            .order('is_main', { ascending: false });
          
          if (imagesData) {
            setImages(imagesData.map((img: any) => ({
              url: img.url,
              is_main: img.is_main
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.fetchError'));
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, car, supabase, t]);

  // Handle country change
  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);
    
    // Reset city selection
    setFormData(prev => ({ ...prev, city_id: '' }));
    
    // Fetch cities for selected country
    if (countryId) {
      try {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', countryId)
          .order('name');
        setCities(citiesData || []);
      } catch (error) {
        console.error('Error fetching cities:', error);
        toast.error(t('common.fetchError'));
      }
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

  const handleImageUpload = async (files: File[]) => {
    setLoading(true);
    try {
      const newImages = [];
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User must be logged in to upload images');
      }
      
      if (!car.id) {
        throw new Error('Car ID is required for image upload');
      }

      for (const file of files) {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2);
        const fileName = `car-images/${user.id}/${car.id}/${uniqueId}.${fileExt}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(fileName);

        // Create database record
        const { error: dbError } = await supabase
          .from('car_images')
          .insert({
            car_id: car.id,
            url: publicUrl,
            is_main: images.length === 0
          });

        if (dbError) {
          // If database insert fails, clean up the uploaded file
          await supabase.storage
            .from('car-images')
            .remove([fileName]);
          throw new Error(dbError.message);
        }

        newImages.push({
          url: publicUrl,
          is_main: images.length === 0
        });
      }

      // Update local state with new images
      setImages(prev => [...prev, ...newImages]);
      
      // Update the car's featured image if this is the first image
      if (images.length === 0 && newImages.length > 0) {
        await handleSetMainImage(newImages[0].url);
      }
      
      toast.success(t('common.imageUploadSuccess'));
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message || t('common.imageUploadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetMainImage = async (imageUrl: string) => {
    try {
      // Update all images to not be main
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
      setImages(images.map(img => ({
        ...img,
        is_main: img.url === imageUrl
      })));

      toast.success(t('common.mainImageUpdated'));
    } catch (error) {
      console.error('Error updating main image:', error);
      toast.error(t('common.updateError'));
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User must be logged in to delete images');
      }

      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = `car-images/${user.id}/${car.id}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('car-images')
        .remove([fileName]);

      if (storageError) throw new Error(storageError.message);

      // Delete from database
      const { error: dbError } = await supabase
        .from('car_images')
        .delete()
        .eq('car_id', car.id)
        .eq('url', imageUrl);

      if (dbError) throw new Error(dbError.message);

      // Update local state
      const newImages = images.filter(img => img.url !== imageUrl);
      setImages(newImages);

      // If the deleted image was the main image, set a new main image
      if (images.find(img => img.url === imageUrl)?.is_main && newImages.length > 0) {
        await handleSetMainImage(newImages[0].url);
      }

      toast.success(t('common.imageDeleted'));
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || t('common.deleteError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: carData, error: updateError } = await supabase
        .from('cars')
        .update({
          ...formData,
          status: 'Pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', car.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Handle image updates
      if (images.length > 0) {
        // First, delete old images that are not in the new list
        const oldImages = car.images || [];
        const newImageUrls = images.map((img) => img.url);
        
        const imagesToDelete = oldImages.filter((oldImg: any) => 
          !newImageUrls.includes(oldImg.url)
        );

        if (imagesToDelete.length > 0) {
          await supabase
            .from('car_images')
            .delete()
            .in('url', imagesToDelete.map((img: any) => img.url));
        }

        // Then, update all images for this car
        await supabase
          .from('car_images')
          .update(images.map(img => ({
            is_main: img.is_main ? true : false,
            url: img.url
          })))
          .eq('car_id', car.id);

        // If there's a main image, ensure only one is marked as main
        const mainImage = images.find(img => img.is_main);
        if (mainImage) {
          // Update all other images to not be main
          await supabase
            .from('car_images')
            .update({ is_main: false })
            .eq('car_id', car.id)
            .neq('url', mainImage.url);
        }
      }

      toast.success(t('cars.updateSuccess'));
      onUpdate();
      onEditComplete();
      onClose();
    } catch (error: any) {
      console.error('Error updating car:', error);
      toast.error(error.message || t('cars.updateError'));
    } finally {
      setLoading(false);
    }
  };

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
                        {t('car.price')} {t(`common.currency.${car.country?.currency_code || 'QAR'}`)}
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
