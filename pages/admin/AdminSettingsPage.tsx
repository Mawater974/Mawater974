import React, { useState } from 'react';
import { exportAllDataJSON, importDataJSON } from '../../services/dataService';
import { Database, Upload, Download, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleExport = async () => {
      await exportAllDataJSON();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          setImporting(true);
          setImportStatus(null);
          
          reader.onload = async (event) => {
              const json = event.target?.result as string;
              if (json) {
                 const success = await importDataJSON(json);
                 if (success) {
                     setImportStatus({type: 'success', text: 'Data imported successfully!'});
                 } else {
                     setImportStatus({type: 'error', text: 'Failed to import data. Check console for details.'});
                 }
              }
              setImporting(false);
          };
          reader.readAsText(file);
      }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white">System Settings</h1>
        <p className="text-gray-500 text-sm">Manage global configurations and data backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Data Management Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Data Management</h3>
                    <p className="text-xs text-gray-500">Backup and Restore full database</p>
                </div>
             </div>
             
             <div className="space-y-4">
                 <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                        <strong>Warning:</strong> Importing data will merge with existing records. Ensure IDs do not conflict or use this feature only for restoration on clean instances.
                    </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button 
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                     >
                        <Download className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
                        <span className="font-bold text-gray-700 dark:text-gray-300">Export All Data</span>
                        <span className="text-xs text-gray-500">JSON Format</span>
                     </button>
                     
                     <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition group cursor-pointer relative">
                        {importing ? (
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
                        )}
                        <span className="font-bold text-gray-700 dark:text-gray-300">Import Data</span>
                        <span className="text-xs text-gray-500">Select JSON Backup</span>
                        <input type="file" accept="application/json" onChange={handleImport} disabled={importing} className="hidden" />
                     </label>
                 </div>
                 
                 {importStatus && (
                     <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${importStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                         {importStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                         {importStatus.text}
                     </div>
                 )}
             </div>
          </div>
          
          {/* General Config Placeholder */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 opacity-50 pointer-events-none">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">General Configuration</h3>
              <p className="text-sm text-gray-500">Additional settings for site metadata, currency, and localization will appear here.</p>
          </div>
      </div>
    </div>
  );
};
