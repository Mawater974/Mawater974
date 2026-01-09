
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getDealershipByUserId, getDealershipCars, updateCarStatus, deleteCar, updateDealership, uploadShowroomLogo, getOptimizedImageUrl } from '../../services/dataService';
import { Dealership, Car } from '../../types';
import { CarForm } from '../../components/CarForm';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { compressImage } from '../../utils/imageOptimizer';
import { parsePhoneNumber } from 'libphonenumber-js';
import { 
    LayoutDashboard, Car as CarIcon, Settings, BarChart, 
    PlusCircle, Edit, Trash2, Eye, TrendingUp, CheckCircle, 
    AlertCircle, Upload, MapPin, Globe, Phone, Mail, Building2, Warehouse
} from 'lucide-react';

const COUNTRY_PHONE_CODES: Record<string, string> = {
  'qa': '+974', 'sa': '+966', 'ae': '+971', 'kw': '+965', 
  'bh': '+973', 'om': '+968', 'us': '+1', 'gb': '+44', 
  'eg': '+20', 'sy': '+963', 'jo': '+962', 'lb': '+961'
};

export const DealerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useAppContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'profile'>('dashboard');
  const [dealer, setDealer] = useState<Dealership | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<Dealership>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Split Phone States for Editing
  const [c1Code, setC1Code] = useState('+974');
  const [c1Num, setC1Num] = useState('');
  const [c2Code, setC2Code] = useState('+974');
  const [c2Num, setC2Num] = useState('');
  const [c3Code, setC3Code] = useState('+974');
  const [c3Num, setC3Num] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const dealerData = await getDealershipByUserId(user.id);
    if (dealerData) {
        setDealer(dealerData);
        setProfileForm(dealerData);
        
        // Parse existing phone numbers to split into code + number
        if(dealerData.contact_number_1) {
            try {
                const p = parsePhoneNumber(dealerData.contact_number_1);
                if(p) { setC1Code(`+${p.countryCallingCode}`); setC1Num(p.nationalNumber); }
                else setC1Num(dealerData.contact_number_1);
            } catch(e) { setC1Num(dealerData.contact_number_1); }
        }
        if(dealerData.contact_number_2) {
            try {
                const p = parsePhoneNumber(dealerData.contact_number_2);
                if(p) { setC2Code(`+${p.countryCallingCode}`); setC2Num(p.nationalNumber); }
                else setC2Num(dealerData.contact_number_2);
            } catch(e) { setC2Num(dealerData.contact_number_2); }
        }
        if(dealerData.contact_number_3) {
            try {
                const p = parsePhoneNumber(dealerData.contact_number_3);
                if(p) { setC3Code(`+${p.countryCallingCode}`); setC3Num(p.nationalNumber); }
                else setC3Num(dealerData.contact_number_3);
            } catch(e) { setC3Num(dealerData.contact_number_3); }
        }

        const dealerCars = await getDealershipCars(user.id);
        setCars(dealerCars);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Actions
  const handleDeleteCar = async (id: number) => {
      if (confirm("Are you sure you want to archive this listing?")) {
          await deleteCar(id);
          fetchData();
      }
  };

  const handleStatusToggle = async (car: Car) => {
      const newStatus = car.status === 'sold' ? 'approved' : 'sold';
      if (confirm(`Mark this car as ${newStatus}?`)) {
          await updateCarStatus(car.id, newStatus);
          fetchData();
      }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              // Enforce 100KB limit for profile updates too
              const compressed = await compressImage(file, false, true, 100);
              setLogoFile(compressed);
              setLogoPreview(URL.createObjectURL(compressed));
          } catch(err) {
              console.error(err);
              alert("Failed to process image. It might be too large.");
          }
      }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!dealer) return;
      setSavingProfile(true);

      let logoUrl = dealer.logo_url;
      if (logoFile) {
          const uploaded = await uploadShowroomLogo(logoFile);
          if (uploaded) logoUrl = uploaded;
      }

      // Reconstruct Phone Numbers
      const finalC1 = c1Num ? `${c1Code}${c1Num}` : '';
      const finalC2 = c2Num ? `${c2Code}${c2Num}` : '';
      const finalC3 = c3Num ? `${c3Code}${c3Num}` : '';

      const success = await updateDealership(dealer.id, {
          ...profileForm,
          logo_url: logoUrl,
          contact_number_1: finalC1,
          contact_number_2: finalC2,
          contact_number_3: finalC3,
      });

      if (success) {
          alert("Profile updated successfully!");
          fetchData();
      } else {
          alert("Failed to update profile.");
      }
      setSavingProfile(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!dealer) return <div className="p-8 text-center">No dealership account found. Please register first.</div>;

  // Stats Calculation
  const totalViews = cars.reduce((acc, car) => acc + (car.views_count || 0), 0);
  const activeListings = cars.filter(c => c.status === 'approved').length;

  // Updated Styles for Light Theme readability
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5";
  const inputClass = "w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition shadow-sm placeholder-gray-400";

  const renderPhoneInput = (
      label: string, 
      code: string, 
      setCode: (v: string) => void, 
      num: string, 
      setNum: (v: string) => void
  ) => (
      <div>
          <label className={labelClass}>{label}</label>
          <div className="flex gap-2">
              <select 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)}
                  className="w-28 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm cursor-pointer"
              >
                  {Object.entries(COUNTRY_PHONE_CODES).map(([iso, c]) => (
                      <option key={iso} value={c}>{iso.toUpperCase()} {c}</option>
                  ))}
                  <option value="+90">TR +90</option>
                  <option value="+91">IN +91</option>
              </select>
              <input 
                  type="tel" 
                  value={num} 
                  onChange={(e) => setNum(e.target.value.replace(/\D/g, ''))} 
                  className={inputClass} 
                  placeholder="33334444" 
              />
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans pb-12">
        {/* Header & Tabs Container */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-20 z-30">
            <div className="container mx-auto px-4 pt-6 max-w-7xl">
                {/* Dealer Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-32 aspect-video rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700 overflow-hidden shrink-0">
                        {dealer.logo_url ? (
                            <img src={getOptimizedImageUrl(dealer.logo_url, 150)} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                            <Building2 className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white line-clamp-1">{dealer.business_name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <span>Dealer Portal</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className={`flex items-center gap-1 ${dealer.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {dealer.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                {dealer.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'dashboard' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> {t('dealer.overview')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'inventory' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <CarIcon className="w-5 h-5" /> {t('dealer.inventory')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'profile' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Settings className="w-5 h-5" /> {t('dealer.profile')}
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            {activeTab === 'dashboard' && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.total_cars')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{cars.length}</h3>
                                </div>
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                    <CarIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.active_listings')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{activeListings}</h3>
                                </div>
                                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.total_views')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalViews}</h3>
                                </div>
                                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                                    <Eye className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Status</p>
                                    <h3 className="text-2xl font-bold text-white">Standard</h3>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
                                    <BarChart className="w-5 h-5" />
                                </div>
                            </div>
                            <button className="mt-4 text-xs bg-white text-gray-900 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition">
                                Upgrade Plan
                            </button>
                        </div>
                    </div>

                    {/* Chart Mock */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance Analytics</h3>
                        <p className="text-gray-500 text-sm mt-1">Detailed traffic analysis and lead reports coming soon.</p>
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold dark:text-white">{t('dealer.inventory')}</h2>
                        <button 
                            onClick={() => { setEditingCar(null); setIsCarModalOpen(true); }}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-900/20 transition transform hover:-translate-y-0.5"
                        >
                            <PlusCircle className="w-5 h-5" /> {t('dealer.add_car')}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-bold text-xs border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">{t('dealer.table.car_details')}</th>
                                        <th className="px-6 py-4">{t('common.price')}</th>
                                        <th className="px-6 py-4">{t('dealer.table.status')}</th>
                                        <th className="px-6 py-4">{t('dealer.total_views')}</th>
                                        <th className="px-6 py-4 text-right">{t('dealer.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {cars.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-gray-500">{t('dealer.no_cars')}</td></tr>
                                    ) : cars.map(car => (
                                        <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                                        {car.car_images?.[0] ? (
                                                            <img src={car.car_images[0].thumbnail_url || car.car_images[0].image_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <Warehouse className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{car.brands?.name} {car.models?.name}</p>
                                                        <p className="text-xs text-gray-500">{car.year} • {car.exact_model}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-200">
                                                {car.price.toLocaleString()} QAR
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    car.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    car.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                                                    car.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {car.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">
                                                {car.views_count || 0}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleStatusToggle(car)}
                                                        className={`p-2 rounded-lg transition ${car.status === 'sold' ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                        title={car.status === 'sold' ? "Mark Available" : "Mark Sold"}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setEditingCar(car); setIsCarModalOpen(true); }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCar(car.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Archive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="max-w-4xl space-y-6">
                    <h2 className="text-2xl font-bold dark:text-white mb-6">{t('dealer.profile')}</h2>
                    
                    <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">
                        {/* Logo Upload */}
                        <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                            <div className="w-48 aspect-video rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center overflow-hidden relative group border border-gray-300 dark:border-gray-600">
                                {logoPreview || dealer.logo_url ? (
                                    <img src={logoPreview || dealer.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-400" />
                                )}
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-xs font-bold">
                                    Change
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Showroom Logo</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Business Name (English)</label>
                                <input type="text" value={profileForm.business_name || ''} onChange={e => setProfileForm({...profileForm, business_name: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Business Name (Arabic)</label>
                                <input type="text" value={profileForm.business_name_ar || ''} onChange={e => setProfileForm({...profileForm, business_name_ar: e.target.value})} className={`${inputClass} text-right`} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Description</label>
                                <textarea rows={3} value={profileForm.description || ''} onChange={e => setProfileForm({...profileForm, description: e.target.value})} className={inputClass} />
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Phone className="w-4 h-4 text-primary-600" /> Contact Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {renderPhoneInput("Contact #1", c1Code, setC1Code, c1Num, setC1Num)}
                                {renderPhoneInput("Contact #2", c2Code, setC2Code, c2Num, setC2Num)}
                                {renderPhoneInput("Contact #3", c3Code, setC3Code, c3Num, setC3Num)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Business Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                        <input type="email" placeholder="email@example.com" value={profileForm.email || ''} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Website</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                        <input type="text" placeholder="https://..." value={profileForm.website || ''} onChange={e => setProfileForm({...profileForm, website: e.target.value})} className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-600" /> Location & Hours</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Address</label>
                                    <input type="text" placeholder="Building, Street" value={profileForm.location || ''} onChange={e => setProfileForm({...profileForm, location: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Opening Hours</label>
                                    <input type="text" placeholder="e.g. 8am - 9pm" value={profileForm.opening_hours || ''} onChange={e => setProfileForm({...profileForm, opening_hours: e.target.value})} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={savingProfile}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                        >
                            {savingProfile ? <LoadingSpinner className="w-5 h-5 text-white" /> : "Save Changes"}
                        </button>
                    </form>
                </div>
            )}
        </main>

        {/* Modal for adding/editing cars */}
        {isCarModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto relative max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <h2 className="text-xl font-bold dark:text-white">{editingCar ? 'Edit Listing' : t('dealer.add_car')}</h2>
                        <button onClick={() => setIsCarModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">Close</button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <CarForm 
                            currentUser={profile}
                            initialData={editingCar || undefined}
                            onSuccess={() => {
                                setIsCarModalOpen(false);
                                fetchData();
                            }}
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
