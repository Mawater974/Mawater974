
import React, { useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { FileText, Edit, Trash2 } from 'lucide-react';

export const AdminContentPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const pages = [
      { id: 1, title: 'Privacy Policy', lastUpdated: '2 days ago', author: 'Admin' },
      { id: 2, title: 'Terms & Conditions', lastUpdated: '1 month ago', author: 'Admin' },
      { id: 3, title: 'About Us', lastUpdated: '3 months ago', author: 'Admin' },
      { id: 4, title: 'Contact Support Info', lastUpdated: '5 days ago', author: 'Support Team' },
  ];

  return (
    <div>
      <AdminHeader 
        title="Content Management System" 
        description="Manage static pages, blog posts, and site announcements."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        addLabel="New Page"
        onAdd={() => alert("CMS Editor coming soon")}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                <tr>
                    <th className="px-6 py-4">Page Title</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pages.map(page => (
                    <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{page.title}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{page.author}</td>
                        <td className="px-6 py-4 text-gray-500">{page.lastUpdated}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                    <Trash2 className="w-4 h-4" />
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
