export type DealershipType = 'Official' | 'Private';
export type BusinessType = 'Dealership' | 'Service Center' | 'Spare Parts Dealership';
export type SellerType = 'private' | 'dealer';

export interface Showroom {
  id: number;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  logo?: string;
  coverImage?: string;
  location: string;
  location_ar?: string;
  city_id?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  dealershipType: DealershipType;
  businessType?: BusinessType;
  user_id?: string;
}

export interface ShowroomRegistration {
  id?: number;
  business_name: string;
  business_name_ar: string;
  owner_name: string;
  email: string;
  phone: string;
  location: string;
  location_ar: string;
  dealership_type: DealershipType;
  business_type: BusinessType;
  description: string;
  description_ar: string;
  logo?: File;
  logo_url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  user_id?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_id?: string;
  review_notes?: string;
}

export interface CarAd {
  id?: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  price: number;
  year: number;
  brand: string;
  model: string;
  trim?: string;
  mileage?: number;
  exterior_color?: string;
  interior_color?: string;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  condition?: string;
  features?: string[];
  images?: File[];
  image_urls?: string[];
  seller_type: SellerType;
  seller_id?: string;
  dealership_id?: number;
  status?: string;
  is_featured?: boolean;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}
