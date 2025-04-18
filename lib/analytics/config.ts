export const GA_MEASUREMENT_ID = 'G-VPPL3CMS1K';

// Custom dimensions
export const GA_CUSTOM_DIMENSIONS = {
  userRole: 'user_role',
  userLanguage: 'user_language',
  carCategory: 'car_category',
  searchResultCount: 'search_result_count',
  deviceType: 'device_type',
  userRegion: 'user_region',
};

// Event Names
export const GA_EVENTS = {
  // User Engagement
  PAGE_VIEW: 'page_view',
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
  
  // Car Related
  CAR_VIEW: 'car_view',
  CAR_SEARCH: 'car_search',
  CAR_FILTER: 'car_filter',
  CAR_FAVORITE: 'car_favorite',
  CAR_SHARE: 'car_share',
  
  // Contact Events
  CONTACT_SELLER: 'contact_seller',
  WHATSAPP_CLICK: 'whatsapp_click',
  PHONE_CLICK: 'phone_click',
  EMAIL_CLICK: 'email_click',
  
  // User Actions
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PROFILE_UPDATE: 'profile_update',
  
  // Search and Navigation
  SEARCH_PERFORMED: 'search_performed',
  FILTER_USED: 'filter_used',
  NAVIGATION_CLICK: 'navigation_click',
  
  // Form Interactions
  FORM_START: 'form_start',
  FORM_COMPLETE: 'form_complete',
  FORM_ERROR: 'form_error',
  
  // E-commerce
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_PAYMENT_INFO: 'add_payment_info',
  PURCHASE: 'purchase',
};

// Conversion Events
export const GA_CONVERSIONS = {
  CONTACT_SELLER: {
    name: GA_EVENTS.CONTACT_SELLER,
    params: {
      conversion_type: 'lead',
      value: 10, // Value per lead
      currency: 'QAR'
    }
  },
  USER_SIGNUP: {
    name: GA_EVENTS.USER_SIGNUP,
    params: {
      conversion_type: 'signup',
      value: 5,
      currency: 'QAR'
    }
  },
  CAR_LISTING: {
    name: 'car_listing_created',
    params: {
      conversion_type: 'listing',
      value: 15,
      currency: 'QAR'
    }
  }
};

// User Properties
export const USER_PROPERTIES = {
  accountType: 'account_type',
  signupDate: 'signup_date',
  lastLoginDate: 'last_login_date',
  listingCount: 'listing_count',
  preferredLanguage: 'preferred_language',
  region: 'region',
  deviceType: 'device_type',
  userRole: 'role',
};

// E-commerce Item Categories
export const ITEM_CATEGORIES = {
  ECONOMY: 'economy',
  LUXURY: 'luxury',
  SUV: 'suv',
  SPORTS: 'sports',
  CLASSIC: 'classic',
};

// Scroll Depth Thresholds
export const SCROLL_DEPTHS = [25, 50, 75, 90];

// Session Timeout (in minutes)
export const SESSION_TIMEOUT = 30;
