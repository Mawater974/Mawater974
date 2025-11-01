export interface SparePart {
  id: number;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  part_number: string;
  brand: string;
  brand_ar?: string;
  category: string;
  category_ar?: string;
  condition: 'new' | 'used' | 'refurbished';
  price: number;
  quantity: number;
  images?: { url: string; is_main?: boolean }[];
  status: 'approved' | 'pending' | 'rejected' | 'sold' | 'hidden';
  user_id: string;
  country_id: number;
  created_at: string;
  updated_at: string;
  views_count?: number;
  is_featured?: boolean;
  compatibility_notes?: string;
  compatibility_notes_ar?: string;
  warranty_available?: boolean;
  warranty_months?: number;
  location?: string;
  location_ar?: string;
  city_id?: number;
  dealership_id?: number;
  currency_code?: string;
  favorite_count?: number;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    created_at: string;
    role: string;
  };
}

