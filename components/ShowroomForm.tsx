
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
    createDealership, updateDealership, uploadShowroomLogo, 
    getCountries, getCities, getOptimizedImageUrl 
} from '../services/dataService';
import { Country, City, Dealership, Profile } from '../types';
import { compressImage } from '../utils/imageOptimizer';
import { Building2, MapPin, Phone, Globe, Upload, Loader2, CheckCircle, Info, Camera } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';

// Fallback codes
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'qa': '+974', 'sa': '+966', 'ae': '+971', 'kw': '+965', 
  'bh': '+973', 'om': '+968', 'us': '+1', 'gb': '+44', 
  'eg': '+20', 'sy': '+963', 'jo': '+962', 'lb': '+961'
};

interface ShowroomFormProps {
    initialData?: Dealership; // If present, Edit Mode
    userId?: string;          // Required for Create Mode
    userProfile?: Profile | null; // Used for auto-filling details in Create Mode
    onSuccess: () => void;
}

export const ShowroomForm: React.FC<ShowroomFormProps> = ({ 
    initialData, 
    userId, 
    userProfile,
    onSuccess 
}) => {
    const { t } = useAppContext();
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [businessName, setBusinessName] = useState('');
    const [businessNameAr, setBusinessNameAr] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');

    const [location, setLocation] = useState('');
    const [locationAr, setLocationAr] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
    const [selectedCity, setSelectedCity] = useState<number | ''>('');

    const [dealershipType, setDealershipType] = useState('');
    const [businessType, setBusinessType] = useState('');

    // Phone State
    const [c1Code, setC1Code] = useState('+974');
    const [c1Num, setC1Num] = useState('');
    const [c2Code, setC2Code] = useState('+974');
    const [c2Num, setC2Num] = useState('');
    const [c3Code, setC3Code] = useState('+974');
    const [c3Num, setC3Num] = useState('');

    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [openingHours, setOpeningHours] = useState('');
    const [openingHoursAr, setOpeningHoursAr] = useState('');

    // Image State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Data Lists
    const [countries, setCountries] = useState<Country[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    // 1. Fetch Static Data
    useEffect(() => {
        getCountries().then(setCountries);
    }, []);

    // 2. Initialize Data (Edit Mode OR Create Mode Prefill)
    useEffect(() => {
        const init = async () => {
            if (initialData) {
                // --- EDIT MODE ---
                setBusinessName(initialData.business_name || '');
                setBusinessNameAr(initialData.business_name_ar || '');
                setDescription(initialData.description || '');
                setDescriptionAr(initialData.description_ar || '');
                setLocation(initialData.location || '');
                setLocationAr(initialData.location_ar || '');
                setDealershipType(initialData.dealership_type || '');
                setBusinessType(initialData.business_type || '');
                setEmail(initialData.email || '');
                setWebsite(initialData.website || '');
                setOpeningHours(initialData.opening_hours || '');
                setOpeningHoursAr(initialData.opening_hours_ar || '');
                
                if (initialData.country_id) {
                    setSelectedCountry(initialData.country_id);
                    await getCities(initialData.country_id).then(setCities);
                    setSelectedCity(initialData.city_id || '');
                }

                // Parse Phones
                parseAndSetPhone(initialData.contact_number_1, setC1Code, setC1Num);
                parseAndSetPhone(initialData.contact_number_2, setC2Code, setC2Num);
                parseAndSetPhone(initialData.contact_number_3, setC3Code, setC3Num);

            } else if (userProfile) {
                // --- CREATE MODE (Auto-fill) ---
                if (userProfile.email) setEmail(userProfile.email);
                
                // Pre-select country
                if (userProfile.country_id && countries.length > 0) {
                    setSelectedCountry(userProfile.country_id);
                    getCities(userProfile.country_id).then(setCities);
                    
                    // Set default codes based on user country
                    const userCountry = countries.find(c => c.id === userProfile.country_id);
                    if (userCountry) {
                        const code = COUNTRY_PHONE_CODES[userCountry.code.toLowerCase()] || '+974';
                        setC1Code(code); setC2Code(code); setC3Code(code);
                    }
                }

                // Parse Profile Phone
                if (userProfile.phone_number) {
                    parseAndSetPhone(userProfile.phone_number, setC1Code, setC1Num);
                }
            }
        };
        init();
    }, [initialData, userProfile, countries]);

    // Helper to parse phone numbers
    const parseAndSetPhone = (fullNumber: string | undefined, setCode: (s: string) => void, setNum: (s: string) => void) => {
        if (!fullNumber) return;
        try {
            const p = parsePhoneNumber(fullNumber);
            if (p) {
                setCode(`+${p.countryCallingCode}`);
                setNum(p.nationalNumber);
            } else {
                setNum(fullNumber);
            }
        } catch (e) {
            setNum(fullNumber);
        }
    };

    const handleCountryChange = (val: number | string) => {
        const id = Number(val);
        setSelectedCountry(id);
        setSelectedCity('');
        getCities(id).then(setCities);
        
        // Auto-update C1 code if empty in create mode
        if (!initialData && !c1Num) {
            const country = countries.find(c => c.id === id);
            if (country) {
                const code = COUNTRY_PHONE_CODES[country.code.toLowerCase()] || '+974';
                setC1Code(code);
            }
        }
    };

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressed = await compressImage(file, false, true, 100);
                setLogoFile(compressed);
                setLogoPreview(URL.createObjectURL(compressed));
            } catch (err) {
                console.error("Compression failed", err);
                alert("Could not process image. Please try another one.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!businessName || !description || !selectedCountry || !selectedCity || !dealershipType || !businessType) {
            alert("Please fill in all required fields.");
            return;
        }
        if (!initialData && !c1Num) {
             alert("Primary contact number is required.");
             return;
        }

        setSubmitting(true);

        let logoUrl = initialData?.logo_url;
        if (logoFile) {
            try {
                const uploaded = await uploadShowroomLogo(logoFile);
                if (uploaded) logoUrl = uploaded;
            } catch (err) {
                console.error(err);
                alert("Error uploading logo.");
                setSubmitting(false);
                return;
            }
        }

        const contact1 = c1Num ? `${c1Code}${c1Num.replace(/\D/g, '')}` : '';
        const contact2 = c2Num ? `${c2Code}${c2Num.replace(/\D/g, '')}` : '';
        const contact3 = c3Num ? `${c3Code}${c3Num.replace(/\D/g, '')}` : '';

        const payload: Partial<Dealership> = {
            business_name: businessName,
            business_name_ar: businessNameAr || businessName,
            description: description,
            description_ar: descriptionAr || description,
            location: location,
            location_ar: locationAr,
            country_id: Number(selectedCountry),
            city_id: Number(selectedCity),
            dealership_type: dealershipType,
            business_type: businessType,
            contact_number_1: contact1,
            contact_number_2: contact2,
            contact_number_3: contact3,
            email,
            website,
            opening_hours: openingHours,
            opening_hours_ar: openingHoursAr,
            logo_url: logoUrl
        };

        let success = false;

        if (initialData) {
            // Update
            success = await updateDealership(initialData.id, payload);
        } else {
            // Create
            if (!userId) {
                alert("User ID missing.");
                setSubmitting(false);
                return;
            }
            payload.user_id = userId;
            payload.status = 'pending';
            const created = await createDealership(payload);
            success = !!created;
        }

        setSubmitting(false);

        if (success) {
            onSuccess();
        } else {
            alert("Operation failed. Please try again.");
        }
    };

    const inputClass = "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition shadow-sm placeholder-gray-400";

    const renderPhoneInput = (
        label: string, 
        code: string, 
        setCode: (v: string) => void, 
        num: string, 
        setNum: (v: string) => void,
        required: boolean = false
    ) => (
        <div>
            <label className="block text-sm font-bold mb-1 dark:text-gray-300">
                {label} {required && '*'}
            </label>
            <div className="flex items-stretch border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white dark:bg-gray-700 transition-all shadow-sm">
                <div className="bg-gray-100 dark:bg-gray-800 px-1 flex items-center min-w-[90px]">
                    <select 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-transparent border-none text-gray-700 dark:text-gray-200 font-bold focus:ring-0 outline-none text-sm cursor-pointer py-3 text-center hover:text-primary-600"
                        style={{ textAlignLast: 'center' }}
                    >
                        {Object.entries(COUNTRY_PHONE_CODES).map(([iso, c]) => (
                            <option key={iso} value={c}>{c}</option>
                        ))}
                        <option value="+90">+90</option>
                        <option value="+91">+91</option>
                        <option value="+63">+63</option>
                    </select>
                </div>
                <input 
                    type="text" 
                    required={required}
                    value={num} 
                    onChange={(e) => setNum(e.target.value)} 
                    className="flex-1 p-3 border-0 focus:ring-0 outline-none bg-transparent text-gray-900 dark:text-white min-w-0 font-medium placeholder-gray-400"
                    placeholder="33334444" 
                />
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            
            {/* Basic Info */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" /> {t('register_showroom.business_details')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Business Name (English) *</label>
                        <input type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputClass} placeholder="e.g. Elite Motors" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300 text-right">اسم المعرض (بالعربية)</label>
                        <input type="text" value={businessNameAr} onChange={e => setBusinessNameAr(e.target.value)} className={`${inputClass} text-right`} placeholder="مثال: النخبة للسيارات" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Description (English) *</label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} className={inputClass} rows={3} placeholder="Tell us about your showroom..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300 text-right">وصف المعرض (بالعربية)</label>
                        <textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} className={`${inputClass} text-right`} rows={3} placeholder="نبذة عن المعرض..." />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Business Focus *</label>
                        <select required value={businessType} onChange={e => setBusinessType(e.target.value)} className={inputClass}>
                            <option value="" disabled>Select Business Focus</option>
                            <option value="showroom">Showroom</option>
                            <option value="service_center">Service Center</option>
                            <option value="spare_parts_dealership">Spare Parts Dealership</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Dealership Type *</label>
                        <select required value={dealershipType} onChange={e => setDealershipType(e.target.value)} className={inputClass}>
                            <option value="" disabled>Select Dealership Type</option>
                            <option value="official">Official Dealer</option>
                            <option value="private">Private Dealer</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Location */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" /> Location
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Country *</label>
                        <select required value={selectedCountry} onChange={e => handleCountryChange(e.target.value)} className={inputClass}>
                            <option value="">Select Country</option>
                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">City *</label>
                        <select required value={selectedCity} onChange={e => setSelectedCity(Number(e.target.value))} className={inputClass} disabled={!selectedCountry}>
                            <option value="">Select City</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Address (English) *</label>
                        <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="Building, Street, Area" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300 text-right">العنوان (بالعربية)</label>
                        <input type="text" value={locationAr} onChange={e => setLocationAr(e.target.value)} className={`${inputClass} text-right`} placeholder="المبنى، الشارع، المنطقة" />
                    </div>
                </div>
            </section>

            {/* Contact Details */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary-600" /> {t('register_showroom.contact_info')}
                </h3>
                
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg flex gap-3 text-sm text-primary-800 dark:text-primary-200 border border-primary-100 dark:border-primary-800">
                    <Info className="w-5 h-5 flex-shrink-0 text-primary-600" />
                    <p>Keep your contact information up to date so customers can reach you.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {renderPhoneInput("Main Contact", c1Code, setC1Code, c1Num, setC1Num, !initialData)}
                    {renderPhoneInput("Contact 2", c2Code, setC2Code, c2Num, setC2Num)}
                    {renderPhoneInput("Contact 3", c3Code, setC3Code, c3Num, setC3Num)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Business Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="sales@showroom.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Website (Optional)</label>
                        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className={inputClass} placeholder="www.showroom.com" />
                    </div>
                </div>
            </section>

            {/* Timings & Logo */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-600" /> Additional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Opening Hours (English)</label>
                        <input type="text" value={openingHours} onChange={e => setOpeningHours(e.target.value)} className={inputClass} placeholder="Sat-Thu: 8am - 9pm" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 dark:text-gray-300 text-right">ساعات العمل (بالعربية)</label>
                        <input type="text" value={openingHoursAr} onChange={e => setOpeningHoursAr(e.target.value)} className={`${inputClass} text-right`} placeholder="السبت-الخميس: ٨ ص - ٩ م" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 dark:text-gray-300">Showroom Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-48 aspect-video rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center overflow-hidden relative group border border-gray-200 dark:border-gray-600 hover:border-primary-500 transition-colors">
                            {logoPreview || initialData?.logo_url ? (
                                <img src={logoPreview || getOptimizedImageUrl(initialData?.logo_url || '', 300)} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-1 group-hover:text-primary-600 transition-colors" />
                                    <span className="text-xs text-gray-500 group-hover:text-primary-600 font-bold">Upload</span>
                                </>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                                <Camera className="w-8 h-8 text-white mb-1" />
                                <span className="text-white text-xs font-bold uppercase tracking-wide">Change Photo</span>
                            </div>

                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoSelect} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            <p className="font-bold dark:text-gray-300 mb-1">{t('dealer.profile.logo')}</p>
                            <p>{t('dealer.profile.logo_hint1')}</p>
                            <p>{t('dealer.profile.logo_hint2')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {initialData ? t('common.save_changes') : t('register_showroom.submit')}
                </button>
            </div>
        </form>
    );
};
