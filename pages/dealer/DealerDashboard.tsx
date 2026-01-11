
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { 
    getDealershipByUserId, getDealershipCars, updateCarStatus, deleteCar, 
    getUserSpareParts, deleteSparePart, getOptimizedImageUrl 
} from '../../services/dataService';
import { Dealership, Car, SparePart } from '../../types';
import { CarForm } from '../../components/CarForm';
import { SparePartForm } from '../../components/SparePartForm';
import { ShowroomForm } from '../../components/ShowroomForm';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Car as CarIcon, Settings, 
    PlusCircle, Edit, Trash2, Eye, TrendingUp, CheckCircle, 
    Building2, Warehouse, ShoppingBag, Archive, XCircle, ExternalLink, DollarSign
} from 'lucide-react';

export const DealerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { t, selectedCountryCode } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'parts' | 'profile'>('dashboard');
  const [dealer, setDealer] = useState<Dealership | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    const dealerData = await getDealershipByUserId(user.id);
    if (dealerData) {
        setDealer(dealerData);
        
        const [dealerCars, dealerParts] = await Promise.all([
            getDealershipCars(user.id),
            getUserSpareParts(user.id)
        ]);
        setCars(dealerCars);
        setParts(dealerParts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [!user]);

  // Car Actions
  const handleDeleteCar = async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(t('dealer.confirm_archive'))) {
          await deleteCar(id);
          fetchData();
      }
  };

  const handleStatusToggle = async (car: Car, e: React.MouseEvent) => {
      e.stopPropagation();
      const newStatus = car.status === 'sold' ? 'approved' : 'sold';
      if (confirm(t('dealer.confirm_status', { status: newStatus }))) {
          await updateCarStatus(car.id, newStatus);
          fetchData();
      }
  };

  // Part Actions
  const handleDeletePart = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(t('dealer.confirm_archive'))) {
          await deleteSparePart(id);
          fetchData();
      }
  };

  const handleAdClick = (path: string) => {
      window.open(path, '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!dealer) return <div className="p-8 text-center">{t('dealer.no_account')}</div>;

  // Stats Calculation
  const totalViews = cars.reduce((acc, car) => acc + (car.views_count || 0), 0);
  const activeListings = cars.filter(c => c.status === 'approved').length;
  const soldListings = cars.filter(c => c.status === 'sold').length;
  const expiredListings = cars.filter(c => c.status === 'archived' || c.status === 'rejected').length + parts.filter(p => p.status === 'archived' || p.status === 'rejected').length;

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
                            <span>{t('dealer.portal')}</span>
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
                        onClick={() => setActiveTab('parts')}
                        className={`pb-4 px-2 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'parts' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <ShoppingBag className="w-5 h-5" /> {t('dealer.spare_parts')}
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
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.active_listings')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{activeListings}</h3>
                                </div>
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.sold_listings')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{soldListings}</h3>
                                </div>
                                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('dealer.archived_listings')}</p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{expiredListings}</h3>
                                </div>
                                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600">
                                    <Archive className="w-5 h-5" />
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
                    </div>

                    {/* Chart Mock */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dealer.analytics')}</h3>
                        <p className="text-gray-500 text-sm mt-1">{t('dealer.analytics_desc')}</p>
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
                                        <tr 
                                            key={car.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-pointer"
                                            onClick={() => handleAdClick(`/#/${selectedCountryCode}/cars/${car.id}`)}
                                        >
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
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={(e) => handleStatusToggle(car, e)}
                                                        className={`p-2 rounded-lg transition ${car.status === 'sold' ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                        title={car.status === 'sold' ? t('dealer.mark_available') : t('dealer.mark_sold')}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setEditingCar(car); setIsCarModalOpen(true); }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteCar(car.id, e)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title={t('dealer.archive_listing')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAdClick(`/#/${selectedCountryCode}/cars/${car.id}`)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                                                        title={t('dealer.view_ad')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
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

            {activeTab === 'parts' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold dark:text-white">{t('dealer.spare_parts')}</h2>
                        <button 
                            onClick={() => { setEditingPart(null); setIsPartModalOpen(true); }}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-900/20 transition transform hover:-translate-y-0.5"
                        >
                            <PlusCircle className="w-5 h-5" /> {t('dealer.add_part')}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-bold text-xs border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">{t('dealer.item_details')}</th>
                                        <th className="px-6 py-4">{t('common.price')}</th>
                                        <th className="px-6 py-4">{t('dealer.condition')}</th>
                                        <th className="px-6 py-4">{t('dealer.table.status')}</th>
                                        <th className="px-6 py-4 text-right">{t('dealer.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {parts.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-gray-500">{t('my_ads.no_parts')}</td></tr>
                                    ) : parts.map(part => (
                                        <tr 
                                            key={part.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-pointer"
                                            onClick={() => handleAdClick(`/#/${selectedCountryCode}/parts/${part.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                                        {part.spare_part_images?.[0] ? (
                                                            <img src={part.spare_part_images[0].url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{part.title}</p>
                                                        <p className="text-xs text-gray-500">{part.part_type} • {part.brands?.name || 'Universal'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-200">
                                                {part.price.toLocaleString()} QAR
                                            </td>
                                            <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-400">
                                                {t(`condition.${part.condition}`)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    part.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    part.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {part.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => { setEditingPart(part); setIsPartModalOpen(true); }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeletePart(part.id, e)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title={t('dealer.archive_part')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAdClick(`/#/${selectedCountryCode}/parts/${part.id}`)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                                                        title={t('dealer.view_ad')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
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
                    <ShowroomForm 
                        initialData={dealer}
                        onSuccess={() => {
                            alert(t('profile.update_success'));
                            fetchData();
                        }}
                    />
                </div>
            )}
        </main>

        {/* Modals */}
        {isCarModalOpen && editingCar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white">{t('my_ads.edit_listing')}</h2>
                        <button onClick={() => setIsCarModalOpen(false)}><XCircle className="w-6 h-6 text-gray-500" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <CarForm 
                            currentUser={profile}
                            initialData={editingCar}
                            onSuccess={() => { setIsCarModalOpen(false); fetchData(); }}
                        />
                    </div>
                </div>
            </div>
        )}

        {isCarModalOpen && !editingCar && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white">{t('dealer.add_car')}</h2>
                        <button onClick={() => setIsCarModalOpen(false)}><XCircle className="w-6 h-6 text-gray-500" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <CarForm 
                            currentUser={profile}
                            onSuccess={() => { setIsCarModalOpen(false); fetchData(); }}
                        />
                    </div>
                </div>
            </div>
        )}

        {isPartModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white">{editingPart ? t('my_ads.edit_part') : t('dealer.add_part')}</h2>
                        <button onClick={() => setIsPartModalOpen(false)}><XCircle className="w-6 h-6 text-gray-500" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <SparePartForm 
                            currentUser={profile}
                            initialData={editingPart || undefined}
                            onSuccess={() => { setIsPartModalOpen(false); fetchData(); }}
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
