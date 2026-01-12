import React, { useEffect, useState, useRef } from 'react';
import { getCars, updateCarStatus, updateCarFeatured, deleteCar, deleteCarPermanently, exportToCSV, SortOption } from '../../services/dataService';
import { Car } from '../../types';
import { CheckCircle, XCircle, Star, Eye, Search, Archive, SlidersHorizontal, Edit, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CarForm } from '../../components/CarForm';
import { useAuth } from '../../context/AuthContext';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminCarsPage: React.FC = () => {
   const { profile } = useAuth();
   const [cars, setCars] = useState<Car[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [filter, setFilter] = useState('all');
   const [search, setSearch] = useState('');
   const [sortBy, setSortBy] = useState<SortOption>('newest');

   // Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingCar, setEditingCar] = useState<Car | null>(null);

   // Import Ref
   const fileInputRef = useRef<HTMLInputElement>(null);

   const fetchCars = async () => {
      setLoading(true);
      setRefreshing(true);
      // Allow fetching archived cars in Admin panel
      // Pass 'all' explicitly when filter is 'all' to override default 'approved'
      // Pass ignoreFeatured: true so admins see pure chronological order if desired
      const { data } = await getCars(
         {
            status: filter === 'all' ? 'all' : filter,
            searchQuery: search,
            ignoreFeatured: true
         },
         1,
         50,
         sortBy
      );
      setCars(data);
      setLoading(false);
      setRefreshing(false);
   };

   useEffect(() => {
      fetchCars();
   }, [filter, sortBy]); // Re-fetch when sort changes

   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchCars();
   };

   const handleStatusChange = async (id: number, status: 'approved' | 'rejected' | 'pending', e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to mark this car as ${status}?`)) {
         await updateCarStatus(id, status);
         fetchCars();
      }
   };

   const handleFeaturedToggle = async (id: number, current: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      await updateCarFeatured(id, !current);
      fetchCars();
   };

   const handleArchive = async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to archive this car? It will be hidden from the public.")) {
         await deleteCar(id);
         fetchCars();
      }
   };

   const handlePermanentDelete = async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      // Warning prompt for permanent deletion
      if (confirm("DANGER: Are you sure you want to PERMANENTLY delete this car?\n\nThis action cannot be undone. It will delete the car record and all associated images from the server.")) {
         await deleteCarPermanently(id);
         fetchCars();
      }
   };

   const handleEdit = (car: Car, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingCar(car);
      setIsModalOpen(true);
   };

   const handleView = (car: Car, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      let countryCode = 'qa';
      // Robustly handle potential array or object return from Supabase relations
      const c = car.countries as any;

      if (Array.isArray(c)) {
         if (c.length > 0 && c[0].code) countryCode = c[0].code;
      } else if (c && c.code) {
         countryCode = c.code;
      }

      window.open(`/${countryCode.toLowerCase()}/cars/${car.id}`, '_blank');
   };

   const handleExport = () => {
      exportToCSV(cars, `cars_export_${new Date().toISOString().split('T')[0]}.csv`);
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
      setEditingCar(null);
   };

   return (
      <div>
         <AdminHeader
            title="Car Management"
            description="Review, approve, and manage car listings."
            onRefresh={fetchCars}
            refreshing={refreshing}
            onExport={handleExport}
            onImport={handleImport}
            onAdd={() => { setEditingCar(null); setIsModalOpen(true); }}
            addLabel="Add New Listing"
         />

         <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv,.json" />

         {/* Toolbar */}
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
               {['all', 'pending', 'approved', 'rejected', 'sold', 'archived'].map(s => (
                  <button
                     key={s}
                     onClick={() => setFilter(s)}
                     className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${filter === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                  >
                     {s}
                  </button>
               ))}
            </div>

            <div className="flex gap-2">
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  <select
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as SortOption)}
                     className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                  >
                     <option value="newest">Newest Listed</option>
                     <option value="oldest">Oldest Listed</option>
                     <option value="price_asc">Price: Low to High</option>
                     <option value="price_desc">Price: High to Low</option>
                     <option value="year_desc">Newest Model Year</option>
                  </select>
               </div>

               <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Search make, model or ID..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm w-full md:w-64 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
               </form>
            </div>
         </div>

         {/* Table */}
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                     <tr>
                        <th className="px-6 py-4">Car Info</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Seller</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Featured</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {loading ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center">Loading...</td></tr>
                     ) : cars.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No cars found matching filters.</td></tr>
                     ) : (
                        cars.map(car => (
                           <tr
                              key={car.id}
                              onClick={() => handleView(car)}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group ${car.status === 'archived' ? 'opacity-60' : ''}`}
                           >
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                       {car.car_images?.[0] && <img src={car.car_images[0].image_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-1">
                                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                                             {car.brands?.name} {car.models?.name}
                                          </p>
                                          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                       </div>
                                       <p className="text-gray-500 text-xs">{car.year} • {car.mileage}km</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 font-medium">{car.price.toLocaleString()} QAR</td>
                              <td className="px-6 py-4 text-gray-500">{car.profiles?.full_name || car.user_id?.substring(0, 8)}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${car.status === 'approved' ? 'bg-green-100 text-green-700' :
                                       car.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          car.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                             car.status === 'archived' ? 'bg-gray-200 text-gray-600' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {car.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <button onClick={(e) => handleFeaturedToggle(car.id, car.is_featured, e)} className={`p-1 rounded-full ${car.is_featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500'}`}>
                                    <Star className={`w-5 h-5 ${car.is_featured ? 'fill-current' : ''}`} />
                                 </button>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    {car.status === 'pending' && (
                                       <>
                                          <button onClick={(e) => handleStatusChange(car.id, 'approved', e)} title="Approve" className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                                             <CheckCircle className="w-5 h-5" />
                                          </button>
                                          <button onClick={(e) => handleStatusChange(car.id, 'rejected', e)} title="Reject" className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                             <XCircle className="w-5 h-5" />
                                          </button>
                                       </>
                                    )}

                                    {/* Add option to reset to pending for archived/rejected/sold */}
                                    {(car.status === 'archived' || car.status === 'rejected' || car.status === 'sold') && (
                                       <button onClick={(e) => handleStatusChange(car.id, 'pending', e)} title="Restore to Pending" className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg">
                                          <RefreshCw className="w-5 h-5" />
                                       </button>
                                    )}

                                    <button onClick={(e) => handleEdit(car, e)} title="Edit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                       <Edit className="w-5 h-5" />
                                    </button>

                                    <button onClick={(e) => handleView(car, e)} title="View" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                       <Eye className="w-5 h-5" />
                                    </button>

                                    {/* Archive Button */}
                                    {car.status !== 'archived' && (
                                       <button onClick={(e) => handleArchive(car.id, e)} title="Archive" className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                                          <Archive className="w-5 h-5" />
                                       </button>
                                    )}

                                    {/* Permanent Delete Button */}
                                    <button onClick={(e) => handlePermanentDelete(car.id, e)} title="Delete Permanently" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

         {/* Admin Add/Edit Car Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                     <h2 className="text-xl font-bold dark:text-white">{editingCar ? 'Edit Listing' : 'Add New Listing'} (Admin Mode)</h2>
                     <button onClick={handleModalClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XCircle className="w-6 h-6" />
                     </button>
                  </div>
                  <div className="p-6">
                     <CarForm
                        isAdmin={true}
                        currentUser={profile}
                        initialData={editingCar || undefined}
                        onSuccess={() => { handleModalClose(); fetchCars(); }}
                     />
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};