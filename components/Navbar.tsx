'use client';

import { Fragment, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  HomeIcon,
  BellIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCountry } from '../contexts/CountryContext';
import CountrySelector from './CountrySelector';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import MobileCategoryBar from './MobileCategoryBar';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { currentCountry } = useCountry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [country, setCountry] = useState(currentCountry?.code.toLowerCase() || 'qa');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setCountry(currentCountry?.code.toLowerCase() || 'qa');
    setMounted(true);
    // Check if user is admin
    const checkUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error checking user role:', error);
            
            // Try to ensure the profile exists
            try {
              const { data: ensureData, error: ensureError } = await supabase.rpc(
                'ensure_user_profile_exists',
                { user_id: user.id }
              );
              
              if (ensureError) {
                console.error('Error ensuring profile exists:', ensureError);
                return;
              }
              
              console.log('Profile check result:', ensureData);
              
              // Try to get the role again
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
                
              if (retryError) {
                console.error('Error retrying user role check:', retryError);
                return;
              }
              
              setIsAdmin(retryData?.role === 'admin');
              setIsDealer(retryData?.role === 'dealer');
            } catch (ensureError) {
              console.error('Exception ensuring profile exists:', ensureError);
            }
            
            return;
          }
          
          setIsAdmin(data?.role === 'admin');
          setIsDealer(data?.role === 'dealer');
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    checkUserRole();
    if (user) {
      fetchUnreadCount();
      // Subscribe to notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    try {
      trackEvent?.('language_change', { from: language, to: newLang });
    } catch (error) {
      console.error('Error tracking language change:', error);
    }
  };

  const navItems = [
    { name: t('nav.browseCars'), href: `/${currentCountry?.code.toLowerCase()}/cars` },
    { name: t('nav.sellYourCar'), href: `/${currentCountry?.code.toLowerCase()}/sell` },
    { name: t('nav.showrooms'), href: `/${currentCountry?.code.toLowerCase()}/showrooms` },
    { name: t('nav.carRental'), href: `/${currentCountry?.code.toLowerCase()}/car-rental` },
    { name: t('nav.spareParts'), href: `/${currentCountry?.code.toLowerCase()}/spare-parts` },
    { name: t('nav.carPhotography'), href: `/${currentCountry?.code.toLowerCase()}/car-photography` },
  ];

  const userMenuItems = [
    { name: t('user.myProfile'), href: `/profile`, icon: UserCircleIcon },
    ...(isAdmin ? [{ name: t('user.adminDashboard'), href: `/admin`, icon: ClipboardDocumentListIcon }] : []),
    ...(isDealer ? [{ name: t('user.dealerDashboard'), href: `/dealer-dashboard`, icon: ClipboardDocumentListIcon }] : []),
    { name: t('user.myAds'), href: `/my-ads`, icon: ClipboardDocumentListIcon },
    { name: t('user.favorites'), href: `/favorites`, icon: HeartIcon },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex-1 flex items-center justify-between">
            <Link href={`/${currentCountry?.code.toLowerCase()}`} className="flex items-center">
              <Image src="/logo.png" alt="Mawater974 Logo" width={150} height={40} className="h-150 w-40" priority />
            </Link>

            {/* Navigation Links */}
            <div className={`hidden lg:flex items-center ${language === 'ar' ? 'space-x-reverse space-x-4 xl:space-x-10' : 'space-x-4 xl:space-x-8 2xl:space-x-10'}`}>
              <Link
                href={`/${currentCountry?.code.toLowerCase()}`}
                className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium whitespace-nowrap"
              >
                {t('nav.home')}
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon text-sm font-medium whitespace-nowrap"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className={`flex items-center ${language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              {/* Country Selector */}
              <div className="hidden md:block w-35">
                <CountrySelector />
              </div>
              
              {/* Language Switcher */}
              <button
                onClick={handleLanguageChange}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon border border-gray-200 dark:border-gray-700 rounded-lg hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors"
              >
                {language === 'ar' ? 'EN' : 'ع'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>

              {/* User Menu */}
              {user ? (
                <Menu as="div" className="relative ml-3">
                  <Menu.Button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-qatar-maroon dark:hover:text-qatar-maroon group">
                    <UserCircleIcon className="h-8 w-8" />
                    <span className="hidden md:block font-medium mx-2">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-qatar-maroon dark:group-hover:text-qatar-maroon transition-colors" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-1 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
                      {/* Profile */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <UserCircleIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                            {t('user.myProfile')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Messages & Notifications */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/messages"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 relative`}
                          >
                            <BellIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                            {t('user.messages')}
                            {unreadCount > 0 && (
                              <span className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 bg-qatar-maroon text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Favorites */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/favorites"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <HeartIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                            {t('user.favorites')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* My Ads */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/my-ads"
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <ClipboardDocumentListIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                            {t('user.myAds')}
                          </Link>
                        )}
                      </Menu.Item>

                      {/* Showroom Dashboard */}
                      {isDealer && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dealer-dashboard"
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <Cog6ToothIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                              {t('dashboard.title')}
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      {/* Admin Dashboard */}
                      {isAdmin && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin"
                              className={`${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <Cog6ToothIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                              {t('user.adminDashboard')}
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <ArrowRightOnRectangleIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                            {t('user.signOut')}
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <div className="hidden sm:flex sm:items-center sm:space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon px-3 py-2 text-sm font-medium"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-qatar-maroon text-white hover:bg-qatar-maroon/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} fixed inset-0 z-50`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)}></div>
        <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-gray-900 shadow-xl transform transition ease-in-out duration-300">
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('nav.menu')}</h2>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('nav.country')}</span>
              <div className="w-40">
                <CountrySelector />
              </div>
            </div>
          </div>
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('nav.language')}</span>
              <button
                onClick={handleLanguageChange}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon border border-gray-200 dark:border-gray-700 rounded-lg hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors"
              >
                {language === 'ar' ? 'EN' : 'ع'}
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('nav.theme')}</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                {t('nav.home')}
              </span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-sign-in-alt text-gray-400" />
                    {t('nav.signIn')}
                  </span>
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-qatar-maroon dark:hover:text-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-user-plus text-gray-400" />
                    {t('nav.signUp')}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <MobileCategoryBar />
    </nav>
  );
}
