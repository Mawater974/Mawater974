
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, Sun, Globe, Menu, X, Car, MapPin, User, LogOut, Heart, 
  FileText, Bell, Phone, Mail, Facebook, Twitter, Instagram, 
  LayoutDashboard, PlusCircle, Building2, Store
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
    changeCountry,
    isLoading
  } = useAppContext();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();

  // URL Validation Guard
  const isValidCountry = FALLBACK_COUNTRIES.some(c => c.code === countryCode);
  if (!isValidCountry && countryCode) {
     return <Navigate to="/qa" replace />;
  }

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(`/${countryCode}/login`);
  };

  // Helper for internal links
  const getLink = (path: string) => `/${countryCode}${path}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Loading Overlay */}
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
            <Link to={getLink('/')} className="block">
              <img src="/logo.png" alt="Mawater974" className="h-12 w-auto object-contain" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
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

              {/* Country Selector (Shows Code) */}
              <div className="relative group z-50">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold transition">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  <span className="uppercase">
                    {countries.find(c => c.id === selectedCountryId)?.code || countryCode?.toUpperCase() || 'QA'}
                  </span>
                </button>
                {/* Dropdown shows Full Name */}
                <div className="absolute right-0 top-full pt-4 -mt-2 w-48 hidden group-hover:block">
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl py-2">
                    {countries.map(country => (
                      <button
                        key={country.id}
                        onClick={() => changeCountry(country.id)}
                        className={`block w-full text-start px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedCountryId === country.id ? 'text-primary-700 font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        {language === 'ar' ? country.name_ar : country.name}
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
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                    </button>
                    {isNotifOpen && (
                       <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm">Notifications</div>
                          <div className="p-6 text-sm text-gray-500 text-center">No new notifications</div>
                       </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="relative group z-50">
                      <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                           <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block">{profile?.full_name || 'User'}</span>
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full pt-4 -mt-2 w-60 hidden group-hover:block animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl py-2">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                            <p className="font-bold text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            
                            {profile?.role === 'admin' && (
                                <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 mb-1">
                                    <LayoutDashboard className="w-4 h-4 text-purple-600" /> Admin Dashboard
                                </Link>
                            )}

                            {profile?.role === 'dealer' && (
                                <Link to={getLink("/dealer-dashboard")} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 mb-1">
                                    <Store className="w-4 h-4 text-blue-600" /> Dealer Portal
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
                                    <Building2 className="w-4 h-4 text-orange-500" /> Register Showroom
                                </Link>
                            )}

                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                            <button onClick={handleSignOut} className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                      </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                    <Link to={getLink("/login")} className="px-5 py-2 rounded-full text-sm font-bold text-primary-700 hover:bg-primary-50 transition">
                    {t('nav.login')}
                    </Link>
                    <Link to={getLink("/signup")} className="bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition">
                    Register
                    </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-6 flex flex-col gap-4 shadow-2xl absolute w-full z-40">
             <Link to={getLink("/cars")} onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg font-bold">{t('nav.cars')}</Link>
             <Link to={getLink("/parts")} onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg font-bold">{t('nav.parts')}</Link>
             <Link to={getLink("/dealers")} onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg font-bold">{t('nav.dealers')}</Link>
             <Link to={getLink("/sell")} onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg font-bold text-primary-600">{t('footer.sell_car')}</Link>
             
             {user && (
               <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-2">
                 {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 font-bold text-purple-600">Admin Dashboard</Link>
                 )}
                 {profile?.role === 'dealer' && (
                    <Link to={getLink("/dealer-dashboard")} onClick={() => setIsMenuOpen(false)} className="block py-2 font-bold text-blue-600">Dealer Portal</Link>
                 )}
                 <Link to={getLink("/my-ads")} onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium">{t('nav.my_ads')}</Link>
                 <Link to={getLink("/favorites")} onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium">{t('nav.favorites')}</Link>
                 <Link to={getLink("/profile")} onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium">{t('nav.profile')}</Link>
                 {profile?.role !== 'dealer' && (
                    <Link to={getLink("/register-showroom")} onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-orange-600">Register Showroom</Link>
                 )}
               </div>
             )}

             <div className="py-4 border-t border-gray-100 dark:border-gray-700">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t('nav.select_country')}</span>
               <div className="flex flex-wrap gap-2">
                 {countries.map(country => (
                    <button
                      key={country.id}
                      onClick={() => { changeCountry(country.id); setIsMenuOpen(false); }}
                      className={`px-4 py-2 text-sm rounded-lg border ${selectedCountryId === country.id ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      {language === 'ar' ? country.name_ar : country.name}
                    </button>
                 ))}
               </div>
             </div>

             <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-4">
                  <button onClick={toggleTheme} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center gap-2">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="text-sm font-medium">Theme</span>
                  </button>
                  <button onClick={toggleLang} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">{language === 'en' ? 'العربية' : 'English'}</span>
                  </button>
                </div>
                
                {user ? (
                   <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                            {profile?.full_name?.[0] || 'U'}
                         </div>
                         <div>
                            <p className="font-bold text-sm">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                         </div>
                      </div>
                      <button onClick={handleSignOut} className="text-red-500 p-2"><LogOut className="w-5 h-5" /></button>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                     <Link to={getLink("/login")} onClick={() => setIsMenuOpen(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl text-center font-bold">
                       {t('nav.login')}
                     </Link>
                     <Link to={getLink("/signup")} onClick={() => setIsMenuOpen(false)} className="bg-primary-700 text-white py-3 rounded-xl text-center font-bold">
                       Register
                     </Link>
                  </div>
                )}
             </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white border-t border-gray-800 pt-16 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <Link to={getLink("/")} className="block">
                <img src="/logo.png" alt="Mawater974" className="h-16 w-auto bg-white rounded-lg p-1" />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                 {t('footer.slogan')}
              </p>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition cursor-pointer">
                    <Facebook className="w-5 h-5" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition cursor-pointer">
                    <Twitter className="w-5 h-5" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition cursor-pointer">
                    <Instagram className="w-5 h-5" />
                 </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-6 text-lg">{t('footer.marketplace')}</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                 <li><Link to={getLink("/cars")} className="hover:text-primary-500 transition">{t('footer.buy_cars')}</Link></li>
                 <li><Link to={getLink("/parts")} className="hover:text-primary-500 transition">{t('nav.parts')}</Link></li>
                 <li><Link to={getLink("/dealers")} className="hover:text-primary-500 transition">{t('nav.dealers')}</Link></li>
                 <li><Link to={getLink("/my-ads")} className="hover:text-primary-500 transition">{t('footer.sell_car')}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-white mb-6 text-lg">{t('footer.company')}</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                 <li><Link to="#" className="hover:text-primary-500 transition">{t('footer.about')}</Link></li>
                 <li><Link to="#" className="hover:text-primary-500 transition">{t('footer.privacy')}</Link></li>
                 <li><Link to="#" className="hover:text-primary-500 transition">{t('footer.terms')}</Link></li>
                 <li><Link to={getLink("/contact")} className="hover:text-primary-500 transition">{t('footer.support')}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-white mb-6 text-lg">{t('footer.contact')}</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                 <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span>{t('footer.address')}<br/>{t('footer.pobox')}</span>
                 </li>
                 <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span dir="ltr">+974 1234 5678</span>
                 </li>
                 <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span dir="ltr">support@mawater974.com</span>
                 </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Mawater974. {t('footer.rights')}
            </p>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-400">{t('footer.operational')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
