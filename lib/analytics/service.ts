import { GA_MEASUREMENT_ID, GA_EVENTS, GA_CUSTOM_DIMENSIONS, GA_CONVERSIONS, SCROLL_DEPTHS } from './config';

class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized: boolean = false;
  private scrollDepthTracked: Set<number> = new Set();
  private sessionStartTime: number = Date.now();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeScrollTracking();
      this.initializeTimeTracking();
    }
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initializeScrollTracking() {
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        SCROLL_DEPTHS.forEach(depth => {
          if (scrollPercent >= depth && !this.scrollDepthTracked.has(depth)) {
            this.scrollDepthTracked.add(depth);
            this.trackEvent(GA_EVENTS.SCROLL_DEPTH, {
              depth: depth,
              page_path: window.location.pathname,
            });
          }
        });
      }
    });
  }

  private initializeTimeTracking() {
    const trackTimeSpent = () => {
      const timeSpent = Math.round((Date.now() - this.sessionStartTime) / 1000);
      this.trackEvent(GA_EVENTS.TIME_ON_PAGE, {
        time_seconds: timeSpent,
        page_path: window.location.pathname,
      });
    };

    window.addEventListener('beforeunload', trackTimeSpent);
    setInterval(trackTimeSpent, 60000); // Track every minute
  }

  public trackEvent(
    eventName: string,
    eventParams: Record<string, any> = {},
    isConversion: boolean = false
  ) {
    try {
      if (!window.gtag) return;

      const baseParams = {
        send_to: GA_MEASUREMENT_ID,
        timestamp: new Date().toISOString(),
        page_path: window.location.pathname,
        page_title: document.title,
        ...eventParams,
      };

      // Add user properties if available
      const userId = localStorage.getItem('userId');
      if (userId) {
        baseParams.user_id = userId;
      }

      // Check if this is a conversion event
      const conversionEvent = Object.values(GA_CONVERSIONS).find(conv => conv.name === eventName);
      if (isConversion && conversionEvent) {
        baseParams.conversion = true;
        baseParams.value = conversionEvent.params.value;
        baseParams.currency = conversionEvent.params.currency;
      }

      window.gtag('event', eventName, baseParams);
    } catch (error) {
      // Silently fail if analytics is blocked
      console.debug('Analytics event failed:', error);
    }
  }

  public trackPageView(
    pageTitle?: string,
    customDimensions: Record<string, any> = {}
  ) {
    try {
      if (!window.gtag) return;

      // Reset scroll tracking for new page
      this.scrollDepthTracked.clear();

      const params = {
        page_title: pageTitle || document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        send_to: GA_MEASUREMENT_ID,
        ...customDimensions,
      };

      window.gtag('config', GA_MEASUREMENT_ID, params);
      this.trackEvent(GA_EVENTS.PAGE_VIEW, params);
    } catch (error) {
      // Silently fail if analytics is blocked
      console.debug('Analytics event failed:', error);
    }
  }

  public trackCarView(car: {
    id: string;
    name: string;
    price?: number;
    category: string;
    seller_id: string;
  }) {
    this.trackEvent(GA_EVENTS.CAR_VIEW, {
      car_id: car.id,
      car_name: car.name,
      car_price: car.price,
      car_category: car.category,
      seller_id: car.seller_id,
      currency: 'QAR',
      [GA_CUSTOM_DIMENSIONS.carCategory]: car.category,
    });
  }

  public trackSearch(params: {
    query: string;
    filters: Record<string, any>;
    resultCount: number;
  }) {
    this.trackEvent(GA_EVENTS.SEARCH_PERFORMED, {
      search_term: params.query,
      filters: JSON.stringify(params.filters),
      results_count: params.resultCount,
      [GA_CUSTOM_DIMENSIONS.searchResultCount]: params.resultCount,
    });
  }

  public trackContactSeller(params: {
    car_id: string;
    seller_id: string;
    contact_method: 'phone' | 'whatsapp' | 'email';
  }) {
    const eventName = `${params.contact_method}_click`.toUpperCase();
    
    // Track specific contact method
    this.trackEvent(GA_EVENTS[eventName], {
      car_id: params.car_id,
      seller_id: params.seller_id,
    });

    // Track general contact conversion
    this.trackEvent(GA_EVENTS.CONTACT_SELLER, {
      car_id: params.car_id,
      seller_id: params.seller_id,
      contact_method: params.contact_method,
    }, true); // Mark as conversion
  }

  public trackUserAction(action: string, data: Record<string, any> = {}) {
    const isConversion = action === GA_EVENTS.USER_SIGNUP;
    this.trackEvent(action, data, isConversion);
  }

  public setUserProperties(properties: Record<string, any>) {
    try {
      if (!window.gtag) return;

      window.gtag('set', 'user_properties', properties);
    } catch (error) {
      // Silently fail if analytics is blocked
      console.debug('Analytics event failed:', error);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
