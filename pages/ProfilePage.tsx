
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/dataService';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { t } = useAppContext();
  const { user, profile, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.role || 'User');
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);
    
    const success = await updateUserProfile(user.id, {
        full_name: fullName,
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
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
               <input 
                 type="email" 
                 disabled 
                 value={user.email} 
                 className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed shadow-inner"
               />
            </div>
            
            <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
               <input 
                 type="text" 
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 className={inputClass}
               />
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
