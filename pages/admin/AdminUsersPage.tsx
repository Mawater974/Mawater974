
import React, { useEffect, useState, useRef } from 'react';
import { getAllUsers, exportToCSV } from '../../services/dataService';
import { supabase } from '../../supabaseClient';
import { Profile } from '../../types';
import { Mail, Shield, Search, Send, Sparkles, X, Loader2, CheckCircle } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'dealers'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setRefreshing(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => u.role === 'dealer');

  const handleExport = () => {
      exportToCSV(filteredUsers, `users_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImport = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.length) {
          alert("Import feature coming soon! File selected: " + e.target.files[0].name);
      }
  };

  // --- New Functionality ---

  const handleSendMagicLink = async (email: string | undefined, name: string) => {
      if (!email) return alert("No email address found for this user.");
      
      if (confirm(`Send a magic login link to ${name} (${email})?`)) {
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) {
              alert("Failed to send link: " + error.message);
          } else {
              alert("Magic link sent successfully!");
          }
      }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;

      setSendingInvite(true);
      // Using signInWithOtp allows sending a "magic link" which acts as an invite/signup for new users
      const { error } = await supabase.auth.signInWithOtp({ email: inviteEmail });
      
      setSendingInvite(false);
      
      if (error) {
          alert("Error sending invite: " + error.message);
      } else {
          alert(`Invite sent to ${inviteEmail} successfully!`);
          setInviteEmail('');
          setIsInviteModalOpen(false);
      }
  };

  return (
    <div>
      <AdminHeader 
        title="User Management"
        description="Manage user accounts, roles, and dealer permissions."
        onRefresh={fetchUsers}
        refreshing={refreshing}
        onExport={handleExport}
        onImport={handleImport}
        onAdd={() => setIsInviteModalOpen(true)}
        addLabel="Invite User"
      />
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv,.json" />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
             <div className="flex gap-4 text-sm font-medium">
                <button 
                   onClick={() => setActiveTab('all')}
                   className={`pb-2 px-1 border-b-2 transition ${activeTab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   All Users
                </button>
                <button 
                   onClick={() => setActiveTab('dealers')}
                   className={`pb-2 px-1 border-b-2 transition ${activeTab === 'dealers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   Dealers & Showrooms
                </button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 dark:text-white" />
             </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                   <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                   {loading ? (
                      <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                   ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found.</td></tr>
                   ) : (
                      filteredUsers.map(user => (
                         <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                     {user.full_name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
                                     <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <Mail className="w-3 h-3" /> {user.email || 'No email'}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  user.role === 'dealer' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                               }`}>
                                  {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                  {user.role || 'User'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">Active</span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                               {new Date(user.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => handleSendMagicLink(user.email, user.full_name)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition group relative"
                                      title="Send Magic Link"
                                   >
                                      <Sparkles className="w-4 h-4" />
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

      {/* Invite Modal */}
      {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 relative">
                  <button 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                      <X className="w-5 h-5" />
                  </button>

                  <div className="mb-6">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 mb-4">
                          <Send className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold dark:text-white">Invite User</h2>
                      <p className="text-gray-500 text-sm mt-1">Send an invitation email with a magic link to join.</p>
                  </div>

                  <form onSubmit={handleInviteSubmit}>
                      <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="new.user@example.com"
                          />
                      </div>

                      <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setIsInviteModalOpen(false)}
                            className="flex-1 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={sendingInvite}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                              {sendingInvite ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              Send Invite
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
