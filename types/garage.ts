// types/garage.ts
export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
}

export interface GarageService {
  id: string;
  garage_id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Garage {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  address_en: string;
  address_ar: string;
  city_en: string;
  city_ar: string;
  country_en: string;
  country_ar: string;
  phone: string;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  created_at: string;
  updated_at: string;
  services_en?: string[];
  services_ar?: string[];
  opening_hours: OpeningHour[];
  social_links?: SocialLinks;
  is_featured?: boolean;
  is_verified?: boolean;
  country_id?: number | null;
}

export interface GarageFilters {
  search?: string;
  city?: string;
  sort_by?: 'name' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  is_featured?: boolean;
  is_verified?: boolean;
}

export interface GarageResponse {
  data: Garage[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}