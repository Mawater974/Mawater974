export interface Garage {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  address_en: string;
  address_ar: string;
  city_en: string;
  city_ar: string;
  country_en: string;
  country_ar: string;
  phone: string;
  email: string;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  services_en: string[];
  services_ar: string[];
  opening_hours: {
    day: string;
    open: string;
    close: string;
    is_closed: boolean;
  }[];
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  is_featured: boolean;
  is_verified: boolean;
}

export interface GarageReview {
  id: string;
  garage_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface GarageService {
  id: string;
  garage_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  duration: number; // in minutes
  is_available: boolean;
}

export interface GarageFilters {
  search?: string;
  city?: string;
  service?: string;
  rating?: number;
  is_open_now?: boolean;
  sort_by?: 'rating' | 'review_count' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
