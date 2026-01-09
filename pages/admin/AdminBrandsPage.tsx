
import React, { useEffect, useState } from 'react';
import { getBrands, getModels, createBrand, deleteBrand, createModel, deleteModel } from '../../services/dataService';
import { Brand, Model } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Trash2, CheckCircle, Search, Layers, Tag, PlusCircle, X } from 'lucide-react';

export const AdminBrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Form States
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandNameAr, setNewBrandNameAr] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');

  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelNameAr, setNewModelNameAr] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    setRefreshing(true);
    const data = await getBrands();
    setBrands(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
        getModels(selectedBrand.id).then(setModels);
    } else {
        setModels([]);
    }
  }, [selectedBrand]);

  const handleCreateBrand = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBrandName) return;
      
      const brand = await createBrand({
          name: newBrandName,
          name_ar: newBrandNameAr,
          logo_url: newBrandLogo
      });

      if (brand) {
          setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)));
          setNewBrandName('');
          setNewBrandNameAr('');
          setNewBrandLogo('');
          setShowAddBrand(false);
      }
  };

  const handleDeleteBrand = async (id: number) => {
      if (confirm("Are you sure? This will delete the brand and ALL its models.")) {
          const success = await deleteBrand(id);
          if (success) {
              setBrands(prev => prev.filter(b => b.id !== id));
              if (selectedBrand?.id === id) {
                  setSelectedBrand(null);
                  setModels([]);
              }
          }
      }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBrand || !newModelName) return;

      const model = await createModel({
          brand_id: selectedBrand.id,
          name: newModelName,
          name_ar: newModelNameAr
      });

      if (model) {
          setModels(prev => [...prev, model].sort((a, b) => a.name.localeCompare(b.name)));
          setNewModelName('');
          setNewModelNameAr('');
          setShowAddModel(false);
      }
  };

  const handleDeleteModel = async (id: number) => {
      if (confirm("Delete this model?")) {
          const success = await deleteModel(id);
          if (success) {
              setModels(prev => prev.filter(m => m.id !== id));
          }
      }
  };

  const filteredBrands = brands.filter(b => 
      b.name.toLowerCase().includes(search.toLowerCase()) || 
      (b.name_ar && b.name_ar.includes(search))
  );

  return (
    <div>
      <AdminHeader 
        title="Brands & Models" 
        description="Manage vehicle makes and their corresponding models."
        onRefresh={fetchBrands}
        refreshing={refreshing}
        onAdd={() => setShowAddBrand(true)}
        addLabel="Add Brand"
      />

      {/* Add Brand Modal */}
      {showAddBrand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Add New Brand</h3>
                  <form onSubmit={handleCreateBrand} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Brand Name (English)</label>
                          <input type="text" required value={newBrandName} onChange={e => setNewBrandName(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Brand Name (Arabic)</label>
                          <input type="text" value={newBrandNameAr} onChange={e => setNewBrandNameAr(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right" placeholder="اختياري" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                          <input type="text" value={newBrandLogo} onChange={e => setNewBrandLogo(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://..." />
                      </div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => setShowAddBrand(false)} className="flex-1 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700">Save Brand</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Left Column: Brand List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search brands..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 p-2 space-y-1">
                  {loading ? (
                      <p className="text-center py-4 text-gray-500">Loading brands...</p>
                  ) : filteredBrands.map(brand => (
                      <div 
                        key={brand.id}
                        onClick={() => setSelectedBrand(brand)}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                            selectedBrand?.id === brand.id 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                          <div className="flex items-center gap-3">
                              {brand.logo_url ? (
                                  <img src={brand.logo_url} alt="" className="w-8 h-8 object-contain rounded bg-white p-0.5" />
                              ) : (
                                  <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-xs">
                                      {brand.name[0]}
                                  </div>
                              )}
                              <div>
                                  <p className="font-bold text-sm">{brand.name}</p>
                                  {brand.name_ar && <p className="text-xs opacity-60 text-right font-arabic">{brand.name_ar}</p>}
                              </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* Right Column: Models List */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden relative">
              {selectedBrand ? (
                  <>
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                          <div>
                              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                                  {selectedBrand.logo_url && <img src={selectedBrand.logo_url} className="w-6 h-6 object-contain" alt="" />}
                                  {selectedBrand.name} <span className="text-gray-400 font-normal">Models</span>
                              </h2>
                              <p className="text-xs text-gray-500 mt-1">Manage models associated with {selectedBrand.name}</p>
                          </div>
                          <button 
                            onClick={() => setShowAddModel(true)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white transition"
                          >
                              <PlusCircle className="w-4 h-4 text-green-500" /> Add Model
                          </button>
                      </div>

                      {/* Add Model Form (Inline) */}
                      {showAddModel && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-800 animate-fade-in">
                              <form onSubmit={handleCreateModel} className="flex flex-col md:flex-row gap-4 items-end">
                                  <div className="flex-1 w-full">
                                      <label className="block text-xs font-bold text-green-800 dark:text-green-400 mb-1">Model Name</label>
                                      <input 
                                        type="text" 
                                        autoFocus
                                        required 
                                        value={newModelName} 
                                        onChange={e => setNewModelName(e.target.value)} 
                                        className="w-full p-2 rounded border border-green-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                        placeholder="e.g. Corolla" 
                                      />
                                  </div>
                                  <div className="flex-1 w-full">
                                      <label className="block text-xs font-bold text-green-800 dark:text-green-400 mb-1">Arabic Name</label>
                                      <input 
                                        type="text" 
                                        value={newModelNameAr} 
                                        onChange={e => setNewModelNameAr(e.target.value)} 
                                        className="w-full p-2 rounded border border-green-200 focus:ring-2 focus:ring-green-500 outline-none text-sm text-right"
                                        placeholder="مثال: كورولا" 
                                      />
                                  </div>
                                  <div className="flex gap-2">
                                      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700">Save</button>
                                      <button type="button" onClick={() => setShowAddModel(false)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
                                  </div>
                              </form>
                          </div>
                      )}

                      <div className="flex-1 overflow-y-auto p-6">
                          {models.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                  <Layers className="w-12 h-12 mb-2 opacity-20" />
                                  <p>No models found for this brand.</p>
                                  <button onClick={() => setShowAddModel(true)} className="text-primary-600 font-bold hover:underline mt-2">Add First Model</button>
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {models.map(model => (
                                      <div key={model.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 group hover:shadow-sm transition">
                                          <div>
                                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{model.name}</p>
                                              {model.name_ar && <p className="text-xs text-gray-500">{model.name_ar}</p>}
                                          </div>
                                          <button 
                                            onClick={() => handleDeleteModel(model.id)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-white dark:hover:bg-gray-800 transition opacity-0 group-hover:opacity-100"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <Tag className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700" />
                      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Select a Brand</h3>
                      <p className="text-sm mt-1 max-w-xs mx-auto">Click on a brand from the list on the left to manage its models.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};