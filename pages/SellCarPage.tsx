
import React, { useState } from 'react';
import { CarForm } from '../components/CarForm';
import { SparePartForm } from '../components/SparePartForm';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Car, Settings, ShoppingBag } from 'lucide-react';

export const SellCarPage: React.FC = () => {
  const { t } = useAppContext();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'car' | 'part'>('car');

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Login to Sell</h1>
            <p className="text-gray-500 mb-6">You need an account to post advertisements.</p>
            <button onClick={() => navigate('/login')} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">
                Login / Register
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
         <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Create New Listing</h1>
         <p className="text-gray-500">Reach thousands of buyers in Qatar. Select listing type below.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
         {/* Tab Switcher */}
         <div className="flex border-b border-gray-100 dark:border-gray-700">
             <button 
                onClick={() => setActiveTab('car')}
                className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition ${activeTab === 'car' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
             >
                 <Car className="w-5 h-5" /> Sell a Car
             </button>
             <button 
                onClick={() => setActiveTab('part')}
                className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition ${activeTab === 'part' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
             >
                 <Settings className="w-5 h-5" /> Sell Spare Part
             </button>
         </div>

         <div className="p-6 md:p-8">
             {activeTab === 'car' ? (
                 <CarForm 
                    isAdmin={false} 
                    currentUser={profile} 
                    onSuccess={() => navigate('/my-ads')} 
                 />
             ) : (
                 <SparePartForm
                    isAdmin={false}
                    currentUser={profile}
                    onSuccess={() => navigate('/my-ads')}
                 />
             )}
         </div>
      </div>
    </div>
  );
};
