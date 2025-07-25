'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AdminNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Admin Dashboard', href: '/admin' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Country Analytics', href: '/admin/country-analytics' },
    { name: 'Cars', href: '/admin/cars' },
    { name: 'Spare Parts', href: '/admin/spare-parts' },
    { name: 'Dealerships', href: '/admin/dealership-requests' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Database', href: '/admin/database' },
    { name: 'Brands', href: '/admin/brands' },
    { name: 'Models', href: '/admin/models' },
    { name: 'Locations', href: '/admin/locations' },
    { name: 'Currency Rates', href: '/admin/currency-rates' },
    { name: 'Settings', href: '/admin/settings' },
    { name: 'Contacts', href: '/admin/contact-messages' },
    { name: 'Files', href: '/admin/files' },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Export', href: '/admin/export' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md mb-4">
      <div className="mx-auto px-2">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="text-xl font-bold text-qatar-maroon dark:text-qatar-maroon-light">
                Admin
              </Link>
            </div>
            <nav className="ml-6 flex overflow-x-auto hide-scrollbar">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-qatar-maroon text-white dark:bg-qatar-maroon-dark'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-qatar-maroon"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
