
import React, { useState, useEffect } from 'react';
import { getBrands, getModels, getCountries, getCities, getAllUsers, createCar, updateCar, getDealershipByUserId, getOptimizedImageUrl, setMainImage, getProfileByPhone, createGhostAccount } from '../services/dataService';
import { Brand, Model, Country, City, Profile, Car, CarImage } from '../types';
import { compressImage } from '../utils/imageOptimizer';
import { Upload, Loader2, CheckCircle, UserCircle, ArrowLeft, ArrowRight, Image as ImageIcon, Trash2, Star, UserPlus, Search, Globe, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Options provided
const cylinderOptions = ['Electric', '3', '4', '5', '6', '8', '10', '12', '16'];
const doorOptions = ['2', '3', '4', '5', '6+'];
const driveTypeOptions = ['FWD', 'RWD', 'AWD', '4WD'];
const warrantyOptions = ['Yes', 'No'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const gearboxTypes = ['Manual', 'Automatic'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'];
const conditions = ['New', 'Excellent', 'Good', 'Not Working'];
const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy', 'Bronze', 'Other'];

// Unified Image Type for Reordering
type VisualImage =
  | { type: 'existing'; id: string; url: string; isMain: boolean; originalData: CarImage }
  | { type: 'new'; id: string; file: File; url: string; isMain: boolean };

interface CarFormProps {
  isAdmin?: boolean;
  onSuccess: () => void;
  currentUser: Profile | null;
  initialData?: Car; // Added prop for edit mode
}

export const CarForm: React.FC<CarFormProps> = ({ isAdmin = false, onSuccess, currentUser, initialData }) => {
  const { t, selectedCountryId, language, currency } = useAppContext();

  // Data Lists
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  // Year Dropdown Data
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear + 1 - i);

  // Form State
  const [selectedBrand, setSelectedBrand] = useState<number | ''>('');
  const [selectedModel, setSelectedModel] = useState<number | ''>('');
  const [exactModel, setExactModel] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
  const [selectedCity, setSelectedCity] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [gearbox, setGearbox] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [condition, setCondition] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [doors, setDoors] = useState('');
  const [driveType, setDriveType] = useState('');
  const [warranty, setWarranty] = useState('');

  const [isFeatured, setIsFeatured] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Admin Specific
  const [targetUser, setTargetUser] = useState<Profile | null>(currentUser);

  // Ghost User Mode State
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostName, setGhostName] = useState('');
  const [ghostPhoneCode, setGhostPhoneCode] = useState('+974');
  const [ghostPhoneNum, setGhostPhoneNum] = useState('');
  const [ghostCountryId, setGhostCountryId] = useState<number | ''>('');

  // Unified Image State
  const [visualImages, setVisualImages] = useState<VisualImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); // Track deletions separately

  const [processingImages, setProcessingImages] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Constants
  const maxImages = isFeatured ? 15 : 10;
  const isHighRes = isFeatured;

  // Initial Load
  useEffect(() => {
    getBrands().then(setBrands);
    getCountries().then(setCountries);

    if (isAdmin) {
      getAllUsers().then(setAllUsers);
    }

    // --- Country Selection Logic ---
    if (!initialData) {
      if (isAdmin) {
        // Admins default to current context but can change
        if (!selectedCountry && selectedCountryId) {
          setSelectedCountry(selectedCountryId);
        }
      } else {
        // Normal Users: Prefer Profile Country > Context Country
        if (currentUser?.country_id) {
          setSelectedCountry(currentUser.country_id);
        } else if (!selectedCountry && selectedCountryId) {
          setSelectedCountry(selectedCountryId);
        }
      }
    }
  }, [isAdmin, selectedCountryId, currentUser, initialData]);

  // Populate form if initialData exists (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setSelectedBrand(initialData.brand_id);
      setSelectedModel(initialData.model_id);
      setExactModel(initialData.exact_model || '');
      setSelectedCountry(initialData.country_id || '');
      setSelectedCity(initialData.city_id || '');
      setYear(initialData.year);
      setPrice(initialData.price);
      setMileage(initialData.mileage);
      setDescription(initialData.description || '');

      setColor(initialData.color || '');
      setFuelType(initialData.fuel_type || '');
      setGearbox(initialData.gearbox_type || '');
      setBodyType(initialData.body_type || '');
      setCondition(initialData.condition || '');
      setCylinders(initialData.cylinders || '');
      setDoors(initialData.doors || '');
      setDriveType(initialData.drive_type || '');
      setWarranty(initialData.warranty || '');

      setIsFeatured(initialData.is_featured);
      setTermsAccepted(true); // Pre-accept for edit

      // Populate unified images list
      if (initialData.car_images) {
        const mappedImages: VisualImage[] = initialData.car_images
          .sort((a, b) => (a.is_main === b.is_main ? 0 : a.is_main ? -1 : 1)) // Ensure main is first initially
          .map(img => ({
            type: 'existing',
            id: img.id,
            url: img.thumbnail_url || img.image_url,
            isMain: img.is_main,
            originalData: img
          }));
        setVisualImages(mappedImages);
      }
    }
  }, [initialData]);

  // Dependent Selects
  useEffect(() => {
    if (selectedBrand) {
      getModels(Number(selectedBrand)).then(setModels);
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedCountry) {
      getCities(Number(selectedCountry)).then(setCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  // Update ghost phone code when ghost country changes (Auto-detect from country list if available)
  useEffect(() => {
    if (ghostCountryId && countries.length > 0) {
      const c = countries.find(x => x.id === Number(ghostCountryId));
      if (c && c.phone_code) {
        setGhostPhoneCode(c.phone_code);
      }
    } else if (!ghostCountryId && selectedCountry && countries.length > 0) {
      // Default to car country phone code if ghost country not set
      const c = countries.find(x => x.id === Number(selectedCountry));
      if (c && c.phone_code) {
        setGhostPhoneCode(c.phone_code);
      }
    }
  }, [ghostCountryId, selectedCountry, countries]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProcessingImages(true);
      // Cast to File[] to fix TS error: Argument of type 'unknown' is not assignable to parameter of type 'File'
      const newFiles = Array.from(e.target.files) as File[];
      const newVisuals: VisualImage[] = [];

      if (visualImages.length + newFiles.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed.`);
        setProcessingImages(false);
        return;
      }

      for (const file of newFiles) {
        try {
          const compressed = await compressImage(file, isHighRes);
          newVisuals.push({
            type: 'new',
            id: Math.random().toString(36).substr(2, 9), // Temp ID
            file: compressed,
            url: URL.createObjectURL(compressed),
            isMain: false
          });
        } catch (err) {
          console.error("Compression failed", err);
        }
      }

      setVisualImages([...visualImages, ...newVisuals]);
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = visualImages[index];

    // If it's existing, mark ID for deletion
    if (imageToRemove.type === 'existing') {
      setDeletedImageIds([...deletedImageIds, imageToRemove.id]);
    } else {
      // If it's new, revoke object URL to free memory
      URL.revokeObjectURL(imageToRemove.url);
    }

    const newImages = [...visualImages];
    newImages.splice(index, 1);
    setVisualImages(newImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === visualImages.length - 1) return;

    const newImages = [...visualImages];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    // Swap
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setVisualImages(newImages);
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const newImages = [...visualImages];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    setVisualImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isAdmin && !targetUser) return alert('User is required');
    if (isAdmin && !isGhostMode && !targetUser) return alert('Please select a user to list for.');
    if (isAdmin && isGhostMode && (!ghostName || !ghostPhoneNum)) return alert('Ghost user details required.');

    if (!selectedBrand || !selectedModel) return alert('Brand and Model required');
    if (!selectedCountry || !selectedCity) return alert('Location required');
    if (!year) return alert('Year is required');
    if (!description) return alert('Description is required');

    // New validation requirements
    if (!condition) return alert('Condition is required');
    if (!bodyType) return alert('Body Type is required');
    if (!fuelType) return alert('Fuel Type is required');
    if (!gearbox) return alert('Gearbox (Transmission) is required');

    if (!termsAccepted) return alert('You must accept the terms and conditions.');
    if (visualImages.length === 0) return alert('Please upload at least one image.');

    setUploading(true);

    let finalUserId: string;

    // 1. Resolve User ID (Admin Mode)
    if (isAdmin && isGhostMode) {
      // Construct full phone
      const fullPhone = `${ghostPhoneCode}${ghostPhoneNum.replace(/\D/g, '')}`;

      // Use Ghost Country dropdown IF selected, otherwise default to Car Location Country
      const finalGhostCountryId = ghostCountryId || Number(selectedCountry);

      // A. Check existing by phone
      const existingProfile = await getProfileByPhone(fullPhone);

      if (existingProfile) {
        finalUserId = existingProfile.id;
        console.log("Found existing user for offline seller:", existingProfile.full_name);
      } else {
        // B. Create new Ghost Account
        const newId = await createGhostAccount(ghostName, fullPhone, finalGhostCountryId);
        if (!newId) {
          alert("Failed to create ghost account. Check phone number format or server logs.");
          setUploading(false);
          return;
        }
        finalUserId = newId;
        console.log("Created new ghost user:", newId);
      }
    } else {
      // Regular User or Admin selecting existing
      if (!targetUser) {
        setUploading(false);
        return;
      }
      finalUserId = targetUser.id;
    }

    // 2. Resolve Dealership (if applicable for finalUser)
    let dealershipId: number | undefined = undefined;
    const dealership = await getDealershipByUserId(finalUserId);
    if (dealership) {
      dealershipId = dealership.id;
    }

    // 3. Prepare Data
    const carData: Partial<Car> = {
      brand_id: Number(selectedBrand),
      model_id: Number(selectedModel),
      country_id: Number(selectedCountry),
      city_id: Number(selectedCity),
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      description,
      exact_model: exactModel,

      color: color || undefined,
      fuel_type: fuelType || undefined,
      gearbox_type: gearbox || undefined,
      body_type: bodyType || undefined,
      condition: condition || undefined,
      cylinders: cylinders || undefined,
      doors: doors || undefined,
      drive_type: driveType || undefined,
      warranty: warranty || undefined,

      dealership_id: dealershipId,

      is_featured: isAdmin ? isFeatured : false,
      status: isAdmin ? 'approved' : 'pending',
    };

    let success;
    if (initialData) {
      // Prepare data for Update
      const newFiles = (visualImages.filter(img => img.type === 'new') as Extract<VisualImage, { type: 'new' }>[]).map(img => img.file);

      // We only pass IDs of existing images that remain, in their specific order
      const existingIdsOrdered = visualImages
        .filter(img => img.type === 'existing')
        .map(img => img.id);

      // Update Logic
      success = await updateCar(
        initialData.id,
        carData,
        newFiles,
        deletedImageIds,
        existingIdsOrdered,
        isAdmin
      );

      if (success) {
        // Explicitly set the Main Image based on Visual Order
        const firstImage = visualImages[0];
        if (firstImage) {
          if (firstImage.type === 'existing') {
            await setMainImage(initialData.id, firstImage.id);
          } else {
            await setMainImage(initialData.id, null);
          }
        }
      }

    } else {
      // Create Logic
      const filesToUpload = (visualImages.filter(img => img.type === 'new') as Extract<VisualImage, { type: 'new' }>[]).map(img => img.file);
      success = await createCar(carData, filesToUpload, finalUserId);
    }

    setUploading(false);

    if (success) {
      alert(initialData ? t('form.success_update') : t('form.success_post'));
      onSuccess();
    } else {
      alert('Failed to save car. Please try again.');
    }
  };

  const inputClass = "w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm outline-none placeholder-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-primary-600" />
            List On Behalf Of
          </label>

          {!initialData ? (
            <>
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 mb-4 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsGhostMode(false)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition ${!isGhostMode ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Search className="w-4 h-4 inline mr-1" /> Search Database
                </button>
                <button
                  type="button"
                  onClick={() => setIsGhostMode(true)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition ${isGhostMode ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UserPlus className="w-4 h-4 inline mr-1" /> Offline Seller
                </button>
              </div>

              {!isGhostMode ? (
                <select
                  className={inputClass}
                  value={targetUser?.id || ''}
                  onChange={(e) => {
                    const userId = e.target.value;
                    const foundUser = allUsers.find(u => u.id === userId);
                    setTargetUser(foundUser || null);
                  }}
                >
                  <option value="">Select a Registered User...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} {user.is_ghost ? '(Offline Account)' : `(${user.role})`} - {user.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                    <span className="font-bold">Note:</span> If phone number exists, ad will link to existing user. Otherwise, a placeholder account is created.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Seller Name</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={ghostName}
                        onChange={(e) => setGhostName(e.target.value)}
                        placeholder="e.g. Mohammed Ali"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                      <div className="flex gap-2">
                        <select
                          className="w-24 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
                          value={ghostPhoneCode}
                          onChange={(e) => setGhostPhoneCode(e.target.value)}
                        >
                          <option value="+974">+974 (QA)</option>
                          <option value="+966">+966 (SA)</option>
                          <option value="+971">+971 (AE)</option>
                          <option value="+965">+965 (KW)</option>
                          <option value="+973">+973 (BH)</option>
                          <option value="+968">+968 (OM)</option>
                          <option value="+962">+962 (JO)</option>
                          <option value="+20">+20 (EG)</option>
                        </select>
                        <input
                          type="tel"
                          className={inputClass}
                          value={ghostPhoneNum}
                          onChange={(e) => setGhostPhoneNum(e.target.value)}
                          placeholder="33334444"
                        />
                      </div>
                    </div>
                    {/* User Country Selector for Ghost Account */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Seller Country
                      </label>
                      <select
                        className={inputClass}
                        value={ghostCountryId}
                        onChange={(e) => setGhostCountryId(Number(e.target.value))}
                      >
                        <option value="">Same as Car Location (Default)</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>
                            {language === 'ar' ? c.name_ar : c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Edit Mode: Show read-only user info
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">
                {targetUser?.full_name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">{targetUser?.full_name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500">{targetUser?.email}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800">
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
          />
          <label htmlFor="isFeatured" className="font-bold text-gray-800 dark:text-gray-200 cursor-pointer">Set as Featured Listing (Allows 15 High-Res Photos)</label>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('form.brand')} <span className="text-red-500">*</span></label>
          <select required value={selectedBrand} onChange={e => setSelectedBrand(Number(e.target.value))} className={inputClass}>
            <option value="">{t('form.select')} {t('form.brand')}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {language === 'ar' ? (b.name_ar || b.name) : b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('form.model')} <span className="text-red-500">*</span></label>
          <select required value={selectedModel} onChange={e => setSelectedModel(Number(e.target.value))} className={inputClass} disabled={!selectedBrand}>
            <option value="">{t('form.select')} {t('form.model')}</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {language === 'ar' ? (m.name_ar || m.name) : m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('form.exact_model')}</label>
          <input
            type="text"
            value={exactModel}
            onChange={e => setExactModel(e.target.value)}
            className={inputClass}
            placeholder="e.g. GT-Line, AMG, Titanium, SE"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('common.price')} ({currency}) <span className="text-red-500">*</span></label>
          <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className={inputClass} placeholder="00000" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('common.mileage')} (km) <span className="text-red-500">*</span></label>
          <input required type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className={inputClass} placeholder="00000" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('common.year')} <span className="text-red-500">*</span></label>
          <select
            required
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className={inputClass}
          >
            <option value="">{t('form.select')} {t('common.year')}</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('car.condition')} <span className="text-red-500">*</span></label>
          <select required value={condition} onChange={e => setCondition(e.target.value)} className={inputClass}>
            <option value="">{t('form.select')} {t('car.condition')}</option>
            {conditions.map(c => <option key={c} value={c}>{t(`condition.${c.toLowerCase().replace(' ', '_')}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('car.specifications')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.body_type')} <span className="text-red-500">*</span></label>
            <select required value={bodyType} onChange={e => setBodyType(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {bodyTypes.map(b => <option key={b} value={b}>{t(`body.${b.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.gearbox')} <span className="text-red-500">*</span></label>
            <select required value={gearbox} onChange={e => setGearbox(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {gearboxTypes.map(g => <option key={g} value={g}>{t(`gearbox.${g.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.fuel')} <span className="text-red-500">*</span></label>
            <select required value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {fuelTypes.map(f => <option key={f} value={f}>{t(`fuel.${f.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.color')} <span className="text-red-500">*</span></label>
            <select required value={color} onChange={e => setColor(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {colors.map(c => <option key={c} value={c}>{t(`color.${c.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.cylinders')}</label>
            <select value={cylinders} onChange={e => setCylinders(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {cylinderOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.doors')}</label>
            <select value={doors} onChange={e => setDoors(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {doorOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.drive_type')}</label>
            <select value={driveType} onChange={e => setDriveType(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {driveTypeOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500">{t('car.warranty')}</label>
            <select value={warranty} onChange={e => setWarranty(e.target.value)} className={inputClass}>
              <option value="">{t('form.select')}</option>
              {warrantyOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
            {t('form.country')} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedCountry}
            onChange={e => setSelectedCountry(Number(e.target.value))}
            className={`${inputClass} ${!isAdmin ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''}`}
            disabled={!isAdmin}
          >
            <option value="">{t('form.select')} {t('form.country')}</option>
            {countries.map(c => (
              <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name}</option>
            ))}
          </select>
          {!isAdmin && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked to your profile location.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('form.city')} <span className="text-red-500">*</span></label>
          <select
            required
            value={selectedCity}
            onChange={e => setSelectedCity(Number(e.target.value))}
            className={inputClass}
            disabled={!selectedCountry}
          >
            <option value="">{selectedCountry ? `${t('form.select')} ${t('form.city')}` : 'Select Country First'}</option>
            {cities.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">{t('form.description')} <span className="text-red-500">*</span></label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={inputClass}
          placeholder={t('form.desc_placeholder')}
        ></textarea>
      </div>

      {/* Images */}
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <label className="block text-base font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary-600" />
          {t('form.upload_photos')} <span className="text-red-500">*</span> <span className="text-sm font-normal text-gray-500">({visualImages.length}/{maxImages})</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">{t('form.photo_instruction')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render Unified Visual List */}
          {visualImages.map((img, idx) => (
            <div key={img.id} className="relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 group shadow-md bg-gray-100 dark:bg-gray-800 transition-all hover:border-primary-500 hover:shadow-xl">
              <img
                src={img.type === 'existing' ? getOptimizedImageUrl(img.url, 800) : img.url}
                alt="preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Enhanced Overlay with Arrows and Bottom Bar */}
              <div className="absolute inset-0 transition-all duration-300">
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                {/* Reorder Arrows */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                  {idx > 0 ? (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'left')}
                      className="p-3 bg-black/60 hover:bg-black text-white rounded-full transition shadow-xl pointer-events-auto backdrop-blur-sm"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  ) : <div />}

                  {idx < visualImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'right')}
                      className="p-3 bg-black/60 hover:bg-black text-white rounded-full transition shadow-xl pointer-events-auto backdrop-blur-sm"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Main Photo Badge (Top Left) */}
                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-10">
                    <Star className="w-3 h-3 fill-current" />
                    {t('form.main_photo')}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between gap-3">
                  {idx > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAsMain(idx)}
                      className="flex items-center gap-2 px-2 py-1 bg-[#8b1538] hover:bg-[#a01840] text-white rounded-md text-sm font-black transition-all shadow-lg active:scale-95"
                    >
                      <Star className="w-3 h-3" />
                      {t('form.set_main')}
                    </button>
                  ) : (
                    <div className="flex-1" /> // Spacer for the first image
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="flex items-center gap-2 px-3 py-1 bg-[#2d3748] hover:bg-[#1a202c] text-white rounded-md text-sm font-black transition-all shadow-lg active:scale-95 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t('form.remove')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {visualImages.length < maxImages && (
            <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all bg-white dark:bg-gray-900/50 hover:shadow-xl group">
              {processingImages ? (
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              ) : (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-bold group-hover:text-primary-600 transition-colors">{t('form.add_more_photos')}</span>
                  <span className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                </>
              )}
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" disabled={processingImages} />
            </label>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
          {t('form.terms_agree')} <a href="#" className="text-primary-600 font-bold hover:underline">{t('footer.terms')}</a> & <a href="#" className="text-primary-600 font-bold hover:underline">{t('footer.privacy')}</a>.
        </label>
      </div>

      <button
        type="submit"
        disabled={uploading || processingImages || (isAdmin && !isGhostMode && !targetUser) || !termsAccepted}
        className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
        {uploading ? t('form.processing') : initialData ? t('form.update_ad') : isAdmin ? 'List Car' : t('form.submit_ad')}
      </button>
    </form>
  );
};
