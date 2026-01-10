
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getSpareParts } from '../services/dataService';
import { SparePart } from '../types';
import { SparePartCard } from '../components/SparePartCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';
import { Settings, Search } from 'lucide-react';

export const SparePartsPage: React.FC = () => {
    const { t, language } = useAppContext();
    const [parts, setParts] = useState<SparePart[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local input if URL changes externally
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const data = await getSpareParts(searchQuery);
            setParts(data);
            setLoading(false);
        };
        fetch();
    }, [searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Update URL which triggers fetch via useEffect above
        setSearchParams(localSearch ? { search: localSearch } : {});
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-8 h-8 text-primary-600" />
                        <h1 className="text-3xl font-bold dark:text-white">{t('nav.parts')}</h1>
                    </div>
                    <p className="text-gray-500 text-sm">{t('parts.subtitle')}</p>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto md:min-w-[300px]">
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder={t('home.search_parts_placeholder')}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    />
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {searchQuery && (
                <p className="mb-6 text-gray-500">
                    {t('parts.showing_results_for')} <span className="font-bold text-gray-900 dark:text-white">"{searchQuery}"</span>
                </p>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <LoadingSpinner className="w-16 h-16" />
                </div>
            ) : (
                parts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {parts.map(part => (
                            <SparePartCard key={part.id} part={part} language={language} t={t} />
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold dark:text-white">{t('common.no_results')}</h3>
                        <p className="text-gray-500 mt-1">{t('parts.try_adjusting')}</p>
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchParams({}); setLocalSearch(''); }}
                                className="mt-4 text-primary-600 font-bold hover:underline"
                            >
                                {t('parts.clear_search')}
                            </button>
                        )}
                    </div>
                )
            )}
        </div>
    );
};
