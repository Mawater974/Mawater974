
import React from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Globe, Search, Code, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminSeoPage: React.FC = () => {
    return (
        <div>
            <AdminHeader
                title="SEO & Metadata"
                description="Configure search engine optimization settings and sitemaps."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Global Meta */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                        <Globe className="w-5 h-5 text-blue-500" /> Global Settings
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Site Title Suffix</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" defaultValue="| Mawater974 - Premium Car Market" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
                            <textarea rows={3} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" defaultValue="Discover the finest vehicles in Qatar. Buy and sell cars, find spare parts, and locate trusted showrooms with Mawater974." />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Keywords</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" defaultValue="cars, qatar, doha, buy car, sell car, luxury cars, spare parts" />
                        </div>
                        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700">Save Changes</button>
                    </div>
                </div>

                {/* Technical SEO */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                            <Code className="w-5 h-5 text-green-500" /> Technical SEO
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">Sitemap.xml</p>
                                        <p className="text-xs text-gray-500">Last generated: 1 day ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid</span>
                                    <button className="text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 px-2 py-1 rounded hover:bg-gray-50">Regenerate</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">Robots.txt</p>
                                        <p className="text-xs text-gray-500">Allowing all crawlers</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="text-xs text-primary-600 font-bold hover:underline">Edit</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                            <Search className="w-5 h-5 text-purple-500" /> Search Preview
                        </h3>

                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">www.mawater974.com</p>
                            <h4 className="text-xl text-blue-800 dark:text-blue-400 hover:underline cursor-pointer mb-1">Mawater974 - Qatar's Premium Car Market</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                                Discover the finest vehicles in Qatar. Buy and sell cars, find spare parts, and locate trusted showrooms with Mawater974. Join thousands of users today.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
