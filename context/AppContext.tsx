
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
  'nav.register': { en: 'Register', ar: 'تسجيل جديد' },
  'nav.logout': { en: 'Sign Out', ar: 'تسجيل خروج' },
  'nav.my_ads': { en: 'My Ads', ar: 'إعلاناتي' },
  'nav.favorites': { en: 'Favorites', ar: 'المفضلة' },
  'nav.profile': { en: 'My Profile', ar: 'ملفي الشخصي' },
  'nav.dealer_portal': { en: 'Dealer Portal', ar: 'بوابة التجار' },
  'nav.admin_dashboard': { en: 'Admin Dashboard', ar: 'لوحة المسؤول' },
  'nav.register_showroom': { en: 'Register Showroom', ar: 'تسجيل معرض' },
  'nav.select_country': { en: 'Select Country', ar: 'اختر الدولة' },

  'hero.badge': { en: 'Ride in Style', ar: 'قُد بأسلوب' },
  'hero.title1': { en: 'Exclusive Cars', ar: 'سيارات حصرية' },
  'hero.title2': { en: 'in {country}', ar: 'في {country}' },
  'hero.description': { 
    en: 'Discover the finest vehicles in {country}. From supercars to economic sedans, Find your perfect choice with Mawater974.', 
    ar: 'اكتشف أرقى السيارات في {country}. من السيارات الخارقة إلى سيارات السيدان الاقتصادية، اعثر على خيارك الأمثل مع مواتر 974.' 
  },
  'hero.search': { en: 'Search...', ar: 'بحث...' },
  
  'home.browse_brand': { en: 'Browse by Brand', ar: 'تصفح حسب الماركة' },
  'home.view_all': { en: 'View All', ar: 'عرض الكل' },
  'home.latest_listings': { en: 'Check out the latest premium listings', ar: 'تفقّد أحدث الإعلانات المميزة' },
  'home.parts_subtitle': { en: 'Original and aftermarket parts', ar: 'قطع غيار أصلية وتجارية' },
  'home.cta.title': { en: 'Have a car to sell?', ar: 'هل ترغب ببيع سيارتك؟' },
  'home.cta.desc': { en: 'Join thousands of sellers on Mawater974. List your vehicle today and reach serious buyers instantly.', ar: 'انضم لآلاف البائعين على مواتر ٩٧٤. اعرض سيارتك اليوم وصل للمشترين الجادين فوراً.' },
  'home.cta.post_ad': { en: 'Post an Ad Now', ar: 'أضف إعلانك الآن' },
  'home.cta.find_dealer': { en: 'Find a Dealer', ar: 'ابحث عن معرض' },
  'home.search_parts_placeholder': { en: 'Search for parts...', ar: 'ابحث عن قطع غيار...' },

  'home.dealer_section.title': { en: 'Own a Showroom?', ar: 'هل تمتلك معرض سيارات؟' },
  'home.dealer_section.desc': { 
    en: 'Registering your dealership is easy. Create a normal user account, go to your profile menu, and select "Register Showroom". Once approved, you can manage your inventory professionally.', 
    ar: 'تسجيل معرضك سهل للغاية. أنشئ حساب مستخدم عادي، اذهب إلى قائمة الملف الشخصي، اختر "تسجيل معرض"، وأضف بياناتك. بمجرد الموافقة، يمكنك إدارة مخزونك بشكل احترافي.' 
  },
  'home.dealer_section.step1': { en: '1. Sign In / Register', ar: '١. سجل دخول / تسجيل جديد' },
  'home.dealer_section.step2': { en: '2. Profile > Register Showroom', ar: '٢. الملف الشخصي > تسجيل معرض' },
  'home.dealer_section.step3': { en: '3. Wait for Approval', ar: '٣. انتظر الموافقة' },
  'home.dealer_section.cta': { en: 'Start Registration', ar: 'ابدأ التسجيل' },

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
  'common.optional': { en: '(Optional)', ar: '(اختياري)' },
  'common.user': { en: 'User', ar: 'مستخدم' },
  'common.try_adjusting': { en: 'Try adjusting your filters.', ar: 'حاول تعديل الفلاتر.' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.archive': { en: 'Archive', ar: 'أرشفة' },
  'common.share': { en: 'Share', ar: 'مشاركة' },
  'common.change': { en: 'Change', ar: 'تغيير' },
  'common.save_changes': { en: 'Save Changes', ar: 'حفظ التغييرات' },

  'filter.brand': { en: 'Brand', ar: 'الماركة' },
  'filter.all_brands': { en: 'All Brands', ar: 'كل الماركات' },
  'filter.model': { en: 'Model', ar: 'الموديل' },
  'filter.all_models': { en: 'All Models', ar: 'كل الموديلات' },
  'filter.min_price': { en: 'Min Price', ar: 'أقل سعر' },
  'filter.max_price': { en: 'Max Price', ar: 'أعلى سعر' },
  'filter.min_year': { en: 'Min Year', ar: 'من سنة' },
  'filter.max_year': { en: 'Max Year', ar: 'إلى سنة' },
  'filter.apply': { en: 'Apply Filters', ar: 'تطبيق الفلتر' },
  'filter.title': { en: 'Filters', ar: 'الفلاتر' },
  'filter.clear': { en: 'Clear', ar: 'مسح' },
  'filter.show': { en: 'Show Filters', ar: 'إظهار الفلاتر' },
  'filter.hide': { en: 'Hide Filters', ar: 'إخفاء الفلاتر' },
  'filter.any': { en: 'Any', ar: 'الكل' },
  'search.placeholder': { en: 'Search by description...', ar: 'ابحث في الوصف...' },
  
  'login.title': { en: 'Login', ar: 'تسجيل الدخول' },
  'login.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'login.password': { en: 'Password', ar: 'كلمة المرور' },
  'login.submit': { en: 'Login', ar: 'دخول' },
  'login.no_account': { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  'login.signup_link': { en: 'Sign Up', ar: 'سجل الآن' },
  'login.google': { en: 'Continue with Google', ar: 'الاستمرار باستخدام جوجل' },
  'login.remember_me': { en: 'Remember me', ar: 'تذكرني' },
  'login.forgot_password': { en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟' },
  
  'signup.title': { en: 'Create Account', ar: 'إنشاء حساب جديد' },
  'signup.fullname': { en: 'Full Name', ar: 'الاسم الكامل' },
  'signup.select_country': { en: 'Select Country', ar: 'اختر الدولة' },
  'signup.phone': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'signup.phone_format': { en: 'Format', ar: 'الصيغة' },
  'signup.password_hint': { en: 'Min 6 characters', ar: '٦ خانات على الأقل' },
  'signup.submit': { en: 'Sign Up', ar: 'تسجيل' },
  'signup.has_account': { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  'signup.login_link': { en: 'Login', ar: 'دخول' },
  'signup.error.select_country': { en: 'Please select your country.', ar: 'يرجى اختيار الدولة.' },
  'signup.error.invalid_code': { en: 'Invalid country code.', ar: 'رمز الدولة غير صحيح.' },
  'signup.error.phone_length': { en: 'Phone number must be between 10 and 15 digits.', ar: 'يجب أن يكون رقم الهاتف بين ١٠ و ١٥ خانة.' },
  'signup.error.profile_save': { en: 'Account created but failed to save details.', ar: 'تم إنشاء الحساب ولكن فشل حفظ التفاصيل.' },

  'auth.forgot_title': { en: 'Forgot Password', ar: 'نسيت كلمة المرور' },
  'auth.forgot_desc': { en: 'Enter your email address and we will send you a link to reset your password.', ar: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.' },
  'auth.send_reset': { en: 'Send Reset Link', ar: 'إرسال رابط إعادة التعيين' },
  'auth.back_to_login': { en: 'Back to Login', ar: 'العودة لتسجيل الدخول' },
  'auth.reset_email_sent': { en: 'If an account exists, a password reset link has been sent.', ar: 'إذا كان الحساب موجوداً، فقد تم إرسال رابط إعادة التعيين.' },
  'auth.update_password_title': { en: 'Update Password', ar: 'تحديث كلمة المرور' },
  'auth.new_password': { en: 'New Password', ar: 'كلمة المرور الجديدة' },
  'auth.confirm_password': { en: 'Confirm Password', ar: 'تأكيد كلمة المرور' },
  'auth.update_submit': { en: 'Update Password', ar: 'تحديث كلمة المرور' },
  'auth.password_mismatch': { en: 'Passwords do not match.', ar: 'كلمات المرور غير متطابقة.' },
  'auth.password_updated': { en: 'Password updated successfully.', ar: 'تم تحديث كلمة المرور بنجاح.' },

  'profile.title': { en: 'My Profile', ar: 'الملف الشخصي' },
  'profile.update_success': { en: 'Profile updated successfully', ar: 'تم تحديث الملف بنجاح' },
  'profile.email_label': { en: 'Email', ar: 'البريد الإلكتروني' },
  'profile.name_label': { en: 'Full Name', ar: 'الاسم الكامل' },
  'profile.phone_label': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'profile.phone_hint': { en: 'Used for verifying ads and contact.', ar: 'يستخدم للتحقق من الإعلانات والتواصل.' },

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
  'car.cylinders': { en: 'Cylinders', ar: 'سلندرات' },
  'car.doors': { en: 'Doors', ar: 'الأبواب' },
  'car.drive_type': { en: 'Drive Type', ar: 'نظام الدفع' },
  'car.warranty': { en: 'Warranty', ar: 'الضمان' },
  'car.featured': { en: 'FEATURED', ar: 'مميز' },

  'cars.showing_results': { en: 'Showing {count} of {total} results', ar: 'عرض {count} من {total} نتيجة' },
  'cars.compare': { en: 'Compare', ar: 'مقارنة' },
  'cars.done': { en: 'Done', ar: 'تم' },
  'cars.compare_selected': { en: '{count} / 3 Selected', ar: 'تم تحديد {count} / 3' },
  'cars.compare_now': { en: 'Compare Now', ar: 'قارن الآن' },
  'cars.hero.title': { en: 'Find Your Perfect Car', ar: 'اعثر على سيارتك المثالية' },
  'cars.hero.subtitle': { en: 'Browse thousands of cars in {country}. Verified sellers, trusted dealers.', ar: 'تصفح آلاف السيارات في {country}. بائعون موثوقون ومعارض معتمدة.' },
  
  'compare.title': { en: 'Compare Vehicles', ar: 'مقارنة المركبات' },
  'compare.vehicle': { en: 'Vehicle', ar: 'المركبة' },
  'compare.remove': { en: 'Remove', ar: 'إزالة' },

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
  'footer.rights': { en: 'All Rights Reserved', ar: 'جميع الحقوق محفوظة' },
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
  'contact.call_us': { en: 'Call Us', ar: 'اتصل بنا' },
  'contact.hours': { en: 'Mon-Sat from 8am to 5pm', ar: 'السبت - الخميس: ٨ ص إلى ٥ م' },
  'contact.email_us': { en: 'Email Us', ar: 'راسلنا' },
  'contact.email_desc': { en: 'For general inquiries and support', ar: 'للاستفسارات العامة والدعم الفني' },
  'contact.visit_us': { en: 'Visit Us', ar: 'زرنا' },
  'contact.office_type': { en: 'Main Office', ar: 'المكتب الرئيسي' },
  'contact.form_title': { en: 'Send a Message', ar: 'أرسل رسالة' },
  'contact.thank_you': { en: 'Thank You!', ar: 'شكراً لك!' },
  'contact.send_another': { en: 'Send another message', ar: 'أرسل رسالة أخرى' },

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

  'sell.login_title': { en: 'Login to Sell', ar: 'سجل الدخول للبيع' },
  'sell.login_desc': { en: 'You need an account to post advertisements.', ar: 'تحتاج إلى حساب لنشر الإعلانات.' },
  'sell.login_register': { en: 'Login / Register', ar: 'دخول / تسجيل' },
  'sell.title': { en: 'Create New Listing', ar: 'إنشاء إعلان جديد' },
  'sell.subtitle': { en: 'Reach thousands of buyers in {country}. Select listing type below.', ar: 'صل لآلاف المشترين في {country}. اختر نوع الإعلان أدناه.' },
  'sell.car_option': { en: 'Sell a Car', ar: 'بيع سيارة' },
  'sell.part_option': { en: 'Sell Spare Part', ar: 'بيع قطع غيار' },

  'form.brand': { en: 'Brand', ar: 'الماركة' },
  'form.model': { en: 'Model', ar: 'الموديل' },
  'form.exact_model': { en: 'Exact Model (Trim)', ar: 'الطراز الدقيق (فئة)' },
  'form.location': { en: 'Location', ar: 'الموقع' },
  'form.country': { en: 'Country', ar: 'الدولة' },
  'form.city': { en: 'City', ar: 'المدينة' },
  'form.select': { en: 'Select', ar: 'اختر' },
  'form.description': { en: 'Description', ar: 'الوصف' },
  'form.desc_placeholder': { en: 'Describe condition, features, history...', ar: 'صف الحالة، المميزات، التاريخ...' },
  'form.upload_photos': { en: 'Upload Photos', ar: 'رفع الصور' },
  'form.main_photo': { en: 'Main Photo', ar: 'الصورة الرئيسية' },
  'form.set_main': { en: 'Set as Main', ar: 'تعيين كرئيسية' },
  'form.remove': { en: 'Remove', ar: 'حذف' },
  'form.terms_agree': { en: 'I confirm that I have read and agree to the', ar: 'أؤكد أنني قرأت ووافقت على' },
  'form.submit_ad': { en: 'Post Ad Now', ar: 'انشر الإعلان الآن' },
  'form.update_ad': { en: 'Update Ad', ar: 'تحديث الإعلان' },
  'form.processing': { en: 'Processing...', ar: 'جاري المعالجة...' },
  'form.success_post': { en: 'Ad listed successfully!', ar: 'تم نشر الإعلان بنجاح!' },
  'form.success_update': { en: 'Ad updated successfully!', ar: 'تم تحديث الإعلان بنجاح!' },
  'form.add_more_photos': { en: 'Add More Photos', ar: 'أضف المزيد من الصور' },
  'form.photo_instruction': { en: 'The first image will be the main photo. Use arrows to reorder.', ar: 'الصورة الأولى ستكون الرئيسية. استخدم الأسهم للترتيب.' },

  // Specs Options
  'fuel.petrol': { en: 'Petrol', ar: 'بترول' },
  'fuel.diesel': { en: 'Diesel', ar: 'ديزل' },
  'fuel.hybrid': { en: 'Hybrid', ar: 'هجين' },
  'fuel.electric': { en: 'Electric', ar: 'كهرباء' },
  
  'gearbox.manual': { en: 'Manual', ar: 'عادي' },
  'gearbox.automatic': { en: 'Automatic', ar: 'أوتوماتيك' },
  
  'body.sedan': { en: 'Sedan', ar: 'سيدان' },
  'body.suv': { en: 'SUV', ar: 'دفع رباعي' },
  'body.hatchback': { en: 'Hatchback', ar: 'هاتشباك' },
  'body.coupe': { en: 'Coupe', ar: 'كوبيه' },
  'body.pickup': { en: 'Pickup', ar: 'بيك أب' },
  'body.truck': { en: 'Truck', ar: 'شاحنة' },
  'body.van': { en: 'Van', ar: 'فان' },
  'body.wagon': { en: 'Wagon', ar: 'واغون' },
  'body.convertible': { en: 'Convertible', ar: 'كشف' },
  'body.other': { en: 'Other', ar: 'آخر' },

  'condition.new': { en: 'New', ar: 'جديد' },
  'condition.excellent': { en: 'Excellent', ar: 'ممتاز' },
  'condition.good': { en: 'Good', ar: 'جيد' },
  'condition.not_working': { en: 'Not Working', ar: 'عطلان' },
  'condition.used': { en: 'Used', ar: 'مستعمل' },
  'condition.refurbished': { en: 'Refurbished', ar: 'مجدد' },

  'drive.fwd': { en: 'FWD', ar: 'دفع أمامي' },
  'drive.rwd': { en: 'RWD', ar: 'دفع خلفي' },
  'drive.awd': { en: 'AWD', ar: 'دفع كلي' },
  'drive.4wd': { en: '4WD', ar: 'دفع رباعي' },

  'color.white': { en: 'White', ar: 'أبيض' },
  'color.black': { en: 'Black', ar: 'أسود' },
  'color.silver': { en: 'Silver', ar: 'فضي' },
  'color.gray': { en: 'Gray', ar: 'رمادي' },
  'color.red': { en: 'Red', ar: 'أحمر' },
  'color.blue': { en: 'Blue', ar: 'أزرق' },
  'color.green': { en: 'Green', ar: 'أخضر' },
  'color.yellow': { en: 'Yellow', ar: 'أصفر' },
  'color.orange': { en: 'Orange', ar: 'برتقالي' },
  'color.brown': { en: 'Brown', ar: 'بني' },
  'color.purple': { en: 'Purple', ar: 'بفسجي' },
  'color.gold': { en: 'Gold', ar: 'ذهبي' },
  'color.beige': { en: 'Beige', ar: 'بيج' },
  'color.maroon': { en: 'Maroon', ar: 'عنابي' },
  'color.navy': { en: 'Navy', ar: 'كحلي' },
  'color.bronze': { en: 'Bronze', ar: 'برونزي' },
  'color.other': { en: 'Other', ar: 'لون آخر' },

  'part.title': { en: 'Title', ar: 'العنوان' },
  'part.category': { en: 'Category', ar: 'الفئة' },
  'part.type': { en: 'Part Type', ar: 'نوع القطعة' },
  'part.original': { en: 'Original (OEM)', ar: 'أصلي (وكالة)' },
  'part.aftermarket': { en: 'Aftermarket', ar: 'تجاري' },
  'part.negotiable': { en: 'Price is Negotiable', ar: 'السعر قابل للتفاوض' },
  'part.contact_notice': { en: 'Your contact information (Name, Phone Number) will be automatically displayed from your profile.', ar: 'سيتم عرض معلومات الاتصال الخاصة بك (الاسم، رقم الهاتف) تلقائياً من ملفك الشخصي.' },
  'part.title_placeholder': { en: 'e.g. Toyota Camry 2020 Headlight', ar: 'مثال: مصباح أمامي تويوتا كامري ٢٠٢٠' },
  'part.desc_placeholder': { en: 'Details about the part...', ar: 'تفاصيل عن القطعة...' },
  'part.list_btn': { en: 'List Part', ar: 'اعرض القطعة' },
  'part.update_btn': { en: 'Update Part', ar: 'تحديث القطعة' },

  // New Translations for Spare Parts Page
  'parts.subtitle': { en: 'Find original and aftermarket parts for your vehicle.', ar: 'اعثر على قطع غيار أصلية وتجارية لسيارتك.' },
  'parts.showing_results_for': { en: 'Showing results for:', ar: 'عرض النتائج لـ:' },
  'parts.try_adjusting': { en: 'Try adjusting your search terms or checking category filters.', ar: 'حاول تعديل مصطلحات البحث أو التحقق من فلاتر الفئات.' },
  'parts.clear_search': { en: 'Clear Search', ar: 'مسح البحث' },
  'parts.universal': { en: 'Universal', ar: 'عام / شامل' },
  'parts.compatible_model': { en: 'Compatible Model', ar: 'الموديل المتوافق' },
  'parts.listed_date': { en: 'Listed Date', ar: 'تاريخ العرض' },
  'parts.location': { en: 'Location', ar: 'الموقع' },
  'parts.member_since': { en: 'Member since', ar: 'عضو منذ' },
  'parts.call_seller': { en: 'Call Seller', ar: 'اتصل بالبائع' },
  'parts.whatsapp': { en: 'WhatsApp', ar: 'واتساب' },
  'parts.no_phone': { en: 'No phone number available for this seller.', ar: 'لا يوجد رقم هاتف لهذا البائع.' },
  'parts.similar': { en: 'Similar Parts', ar: 'قطع غيار مشابهة' },
  'parts.negotiable_badge': { en: 'Negotiable', ar: 'قابل للتفاوض' },

  'comments.title': { en: 'Comments', ar: 'التعليقات' },
  'comments.no_comments': { en: 'No comments yet. Be the first to ask!', ar: 'لا توجد تعليقات بعد. كن أول من يسأل!' },
  'comments.placeholder': { en: 'Ask a question or share your thoughts...', ar: 'اطرح سؤالاً أو شارك أفكارك...' },
  'comments.login_prompt': { en: 'Please login to post a comment.', ar: 'يرجى تسجيل الدخول لنشر تعليق.' },
  'comments.login_action': { en: 'Login / Register', ar: 'دخول / تسجيل' },
  'comments.delete_confirm': { en: 'Delete this comment?', ar: 'حذف هذا التعليق؟' },

  // Privacy Policy Keys
  'privacy.title': { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  'privacy.last_updated': { en: 'Last Updated', ar: 'آخر تحديث' },
  'privacy.intro': { 
    en: 'Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.', 
    ar: 'خصوصيتك مهمة بالنسبة لنا. تشرح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها.' 
  },
  'privacy.collect.title': { en: 'Information We Collect', ar: 'المعلومات التي نجمعها' },
  'privacy.collect.desc': { 
    en: 'We collect information you provide directly to us, such as when you create an account, post an ad, or contact us. This may include your name, email address, phone number, and location.', 
    ar: 'نجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب، أو نشر إعلان، أو التواصل معنا. قد يشمل ذلك اسمك، عنوان بريدك الإلكتروني، رقم هاتفك، وموقعك.' 
  },
  'privacy.use.title': { en: 'How We Use Your Information', ar: 'كيف نستخدم معلوماتك' },
  'privacy.use.desc': { 
    en: 'We use the information we collect to operate and improve our services, communicate with you, and personalize your experience. We may also use it to prevent fraud and ensure security.', 
    ar: 'نستخدم المعلومات التي نجمعها لتشغيل وتحسين خدماتنا، والتواصل معك، وتخصيص تجربتك. قد نستخدمها أيضاً لمنع الاحتيال وضمان الأمان.' 
  },
  'privacy.sharing.title': { en: 'Sharing of Information', ar: 'مشاركة المعلومات' },
  'privacy.sharing.desc': { 
    en: 'We do not share your personal information with third parties except as described in this policy, such as with your consent or for legal reasons.', 
    ar: 'لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا كما هو موضح في هذه السياسة، مثل بموافقتك أو لأسباب قانونية.' 
  },

  // Terms & Conditions Keys
  'terms.title': { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  'terms.last_updated': { en: 'Last Updated', ar: 'آخر تحديث' },
  'terms.intro': { 
    en: 'Welcome to Mawater974. By using our website, you agree to comply with and be bound by the following terms and conditions.', 
    ar: 'مرحبًا بكم في مواتر ٩٧٤. باستخدامك لموقعنا، فإنك توافق على الالتزام بالشروط والأحكام التالية.' 
  },
  'terms.usage.title': { en: 'Acceptable Use', ar: 'الاستخدام المقبول' },
  'terms.usage.desc': { 
    en: 'You agree to use our website only for lawful purposes. You must not post any content that is illegal, offensive, or violates the rights of others.', 
    ar: 'توافق على استخدام موقعنا لأغراض قانونية فقط. يجب ألا تنشر أي محتوى غير قانوني أو مسيء أو ينتهك حقوق الآخرين.' 
  },
  'terms.account.title': { en: 'Account Responsibility', ar: 'مسؤولية الحساب' },
  'terms.account.desc': { 
    en: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.', 
    ar: 'أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.' 
  },
  'terms.termination.title': { en: 'Termination', ar: 'الإنهاء' },
  'terms.termination.desc': { 
    en: 'We reserve the right to terminate or suspend your account at any time, without notice, for conduct that we believe violates these terms or is harmful to other users.', 
    ar: 'نحتفظ بالحق في إنهاء أو تعليق حسابك في أي وقت، دون إشعار، بسبب سلوك نعتقد أنه ينتهك هذه الشروط أو يضر بالمستخدمين الآخرين.' 
  },

  // Additional Keys
  'my_ads.post_ad': { en: '+ Post Ad', ar: '+ أضف إعلان' },
  'my_ads.tab_cars': { en: 'Cars', ar: 'السيارات' },
  'my_ads.tab_parts': { en: 'Spare Parts', ar: 'قطع الغيار' },
  'my_ads.edit_listing': { en: 'Edit Listing', ar: 'تعديل الإعلان' },
  'my_ads.edit_part': { en: 'Edit Part', ar: 'تعديل القطعة' },
  'my_ads.confirm_delete_car': { en: 'Are you sure you want to delete (archive) this ad? It will be hidden from public view.', ar: 'هل أنت متأكد أنك تريد حذف (أرشفة) هذا الإعلان؟ سيتم إخفاؤه عن العامة.' },
  'my_ads.confirm_delete_part': { en: 'Are you sure you want to delete (archive) this part? It will be hidden from public view.', ar: 'هل أنت متأكد أنك تريد حذف (أرشفة) هذه القطعة؟ سيتم إخفاؤها عن العامة.' },
  'my_ads.no_cars': { en: "You haven't posted any car ads yet.", ar: 'لم تقم بإضافة أي إعلانات سيارات بعد.' },
  'my_ads.no_parts': { en: "You haven't posted any spare part ads yet.", ar: 'لم تقم بإضافة أي إعلانات قطع غيار بعد.' },

  'showroom.info': { en: 'Showroom Info', ar: 'معلومات المعرض' },
  'showroom.about': { en: 'About', ar: 'نبذة' },
  'showroom.hours': { en: 'Hours', ar: 'ساعات العمل' },
  'showroom.contact_numbers': { en: 'Contact Numbers', ar: 'أرقام التواصل' },
  'showroom.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'showroom.website': { en: 'Website', ar: 'الموقع الإلكتروني' },
  'showroom.visit_website': { en: 'Visit Website', ar: 'زيارة الموقع' },
  'showroom.inventory': { en: 'Current Inventory', ar: 'المخزون الحالي' },
  'showroom.no_vehicles': { en: 'No Vehicles Listed', ar: 'لا توجد سيارات معروضة' },
  'showroom.no_vehicles_desc': { en: 'This showroom currently has no inventory online.', ar: 'هذا المعرض ليس لديه مخزون معروض حالياً.' },

  'dealer.portal': { en: 'Dealer Portal', ar: 'بوابة التاجر' },
  'dealer.spare_parts': { en: 'Spare Parts', ar: 'قطع الغيار' },
  'dealer.sold_listings': { en: 'Sold Listings', ar: 'الإعلانات المباعة' },
  'dealer.archived_listings': { en: 'Archived / Expired', ar: 'مؤرشفة / منتهية' },
  'dealer.analytics': { en: 'Performance Analytics', ar: 'تحليلات الأداء' },
  'dealer.analytics_desc': { en: 'Detailed traffic analysis and lead reports coming soon.', ar: 'تحليل الزيارات وتقارير العملاء المحتملين قريباً.' },
  'dealer.add_part': { en: 'Add Part', ar: 'أضف قطعة' },
  'dealer.item_details': { en: 'Item Details', ar: 'تفاصيل العنصر' },
  'dealer.condition': { en: 'Condition', ar: 'الحالة' },
  'dealer.profile.business_name_en': { en: 'Business Name (English)', ar: 'اسم العمل (إنجليزي)' },
  'dealer.profile.business_name_ar': { en: 'Business Name (Arabic)', ar: 'اسم العمل (عربي)' },
  'dealer.profile.description': { en: 'Description', ar: 'الوصف' },
  'dealer.profile.contact_details': { en: 'Contact Details', ar: 'معلومات الاتصال' },
  'dealer.profile.email': { en: 'Business Email', ar: 'بريد العمل' },
  'dealer.profile.website': { en: 'Website', ar: 'الموقع' },
  'dealer.profile.location_hours': { en: 'Location & Hours', ar: 'الموقع وساعات العمل' },
  'dealer.profile.address': { en: 'Address', ar: 'العنوان' },
  'dealer.profile.opening_hours': { en: 'Opening Hours', ar: 'ساعات العمل' },
  'dealer.profile.logo': { en: 'Showroom Logo', ar: 'شعار المعرض' },
  'dealer.profile.logo_hint1': { en: 'Upload a high-quality logo.', ar: 'ارفع شعار عالي الجودة.' },
  'dealer.profile.logo_hint2': { en: 'Ratio 16:9 preferred. Max size 2MB.', ar: 'يفضل نسبة ١٦:٩. الحجم الأقصى ٢ ميجابايت.' },
  'dealer.no_account': { en: 'No dealership account found. Please register first.', ar: 'لم يتم العثور على حساب معرض. يرجى التسجيل أولاً.' },
  'dealer.mark_available': { en: 'Mark Available', ar: 'حدد كمتاح' },
  'dealer.mark_sold': { en: 'Mark Sold', ar: 'حدد كمباع' },
  'dealer.view_ad': { en: 'View Ad Page', ar: 'عرض صفحة الإعلان' },
  'dealer.archive_listing': { en: 'Archive Listing', ar: 'أرشفة الإعلان' },
  'dealer.archive_part': { en: 'Archive Part', ar: 'أرشفة القطعة' },
  'dealer.confirm_archive': { en: 'Are you sure you want to archive this listing?', ar: 'هل أنت متأكد أنك تريد أرشفة هذا الإعلان؟' },
  'dealer.confirm_status': { en: 'Mark this car as {status}?', ar: 'تحديد هذه السيارة كـ {status}؟' },
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { countryCode } = useParams<{ countryCode?: string }>();
  
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [isLoading, setIsLoading] = useState(false);
  
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
      // Logic to sync URL param with state, or default to QA/Saved
      let targetId: number | null = null;

      // 1. Try URL Param first
      if (countryCode && countryCode.length === 2) {
          const matched = FALLBACK_COUNTRIES.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
          if (matched) targetId = matched.id;
      }

      // 2. Try LocalStorage if not in URL
      if (!targetId) {
          const savedCountryId = localStorage.getItem('app_country');
          if (savedCountryId) {
              const matched = FALLBACK_COUNTRIES.find(c => c.id === Number(savedCountryId));
              if (matched) targetId = matched.id;
          }
      }

      // 3. Default to Qatar
      if (!targetId) {
          targetId = 1; // Qatar
      }

      if (targetId && targetId !== selectedCountryId) {
          setSelectedCountryId(targetId);
          localStorage.setItem('app_country', String(targetId));
      }

      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
      
      // Update selected country ID again with fetched data to ensure freshness
      if (countryCode && countryCode.length === 2) {
          const matched = fetchedCountries.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
          if (matched) {
              setSelectedCountryId(matched.id);
              localStorage.setItem('app_country', String(matched.id));
          }
      } 
    };
    initCountries();
  }, [countryCode]);

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
        
        // Navigate to the same page but with new country code prefix
        // We need to strip existing country code if present
        const currentPath = location.pathname;
        const segments = currentPath.split('/').filter(Boolean);
        
        let newPath = '';
        
        // Check if first segment is a country code
        if (segments.length > 0 && segments[0].length === 2) {
            // Replace first segment
            segments[0] = country.code.toLowerCase();
            newPath = '/' + segments.join('/');
        } else {
            // Prepend new code
            newPath = `/${country.code.toLowerCase()}${currentPath}`;
        }
        
        // Fix double slashes just in case
        newPath = newPath.replace('//', '/');

        navigate(newPath);

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
