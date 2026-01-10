
import React, { useEffect, useState, useRef } from 'react';
import { getDealerships, updateDealerStatus, exportToCSV, getOptimizedImageUrl } from '../../services/dataService';
import { Dealership } from '../../types';
import { Building2, CheckCircle, XCircle, MapPin, RefreshCw, Filter, Phone, Mail, Globe, Warehouse, ExternalLink, Edit } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { ShowroomForm } from '../../components/ShowroomForm';

export const AdminDealersPage: React.FC = () => {
    const [dealers, setDealers] = useState<Dealership[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit State
    const [editingDealer, setEditingDealer] = useState<Dealership | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDealers = async () => {
        setLoading(true);
        setRefreshing(true);
        // Pass 'all' as status to fetch pending/rejected too
        const data = await getDealerships('all', null, 'newest', 'all');
        setDealers(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDealers();
    }, []);

    const handleStatusChange = async (id: number, status: 'approved' | 'rejected' | 'pending', e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (confirm(`Are you sure you want to set this dealer to ${status}?`)) {
            await updateDealerStatus(id, status);
            fetchDealers();
        }
    };

    const handleExport = () => {
        exportToCSV(dealers, `dealers_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            alert("Import feature coming soon! File selected: " + e.target.files[0].name);
        }
    };

    const handleView = (dealer: Dealership, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        // Construct URL based on country code if available, default to 'qa'
        // The dealer object now has country code from the updated fetch query
        const code = (dealer.countries as any)?.code?.toLowerCase() || 'qa';
        window.open(`/#/${code}/showrooms/${dealer.id}`, '_blank');
    };

    const handleEdit = (dealer: Dealership, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDealer(dealer);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingDealer(null);
    };

    const filteredDealers = dealers.filter(d => {
        if (filter === 'all') return true;
        const status = d.status || 'pending';
        return status === filter;
    });

    return (
        <div>
            <AdminHeader
                title="Dealer Management"
                description="Manage showroom and dealer accounts."
                onRefresh={fetchDealers}
                refreshing={refreshing}
                onExport={handleExport}
                onImport={handleImport}
                onAdd={() => alert("Please use the User Management page to upgrade users to Dealers.")}
                addLabel="Add Dealer"
            />

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv,.json" />

            {/* Filters Toolbar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-bold mr-2">
                    <Filter className="w-4 h-4" /> Filter Status:
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === status
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {status}
                            {status !== 'all' && (
                                <span className="ml-2 text-xs opacity-60">
                                    ({dealers.filter(d => (d.status || 'pending') === status).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Dealer</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Contacts</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>
                        ) : filteredDealers.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-500">No dealers found matching this filter.</td></tr>
                        ) : filteredDealers.map(dealer => (
                            <tr
                                key={dealer.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                                onClick={() => handleView(dealer)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                            {dealer.logo_url ? (
                                                <img src={getOptimizedImageUrl(dealer.logo_url, 100)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Warehouse className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{dealer.business_name}</p>
                                                <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{dealer.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {dealer.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                            {dealer.dealership_type || 'Showroom'}
                                        </span>
                                        {dealer.business_type && (
                                            <span className="capitalize bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                                {dealer.business_type}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                                        {dealer.contact_number_1 && (
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {dealer.contact_number_1}
                                            </div>
                                        )}
                                        {dealer.email && (
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {dealer.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${dealer.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            dealer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {dealer.status || 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        {dealer.status !== 'approved' && (
                                            <button
                                                onClick={(e) => handleStatusChange(dealer.id, 'approved', e)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        {dealer.status !== 'rejected' && (
                                            <button
                                                onClick={(e) => handleStatusChange(dealer.id, 'rejected', e)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Reject"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleEdit(dealer, e)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit Details"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {/* External Link Button with Hover Effect */}
                                        <button
                                            onClick={(e) => handleView(dealer, e)}
                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition group/link relative"
                                            title="View Public Page"
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

            {/* Edit Modal */}
            {isModalOpen && editingDealer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold dark:text-white">Edit Dealership Info</h2>
                            <button onClick={handleModalClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <ShowroomForm
                                initialData={editingDealer}
                                onSuccess={() => { handleModalClose(); fetchDealers(); }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
