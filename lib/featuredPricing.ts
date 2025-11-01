import { createClient } from '@/utils/supabase/server';

export interface FeaturedPricing {
  id: string;
  country_id: number | null;
  price: number;
  currency_code: string;
}

export async function getFeaturedPricing(countryId: number | null): Promise<FeaturedPricing | null> {
  const supabase = createClient();
  
  // First try to get pricing for the specific country
  const { data: countryPricing, error: countryError } = await supabase
    .from('featured_ad_pricing')
    .select('*')
    .eq('country_id', countryId)
    .single();

  if (countryPricing) {
    return countryPricing;
  }

  // If no country-specific pricing, get the default (where country_id is null)
  const { data: defaultPricing, error: defaultError } = await supabase
    .from('featured_ad_pricing')
    .select('*')
    .is('country_id', null)
    .single();

  if (defaultPricing) {
    return defaultPricing;
  }

  // If no pricing found at all, return null
  return null;
}
