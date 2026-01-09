
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { createDealership, uploadShowroomLogo, getCountries, getCities, getDealershipByUserId } from '../services/dataService';
import { Country, City, Dealership } from '../types';
import { compressImage } from '../utils/imageOptimizer';
import { Building2, MapPin, Phone, Globe, Upload, Loader2, CheckCircle, Info } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';

// Fallback codes if API fails or for initial state
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'qa': '+974', 'sa': '+966', 'ae': '+971', 'kw': '+965', 
  'bh': '+973', 'om': '+968', 'us': '+1', 'gb': '+44', 
  'eg': '+20', 'sy': '+963', 'jo': '+962', 'lb': '+961'
};

export const RegisterShowroomPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useAppContext();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
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
  
  // Split Phone State
  // Contact 1
  const [c1Code, setC1Code] = useState('+974');
  const [c1Num, setC1Num] = useState('');
  // Contact 2
  const [c2Code, setC2Code] = useState('+974');
  const [c2Num, setC2Num] = useState('');
  // Contact 3
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

  useEffect(() => {
    const init = async () => {
      if (!user) {
          navigate(`/${countryCode}/login`);
          return;
      }

      // Check if already a dealer
      const existing = await getDealershipByUserId(user.id);
      if (existing) {
          alert("You are already registered as a dealer.");
          navigate(`/${countryCode}/showrooms/${existing.id}`);
          return;
      }

      const countriesData = await getCountries();
      setCountries(countriesData);
      setChecking(false);
    };
    init();
  }, [user, countryCode, navigate]);

  // Pre-fill Logic & Default Phone Codes based on Profile
  useEffect(() => {
    if (profile && countries.length > 0) {
      if (profile.email && !email) setEmail(profile.email);
      if (profile.country_id) {
          if (!selectedCountry) handleCountryChange(profile.country_id);
          
          // Set default codes for C2 and C3 based on user country
          const userCountry = countries.find(c => c.id === profile.country_id);
          if (userCountry) {
              const code = COUNTRY_PHONE_CODES[userCountry.code.toLowerCase()] || '+974';
              // Always set the default code for optional fields if they are empty
              if (!c2Num) setC2Code(code);
              if (!c3Num) setC3Code(code);
              // Also set C1 code default if empty, though parse logic below might override
              if (!c1Num) setC1Code(code);
          }
      }
      
      // Auto-fill Contact 1 from Profile Phone using libphonenumber-js
      if (profile.phone_number && !c1Num) {
          try {
              const phoneNumber = parsePhoneNumber(profile.phone_number);
              if (phoneNumber) {
                  setC1Code(`+${phoneNumber.countryCallingCode}`);
                  setC1Num(phoneNumber.nationalNumber);
              }
          } catch (e) {
              console.warn("Could not parse profile phone number", e);
              setC1Num(profile.phone_number);
          }
      }
    } else if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [profile, user, countries]);

  const handleCountryChange = (val: number | string) => {
      const id = Number(val);
      setSelectedCountry(id);
      getCities(id).then(setCities);
      
      // Auto-select phone codes if inputs are empty
      const country = countries.find(c => c.id === id);
      if (country) {
          const code = COUNTRY_PHONE_CODES[country.code.toLowerCase()] || '+974';
          // Only override if the number is empty (prevent overwriting user input)
          if (!c1Num) setC1Code(code);
          if (!c2Num) setC2Code(code);
          if (!c3Num) setC3Code(code);
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
      if (!user) return;
      if (!businessName || !description || !selectedCountry || !selectedCity || !c1Num || !dealershipType || !businessType) {
          alert("Please fill in all required fields.");
          return;
      }

      setLoading(true);

      let logoUrl = null;
      if (logoFile) {
          try {
              logoUrl = await uploadShowroomLogo(logoFile);
              if (!logoUrl) {
                  alert("Logo upload failed. Proceeding without logo.");
              }
          } catch (err) {
              alert("Error uploading logo. Please try again.");
              setLoading(false);
              return;
          }
      }

      // Combine code + number (Stripping non-digits from input before saving)
      const contact1 = c1Num ? `${c1Code}${c1Num.replace(/\D/g, '')}` : '';
      const contact2 = c2Num ? `${c2Code}${c2Num.replace(/\D/g, '')}` : '';
      const contact3 = c3Num ? `${c3Code}${c3Num.replace(/\D/g, '')}` : '';

      const dealershipData: Partial<Dealership> = {
          user_id: user.id,
          business_name: businessName,
          business_name_ar: businessNameAr || businessName, 
          description: description,
          description_ar: descriptionAr || description,
          location: location,
          location_ar: locationAr,
          dealership_type: dealershipType,
          business_type: businessType,
          country_id: Number(selectedCountry),
          city_id: Number(selectedCity),
          logo_url: logoUrl || undefined,
          contact_number_1: contact1,
          contact_number_2: contact2,
          contact_number_3: contact3,
          email: email,
          website: website,
          opening_hours: openingHours,
          opening_hours_ar: openingHoursAr,
          status: 'pending'
      };

      const result = await createDealership(dealershipData);

      if (result) {
          alert("Registration submitted successfully! Please wait for admin approval.");
          navigate(`/${countryCode}`);
      } else {
          alert("Failed to register. Please try again.");
      }
      setLoading(false);
  };

  if (checking) return (
      <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
  );

  const inputClass = "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none";

  // Reusable Phone Input Component Structure
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
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white dark:bg-gray-700 transition-all shadow-sm">
              <select 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)}
                  className="w-[90px] p-3 bg-gray-50 dark:bg-gray-800 border-0 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-0 outline-none text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 h-full text-center"
              >
                  {Object.entries(COUNTRY_PHONE_CODES).map(([iso, c]) => (
                      <option key={iso} value={c}>{c}</option>
                  ))}
                  <option value="+90">+90</option>
                  <option value="+91">+91</option>
                  <option value="+63">+63</option>
              </select>
              <input 
                  type="text" 
                  required={required}
                  value={num} 
                  onChange={(e) => setNum(e.target.value)} 
                  className="flex-1 p-3 border-0 focus:ring-0 outline-none bg-transparent text-gray-900 dark:text-white min-w-0"
                  placeholder="5006 0000" 
              />
          </div>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('register_showroom.title')}</h1>
            <p className="text-gray-500">{t('register_showroom.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            
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
                    {/* Swapped Positions: Business Focus First */}
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
                
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p>Primary contact is automatically filled from your profile. You can change it or add more.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {renderPhoneInput("Main Contact", c1Code, setC1Code, c1Num, setC1Num, true)}
                    {renderPhoneInput("Contact 2 (Optional)", c2Code, setC2Code, c2Num, setC2Num)}
                    {renderPhoneInput("Contact 3 (Optional)", c3Code, setC3Code, c3Num, setC3Num)}
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
                        <div className="w-48 aspect-video rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center overflow-hidden relative group border border-gray-200 dark:border-gray-600">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">Upload</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden cursor-pointer absolute inset-0 opacity-0" />
                        </div>
                        <div className="text-sm text-gray-500">
                            <p>Upload a high-quality logo.</p>
                            <p>Ratio 16:9 preferred.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {loading ? "Submitting Application..." : t('register_showroom.submit')}
                </button>
            </div>
        </form>
    </div>
  );
};
