
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/dataService';
import { User, Phone } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';

// Common country phone codes
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'qa': '+974', 'sa': '+966', 'ae': '+971', 'kw': '+965', 
  'bh': '+973', 'om': '+968', 'us': '+1', 'gb': '+44', 
  'eg': '+20', 'sy': '+963', 'jo': '+962', 'lb': '+961'
};

export const ProfilePage: React.FC = () => {
  const { t } = useAppContext();
  const { user, profile, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  
  // Phone State
  const [phoneCode, setPhoneCode] = useState('+974');
  const [phoneNum, setPhoneNum] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.role || 'User');
      
      // Parse Phone Number
      if (profile.phone_number) {
          try {
              const parsed = parsePhoneNumber(profile.phone_number);
              if (parsed) {
                  setPhoneCode(`+${parsed.countryCallingCode}`);
                  setPhoneNum(parsed.nationalNumber);
              } else {
                  setPhoneNum(profile.phone_number);
              }
          } catch (e) {
              // Fallback if parsing fails, just set number, user can fix code manually
              setPhoneNum(profile.phone_number);
          }
      }
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);
    
    // Combine phone number
    const finalPhone = phoneNum ? `${phoneCode}${phoneNum.replace(/\D/g, '')}` : undefined;

    const success = await updateUserProfile(user.id, {
        full_name: fullName,
        phone_number: finalPhone
    });

    if (success) {
        setMessage({ type: 'success', text: t('profile.update_success') });
        await refreshProfile();
    } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm placeholder-gray-400";

  if (!user) return <div className="p-8 text-center">{t('nav.login')}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 dark:text-white flex items-center gap-2">
         <User className="w-8 h-8" /> {t('profile.title')}
      </h1>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
         {message && (
             <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                 {message.text}
             </div>
         )}
         
         <form onSubmit={handleUpdate} className="space-y-6">
            <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('profile.email_label')}</label>
               <input 
                 type="email" 
                 disabled 
                 value={user.email} 
                 className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed shadow-inner"
               />
            </div>
            
            <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('profile.name_label')}</label>
               <input 
                 type="text" 
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 className={inputClass}
               />
            </div>

            {/* Phone Number Input */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {t('profile.phone_label')}
                </label>
                <div className="flex gap-2">
                    <select 
                        value={phoneCode} 
                        onChange={(e) => setPhoneCode(e.target.value)}
                        className="w-28 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm cursor-pointer"
                    >
                        {Object.entries(COUNTRY_PHONE_CODES).map(([iso, c]) => (
                            <option key={iso} value={c}>{c}</option>
                        ))}
                        <option value="+90">+90</option>
                        <option value="+91">+91</option>
                        <option value="+63">+63</option>
                    </select>
                    <input 
                        type="tel" 
                        value={phoneNum} 
                        onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, ''))} 
                        className={inputClass}
                        placeholder="33334444" 
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('profile.phone_hint')}</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 shadow-md hover:shadow-lg"
            >
               {loading ? t('common.loading') : t('common.save')}
            </button>
         </form>
      </div>
    </div>
  );
};
