
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getUserCars, getUserSpareParts, deleteCar, deleteSparePart, getSparePartById } from '../services/dataService';
import { Car, SparePart } from '../types';
import { CarCard } from '../components/CarCard';
import { SparePartCard } from '../components/SparePartCard';
import { FileText, Car as CarIcon, Settings, Trash2, Edit, X } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CarForm } from '../components/CarForm';
import { SparePartForm } from '../components/SparePartForm';
import { useNavigate } from 'react-router-dom';

export const MyAdsPage: React.FC = () => {
    const { t, language, selectedCountryCode } = useAppContext();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'cars' | 'parts'>('cars');
    const [myCars, setMyCars] = useState<Car[]>([]);
    const [myParts, setMyParts] = useState<SparePart[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [editingPart, setEditingPart] = useState<SparePart | null>(null);

    const fetchData = async () => {
        if (user) {
            setLoading(true);
            const [cars, parts] = await Promise.all([
                getUserCars(user.id),
                getUserSpareParts(user.id)
            ]);
            setMyCars(cars);
            setMyParts(parts);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleDeleteCar = async (carId: number) => {
        if (confirm(t('my_ads.confirm_delete_car'))) {
            const success = await deleteCar(carId);
            if (success) {
                setMyCars(prev => prev.filter(c => c.id !== carId));
            }
        }
    };

    const handleDeletePart = async (partId: string) => {
        if (confirm(t('my_ads.confirm_delete_part'))) {
            const success = await deleteSparePart(partId);
            if (success) {
                setMyParts(prev => prev.filter(p => p.id !== partId));
            }
        }
    };

    // When editing part, we might need full details not just the summary from list
    const handleEditPart = async (partId: string) => {
        // Fetch full details
        const fullPart = await getSparePartById(partId);
        if (fullPart) {
            setEditingPart(fullPart);
        }
    };

    if (!user) return <div className="p-8 text-center">{t('nav.login')}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                    <FileText className="text-primary-500" /> {t('nav.my_ads')}
                </h1>
                <button
                    onClick={() => navigate(`/${selectedCountryCode || 'qa'}/sell`)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
                >
                    {t('my_ads.post_ad')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('cars')}
                    className={`pb-3 px-4 flex items-center gap-2 font-bold transition border-b-2 ${activeTab === 'cars' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <CarIcon className="w-5 h-5" /> {t('my_ads.tab_cars')} ({myCars.length})
                </button>
                <button
                    onClick={() => setActiveTab('parts')}
                    className={`pb-3 px-4 flex items-center gap-2 font-bold transition border-b-2 ${activeTab === 'parts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings className="w-5 h-5" /> {t('my_ads.tab_parts')} ({myParts.length})
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <LoadingSpinner className="w-16 h-16" />
                </div>
            ) : (
                <>
                    {/* Cars Tab */}
                    {activeTab === 'cars' && (
                        myCars.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCars.map(car => (
                                    <div key={car.id} className="relative">
                                        <CarCard
                                            car={car}
                                            language={language}
                                            t={t}
                                            actions={
                                                <>
                                                    <button
                                                        onClick={() => setEditingCar(car)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-sm transition"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCar(car.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm transition"
                                                        title={t('common.delete_archive')}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            }
                                        />

                                        <div className="absolute top-2 left-2 bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded z-20 shadow-sm border border-gray-100">
                                            {car.status?.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
                                <CarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t('my_ads.no_cars')}</p>
                            </div>
                        )
                    )}

                    {/* Parts Tab */}
                    {activeTab === 'parts' && (
                        myParts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {myParts.map(part => (
                                    <div key={part.id} className="relative">
                                        <SparePartCard
                                            part={part}
                                            language={language}
                                            t={t}
                                            actions={
                                                <>
                                                    <button
                                                        onClick={() => handleEditPart(part.id)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-sm transition"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePart(part.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm transition"
                                                        title={t('common.delete_archive')}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            }
                                        />
                                        <div className="absolute top-2 left-2 bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded z-20 shadow-sm border border-gray-100">
                                            {part.status?.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
                                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">{t('my_ads.no_parts')}</p>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Edit Car Modal */}
            {editingCar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto relative max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <h2 className="text-xl font-bold dark:text-white">{t('my_ads.edit_listing')}</h2>
                            <button onClick={() => setEditingCar(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <CarForm
                                currentUser={profile}
                                initialData={editingCar}
                                onSuccess={() => {
                                    setEditingCar(null);
                                    fetchData();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Part Modal */}
            {editingPart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto relative max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <h2 className="text-xl font-bold dark:text-white">{t('my_ads.edit_part')}</h2>
                            <button onClick={() => setEditingPart(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <SparePartForm
                                currentUser={profile}
                                initialData={editingPart}
                                onSuccess={() => {
                                    setEditingPart(null);
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
