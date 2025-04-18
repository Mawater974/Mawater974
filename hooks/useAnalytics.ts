import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';
import { analyticsService } from '../lib/analytics/service';
import { GA_EVENTS, GA_CUSTOM_DIMENSIONS } from '../lib/analytics/config';

export const useAnalytics = () => {
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || uuidv4() : uuidv4();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
      
      // Set initial user properties
      analyticsService.setUserProperties({
        session_id: sessionId,
        [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
        [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
      });

      // Track session start
      analyticsService.trackEvent(GA_EVENTS.USER_LOGIN, {
        new_session: !localStorage.getItem('sessionId'),
        session_id: sessionId,
      });
    }
  }, [sessionId]);

  const getDeviceType = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const trackPageView = (title?: string) => {
    analyticsService.trackPageView(title, {
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    analyticsService.trackEvent(eventName, {
      ...eventParams,
      session_id: sessionId,
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  const trackCarView = (carId: string, carName: string, price?: number, category?: string) => {
    analyticsService.trackCarView({
      id: carId,
      name: carName,
      price,
      category,
      session_id: sessionId,
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  const trackSearch = (searchTerm: string, category?: string, filters?: Record<string, any>) => {
    analyticsService.trackSearch({
      search_term: searchTerm,
      category,
      filters,
      session_id: sessionId,
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  const trackContactSeller = (carId: string, carName: string, sellerType: string, contactMethod: string) => {
    analyticsService.trackEvent(GA_EVENTS.CONTACT_SELLER || 'contact_seller', {
      car_id: carId,
      car_name: carName,
      seller_type: sellerType,
      contact_method: contactMethod,
      session_id: sessionId,
      [GA_CUSTOM_DIMENSIONS.deviceType]: getDeviceType(),
      [GA_CUSTOM_DIMENSIONS.userLanguage]: localStorage.getItem('language') || 'en',
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackCarView,
    trackSearch,
    trackContactSeller,
  };
};
