
import React, { useState, useRef } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { DollarSign, CreditCard, Calendar, User, Search, Download } from 'lucide-react';
import { exportToCSV } from '../../services/dataService';

export const AdminFinancePage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Transactions Data
  const [transactions, setTransactions] = useState([
      { id: 'TXN-8821', user: 'Ahmed Al-Sayed', type: 'Featured Car Listing', item: 'Toyota Land Cruiser 2023', amount: 150, currency: 'QAR', date: '2023-10-15', status: 'Completed' },
      { id: 'TXN-8822', user: 'Elite Motors', type: 'Dealer Subscription', item: 'Premium Plan (Monthly)', amount: 500, currency: 'QAR', date: '2023-10-14', status: 'Completed' },
      { id: 'TXN-8823', user: 'John Doe', type: 'Featured Part', item: 'V8 Engine Block', amount: 50, currency: 'QAR', date: '2023-10-14', status: 'Pending' },
      { id: 'TXN-8824', user: 'Fatima Khalid', type: 'Featured Car Listing', item: 'Lexus LX570', amount: 150, currency: 'QAR', date: '2023-10-12', status: 'Failed' },
      { id: 'TXN-8825', user: 'Speed Auto', type: 'Banner Ad', item: 'Homepage Top Banner', amount: 1200, currency: 'QAR', date: '2023-10-10', status: 'Completed' },
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
      exportToCSV(transactions, `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Mock Import Logic
          const reader = new FileReader();
          reader.onload = (e) => {
              // In a real scenario, parse CSV/JSON here
              alert(`File "${file.name}" processed. (Mock Import: No new data added to view)`);
          };
          reader.readAsText(file);
      }
  };

  const filteredTransactions = transactions.filter(t => 
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminHeader 
        title="Finance & Payments" 
        description="Monitor 'Pay for Featured' transactions and subscriptions."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onExport={handleExport}
        onImport={handleImportClick}
        addLabel="Manual Transaction"
        onAdd={() => alert("Manual transaction entry form coming soon.")}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".csv,.json" 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-bold">Total Revenue (Month)</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">24,500 <span className="text-sm font-medium text-gray-400">QAR</span></h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                  <DollarSign className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-bold">Active Subscriptions</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">42</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                  <CreditCard className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm font-bold">Pending Payments</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">5</h3>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded-lg">
                  <Calendar className="w-6 h-6" />
              </div>
          </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-bold text-lg dark:text-white">Recent Transactions</h3>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white w-64" 
                  />
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Service / Item</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredTransactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 font-mono text-gray-500">{txn.id}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                        <User className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{txn.user}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-gray-200">{txn.type}</p>
                                <p className="text-xs text-gray-500">{txn.item}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                {txn.amount} {txn.currency}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{txn.date}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                    txn.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    txn.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {txn.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-primary-600 hover:text-primary-700 hover:underline flex items-center justify-end gap-1 w-full">
                                    <Download className="w-3 h-3" /> PDF
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
