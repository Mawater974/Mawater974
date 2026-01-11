
import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Moon, Sun, Globe, Menu, X, Car, MapPin, User, LogOut, Heart,
  FileText, Bell, Phone, Mail, Facebook, Twitter, Instagram,
  LayoutDashboard, PlusCircle, Building2, Store, ChevronDown, LogIn, Search, Wrench, CalendarRange
} from 'lucide-react';
import { FALLBACK_COUNTRIES } from '../services/dataService';
import { LoadingSpinner } from './LoadingSpinner';

export const Layout: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    isDarkMode,
    toggleTheme,
    countries,
    selectedCountryId,
    selectedCountryCode,
    changeCountry,
    isLoading
  } = useAppContext();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { countryCode } = useParams<{ countryCode?: string }>();

  const mobileProfileRef = useRef<HTMLDivElement>(null);

  // Close mobile profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target as Node)) {
        setIsMobileProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // URL Validation Guard: If countryCode is present in URL, check validity.
  // If invalid, redirect to root (which handles auto-detection)
  if (countryCode) {
    const isValidCountry = FALLBACK_COUNTRIES.some(c => c.code.toLowerCase() === countryCode.toLowerCase());
    if (!isValidCountry) {
      return <Navigate to="/" replace />;
    }
  }

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(getLink('/login'));
  };

  // Helper for internal links
  // Preserves the country code if it exists in the current URL
  const getLink = (path: string) => {
    if (countryCode) {
      // Ensure path starts with /
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `/${countryCode}${cleanPath}`;
    }
    return path.startsWith('/') ? path : `/${path}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans relative transition-colors duration-200">

      {/* Loading Overlay for Country Switch */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center animate-fade-in-up">
            <img src="/logo.png" alt="Mawater974" className="h-20 w-auto mb-6 animate-pulse" />
            <LoadingSpinner className="w-12 h-12" />
            <p className="mt-4 text-gray-500 font-medium">Switching Region...</p>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700 h-20">
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">

            {/* Logo */}
            <Link to={getLink('/')} className="block flex-shrink-0">
              <img src="/logo.png" alt="Mawater974" className="h-10 md:h-12 w-auto object-contain" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <Link to={getLink('/cars')} className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 font-bold text-sm uppercase tracking-wide transition">{t('nav.cars')}</Link>
              <Link to={getLink('/parts')} className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 font-bold text-sm uppercase tracking-wide transition">{t('nav.parts')}</Link>
              <Link to={getLink('/dealers')} className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 font-bold text-sm uppercase tracking-wide transition">{t('nav.dealers')}</Link>
              <Link to={getLink('/services')} className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 font-bold text-sm uppercase tracking-wide transition">{t('nav.services')}</Link>
              <Link to={getLink('/rental')} className="text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 font-bold text-sm uppercase tracking-wide transition">{t('nav.rental')}</Link>
            </div>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">

              <Link to={getLink('/sell')} className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition mr-2">
                <PlusCircle className="w-4 h-4" />
                <span>{t('footer.sell_car')}</span>
              </Link>

              {/* Country Selector */}
              <div className="relative group z-50">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold transition text-gray-800 dark:text-gray-200">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  <span className="uppercase">
                    {countries.find(c => c.id === selectedCountryId)?.code || selectedCountryCode || 'QA'}
                  </span>
                </button>
                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block transform origin-top-right transition-all">
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl py-2 overflow-hidden">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('nav.select_country')}</div>
                    {countries.map(country => (
                      <button
                        key={country.id}
                        onClick={() => changeCountry(country.id)}
                        className={`block w-full text-start px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-between ${selectedCountryId === country.id ? 'text-primary-700 font-bold bg-primary-50 dark:bg-primary-900/10' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        <span>{language === 'ar' ? country.name_ar : country.name}</span>
                        {selectedCountryId === country.id && <span className="w-2 h-2 rounded-full bg-primary-600"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Language Switcher */}
              <button
                onClick={toggleLang}
                className="p-2 text-gray-500 hover:text-primary-700 transition font-bold text-sm flex items-center gap-1"
                title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              >
                <Globe className="w-5 h-5" />
                <span>{language === 'en' ? 'AR' : 'EN'}</span>
              </button>

              {/* Theme */}
              <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-primary-700 transition">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2 text-gray-500 hover:text-primary-700 transition relative"
                    >
                      <Bell className="w-5 h-5" />
                      {/* Mock Notification Badge */}
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                    </button>
                    {isNotifOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm">Notifications</div>
                        <div className="p-6 text-sm text-gray-500 text-center">No new notifications</div>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="relative group z-50">
                    <button className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block">{profile?.full_name || 'User'}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform duration-200 group-hover:rotate-180" />
                    </button>

                    <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover:block animate-fade-in">
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl py-2 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1 bg-gray-50/50 dark:bg-gray-700/30">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        {profile?.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 mb-1">
                            <LayoutDashboard className="w-4 h-4 text-purple-600" /> {t('nav.admin_dashboard')}
                          </Link>
                        )}

                        {profile?.role === 'dealer' && (
                          <Link to={getLink("/dealer-dashboard")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 mb-1">
                            <Store className="w-4 h-4 text-blue-600" /> {t('nav.dealer_portal')}
                          </Link>
                        )}

                        <Link to={getLink("/my-ads")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-500" /> {t('nav.my_ads')}
                        </Link>
                        <Link to={getLink("/favorites")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary-500" /> {t('nav.favorites')}
                        </Link>
                        <Link to={getLink("/profile")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary-500" /> {t('nav.profile')}
                        </Link>

                        {profile?.role !== 'dealer' && profile?.role !== 'admin' && (
                          <Link to={getLink("/register-showroom")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">
                            <Building2 className="w-4 h-4 text-orange-500" /> {t('nav.register_showroom')}
                          </Link>
                        )}

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                        <button onClick={handleSignOut} className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors">
                          <LogOut className="w-4 h-4" /> {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to={getLink("/login")} className="px-5 py-2 rounded-full text-sm font-bold text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition">
                    {t('nav.login')}
                  </Link>
                  <Link to={getLink("/signup")} className="bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Simplified Auth for Mobile Header */}
              {user ? (
                <div className="relative" ref={mobileProfileRef}>
                  <button
                    onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
                    className="flex items-center gap-1 p-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition"
                  >
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                      {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                    </div>
                  </button>
                  {/* Mobile Profile Dropdown */}
                  {isMobileProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl py-2 z-[60] animate-fade-in origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {profile?.role === 'dealer' && (
                        <Link to={getLink("/dealer-dashboard")} onClick={() => setIsMobileProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-600" /> {t('nav.dealer_portal')}
                        </Link>
                      )}
                      <Link to={getLink("/my-ads")} onClick={() => setIsMobileProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" /> {t('nav.my_ads')}
                      </Link>
                      <Link to={getLink("/favorites")} onClick={() => setIsMobileProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary-500" /> {t('nav.favorites')}
                      </Link>
                      <Link to={getLink("/profile")} onClick={() => setIsMobileProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary-500" /> {t('nav.profile')}
                      </Link>
                      <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                      <button onClick={() => { handleSignOut(); setIsMobileProfileOpen(false); }} className="w-full text-start px-4 py-2 text-sm text-red-600 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to={getLink("/login")} className="p-2 text-gray-600 dark:text-gray-300">
                  <LogIn className="w-6 h-6" />
                </Link>
              )}

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-gray-800 shadow-xl border-t border-gray-100 dark:border-gray-700 py-4 px-4 flex flex-col gap-4 z-40 animate-fade-in-down">
            <div className="grid grid-cols-2 gap-3">
              <Link to={getLink("/cars")} onClick={() => setIsMenuOpen(false)} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-white">
                <Car className="w-6 h-6 text-primary-600" /> {t('nav.cars')}
              </Link>
              <Link to={getLink("/parts")} onClick={() => setIsMenuOpen(false)} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-white">
                <Building2 className="w-6 h-6 text-primary-600" /> {t('nav.parts')}
              </Link>
              <Link to={getLink("/dealers")} onClick={() => setIsMenuOpen(false)} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-white">
                <Store className="w-6 h-6 text-primary-600" /> {t('nav.dealers')}
              </Link>
              <Link to={getLink("/services")} onClick={() => setIsMenuOpen(false)} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-white">
                <Wrench className="w-6 h-6 text-primary-600" /> {t('nav.services')}
              </Link>
            </div>

            <Link to={getLink("/rental")} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
              <CalendarRange className="w-5 h-5 text-gray-400" /> {t('nav.rental')}
            </Link>

            <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

            {/* Mobile Country Selector */}
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">{t('nav.select_country')}</label>
              <div className="grid grid-cols-2 gap-2">
                {countries.map(country => (
                  <button
                    key={country.id}
                    onClick={() => { changeCountry(country.id); setIsMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium border ${selectedCountryId === country.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                  >
                    <span className="uppercase">{country.code}</span>
                    {language === 'ar' ? country.name_ar : country.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={toggleLang} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-bold">
                <Globe className="w-4 h-4" /> {language === 'en' ? 'Arabic' : 'English'}
              </button>
              <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-bold">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDarkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-grow flex flex-col">
        <div className="container mx-auto px-4 py-6 flex-grow">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Brand Column */}
            <div className="space-y-4">
              <Link to={getLink("/")} className="block">
                <img src="/logo.png" alt="Mawater974" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" />
              </Link>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {t('footer.slogan')}
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-primary-600 transition"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-primary-600 transition"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-primary-600 transition"><Twitter className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">{t('footer.marketplace')}</h4>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to={getLink("/cars")} className="hover:text-primary-600 transition">{t('footer.buy_cars')}</Link></li>
                <li><Link to={getLink("/sell")} className="hover:text-primary-600 transition">{t('footer.sell_car')}</Link></li>
                <li><Link to={getLink("/parts")} className="hover:text-primary-600 transition">{t('nav.parts')}</Link></li>
                <li><Link to={getLink("/dealers")} className="hover:text-primary-600 transition">{t('nav.dealers')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to={getLink("/about")} className="hover:text-primary-600 transition">{t('footer.about')}</Link></li>
                <li><Link to={getLink("/contact")} className="hover:text-primary-600 transition">{t('footer.contact')}</Link></li>
                <li><Link to={getLink("/privacy")} className="hover:text-primary-600 transition">{t('footer.privacy')}</Link></li>
                <li><Link to={getLink("/terms")} className="hover:text-primary-600 transition">{t('footer.terms')}</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">{t('footer.contact')}</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span>{t('footer.address')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span dir="ltr">+974 1234 5678</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span>support@mawater974.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Mawater974. {t('footer.rights')}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {t('footer.operational')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
