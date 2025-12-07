import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

export type PageType = 
  | 'home' 
  | 'cars' 
  | 'car-detail' 
  | 'showrooms' 
  | 'showroom-detail'
  | 'sell'
  | 'sell-form'
  | 'contact'
  | 'my-ads'
  | 'favorites'
  | 'car-rental'
  | 'car-photography'
  | 'profile'
  | 'privacy'
  | 'terms'
  | 'messages'
  | 'reset-password'
  | 'signup'
  | 'login'
  | 'forgot-password';


export interface PageView {
    countryCode: string;        // User's actual country (from IP/geolocation)
    servedCountryCode: string;  // The country code being served (e.g., 'eg')
    userId?: string;
    pageType: PageType;
    entityId?: string;          // For car-detail, this would be the car ID
    pagePath: string;           // The actual URL path (e.g., '/eg/home')
    userAgent?: string;         // Optional: User agent string
    sessionId?: string;         // Optional: Session ID for anonymous tracking
}

export async function trackPageView({ 
    countryCode, 
    servedCountryCode, 
    userId, 
    pageType, 
    entityId, 
    pagePath,
    userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '',
    sessionId = ''
}: PageView) {
    try {
        const supabase = createClient();
        
        // First try direct insert into page_views
        const { error: insertError } = await supabase
            .from('page_views')
            .upsert({
                country_code: countryCode.toLowerCase(),
                page_type: pageType,
                view_count: 1,
                last_viewed_at: new Date().toISOString()
            }, {
                onConflict: 'country_code,page_type',
                ignoreDuplicates: false
            });

        if (insertError) {
            console.error('Error inserting view:', insertError);
        }

        // Store the exact page path for user tracking
        const exactPath = pagePath;

        // Track detailed user view
        const { error: viewError } = await supabase
            .from('user_page_views')
            .insert({
                user_id: userId || null,
                country_code: servedCountryCode.toLowerCase(),
                real_country_name: countryCode, // Store the actual country name
                page_type: pageType,
                entity_id: entityId || null,
                page_path: exactPath,
                is_authenticated: !!userId,
                user_agent: userAgent,
                session_id: sessionId || null,
                created_at: new Date().toISOString()
            } as any); // Using 'as any' as a temporary workaround for type issues

        if (viewError) {
            console.error('Error recording user view:', viewError);
        }

        // Get current stats
        const { data: currentCount } = await supabase
            .from('page_views')
            .select('view_count')
            .eq('country_code', servedCountryCode.toLowerCase())
            .eq('page_type', pageType)
            .single();

        if (currentCount) {
            console.log(`Current ${pageType} view count for ${countryCode}:`, currentCount.view_count);
        }
    } catch (error) {
        console.error('Error in trackPageView:', error);
    }
}

export async function getPageStats(pageType?: PageType) {
    try {
        const supabase = createClient();
        console.log('Fetching page stats...');
        
        const query = supabase
            .from('page_views')
            .select('*')
            .order('view_count', { ascending: false });

        if (pageType) {
            query.eq('page_type', pageType);
        }
            
        const { data, error } = await query;
            
        if (error) {
            console.error('Error fetching stats:', error);
            return [];
        }

        console.log('Page stats:', data);
        return data || [];
    } catch (error) {
        console.error('Error in getPageStats:', error);
        return [];
    }
}

export async function getEntityStats(pageType: PageType, entityId: string) {
    try {
        const supabase = createClient();
        
        const { data, error } = await supabase
            .from('user_page_views')
            .select('*')
            .eq('page_type', pageType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching entity stats:', error);
            return null;
        }

        return {
            totalViews: data?.length || 0,
            lastView: data?.[0] || null,
            uniqueUsers: new Set(data?.map(view => view.user_id || view.session_id)).size
        };
    } catch (error) {
        console.error('Error in getEntityStats:', error);
        return null;
    }
}
