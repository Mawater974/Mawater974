
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Country } from '../types';
import { getCountries, FALLBACK_COUNTRIES } from '../services/dataService';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface AppContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  countries: Country[];
  selectedCountryId: number | null;
  selectedCountryCode: string;
  changeCountry: (countryId: number) => void;
  currency: string;
  selectedCountry?: Country;
  isLoading: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  'nav.home': { en: 'Home', ar: 'الرئيسية' },
  'nav.cars': { en: 'Buy Cars', ar: 'شراء سيارات' },
  'nav.parts': { en: 'Spare Parts', ar: 'قطع غيار' },
  'nav.dealers': { en: 'Showrooms', ar: 'المعارض' },
  'nav.services': { en: 'Services', ar: 'الخدمات' },
  'nav.rental': { en: 'Car Rental', ar: 'تأجير سيارات' },
  'nav.login': { en: 'Login', ar: 'تسجيل دخول' },
  'nav.my_ads': { en: 'My Ads', ar: 'إعلاناتي' },
  'nav.favorites': { en: 'Favorites', ar: 'المفضلة' },
  'nav.profile': { en: 'My Profile', ar: 'ملفي الشخصي' },
  'hero.badge': { en: 'Ride in Style', ar: 'قُد بأسلوب' },
  'hero.title1': { en: 'Exclusive Cars', ar: 'سيارات حصرية' },
  'hero.title2': { en: 'in {country}', ar: 'في {country}' },
  'hero.description': { 
    en: 'Discover the finest vehicles in {country}. From supercars to economic sedans, Find your perfect choice with Mawater974.', 
    ar: 'اكتشف أرقى السيارات في {country}. من السيارات الخارقة إلى سيارات السيدان الاقتصادية، اعثر على خيارك الأمثل مع مواتر 974.' 
  },
  'hero.search': { en: 'Search...', ar: 'بحث...' },
  'featured.cars': { en: 'Featured Cars', ar: 'سيارات مميزة' },
  'featured.parts': { en: 'Featured Spare Parts', ar: 'قطع غيار مميزة' },
  'featured.dealers': { en: 'Top Showrooms', ar: 'أفضل المعارض' },
  'common.price': { en: 'Price', ar: 'السعر' },
  'common.year': { en: 'Year', ar: 'السنة' },
  'common.mileage': { en: 'Mileage', ar: 'الممشى' },
  'common.view_details': { en: 'View Details', ar: 'التفاصيل' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.no_results': { en: 'No results found', ar: 'لا توجد نتائج' },
  'common.save': { en: 'Save', ar: 'حفظ' },
  'filter.brand': { en: 'Brand', ar: 'الماركة' },
  'filter.all_brands': { en: 'All Brands', ar: 'كل الماركات' },
  'filter.min_price': { en: 'Min Price', ar: 'أقل سعر' },
  'filter.max_price': { en: 'Max Price', ar: 'أعلى سعر' },
  'filter.min_year': { en: 'Min Year', ar: 'من سنة' },
  'filter.max_year': { en: 'Max Year', ar: 'إلى سنة' },
  'filter.apply': { en: 'Apply Filters', ar: 'تطبيق الفلتر' },
  'filter.title': { en: 'Filters', ar: 'الفلاتر' },
  'filter.clear': { en: 'Clear', ar: 'مسح' },
  'filter.show': { en: 'Show Filters', ar: 'إظهار الفلاتر' },
  'filter.hide': { en: 'Hide Filters', ar: 'إخفاء الفلاتر' },
  'search.placeholder': { en: 'Search by description...', ar: 'ابحث في الوصف...' },
  'footer.rights': { en: 'All Rights Reserved', ar: 'جميع الحقوق محفوظة' },
  'nav.select_country': { en: 'Select Country', ar: 'اختر الدولة' },
  'car.details': { en: 'Car Details', ar: 'تفاصيل السيارة' },
  'car.description': { en: 'Description', ar: 'الوصف' },
  'car.specifications': { en: 'Specifications', ar: 'المواصفات' },
  'car.color': { en: 'Color', ar: 'اللون' },
  'car.body_type': { en: 'Body Type', ar: 'نوع الهيكل' },
  'car.condition': { en: 'Condition', ar: 'الحالة' },
  'car.fuel': { en: 'Fuel Type', ar: 'نوع الوقود' },
  'car.gearbox': { en: 'Transmission', ar: 'ناقل الحركة' },
  'car.contact_seller': { en: 'Contact Seller', ar: 'تواصل مع البائع' },
  'car.seller_info': { en: 'Seller Info', ar: 'معلومات البائع' },
  'car.verified_seller': { en: 'Verified Seller', ar: 'بائع موثوق' },
  'profile.title': { en: 'My Profile', ar: 'الملف الشخصي' },
  'profile.update_success': { en: 'Profile updated successfully', ar: 'تم تحديث الملف بنجاح' },
  'cars.showing_results': { en: 'Showing {count} of {total} results', ar: 'عرض {count} من {total} نتيجة' },
  'cars.compare': { en: 'Compare', ar: 'مقارنة' },
  'cars.done': { en: 'Done', ar: 'تم' },
  'cars.compare_selected': { en: '{count} / 3 Selected', ar: 'تم تحديد {count} / 3' },
  'cars.compare_now': { en: 'Compare Now', ar: 'قارن الآن' },
  'cars.hero.title': { en: 'Find Your Perfect Car', ar: 'اعثر على سيارتك المثالية' },
  'cars.hero.subtitle': { en: 'Browse thousands of cars in {country}. Verified sellers, trusted dealers.', ar: 'تصفح آلاف السيارات في {country}. بائعون موثوقون ومعارض معتمدة.' },
  'sort.label': { en: 'Sort by', ar: 'ترتيب حسب' },
  'sort.newest': { en: 'Newest Listed', ar: 'الأحدث' },
  'sort.price_asc': { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' },
  'sort.price_desc': { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' },
  'sort.mileage_asc': { en: 'Lowest Mileage', ar: 'أقل ممشى' },
  'sort.year_desc': { en: 'Newest Model Year', ar: 'أحدث موديل' },
  'sort.name_asc': { en: 'Name (A-Z)', ar: 'الاسم (أ-ي)' },
  'sort.featured': { en: 'Featured First', ar: 'المميزة أولاً' },
  'dealers.subtitle': { en: 'Discover premium showrooms and verified dealers.', ar: 'اكتشف أرقى المعارض والتجار الموثوقين.' },
  'dealers.no_results': { en: 'No showrooms found.', ar: 'لا توجد معارض.' },
  'common.try_adjusting': { en: 'Try adjusting your filters.', ar: 'حاول تعديل الفلاتر.' },
  'footer.slogan': { en: "Qatar's #1 Marketplace for Cars, Parts & Services. We connect buyers and sellers with trust and ease.", ar: "أفضل سوق للسيارات وقطع الغيار والخدمات في قطر. نربط البائعين والمشترين بثقة وسهولة." },
  'footer.marketplace': { en: "Marketplace", ar: "السوق" },
  'footer.company': { en: "Company", ar: "الشركة" },
  'footer.contact': { en: "Contact Us", ar: "اتصل بنا" },
  'footer.buy_cars': { en: "Buy Used Cars", ar: "شراء سيارات مستعملة" },
  'footer.sell_car': { en: "Sell Your Car", ar: "بع سيارتك" },
  'footer.about': { en: "About Us", ar: "من نحن" },
  'footer.privacy': { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  'footer.terms': { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  'footer.support': { en: "Contact Support", ar: "تواصل مع الدعم" },
  'footer.address': { en: "West Bay, Doha, Qatar", ar: "الخليج الغربي، الدوحة، قطر" },
  'footer.pobox': { en: "PO Box 12345", ar: "ص.ب 12345" },
  'footer.operational': { en: "Systems Operational", ar: "الأنظمة تعمل بكفاءة" },
  'contact.title': { en: 'Contact Us', ar: 'اتصل بنا' },
  'contact.subtitle': { en: 'We are here to help you. Send us your query.', ar: 'نحن هنا لمساعدتك. أرسل لنا استفسارك.' },
  'contact.name': { en: 'Full Name', ar: 'الاسم الكامل' },
  'contact.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'contact.message': { en: 'Your Message', ar: 'رسالتك' },
  'contact.send': { en: 'Send Message', ar: 'إرسال الرسالة' },
  'contact.success': { en: 'Message sent successfully! We will contact you soon.', ar: 'تم إرسال الرسالة بنجاح! سنقوم بالتواصل معك قريباً.' },
  'contact.error': { en: 'Failed to send message. Please try again.', ar: 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.' },
  
  // Dealer Portal
  'dealer.dashboard': { en: 'Dealer Dashboard', ar: 'لوحة تحكم التاجر' },
  'dealer.overview': { en: 'Overview', ar: 'نظرة عامة' },
  'dealer.inventory': { en: 'Inventory', ar: 'المخزون' },
  'dealer.profile': { en: 'Showroom Profile', ar: 'ملف المعرض' },
  'dealer.total_cars': { en: 'Total Cars', ar: 'إجمالي السيارات' },
  'dealer.active_listings': { en: 'Active Listings', ar: 'الإعلانات النشطة' },
  'dealer.total_views': { en: 'Total Views', ar: 'إجمالي المشاهدات' },
  'dealer.add_car': { en: 'Add New Car', ar: 'أضف سيارة جديدة' },
  'dealer.table.car_details': { en: 'Car Details', ar: 'تفاصيل السيارة' },
  'dealer.table.status': { en: 'Status', ar: 'الحالة' },
  'dealer.table.actions': { en: 'Actions', ar: 'إجراءات' },
  'dealer.no_cars': { en: 'No cars listed. Start by adding one!', ar: 'لا توجد سيارات. ابدأ بإضافة واحدة!' },
  'register_showroom.title': { en: 'Register Your Showroom', ar: 'سجل معرضك' },
  'register_showroom.subtitle': { en: 'Join our network of premium dealers.', ar: 'انضم لشبكة أفضل المعارض.' },
  'register_showroom.business_details': { en: 'Business Details', ar: 'تفاصيل العمل' },
  'register_showroom.contact_info': { en: 'Contact Information', ar: 'معلومات الاتصال' },
  'register_showroom.submit': { en: 'Submit Registration', ar: 'إرسال التسجيل' },
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  // Initialize with FALLBACK_COUNTRIES to ensure immediate availability
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [isLoading, setIsLoading] = useState(false);
  
  // Extract countryCode from URL
  const pathParts = location.pathname.split('/');
  const urlCountryCode = pathParts[1]; 
  
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLanguage(savedLang);

    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const initCountries = async () => {
      // 1. Resolve ID immediately from Fallback data if URL code exists
      // This prevents the "Loading" state on pages that wait for selectedCountryId
      if (urlCountryCode && urlCountryCode.length === 2 && !selectedCountryId) {
          const matched = FALLBACK_COUNTRIES.find(c => c.code.toLowerCase() === urlCountryCode.toLowerCase());
          if (matched) {
              setSelectedCountryId(matched.id);
          }
      }

      // 2. Fetch fresh data from DB
      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
      
      // 3. Re-validate/Update selected ID with fresh data
      if (urlCountryCode && urlCountryCode.length === 2) {
          const matched = fetchedCountries.find(c => c.code.toLowerCase() === urlCountryCode.toLowerCase());
          if (matched) {
              setSelectedCountryId(matched.id);
              localStorage.setItem('app_country', String(matched.id));
          }
      } 
    };
    initCountries();
  }, [urlCountryCode]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  const changeCountry = (id: number) => {
    const country = countries.find(c => c.id === id);
    if (country) {
        setIsLoading(true);
        setSelectedCountryId(id);
        localStorage.setItem('app_country', String(id));
        
        // Always redirect to home page of the selected country
        navigate(`/${country.code.toLowerCase()}`);

        // Add fake delay to show transition
        setTimeout(() => {
            setIsLoading(false);
        }, 800);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('app_theme', newVal ? 'dark' : 'light');
      if (newVal) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newVal;
    });
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    let text = translations[key]?.[language] || key;
    if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            text = text.replace(`{${paramKey}}`, String(paramValue));
        });
    }
    return text;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  
  const selectedCountry = countries.find(c => c.id === selectedCountryId);
  const currency = selectedCountry?.currency_code || 'QAR';
  const selectedCountryCode = selectedCountry?.code?.toLowerCase() || 'qa';

  return (
    <AppContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      isDarkMode, 
      toggleTheme, 
      t, 
      dir,
      countries,
      selectedCountryId,
      selectedCountryCode,
      changeCountry,
      currency,
      selectedCountry,
      isLoading
    }}>
      <div dir={dir} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
