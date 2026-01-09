
import React, { useEffect, useState, useRef } from 'react';
import { getDealerships, updateDealerStatus, exportToCSV, getOptimizedImageUrl } from '../../services/dataService';
import { Dealership } from '../../types';
import { Building2, CheckCircle, XCircle, MapPin, RefreshCw, Filter, Phone, Mail, Globe, Warehouse } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminDealersPage: React.FC = () => {
  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDealers = async () => {
    setLoading(true);
    setRefreshing(true);
    const data = await getDealerships('all'); 
    setDealers(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleStatusChange = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
      if(confirm(`Are you sure you want to set this dealer to ${status}?`)) {
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
      if(e.target.files?.length) {
          alert("Import feature coming soon! File selected: " + e.target.files[0].name);
      }
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                        filter === status 
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
                    <tr key={dealer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                                    <p className="font-bold text-gray-900 dark:text-white">{dealer.business_name}</p>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                dealer.status === 'approved' ? 'bg-green-100 text-green-700' :
                                dealer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {dealer.status || 'Pending'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => handleStatusChange(dealer.id, 'approved')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"
                                    disabled={dealer.status === 'approved'}
                                >
                                    <CheckCircle className={`w-4 h-4 ${dealer.status === 'approved' ? 'opacity-30' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => handleStatusChange(dealer.id, 'rejected')}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Reject"
                                    disabled={dealer.status === 'rejected'}
                                >
                                    <XCircle className={`w-4 h-4 ${dealer.status === 'rejected' ? 'opacity-30' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => handleStatusChange(dealer.id, 'pending')}
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Set Pending"
                                    disabled={!dealer.status || dealer.status === 'pending'}
                                >
                                    <RefreshCw className={`w-4 h-4 ${(!dealer.status || dealer.status === 'pending') ? 'opacity-30' : ''}`} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
