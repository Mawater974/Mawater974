
import React from 'react';
import { RefreshCw, Download, Upload, Plus } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  description: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  refreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, description, onRefresh, onExport, onImport, onAdd, addLabel, refreshing 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold dark:text-white mb-1">{title}</h1>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={refreshing}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all" 
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        {onImport && (
          <button onClick={onImport} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
            <Upload className="w-4 h-4" /> Import
          </button>
        )}
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" /> Export
          </button>
        )}
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> {addLabel || 'Add New'}
          </button>
        )}
      </div>
    </div>
  );
};
