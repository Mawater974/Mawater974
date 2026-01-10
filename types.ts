
export interface Brand {
  id: number;
  name: string;
  name_ar?: string;
  logo_url?: string;
}

export interface Model {
  id: number;
  brand_id: number;
  name: string;
  name_ar?: string;
}

export interface City {
  id: number;
  name: string;
  name_ar: string;
}

export interface Country {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  currency_code: string;
  phone_code?: string;
}

export interface CarImage {
  id: string;
  car_id: number;
  image_url: string;
  thumbnail_url?: string; // New field for compressed thumbnail
  is_main: boolean;
}

export interface Car {
  id: number;
  brand_id: number;
  model_id: number;
  year: number;
  price: number;
  mileage: number;
  description?: string;
  exact_model?: string;
  
  // Specs - Made optional
  color?: string;
  fuel_type?: string;
  gearbox_type?: string;
  body_type?: string;
  condition?: string;
  cylinders?: string;
  doors?: string;
  drive_type?: string;
  warranty?: string;
  
  is_featured: boolean;
  status?: 'approved' | 'pending' | 'sold' | 'rejected' | 'archived'; 
  city_id?: number;
  country_id?: number;
  views_count?: number;
  
  // Relations
  brands?: Brand;
  models?: Model;
  cities?: City;
  countries?: Country;
  car_images?: CarImage[];
  created_at: string;
  user_id?: string;
  dealership_id?: number; // Linked Dealership ID if seller is a dealer
  profiles?: Profile; // Linked seller profile
}

export interface SparePartCategory {
  id: number;
  name_en: string;
  name_ar: string;
  icon?: string;
}

export interface SparePartImage {
  id: string;
  spare_part_id: string;
  url: string;
  is_primary: boolean;
}

export interface SparePart {
  id: string; // UUID
  user_id: string;
  title: string;
  name_ar?: string; // Optional if not used in form but present in DB
  description?: string;
  price: number;
  currency: string;
  
  brand_id?: number;
  model_id?: number;
  category_id?: number;
  city_id?: number;
  country_id?: number; // Changed from country_code
  
  condition: 'new' | 'used' | 'refurbished';
  part_type: 'original' | 'aftermarket';
  is_negotiable: boolean;
  
  // Removed contact_phone and contact_email as per request
  
  is_featured: boolean;
  status?: 'approved' | 'pending' | 'rejected' | 'archived';
  
  // Relations
  brands?: Brand;
  models?: Model;
  countries?: Country;
  cities?: City;
  spare_part_categories?: SparePartCategory;
  spare_part_images?: SparePartImage[];
  profiles?: Profile; // Linked seller profile
  created_at: string;
}

export interface Dealership {
  id: number;
  user_id: string;
  business_name: string;
  business_name_ar: string;
  description: string;
  description_ar: string;
  location: string;
  location_ar?: string;
  logo_url?: string;
  dealership_type: string;
  business_type?: string;
  featured: boolean;
  country_id?: number;
  city_id?: number;
  opening_hours?: string;
  opening_hours_ar?: string;
  
  // New Fields
  contact_number_1?: string;
  contact_number_2?: string;
  contact_number_3?: string;
  email?: string;
  website?: string;
  
  // Relations
  cities?: City;
  countries?: Country;
  status?: 'approved' | 'pending' | 'rejected';
  created_at?: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  car_id?: number;
  spare_part_id?: string;
  parent_id?: number;
  created_at: string;
  profiles?: Profile; // Author info
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  // Strictly matched DB enum: 'normal_user' instead of 'user'
  role?: 'normal_user' | 'admin' | 'dealer'; 
  country_id?: number; 
  created_at?: string;
  email?: string; 
  phone_number?: string; // Matched DB column name
  password_plain?: string; // Storing plain password as requested
}

export interface Favorite {
  id: number;
  user_id: string;
  car_id?: number;
  spare_part_id?: string;
  created_at: string;
  cars?: Car;
  spare_parts?: SparePart;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  user_id?: string;
  country_id?: number;
  status: 'unread' | 'read' | 'replied';
  parent_message_id?: number;
  created_at?: string;
  updated_at?: string;
}

export type Language = 'en' | 'ar';
