
import React, { useState, useEffect } from 'react';
import { getBrands, getModels, getCountries, getCities, getAllUsers, createCar, updateCar, getDealershipByUserId, getOptimizedImageUrl, setMainImage } from '../services/dataService';
import { Brand, Model, Country, City, Profile, Car, CarImage } from '../types';
import { compressImage } from '../utils/imageOptimizer';
import { Upload, X, Loader2, CheckCircle, UserCircle, ArrowLeft, ArrowRight, ShieldCheck, Image as ImageIcon, Trash2 } from 'lucide-react';
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
  const { t, selectedCountryId } = useAppContext();
  
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
  const [year, setYear] = useState<number>(currentYear);
  const [price, setPrice] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  
  const [selectedColor, setSelectedColor] = useState('');
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
  
  // Unified Image State
  const [visualImages, setVisualImages] = useState<VisualImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); // Track deletions separately
  
  const [processingImages, setProcessingImages] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Constants
  const maxImages = isFeatured || isAdmin ? 15 : 10;
  const isHighRes = isFeatured || isAdmin;

  // Initial Load
  useEffect(() => {
    getBrands().then(setBrands);
    getCountries().then(setCountries);
    
    if (isAdmin) {
        getAllUsers().then(setAllUsers);
    }
    
    // Default country from App Context if not set
    if (!selectedCountry && selectedCountryId && !initialData) {
        setSelectedCountry(selectedCountryId);
    }
  }, [isAdmin, selectedCountryId]);

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
        
        setSelectedColor(initialData.color || '');
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

  useEffect(() => {
    if (isAdmin && targetUser && !initialData) {
        if (targetUser.country_id) {
            setSelectedCountry(targetUser.country_id);
        } else if(selectedCountryId) {
            setSelectedCountry(selectedCountryId);
        }
    }
  }, [targetUser, isAdmin, selectedCountryId, initialData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return alert('User is required');
    if (!selectedBrand || !selectedModel) return alert('Brand and Model required');
    if (!selectedCountry || !selectedCity) return alert('Location required');
    if (!termsAccepted) return alert('You must accept the terms and conditions.');
    if (visualImages.length === 0) return alert('Please upload at least one image.');
    
    setUploading(true);
    
    let dealershipId: number | undefined = undefined;
    if (targetUser) {
        const dealership = await getDealershipByUserId(targetUser.id);
        if (dealership) {
            dealershipId = dealership.id;
        }
    }

    const carData: Partial<Car> = {
        brand_id: Number(selectedBrand),
        model_id: Number(selectedModel),
        country_id: Number(selectedCountry),
        city_id: Number(selectedCity),
        year,
        price: Number(price),
        mileage: Number(mileage),
        description,
        exact_model: exactModel,
        
        color: selectedColor || undefined,
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
        // Logic: 
        // 1. Delete removed images
        // 2. Upload new images
        // 3. Update main image flag. The first image in `visualImages` is the MAIN one.
        //    If `visualImages[0]` is 'existing', we set that ID as main. 
        //    If `visualImages[0]` is 'new', we set the newest uploaded one as main (handled in dataService helper).
        
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
                    // It's a new image. The `updateCar` function handles setting the latest new image as main if no existing image is passed as main.
                    // Or we can rely on `setMainImage(id, null)` which defaults to latest.
                    await setMainImage(initialData.id, null);
                }
            }
        }

    } else {
        // Create Logic - Just extract files, the first one becomes main automatically in backend usually, or we ensure order
        const filesToUpload = (visualImages.filter(img => img.type === 'new') as Extract<VisualImage, { type: 'new' }>[]).map(img => img.file);
        success = await createCar(carData, filesToUpload, targetUser.id);
    }

    setUploading(false);

    if (success) {
        alert(initialData ? 'Car updated successfully!' : 'Car listed successfully!');
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
            
            <select 
                className={inputClass}
                value={targetUser?.id || ''}
                onChange={(e) => {
                    const userId = e.target.value;
                    const foundUser = allUsers.find(u => u.id === userId);
                    setTargetUser(foundUser || null);
                }}
                disabled={!!initialData} // Disable user change on edit
            >
                <option value="">Select a User / Showroom...</option>
                {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.full_name} ({user.role}) - {user.email}
                    </option>
                ))}
            </select>
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
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Brand</label>
            <select required value={selectedBrand} onChange={e => setSelectedBrand(Number(e.target.value))} className={inputClass}>
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Model</label>
            <select required value={selectedModel} onChange={e => setSelectedModel(Number(e.target.value))} className={inputClass} disabled={!selectedBrand}>
                <option value="">Select Model</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Exact Model (Trim)</label>
            <input 
              type="text" 
              value={exactModel} 
              onChange={e => setExactModel(e.target.value)} 
              className={inputClass} 
              placeholder="e.g. GT-Line, AMG, Titanium, SE"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Year</label>
            <select 
                required 
                value={year} 
                onChange={e => setYear(Number(e.target.value))} 
                className={inputClass}
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Price (QAR)</label>
            <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className={inputClass} />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Mileage (km)</label>
            <input required type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Color</label>
            <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className={inputClass}>
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
       </div>
       
       <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Body Type</label>
                 <select value={bodyType} onChange={e => setBodyType(e.target.value)} className={inputClass}>
                    <option value="">Select Body Type</option>
                    {bodyTypes.map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Condition</label>
                 <select value={condition} onChange={e => setCondition(e.target.value)} className={inputClass}>
                    <option value="">Select Condition</option>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Fuel</label>
                 <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputClass}>
                    <option value="">Select Fuel</option>
                    {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Gearbox</label>
                 <select value={gearbox} onChange={e => setGearbox(e.target.value)} className={inputClass}>
                    <option value="">Select Gearbox</option>
                    {gearboxTypes.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Cylinders</label>
                 <select value={cylinders} onChange={e => setCylinders(e.target.value)} className={inputClass}>
                    <option value="">Select Cylinders</option>
                    {cylinderOptions.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Doors</label>
                 <select value={doors} onChange={e => setDoors(e.target.value)} className={inputClass}>
                    <option value="">Select Doors</option>
                    {doorOptions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Drive Type</label>
                 <select value={driveType} onChange={e => setDriveType(e.target.value)} className={inputClass}>
                    <option value="">Select Drive Type</option>
                    {driveTypeOptions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold mb-1 text-gray-500">Warranty</label>
                 <select value={warranty} onChange={e => setWarranty(e.target.value)} className={inputClass}>
                    <option value="">Select Warranty</option>
                    {warrantyOptions.map(w => <option key={w} value={w}>{w}</option>)}
                 </select>
              </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Country</label>
            <select 
                required 
                value={selectedCountry} 
                onChange={e => setSelectedCountry(Number(e.target.value))} 
                className={inputClass}
            >
                <option value="">Select Country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">City</label>
            <select 
                required 
                value={selectedCity} 
                onChange={e => setSelectedCity(Number(e.target.value))} 
                className={inputClass} 
                disabled={!selectedCountry}
            >
                <option value="">{selectedCountry ? 'Select City' : 'Select Country First'}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
       </div>

       <div>
         <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Description</label>
         <textarea 
            rows={4} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className={inputClass}
            placeholder="Describe the car's condition, features, history..."
         ></textarea>
       </div>

       {/* Images */}
       <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-base font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-600" />
            Upload Photos <span className="text-sm font-normal text-gray-500">({visualImages.length}/{maxImages})</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">The first image will be the main photo. Use arrows to reorder.</p>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
             {/* Render Unified Visual List */}
             {visualImages.map((img, idx) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group shadow-sm bg-gray-100 dark:bg-gray-800 transition-all hover:ring-2 hover:ring-primary-500">
                    <img 
                        src={img.type === 'existing' ? getOptimizedImageUrl(img.url, 300) : img.url} 
                        alt="preview" 
                        className="w-full h-full object-cover" 
                    />
                    
                    {/* Reorder Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                         {idx > 0 && (
                             <button type="button" onClick={() => moveImage(idx, 'left')} className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-sm transition" title="Move Left">
                                 <ArrowLeft className="w-4 h-4" />
                             </button>
                         )}
                         {idx < visualImages.length - 1 && (
                             <button type="button" onClick={() => moveImage(idx, 'right')} className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-sm transition" title="Move Right">
                                 <ArrowRight className="w-4 h-4" />
                             </button>
                         )}
                    </div>

                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md z-10 hover:bg-red-600">
                        <Trash2 className="w-3 h-3" />
                    </button>
                    
                    {/* Main Photo Badge */}
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs font-bold text-center py-1">Main Photo</span>}
                    {img.type === 'new' && idx !== 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] font-bold text-center py-0.5">New</span>}
                </div>
             ))}

             {visualImages.length < maxImages && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition bg-white dark:bg-gray-900/50 hover:shadow-inner">
                    {processingImages ? (
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1 font-medium">Add Photo</span>
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
            className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
             I confirm that I have read and agree to the <a href="#" className="text-primary-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 font-bold hover:underline">Privacy Policy</a>. 
             I declare that all information provided in this listing is accurate and truthful.
          </label>
       </div>

       <button 
         type="submit" 
         disabled={uploading || processingImages || (isAdmin && !targetUser) || !termsAccepted} 
         className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
       >
         {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
         {uploading ? 'Processing...' : initialData ? 'Update Ad' : isAdmin ? 'List Car' : 'Post Ad Now'}
       </button>
    </form>
  );
};
