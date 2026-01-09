
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Car, Users, Building2, FileText, Settings, 
  BarChart, Key, Bell, Database, Shield, Link as LinkIcon, 
  Palette, Globe, Activity, Menu, X, LogOut, ChevronDown, Tag
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Brands & Models', icon: Tag, path: '/admin/brands' },
    { title: 'Car Management', icon: Car, path: '/admin/cars' },
    { title: 'Dealer Management', icon: Building2, path: '/admin/dealers' },
    { title: 'User Management', icon: Users, path: '/admin/users' },
    { title: 'Content CMS', icon: FileText, path: '/admin/content' },
    { title: 'Analytics & Reports', icon: BarChart, path: '/admin/reports' },
    { title: 'System Settings', icon: Settings, path: '/admin/settings' },
    { title: 'API Management', icon: Key, path: '/admin/api' },
    { title: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { title: 'Database', icon: Database, path: '/admin/database' },
    { title: 'Security', icon: Shield, path: '/admin/security' },
    { title: 'Integrations', icon: LinkIcon, path: '/admin/integrations' },
    { title: 'Theme & UI', icon: Palette, path: '/admin/theme' },
    { title: 'SEO', icon: Globe, path: '/admin/seo' },
    { title: 'System Health', icon: Activity, path: '/admin/health' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-gray-900 text-white w-64 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src="/logo.png" alt="Mawater974" className="h-8 w-auto bg-white rounded p-0.5" />
            <span className="text-white">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary-600 text-white' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                {profile?.full_name?.[0] || 'A'}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Admin'}</p>
             </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-600/20 hover:text-red-500 text-gray-300 py-2 rounded-lg transition text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 z-40">
           <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">
             <Menu className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-4 ml-auto">
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link to="/" className="text-sm text-primary-600 font-bold hover:underline">
                 View Website
              </Link>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           <Outlet />
        </main>
      </div>
    </div>
  );
};