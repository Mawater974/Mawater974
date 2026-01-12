import React, { useEffect, useState, useRef } from 'react';
import { getSpareParts, deleteSparePart, deleteSparePartPermanently, exportToCSV, getOptimizedImageUrl, updateSparePart } from '../../services/dataService';
import { SparePart } from '../../types';
import { CheckCircle, XCircle, Search, Archive, Edit, Settings, RefreshCw, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SparePartForm } from '../../components/SparePartForm';
import { useAuth } from '../../context/AuthContext';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { supabase } from '../../supabaseClient';

export const AdminPartsPage: React.FC = () => {
   const { profile } = useAuth();
   const [parts, setParts] = useState<SparePart[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [filter, setFilter] = useState('all');
   const [search, setSearch] = useState('');

   // Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingPart, setEditingPart] = useState<SparePart | null>(null);

   const fileInputRef = useRef<HTMLInputElement>(null);

   const fetchParts = async () => {
      setLoading(true);
      setRefreshing(true);

      // Custom query to fetch parts based on status filter
      // Since getSpareParts mainly fetches 'approved', we might need a broader fetch for admin
      // Or we modify getSpareParts to accept status 'all'

      let query = supabase
         .from('spare_parts')
         .select(`
            *,
            brands (*),
            models (*),
            cities (*),
            countries (*),
            spare_part_categories (*),
            spare_part_images (*),
            profiles (*)
        `)
         .order('created_at', { ascending: false });

      if (filter !== 'all') {
         query = query.eq('status', filter);
      }

      if (search) {
         query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
         setParts(data as any[]);
      }

      setLoading(false);
      setRefreshing(false);
   };

   useEffect(() => {
      fetchParts();
   }, [filter]);

   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchParts();
   };

   const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'pending', e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to mark this item as ${status}?`)) {
         await supabase.from('spare_parts').update({ status }).eq('id', id);
         fetchParts();
      }
   };

   const handleArchive = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to archive this item?")) {
         await deleteSparePart(id);
         fetchParts();
      }
   };

   const handlePermanentDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("DANGER: Are you sure you want to PERMANENTLY delete this spare part?\n\nThis will remove the item record and all associated images from the server. This action cannot be undone.")) {
         await deleteSparePartPermanently(id);
         fetchParts();
      }
   };

   const handleEdit = (part: SparePart, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingPart(part);
      setIsModalOpen(true);
   };

   const handleView = (part: SparePart, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      let countryCode = 'qa';
      // Robustly handle potential array or object return from Supabase relations
      const c = part.countries as any;

      if (Array.isArray(c)) {
         if (c.length > 0 && c[0].code) countryCode = c[0].code;
      } else if (c && c.code) {
         countryCode = c.code;
      }

      window.open(`/${countryCode.toLowerCase()}/parts/${part.id}`, '_blank');
   };

   const handleExport = () => {
      exportToCSV(parts, `spare_parts_export_${new Date().toISOString().split('T')[0]}.csv`);
   };

   const handleImport = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
         alert("Import feature coming soon! File selected: " + e.target.files[0].name);
      }
   };

   const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingPart(null);
   };

   return (
      <div>
         <AdminHeader
            title="Spare Parts Management"
            description="Review and manage spare parts listings."
            onRefresh={fetchParts}
            refreshing={refreshing}
            onExport={handleExport}
            onImport={handleImport}
            onAdd={() => { setEditingPart(null); setIsModalOpen(true); }}
            addLabel="Add Part"
         />

         <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv,.json" />

         {/* Toolbar */}
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
               {['all', 'pending', 'approved', 'rejected', 'archived'].map(s => (
                  <button
                     key={s}
                     onClick={() => setFilter(s)}
                     className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${filter === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                  >
                     {s}
                  </button>
               ))}
            </div>

            <form onSubmit={handleSearch} className="relative">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder="Search part title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm w-full md:w-64 focus:ring-2 focus:ring-primary-500 outline-none"
               />
            </form>
         </div>

         {/* Table */}
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                     <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Seller</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {loading ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center">Loading...</td></tr>
                     ) : parts.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No parts found matching filters.</td></tr>
                     ) : (
                        parts.map(part => (
                           <tr
                              key={part.id}
                              onClick={() => handleView(part)}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group ${part.status === 'archived' ? 'opacity-60' : ''}`}
                           >
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                       {part.spare_part_images?.[0] ? (
                                          <img src={part.spare_part_images[0].url} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                          <Settings className="w-6 h-6 text-gray-400" />
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-1">
                                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">{part.title}</p>
                                          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                       </div>
                                       <p className="text-gray-500 text-xs">{part.part_type} • {part.condition}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">{part.spare_part_categories?.name_en || 'Other'}</td>
                              <td className="px-6 py-4 font-medium">{part.price.toLocaleString()} QAR</td>
                              <td className="px-6 py-4 text-gray-500">{part.profiles?.full_name || part.user_id?.substring(0, 8)}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${part.status === 'approved' ? 'bg-green-100 text-green-700' :
                                       part.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          part.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                             part.status === 'archived' ? 'bg-gray-200 text-gray-600' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {part.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    {part.status === 'pending' && (
                                       <>
                                          <button onClick={(e) => handleStatusChange(part.id, 'approved', e)} title="Approve" className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                                             <CheckCircle className="w-5 h-5" />
                                          </button>
                                          <button onClick={(e) => handleStatusChange(part.id, 'rejected', e)} title="Reject" className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                             <XCircle className="w-5 h-5" />
                                          </button>
                                       </>
                                    )}

                                    {/* Restore to Pending */}
                                    {(part.status === 'archived' || part.status === 'rejected') && (
                                       <button onClick={(e) => handleStatusChange(part.id, 'pending', e)} title="Restore to Pending" className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg">
                                          <RefreshCw className="w-5 h-5" />
                                       </button>
                                    )}

                                    <button onClick={(e) => handleEdit(part, e)} title="Edit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                       <Edit className="w-5 h-5" />
                                    </button>

                                    <button onClick={(e) => handleView(part, e)} title="View" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                       <Eye className="w-5 h-5" />
                                    </button>

                                    {/* Archive Button */}
                                    {part.status !== 'archived' && (
                                       <button onClick={(e) => handleArchive(part.id, e)} title="Archive" className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                                          <Archive className="w-5 h-5" />
                                       </button>
                                    )}

                                    {/* Permanent Delete Button */}
                                    <button onClick={(e) => handlePermanentDelete(part.id, e)} title="Delete Permanently" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                       <Trash2 className="w-5 h-5" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Admin Add/Edit Part Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                     <h2 className="text-xl font-bold dark:text-white">{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'} (Admin Mode)</h2>
                     <button onClick={handleModalClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XCircle className="w-6 h-6" />
                     </button>
                  </div>
                  <div className="p-6">
                     <SparePartForm
                        isAdmin={true}
                        currentUser={profile}
                        initialData={editingPart || undefined}
                        onSuccess={() => { handleModalClose(); fetchParts(); }}
                     />
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};